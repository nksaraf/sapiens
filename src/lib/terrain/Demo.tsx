import { useNoiseGenerator } from "@/noise";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "../useControls";
import React from "react";
import * as THREE from "three";
import { HyposymetricTintsGenerator } from "./lib/color-generator";
import { NoisyHeightGenerator } from "./lib/height-generator";
import {
  PerspectiveCamera,
  Sky,
  Sphere,
  OrbitControls,
} from "@react-three/drei";
import { useKeyboardInput } from "src/Keyboard";
import { Planet } from "./components/Planet";
import { createStore } from "../store";
import { TransformControls } from "@react-three/drei";
import { QuadTreeTerrain } from "./components/InfiniteTerrain";

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
    const { controls } = useKeyboardInput.getState();
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
  });

  return (
    <>
      <TransformControls>
        <Sphere ref={ref} args={[10, 10, 10]} position={[0, 50, 0]}>
          <meshStandardMaterial color="red" />
        </Sphere>
      </TransformControls>
    </>
  );
}

export default function TerrainDemo() {
  return (
    <>
      <PlayerCamera />
      {/* <QuadTreeTerrain
        {...useControls("terrain", {
          width: 1000,
          height: 1000,
          maxViewDistance: 1000,
          chunkSize: 500,
          resolution: 64,
        })}
      /> */}
      <gridHelper args={[300, 30]} />
      <PerspectiveCamera
        makeDefault
        position={[0, 300, -300]}
        far={100000}
        near={0.1}
      />
      <OrbitControls makeDefault />
      <Sky
        distance={4500}
        sunPosition={[0, 20, -200]}
        inclination={0}
        azimuth={0.25}
      />
      <Planet
        {...useControls("planet", {
          resolution: 64,
          radius: { value: 100, min: 1, max: 500 },
          position: { value: [0, -100, 0], step: 1 },
        })}
      />
      <axesHelper scale={[100, 100, 100]} />
    </>
  );
}
