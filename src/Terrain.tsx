import { atom } from "jotai";
import { atomFamily, useAtomValue, useUpdateAtom } from "jotai/utils";
import { useControls } from "leva";
import React from "react";
import SimplexNoise from "simplex-noise";
import * as THREE from "three";
import create from "zustand";
import { $ } from "./atoms";
import * as perlin from "./lib/perlin";

// const terrainChunk$ = atom();

// function useNoise(x, y, z) {
//   return noiseGenerator(x, y, z);
// }

export function TerrainChunk({
  width,
  scale,
  offset,
  biomeGenerator,
  heightGenerators,
}: {
  width: number;
  scale: number;
  offset: number;
  biomeGenerator: (x: number, y: number, z: number) => number;
  heightGenerators: {
    [key: string]: (x: number, y: number, z: number) => number;
  };
}) {
  const [object] = React.useState(() => {
    const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  });
  return (
    <mesh>
      <primitive object={object} attach="geometry" />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

interface NoiseGenerator {
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

function getNoise(
  params: {
    scale: number;
    persistence: number;
    octaves: number;
    noiseFunc: { noise2D: (arg0: number, arg1: number) => number };
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
    const noiseValue =
      params.noiseFunc.noise2D(xs * frequency, ys * frequency) * 0.5 + 0.5;
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

class HeightGenerator {
  constructor(generator, position, minRadius, maxRadius) {
    this._position = position.clone();
    this._radius = [minRadius, maxRadius];
    this._generator = generator;
  }

  Get(x, y) {
    const distance = this._position.distanceTo(new THREE.Vector2(x, y));
    let normalization =
      1.0 -
      math.sat(
        (distance - this._radius[0]) / (this._radius[1] - this._radius[0])
      );
    normalization = normalization * normalization * (3 - 2 * normalization);

    return [this._generator.Get(x, y), normalization];
  }
}

export function Terrain({ chunkSize = 500 }) {
  const setSeed = useUpdateAtom(seed$);
  const controls = useControls("noise", {
    octaves: 6,
    persistence: 0.707,
    lacunarity: 1.8,
    exponentiation: 4.5,
    height: 300.0,
    scale: 800.0,
    noiseType: "simplex",
    seed: { value: 1, onChange: (value) => setSeed(value) },
  });

  const noise = useAtomValue(noise$(controls.noiseType));

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <TerrainChunk
        offset={[0 * chunkSize, 0 * chunkSize]}
        scale={1}
        width={chunkSize}
        heightGenerators={}
      />
    </group>
  );
}
