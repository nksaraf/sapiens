import {
  Box,
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Plane,
  useHelper,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { Suspense, useRef } from "react";
import { useControls } from "leva";
import { Piece } from "./Piece";
import { algebraic, Chess, file, rank, SQUARES } from "@/chess";
import type { Square as SquareType } from "@/chess";
import { DirectionalLightHelper, GridHelper } from "three";
import { useStore } from "./store";
import { Toaster } from "react-hot-toast";
import { useHover } from "./useHover";

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

function Board() {
  const props = useControls("board", {
    xOffset: { value: -9, step: 1 },
    yOffset: { value: -10, step: 1 },
    xSquareSize: { value: 2.5, step: 0.1 },
    ySquareSize: { value: 2.5, step: 0.1 },
  });
  const game = useStore((s) => s.game);

  return (
    <>
      {Object.keys(SQUARES).map((square) => {
        let index = SQUARES[square as SquareType];
        let y = rank(index);
        let x = file(index);

        const piece = game.get(square);
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
                color={colorMap[piece.color]}
              />
            )}
          </>
        );
      })}
    </>
  );
}

function Square({ position, square }: { square: string; position: any }) {
  const props = useControls("square", {
    width: { value: 2.5, step: 0.1 },
    height: { value: 2.5, step: 0.1 },
  });

  const game = useStore((s) => s.game);
  const selectedSquare = useStore((s) => s.selectedSquare);

  const squareColor = game.squareColor(square);

  const isSelected = selectedSquare === square;
  const isMovable = selectedSquare
    ? game
        .moves({ square: selectedSquare })
        .some((m) => game.move(m, { dry_run: true })?.to === square)
    : false;

  const [isHovered, bind] = useHover();

  console.log(isMovable);

  return (
    <mesh {...bind} receiveShadow position={position} castShadow>
      <boxBufferGeometry args={[props.width, 2, props.height]} />
      <meshLambertMaterial
        color={
          isHovered
            ? "red"
            : isSelected
            ? "gold"
            : isMovable
            ? "blue"
            : squareColor == "light"
            ? "white"
            : "black"
        }
      />
    </mesh>
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

export function App() {
  return (
    <div className="h-screen w-screen">
      <Toaster />
      <Canvas shadows>
        <color attach="background" args={["black"]} />
        <Camera />
        <Controls />
        {/* <gridHelper /> */}
        <Suspense fallback={<Box />}>
          <Light />
          {/* <CenterPiece /> */}
          <Board />
          <Environment path="/hdri/" preset="city" />
        </Suspense>
        <Plane
          receiveShadow
          args={[40, 40]}
          position={[0, -2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
