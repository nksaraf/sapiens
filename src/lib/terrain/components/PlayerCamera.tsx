import { useFrame } from "@react-three/fiber";
import { useControls } from "../../useControls";
import React from "react";
import * as THREE from "three";
import { Sphere } from "@react-three/drei";
import { useKeyboardInput } from "src/Keyboard";
import { Camera } from "../../../Camera";
import { useViewer } from "./Demo";

export function PlayerCamera() {
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

    // cameraRef.current?.position.copy(position);
    // cameraRef.current?.lookAt(position);
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
        onUpdate={(c: THREE.PerspectiveCamera) => c.lookAt(0, 0, 0)}
        position={[0, 500, -500]}
        far={100000}
        near={0.1}
        makeDefault />
    </>
  );
}
