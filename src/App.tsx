import { Html, OrbitControls, Sky, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  Leva,
  LevaPanel,
  levaStore,
  LevaStoreProvider,
  useControls,
  useStoreContext,
  useCreateStore,
} from "leva";
import { Toaster } from "react-hot-toast";
import { atom, Provider } from "jotai";
import { $ } from "src/atoms";
import { getEngineMove, makeMove } from "@/chess/state";
import { Text } from "@react-three/drei";
import { useAtomValue } from "jotai/utils";
import { Camera } from "./components/Camera";
import { Light } from "./Light";
import { Keyboard, useKeyboardInput } from "./Keyboard";

import React, { Suspense, useEffect } from "react";
import { World } from "@/ecs/components/World";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createEffect } from "react-solid-state";
import { Character } from "./models/Cow";
import { CameraSystem } from "./Camera";

const TerrainDemo = React.lazy(() => import("@/terrain/components/Demo"));
// function UI() {
//   const inCheckmate = useAtomValue($.inCheckmate);
//   return (
//     <>
//       <Text
//         position={[-30, 0, 0]}
//         rotation={[-Math.PI / 2, 0, 0]}
//         color="white"
//         fontSize={4}
//         anchorX="center"
//         anchorY="middle"
//       >
//         {inCheckmate ? "checkmate " : "hello world!"}
//       </Text>
//       <Html position={[-30, 0, 0]}>
//         <div>Turn: {useAtomValue($.turn)} </div>
//       </Html>
//     </>
//   );
// }

function StoreDebugger() {
  // const val = levaStore.useStore();
  // console.log(JSON.stringify(val, null, 2));
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     localStorage.setItem("leva-store-123", JSON.stringify(val));
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, [JSON.stringify(val)]);
  return null;
}
export function App() {
  return (
    <Provider>
      <Suspense fallback={<div>Loading</div>}>
        <div className="h-screen w-screen">
          <Toaster />
          <StoreDebugger />
          <Canvas shadows>
            <World />
            <color attach="background" args={["white"]} />
            <Keyboard />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<TerrainDemo />} />
                <Route
                  path="/other"
                  element={
                    <CameraSystem>
                      <Camera
                        name="player camera"
                        camera="perspective"
                        position={[-40, 20, 20]}
                        far={10000}
                        onUpdate={(c: THREE.PerspectiveCamera) =>
                          c.lookAt(0, 0, 0)
                        }
                        near={0.1}
                        makeDefault
                      />
                      <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        scale={[100, 100, 100]}
                        receiveShadow
                      >
                        <planeBufferGeometry />
                        <meshStandardMaterial />
                      </mesh>
                      <Character />
                      <OrbitControls makeDefault />
                    </CameraSystem>
                  }
                />
              </Routes>
            </BrowserRouter>
            <Light />
            <Stats />
          </Canvas>
          <Debugger />
        </div>
      </Suspense>
    </Provider>
  );
}

function Debugger() {
  return (
    <pre className="fixed bottom-2 right-2">
      {JSON.stringify(useKeyboardInput((s) => s.controls))}
    </pre>
  );
}
