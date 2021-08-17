import { Box, Html, OrbitControls, Plane, Sky, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { Suspense } from "react";
import { useControls } from "leva";
import { Toaster } from "react-hot-toast";
import { atom, Provider, useAtom } from "jotai";
import { $, useCharacter } from "src/atoms";
import { getEngineMove, makeMove } from "@/chess/state";
import { Text } from "@react-three/drei";
import { useAtomValue, useUpdateAtom } from "jotai/utils";
import { BLACK } from "@/chess/constants";
import { Camera } from "./Camera";
import { Light } from "./Light";
import { Character } from "./models/Cow";
import { Board } from "./models/chess/Board";
import { LevaPanel } from "leva";
import { Keyboard, useInput } from "./Keyboard";
import PlayerModel from "./models/Player";
import { Terrain } from "./lib/terrain/Terrain";
import TerrainDemo from "@/terrain/Demo";

const playEngineMove$ = atom(null, (get, set) => {
  getEngineMove(get($.engine), get($.board)).then((move) =>
    set($.board, (board) => makeMove(board, move))
  );
});

function StockfishEngine() {
  const engine = useAtomValue($.engine);
  const [board] = useAtom($.board);

  const playEngineMove = useUpdateAtom(playEngineMove$);

  React.useEffect(() => {
    if (board.turn === BLACK) {
      let timer = setTimeout(() => playEngineMove(), 1000);
      return () => clearTimeout(timer);
    }
  }, [engine, board.turn]);
  return null;
}

function UI() {
  const inCheckmate = useAtomValue($.inCheckmate);
  return (
    <>
      <Text
        position={[-30, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="white"
        fontSize={4}
        anchorX="center"
        anchorY="middle"
      >
        {inCheckmate ? "checkmate " : "hello world!"}
      </Text>
      <Html position={[-30, 0, 0]}>
        <div>Turn: {useAtomValue($.turn)} </div>
      </Html>
    </>
  );
}

function GameCamera() {
  const controls = useControls(
    "scene",
    {
      defaultCamera: { options: ["camera1", "camera2"], value: "camera1" },
      orbitControls: true,
    },
    { collapsed: true }
  );

  return (
    <>
      <Camera
        name="camera1"
        camera="perspective"
        position={[0, 500, 450]}
        fov={60}
        frustumCulled={false}
        far={10000}
        onUpdate={(camera) => camera.lookAt(0, 0, 0)}
        makeDefault={controls.defaultCamera === "camera1"}
      />
      <Camera
        name="camera2"
        camera="orthographic"
        position={[0, 10, 0]}
        onUpdate={(camera) => camera.lookAt(0, 0, 0)}
        makeDefault={controls.defaultCamera === "camera2"}
      />
      {controls.orbitControls ? <OrbitControls makeDefault /> : null}
    </>
  );
}

export function App() {
  return (
    <Provider>
      <div className="h-screen w-screen">
        <Toaster />
        <Canvas shadows>
          <color attach="background" args={["black"]} />
          <GameCamera />
          {/* <Suspense fallback={null}>
            <StockfishEngine />
          </Suspense> */}
          <TerrainDemo />
          {/* <UI /> */}
          <Keyboard />
          <Light />
          {/* <Suspense fallback={<Box />}>
            <Board />
          </Suspense> */}
          {/* <Plane
            receiveShadow
            args={[200, 200]}
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <meshStandardMaterial color="orange" />
          </Plane> */}
          <Sky
            distance={4500}
            sunPosition={[0, 20, -200]}
            inclination={0}
            azimuth={0.25}
          />
          {/* <Suspense fallback={null}>
            <PlayerModel scale={4} />
          </Suspense>
          <Suspense fallback={null}>
            <Character />
          </Suspense> */}
          <Stats />
        </Canvas>
        <Debugger />
      </div>
      {/* <Avatar /> */}
    </Provider>
  );
}

function Avatar() {
  React.useEffect(() => {
    const iframeUrl = "https://evolvfit.readyplayer.me/";

    window.addEventListener("message", receiveMessage, false);

    function receiveMessage(event: any) {
      setTimeout(() => {
        console.log(event.origin);
        // Get URL to avatar
        if (iframeUrl.includes(event.origin)) {
          console.log(`Avatar URL: ${event.data}`);
          // document.querySelector(
          //   "#avatarUrl"
          // ).innerHTML = `Avatar URL: ${event.data}`;
        }
      }, 1000);
    }

    function makeAvatar() {
      let iframe = document.getElementById("iframe") as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement("iframe") as HTMLIFrameElement;
        document.body.appendChild(iframe);
      }
      iframe.id = "iframe";
      iframe.src = iframeUrl;
      iframe.className = "fixed left-0 top-0";
      iframe.allow = "camera *; microphone *";
    }

    makeAvatar();
  }, []);

  return null;
}

function Debugger() {
  return (
    <pre className="fixed bottom-2 right-2">
      {JSON.stringify(useInput((s) => s.controls))}
    </pre>
  );
}
