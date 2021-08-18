import { useNoiseGenerator } from "@/noise";
import { useFrame, useThree } from "@react-three/fiber";
import { folder, useControls } from "leva";
import React from "react";
import * as THREE from "three";
import { HyposymetricTintsGenerator } from "./texture-generator";
import { NoisyHeightGenerator } from "./height-generator";
import { Sphere, useHelper } from "@react-three/drei";
import { useInput } from "src/Keyboard";
import { InfiniteTerrain } from "./InfiniteTerrain";
import { createStore } from "../store";

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

export const useViewer = createStore({
  position: new THREE.Vector3(0, 0, 50),
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
          maxViewDistance: 1000,
          chunkSize: 500,
          resolution: 64,
        })}
      />
      <axesHelper scale={[100, 100, 100]} />
    </group>
  );
}
