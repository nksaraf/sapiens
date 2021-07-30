import {
  Box,
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  PerspectiveCamera,
  Plane,
  Sky,
  useHelper,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { Suspense, useDebugValue, useRef, useState } from "react";
import { useControls } from "leva";
import { Piece } from "./Piece";
import { algebraic, file, rank, SQUARES } from "src/lib/chess";
import type { Square as SquareType } from "src/lib/chess";
import { DirectionalLightHelper, GridHelper } from "three";
import { Toaster } from "react-hot-toast";
import { Provider, useAtom } from "jotai";
import { $ } from "src/atoms";
import {
  buildMove,
  createNewGame,
  createState,
  getFen,
  getPiece,
  makeMove,
  sanToMove,
} from "@/chess/state";
import { Text } from "@react-three/drei";
import { atomFamily, useAtomValue, useUpdateAtom } from "jotai/utils";
import { Square } from "./Square";
import { DEFAULT_POSITION } from "@/chess/constants";
import { Engine } from "@/uci/engine";

function Camera() {
  const props = useControls("camera", {
    position: { value: [0, 23, 12], step: 1 },
    fov: { value: 60, step: 1 },
    far: { value: 1000, step: 1 },
    near: { value: 0.1, step: 1 },
  });
  const ref = React.useRef();

  return (
    <PerspectiveCamera
      name="Camera"
      ref={ref}
      onUpdate={(camera) => {
        camera.lookAt(0, 0, 0);
      }}
      {...props}
      makeDefault
    />
  );
}

function Controls() {
  const props = useControls("controls", {
    enabled: true,
  });
  return props.enabled ? <OrbitControls makeDefault /> : null;
}

const pieceMap = {
  p: "Pawn",
  r: "Rook",
  q: "Queen",
  k: "King",
  n: "Knight",
  b: "Bishop",
} as const;

const colorMap = {
  b: "black",
  w: "white",
} as const;

// (async function () {
//   const engine = new Engine();

//   engine.start(console.log);

//   // stockfish.postMessage("position fen " + DEFAULT_POSITION);
//   let game = createNewGame();

//   for (var i = 0; i < 10; i++) {
//     game = await new Promise((res) => {
//       engine.go({ fen: getFen(game) }, { depth: 10 }, (move) => {
//         console.log(
//           getFen(game),
//           move.getBestMove(),
//           sanToMove(game, move.getBestMove(), { sloppy: true })!
//         );
//         res(
//           makeMove(game, sanToMove(game, move.getBestMove(), { sloppy: true })!)
//         );
//       });
//     });
//   }
// })();

function StockfishEngine() {
  const [engine] = useState(() => {
    new Engine();
  });

  React.useEffect(() => {}, [engine]);
  return null;
}

// start search
// stockfish.postMessage("go depth 10");

// setTimeout(() => {
//   console.log("heree");
//   stockfish.postMessage("stop");
// }, 2000);

function BoardSquare({ index, square }: { index: number; square: SquareType }) {
  const props = useControls("board", {
    xOffset: { value: -9, step: 1 },
    yOffset: { value: -10, step: 1 },
    xSquareSize: { value: 2.5, step: 0.1 },
    ySquareSize: { value: 2.5, step: 0.1 },
  });

  let y = rank(index);
  let x = file(index);

  const piece = useAtomValue($.piece(square));
  return (
    <>
      <Square
        key={index}
        square={algebraic(index)}
        position={[
          x * props.xSquareSize + props.xOffset,
          -1,
          y * props.ySquareSize + props.yOffset,
        ]}
      />
      {piece && (
        <Piece
          position={[
            x * props.xSquareSize + props.xOffset,
            0,
            y * props.ySquareSize + props.yOffset,
          ]}
          square={square as SquareType}
          key={piece.color + piece.type + index}
          piece={pieceMap[piece.type]}
          color={piece.color}
        />
      )}
    </>
  );
}

function Board() {
  return (
    <>
      {Object.keys(SQUARES).map((square) => (
        <BoardSquare
          index={SQUARES[square as SquareType]}
          square={square as SquareType}
        />
      ))}
    </>
  );
}

const CenterPiece = () => {
  const props = useControls("piece", {
    position: { value: [0, 0, 0], step: 1 },
    color: { options: ["black", "white"] },
    piece: {
      options: ["Queen", "King", "Bishop", "Knight", "Rook", "Pawn"] as const,
    },
  });
  return <Piece {...props} />;
};

function Light() {
  let ref = useRef();
  useHelper(ref, DirectionalLightHelper);
  return (
    <>
      <ambientLight
        {...useControls("ambientLight", {
          intensity: { value: 0.3, step: 0.1 },
        })}
      />
      <spotLight
        ref={ref}
        castShadow
        {...useControls("directionalLight", {
          position: { value: [-10, 15, -10] },
          // target: { value: [0, 0, 5] },
          intensity: { value: 1, step: 0.1 },
        })}
      ></spotLight>
    </>
  );
}

function UI() {
  return (
    <>
      {" "}
      <Text
        position={[-30, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="white"
        fontSize={4}
        anchorX="center"
        anchorY="middle"
      >
        hello world!
      </Text>
      <Html position={[-30, 0, 0]}>
        <div>Turn: {useAtomValue($.turn)} </div>
      </Html>
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
          <Camera />
          <StockfishEngine />
          <UI />
          <Controls />
          <Light />
          <Suspense fallback={<Box />}>
            <Board />
          </Suspense>
          <Plane
            receiveShadow
            args={[200, 200]}
            position={[0, -2, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <meshStandardMaterial color="orange" />
          </Plane>
          <Sky
            distance={4500}
            sunPosition={[0, 20, -200]}
            inclination={0}
            azimuth={0.25}
          />
          <Debugger />
        </Canvas>
      </div>
    </Provider>
  );
}

function Debugger() {
  console.log({ hoveredSquare: useAtomValue($.hoveredSquare) });
  return null;
}
