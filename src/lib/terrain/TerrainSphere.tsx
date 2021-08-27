import { NoiseParams, useNoiseGenerator } from "@/noise";
import { Plane } from "@react-three/drei";
import { MeshProps } from "@react-three/fiber";
import { useControls } from "leva";
import React from "react";
import * as THREE from "three";
import {
  TerrainMaterial,
  TerrainMesh,
  TerrainSphereMesh,
  TerrainSphereMeshProps,
} from "./components";
import { FixedHeightGenerator, NoisyHeightGenerator } from "./height-generator";
import {
  COLORS,
  FixedColourGenerator,
  HyposymetricTintsGenerator,
} from "./color-generator";

let constantHeightGen = new FixedHeightGenerator({ height: 0 });

function TerrainSphereFace({
  height,
  width,
  resolution,
  ...props
}: MeshProps & {
  height: number;
  width: number;
  resolution: number;
}) {
  const geom = React.useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    const positions = [];

    return geometry;
  }, []);
  return (
    <mesh {...props}>
      <primitive object={geom} attach="geometry" />
      <meshStandardMaterial color="red" wireframe={true} />
    </mesh>
  );
}

export const DIRECTIONS = {
  UP: new THREE.Vector3(0, 1, 0),
  DOWN: new THREE.Vector3(0, -1, 0),
  LEFT: new THREE.Vector3(-1, 0, 0),
  RIGHT: new THREE.Vector3(1, 0, 0),
  FRONT: new THREE.Vector3(0, 0, 1),
  BACK: new THREE.Vector3(0, 0, -1),
};

const terrainNoiseParams = {
  octaves: 10,
  persistence: 0.5,
  lacunarity: 1.6,
  exponentiation: 7.5,
  height: 1,
  scale: 500,
  noiseType: "simplex",
  seed: 1,
} as const;

const biomeNoiseParams = {
  octaves: 2,
  persistence: 0.5,
  lacunarity: 2.0,
  scale: 2048.0,
  noiseType: "simplex",
  seed: 2,
  exponentiation: 1,
  height: 1.0,
} as const;

export function useHeightGenerator(params: NoiseParams = terrainNoiseParams) {
  const terrainNoiseGenerator = useNoiseGenerator("terrain", params);

  const heightGenerator = React.useMemo(() => {
    return new NoisyHeightGenerator(terrainNoiseGenerator);
  }, [terrainNoiseGenerator]);

  return heightGenerator;
}

export const useColorGenerator = (params: NoiseParams = biomeNoiseParams) => {
  const biomeNoiseGenerator = useNoiseGenerator("biome", params);

  const colorGenerator = React.useMemo(() => {
    return new HyposymetricTintsGenerator({
      biomeNoiseGenerator,
    });
  }, [biomeNoiseGenerator]);

  return colorGenerator;
};

export function TerrainSphere(props: TerrainSphereMeshProps) {
  return (
    <>
      {Object.keys(DIRECTIONS).map((key) => (
        <TerrainSphereMesh
          {...props}
          key={key}
          localUp={DIRECTIONS[key as keyof typeof DIRECTIONS]}
        />
      ))}
    </>
  );
}

export function Planet(props: TerrainSphereMeshProps) {
  const colorGenerator = useColorGenerator({
    octaves: 2,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 2048.0,
    noiseType: "simplex",
    seed: 2,
    exponentiation: 1,
    height: 1.0,
  });

  const heightGenerator = useHeightGenerator({
    octaves: 10,
    persistence: 0.5,
    lacunarity: 1.36,
    exponentiation: 5.5,
    height: 1,
    scale: 200,
    noiseType: "simplex",
    seed: 1,
  });

  return (
    <TerrainSphere
      heightGenerator={heightGenerator}
      colorGenerator={colorGenerator}
      worker={false}
      {...props}
    />
  );
}
