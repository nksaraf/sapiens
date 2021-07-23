import {
  Box,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Stage,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { Suspense } from "react";
import ChessSet from "./ChessSet";
import { useControls } from "leva";

function Camera() {
  const props = useControls("camera", {
    position: [0, 18, 11],
  });
  return (
    <PerspectiveCamera
      name="Camera"
      fov={75}
      far={1000}
      near={0.1}
      {...props}
      makeDefault
    />
  );
}

export function App() {
  return (
    <div className="h-screen w-screen">
      <Suspense fallback={<div>Loading</div>}>
        <Canvas>
          <Camera />
          <OrbitControls makeDefault />
          <Stage
            contactShadow
            shadows
            adjustCamera
            intensity={1}
            // @ts-expect-error
            environment={null}
            preset={undefined}
          >
            <Environment path="/hdri/" preset="city" />
            <ChessSet position={[0, 0, 0]} />
          </Stage>
        </Canvas>
      </Suspense>
    </div>
  );
}
