import { atom } from "jotai";
import { atomFamily, useAtomValue, useUpdateAtom } from "jotai/utils";
import { folder, useControls } from "leva";
import React from "react";
import SimplexNoise from "simplex-noise";
import * as perlin from "./perlin";

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

const simplex$ = atomFamily((seed: string) =>
  atom(new SimplexNoise(seed) as NoiseGenerator)
);

const perlin$ = atom(new PerlinNoise() as NoiseGenerator);

function get2DNoise(
  params: NoiseParams & { noiseGenerator: NoiseGenerator },
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
    const noiseValue =
      params.noiseGenerator.noise2D(xs * frequency, ys * frequency) * 0.5 + 0.5;
    total += noiseValue * amplitude;
    normalization += amplitude;
    amplitude *= G;
    frequency *= params.lacunarity;
  }
  total /= normalization;
  return Math.pow(total, params.exponentiation) * params.height;
}

const seed$ = atom(1);
const noise$ = atomFamily((name: string) =>
  atom((get) => {
    if (name === "simplex") {
      return get(simplex$(`${get(seed$)}`));
    } else if (name === "perlin") {
      return get(perlin$);
    }
  })
);

interface NoiseParams {
  octaves: number;
  persistence: number;
  lacunarity: number;
  exponentiation: number;
  height: number;
  scale: number;
  noiseType: string;
}

export function useNoiseGenerator(
  name: string,
  {
    octaves = 6,
    persistence = 0.707,
    lacunarity = 1.8,
    exponentiation = 4.5,
    height = 300,
    scale = 800,
    noiseType = "simplex",
  }: Partial<NoiseParams> = {}
) {
  const setSeed = useUpdateAtom(seed$);
  const controls = useControls(
    name,
    {
      noise: folder(
        {
          octaves: { value: octaves, step: 1, min: 1, max: 20 },
          persistence: { value: persistence, min: 0.25, max: 1.0 },
          lacunarity: { min: 0.01, max: 4.0, value: lacunarity },
          exponentiation: { min: 0.1, max: 10.0, value: exponentiation },
          height: { min: 0, max: 512, value: height },
          scale: { min: 32, max: 4096, value: scale, step: 1 },
          noiseType: {
            options: ["simplex", "perlin"] as const,
            value: noiseType,
          },
          seed: { value: 1, onChange: (value) => setSeed(value) },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const noiseFn = useAtomValue(noise$(controls.noiseType))!;

  const generator = React.useMemo(() => {
    return {
      noise2D(x: number, y: number) {
        return get2DNoise(
          {
            ...controls,
            noiseGenerator: noiseFn,
          },
          x,
          y
        );
      },
      noise3D(x: number, y: number, z: number) {
        return 0;
      },
    } as NoiseGenerator;
  }, [noiseFn, controls]);

  return generator;
}
