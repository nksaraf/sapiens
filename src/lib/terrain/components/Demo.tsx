import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "../../useControls";
import React from "react";
import * as THREE from "three";
import { Sky, Sphere, OrbitControls } from "@react-three/drei";
import { useKeyboardInput } from "src/Keyboard";
import { Planet } from "./Planet";
import { createStore } from "../../store";
import { TransformControls } from "@react-three/drei";
import { Camera, CameraSystem } from "./Camera";
import { Leva } from "leva";
import { Vector3 } from "three";

export const useViewer = createStore({
  position: new THREE.Vector3(0, 252, 0),
});

function PlayerCamera() {
  const ref = React.useRef<THREE.Mesh>();
  const { speed } = useControls("player", {
    speed: { value: 5, min: 1, max: 100 },
  });
  const cameraRef = React.useRef<THREE.Camera>();

  useFrame(() => {
    const { position } = useViewer.getState();

    if (ref.current) {
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
    }

    cameraRef.current?.position.copy(position);
    cameraRef.current?.lookAt(position);
  });

  return (
    <>
      <Sphere
        ref={ref}
        args={[10, 10, 10]}
        position={useViewer.getState().position}
      >
        <meshStandardMaterial color="red" />
      </Sphere>
      <Camera
        name="player"
        camera="perspective"
        ref={cameraRef as React.Ref<THREE.Camera>}
        position={[0, 500, -500]}
        onUpdate={(camera: THREE.PerspectiveCamera) => {
          camera.lookAt(useViewer.getState().position);
        }}
        far={100000}
        near={0.1}
        makeDefault
      />
    </>
  );
}

export default function TerrainDemo() {
  return (
    <>
      {/* <QuadTreeTerrain
        {...useControls("terrain", {
          width: 1000,
          height: 1000,
          maxViewDistance: 1000,
          chunkSize: 500,
          resolution: 64,
        })}
      /> */}
      {/* <gridHelper args={[300, 30]} /> */}
      <CameraSystem>
        <PlayerCamera />
        <Camera
          name="far back view"
          camera="perspective"
          position={[0, 600, -600]}
          far={100000}
          near={0.1}
        />
        <Camera
          name="far right view"
          camera="perspective"
          position={[0, 600, 600]}
          far={100000}
          near={0.1}
        />

        {/* <OrbitControls makeDefault /> */}
        <Sky
          distance={4500}
          sunPosition={[0, 20, -200]}
          inclination={0}
          azimuth={0.25}
        />
        <Planet
          {...useControls("planet", {
            resolution: 16,
            radius: { value: 250, min: 1, max: 500 },
            position: { value: [0, 0, 0], step: 1 },
          })}
        />
        <axesHelper scale={[100, 100, 100]} />
      </CameraSystem>
    </>
  );
}
