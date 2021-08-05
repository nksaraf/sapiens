import { math } from "@/math";
import React from "react";
import * as THREE from "three";
import { Vector2 } from "three";
import create from "zustand";
import { $ } from "./atoms";
import { NoiseGenerator, useNoiseGenerator } from "./noise";

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
  biomeGenerator: NoiseGenerator;
  heightGenerators: HeightGenerator[];

}) {

  const size = React.useMemo(() => {
    return new THREE.Vector3(width * scale, 0, width * scale)
  }, [width, scale])

  const object = React.useMemo(() => {
    const geometry = new THREE.Mesh(
      new THREE.PlaneGeometry(size.x, size.z, 128, 128),
      new THREE.MeshStandardMaterial({
        // wireframe: true,
        color: 0xFFFFFF,
        side: THREE.FrontSide,
      }))
    geometry.position.add(offset)
    geometry.receiveShadow = true;
    geometry.castShadow = false
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
    object.geometry.attributes.position.needsUpdate = true;
    object.geometry.computeBoundingBox();
    object.geometry.computeVertexNormals();
  }, [object, offset, heightGenerators])
  return (
    <primitive object={object} />
  );
}

export function Terrain({ chunkSize = 500 }) {
  const noise = useNoiseGenerator();
  const biome = useNoiseGenerator();
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
      {chunks.map((chunk, index) => (
        <TerrainChunk
          key={index}
          scale={1}
          biomeGenerator={biome}
          width={chunkSize}
          {...chunk}
        />))}
    </group>
  );
}
