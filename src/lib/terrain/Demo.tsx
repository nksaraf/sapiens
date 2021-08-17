import { NoiseGenerator, NoiseType, useNoiseGenerator } from "@/noise";
import {
  extend,
  Object3DNode,
  Node,
  useFrame,
  useThree,
} from "@react-three/fiber";
import { folder, useControls } from "leva";
import React from "react";
import * as THREE from "three";
import { HyposymetricTintsGenerator } from "./texture-generator";
import { NoisyHeightGenerator } from "./height-generator";
import { TerrainMesh as _TerrainMesh } from "./TerrainMesh";
import { Sphere, useHelper } from "@react-three/drei";
import { useInput } from "src/Keyboard";
import create from "zustand";
import { combine } from "zustand/middleware";
import { AxesHelper } from "three";
import { InfiniteTerrain } from "./InfiniteTerrain";

extend({ TerrainMesh: _TerrainMesh, NoisyHeightGenerator, NoiseGenerator });

export type TerrainMeshProps = Object3DNode<_TerrainMesh, typeof _TerrainMesh>;
export type NoisyHeightGeneratorProps = Node<
  NoisyHeightGenerator,
  typeof NoisyHeightGenerator
>;
export type NoiseGeneratorProps = Node<NoiseGenerator, typeof NoiseGenerator>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      terrainMesh: TerrainMeshProps;
      noisyHeightGenerator: NoisyHeightGeneratorProps;
      noiseGenerator: NoiseGeneratorProps;
    }
  }
}

export const TerrainMesh = React.memo(function TerrainMesh(
  props: TerrainMeshProps
) {
  const ref = React.useRef<_TerrainMesh>();

  React.useLayoutEffect(() => {
    ref.current?.update();
  }, [
    props.resolution,
    props.heightGenerator,
    props.colorGenerator,
    props.width,
    props.height,
    ...(props.offset as [number, number, number]),
  ]);

  return (
    <terrainMesh
      ref={ref}
      receiveShadow
      castShadow={false}
      position={props.offset}
      frustumCulled={false}
      {...props}
    />
  );
});

const terrainNoiseParams = {
  octaves: 10,
  persistence: 0.5,
  lacunarity: 1.6,
  exponentiation: 7.5,
  height: 900.0,
  scale: 1400.0,
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

export const useTerrainGenerator = () => {
  const terrainNoiseGenerator = useNoiseGenerator(
    "terrain",
    terrainNoiseParams
  );

  const biomeNoiseGenerator = useNoiseGenerator("biome", biomeNoiseParams);

  const colorGenerator = React.useMemo(() => {
    return new HyposymetricTintsGenerator({
      biomeNoiseGenerator,
    });
  }, [biomeNoiseGenerator]);

  const heightGenerator = React.useMemo(() => {
    return new NoisyHeightGenerator(terrainNoiseGenerator);
  }, [terrainNoiseGenerator]);

  return { colorGenerator, heightGenerator };
};

export const terrainMaterial = new THREE.MeshStandardMaterial({
  side: THREE.FrontSide,
  vertexColors: true,
});

function TerrainPlane({
  width = 1000,
  height = 1000,
  chunkSize = 500,
  resolution = 100,
}) {
  const { colorGenerator, heightGenerator } = useTerrainGenerator();

  let chunksX = Math.ceil(width / chunkSize);
  let chunksY = Math.ceil(height / chunkSize);
  const materialControls = useControls("terrain", {
    wireframe: true,
  });

  return (
    <>
      {[...new Array(chunksX).fill(0)].map((_, x) =>
        [...new Array(chunksY).fill(0)].map((_, y) => {
          return (
            <TerrainMesh
              key={`${x}.${y}`}
              offset={[chunkSize * x, -chunkSize * y, 0]}
              width={chunkSize}
              height={chunkSize}
              resolution={resolution}
              heightGenerator={heightGenerator}
              colorGenerator={colorGenerator}
            >
              <primitive
                attach="material"
                object={terrainMaterial}
                {...materialControls}
              />
            </TerrainMesh>
          );
        })
      )}
    </>
  );
}

export const useCameraPosition = create(
  combine(
    {
      position: new THREE.Vector3(0, 0, 50),
    },
    (set, get) => ({ set, get })
  )
);

function PlayerCamera() {
  const ref = React.useRef<THREE.Mesh>();
  const { speed } = useControls("player", {
    speed: { value: 5, min: 1, max: 100 },
  });
  const camera = useThree((c) => c.camera);
  useFrame(() => {
    if (!ref.current) {
      return;
    }

    const { position } = useCameraPosition.getState();

    const { controls } = useInput.getState();
    if (controls.forward) {
      position.y += speed;
    }
    if (controls.backward) {
      position.y -= speed;
    }
    if (controls.left) {
      position.x -= speed;
    }
    if (controls.right) {
      position.x += speed;
    }

    ref.current.position.copy(position);
    // camera.lookAt(ref.current.position);
  });
  return (
    <Sphere ref={ref} args={[10, 10, 10]}>
      <meshStandardMaterial color="red" />
    </Sphere>
  );
}

export default function TerrainDemo() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <PlayerCamera />
      <InfiniteTerrain
        {...useControls("terrain", {
          // width: 1000,
          // height: 1000,
          chunkSize: 200,
          resolution: 100,
        })}
      />
      <axesHelper scale={[100, 100, 100]} />
    </group>
  );
}
