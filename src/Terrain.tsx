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

function getRandomHeight(params: {
  position: THREE.Vector3,
  minRadius: number,
  maxRadius: number,
  generator: NoiseGenerator,
}, x: number, y: number): [number, number] {
  const distance = params.position.distanceTo(new THREE.Vector3(x, y, 0));
  let normalization =
    1.0 -
    math.sat(
      (distance - params.minRadius) / (params.maxRadius - params.minRadius)
    );
  normalization = normalization * normalization * (3 - 2 * normalization);

  return [params.generator.noise2D(x!, y!), 1];
}

interface HeightGenerator {
  get(x: number, y: number): [number, number]
}

export function TerrainChunk({
  width,
  scale,
  offset,
  // biomeGenerator,
  heightGenerators,
}: {
  width: number;
  scale: number;
  offset: THREE.Vector3;
  // biomeGenerator: (x: number, y: number, z: number) => number;
  heightGenerators: HeightGenerator[];
}) {

  const size = React.useMemo(() => {
    return new THREE.Vector3(width * scale, 0, width * scale)
  }, [width, scale])

  const object = React.useMemo(() => {
    const geometry = new THREE.Mesh(
      new THREE.PlaneGeometry(size.x, size.z, 128, 128),
      new THREE.MeshStandardMaterial({
        wireframe: true,
        color: 0xFFFFFF,
        side: THREE.FrontSide,
      }))
    geometry.position.add(offset)
    geometry.material.vertexColors = true
    return geometry;
  }, [size, offset]);

  React.useLayoutEffect(() => {
    let position = object.geometry.getAttribute('position')
    for (var i = 0; i < position.count; i++) {
      const heightPairs = [];
      let normalization = 0;
      let z = 0
      let x = position.getX(i);
      let y = position.getY(i);

      for (let gen of heightGenerators) {
        heightPairs.push(gen.get(x + offset.x, y + offset.y));
        normalization += heightPairs[heightPairs.length - 1][1];
      }


      if (normalization > 0) {
        for (let h of heightPairs) {
          z += h[0] * h[1] / normalization;
        }
      }
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
  }, [object, offset, heightGenerators])
  return (
    <primitive object={object} />
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
    const noiseValue =
      params.generator.noise2D(xs * frequency, ys * frequency) * 0.5 + 0.5;
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

function useNoiseGenerator() {
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
        }, x, y)
      },
      noise3D(x: number, y: number, z: number) {
        // get3DNoise({
        //   ...ref.current,
        //   generator: noiseFn
        // }, x, y)
        return 0
      }
    } as NoiseGenerator
  }, [noiseFn, controls])

  return generator;
}

export function Terrain({ chunkSize = 500 }) {
  const noise = useNoiseGenerator();
  const chunks = React.useMemo(() => {
    const offset = new THREE.Vector3(0, 0, 0)
    const props = [{
      offset,
      heightGenerators: [{ get: (x: number, y: number) => getRandomHeight({ generator: noise, position: new THREE.Vector3(0, 0, 0), minRadius: 100000, maxRadius: 100000 + 1 }, x, y) }]
    }]
    return props;
  }, [noise])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {chunks.map((chunk, index) => (<TerrainChunk
        key={index}
        scale={1}
        width={chunkSize}
        {...chunk}
      />))}
    </group>
  );
}
