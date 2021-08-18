import { useNoiseGenerator } from "@/noise";
import { useFrame, useThree } from "@react-three/fiber";
import { folder, useControls } from "leva";
import React from "react";
import * as THREE from "three";
import { HyposymetricTintsGenerator } from "./texture-generator";
import { NoisyHeightGenerator } from "./height-generator";
import { PerspectiveCamera, Sphere, useHelper } from "@react-three/drei";
import { useInput } from "src/Keyboard";
import { InfiniteTerrain, QuadTreeTerrain } from "./InfiniteTerrain";
import { createStore } from "../store";
import { OrbitControls } from "@react-three/drei";
import { TerrainPlane } from "./TerrainPlane";

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

export function TerrainMaterial() {
  const materialControls = useControls("terrain", {
    wireframe: false,
  });

  return (
    <primitive
      attach="material"
      object={terrainMaterial}
      {...materialControls}
    />
  );
}

export const useViewer = createStore({
  position: new THREE.Vector3(0, 50, 0),
});

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

    const { position } = useViewer.getState();
    const { controls } = useInput.getState();
    if (controls.forward) {
      ref.current.position.z += speed;
    }
    if (controls.backward) {
      ref.current.position.z -= speed;
    }
    if (controls.left) {
      ref.current.position.x -= speed;
    }
    if (controls.right) {
      ref.current.position.x += speed;
    }

    position.copy(ref.current.position);
    // ref.current.position.copy(position);
    // camera.lookAt(position);
    // camera.position.z = ref.current.position.y + 10;
  });
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 100, -100]}
        far={100000}
        near={0.1}
      />
      <OrbitControls makeDefault />
      <Sphere ref={ref} args={[10, 10, 10]} position={[0, 50, 0]}>
        <meshStandardMaterial color="red" />
      </Sphere>
    </>
  );
}

export default function TerrainDemo() {
  return (
    <>
      <PlayerCamera />
      <QuadTreeTerrain
        {...useControls("terrain", {
          width: 1000,
          height: 1000,
          maxViewDistance: 1000,
          chunkSize: 500,
          resolution: 64,
        })}
      />
      <axesHelper scale={[100, 100, 100]} />
    </>
  );
}
