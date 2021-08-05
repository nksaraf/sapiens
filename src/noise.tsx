import { atom } from "jotai";
import { atomFamily, useAtomValue, useUpdateAtom } from "jotai/utils";
import { useControls } from "leva";
import React from "react";
import SimplexNoise from "simplex-noise";
import * as perlin from "./lib/perlin";

export interface NoiseGenerator {
  noise2D(x: number, y: number): number;
  noise3D(x: number, y: number, z: number): number;
}

class PerlinNoise {
  noise2D(x: number, y: number): number {
    return perlin.noise2(x, y);
  }
  noise3D(x: number, y: number, z: number): number {
    return perlin.noise3(x, y, z);
  }
}

const simplex$ = atomFamily((seed: string) => atom(new SimplexNoise(seed) as NoiseGenerator)
);

const perlin$ = atom(new PerlinNoise() as NoiseGenerator);

function get2DNoise(
  params: {
    scale: number;
    persistence: number;
    octaves: number;
    generator: NoiseGenerator;
    lacunarity: number;
    exponentiation: number;
    height: number;
  },
  x: number,
  y: number
) {
  const xs = x / params.scale;
  const ys = y / params.scale;
  const G = 2.0 ** -params.persistence;
  let amplitude = 1.0;
  let frequency = 1.0;
  let normalization = 0;
  let total = 0;
  for (let o = 0; o < params.octaves; o++) {
    const noiseValue = params.generator.noise2D(xs * frequency, ys * frequency) * 0.5 + 0.5;
    total += noiseValue * amplitude;
    normalization += amplitude;
    amplitude *= G;
    frequency *= params.lacunarity;
  }
  total /= normalization;
  return Math.pow(total, params.exponentiation) * params.height;
}
const seed$ = atom(1);
const noise$ = atomFamily((name: string) => atom((get) => {
  if (name === "simplex") {
    return get(simplex$(`${get(seed$)}`));
  } else if (name === "perlin") {
    return get(perlin$);
  }
}));
export function useNoiseGenerator() {
  const setSeed = useUpdateAtom(seed$);
  const { noiseType, ...controls } = useControls("noise", {
    octaves: 6,
    persistence: 0.707,
    lacunarity: 1.8,
    exponentiation: 4.5,
    height: 300.0,
    scale: 800.0,
    noiseType: { options: ["simplex", "perlin"], value: "perlin" },
    seed: { value: 1, onChange: (value) => setSeed(value) },
  });

  const noiseFn = useAtomValue(noise$(noiseType))!;

  const generator = React.useMemo(() => {
    return {
      noise2D(x: number, y: number) {
        return get2DNoise({
          ...controls,
          generator: noiseFn
        }, x, y);
      },
      noise3D(x: number, y: number, z: number) {
        // get3DNoise({
        //   ...ref.current,
        //   generator: noiseFn
        // }, x, y)
        return 0;
      }
    } as NoiseGenerator;
  }, [noiseFn, controls]);

  return generator;
}
