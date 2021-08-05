import { math } from "@/math";
import { atom } from "jotai";
import { atomFamily, useAtomValue, useUpdateAtom } from "jotai/utils";
import { useControls } from "leva";
import React from "react";
import SimplexNoise from "simplex-noise";
import * as THREE from "three";
import { Vector2 } from "three";
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
  // biomeGenerator,
  heightGenerators,
}: {
  width: number;
  scale: number;
  offset: [number, number];
  // biomeGenerator: (x: number, y: number, z: number) => number;
  heightGenerators: HeightGenerator[];
}) {
 
  const size = React.useMemo(() => {
    return new THREE.Vector3(width * scale, 0 ,width *scale)
  }, [width, scale ])

  const object = React.useMemo(() => {
    const geometry = new THREE.Mesh(
      new THREE.PlaneGeometry(size.x, size.z, 128, 128),
      new THREE.MeshStandardMaterial({
          wireframe: true,
          color: 0xFFFFFF,
          side: THREE.FrontSide,
      }))
      geometry.position.add(new THREE.Vector3(offset[0], offset[1], 0))
      geometry.material.vertexColors = true
    return geometry;
  }, [size]);

  React.useLayoutEffect(() => {
    let position = object.geometry.getAttribute('position')
    for (var i = 0; i < position.count/ position.itemSize; i++) {
      const heightPairs = [];
      let normalization = 0;
      let z = 0
      let x = position.getX(i);
      let y = position.getY(i);

      for (let gen of heightGenerators) {
        heightPairs.push(gen.get(x + offset[0], y + offset[1]));
        normalization += heightPairs[heightPairs.length-1][1];
      }

      console.log(normalization)

      if (normalization > 0) {
        for (let h of heightPairs) {
          z += h[0] * h[1] / normalization;
        }
      }
      console.log(z)
      position.setZ(i, z)
    }
    // for (let v of ) {
    //   const heightPairs = [];
    //   let normalization = 0;
    //   v.z = 0;
    //   for (let gen of this._params.heightGenerators) {
    //     heightPairs.push(gen.Get(v.x + offset.x, v.y + offset.y));
    //     normalization += heightPairs[heightPairs.length-1][1];
    //   }

    //   if (normalization > 0) {
    //     for (let h of heightPairs) {
    //       v.z += h[0] * h[1] / normalization;
    //     }
    //   }

    //   colours.push(this._ChooseColour(v.x + offset.x, v.z, v.y + offset.y));
    // }

    // for (let f of object.geometry.faces) {
    //   const vs = [f.a, f.b, f.c];

    //   const vertexColours = [];
    //   for (let v of vs) {
    //     vertexColours.push(colours[v]);
    //   }
    //   f.vertexColors = vertexColours;
    // }
    // object.geometry.elementsNeedUpdate = true;
    object.geometry.attributes.position.needsUpdate = true;
    object.geometry.computeBoundingBox();
    object.geometry.computeVertexNormals();
  }, [object, ...offset, heightGenerators])
  return (
      <primitive object={object}  />
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
  _position: any;
  _radius: any[];
  _generator: NoiseGenerator;
  constructor(generator: NoiseGenerator, position: { clone: () => any; }, minRadius: number, maxRadius: number) {
    this._position = position.clone();
    this._radius = [minRadius, maxRadius];
    this._generator = generator;
  }

  get(x: number | undefined, y: number | undefined) {
    const distance = this._position.distanceTo(new THREE.Vector2(x, y));
    let normalization =
      1.0 -
      math.sat(
        (distance - this._radius[0]) / (this._radius[1] - this._radius[0])
      );
    normalization = normalization * normalization * (3 - 2 * normalization);

    return [this._generator.noise2D(x!, y!), 1];
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

  const noise = useAtomValue(noise$(controls.noiseType))!;

  const heightGenerators = React.useMemo(() => {
    return [new HeightGenerator(noise, new THREE.Vector3(0, 0, 0), 100000, 100000 + 1)]
  }, [noise])
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <TerrainChunk
        offset={[0 * chunkSize, 0 * chunkSize]}
        scale={1}
        width={chunkSize}
        heightGenerators={heightGenerators}
      />
    </group>
  );
}
