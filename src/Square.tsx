import React from "react";
import { useControls } from "leva";
import { Square as SquareType } from "src/lib/chess";
import { useStore } from "./store";
import { squareColor } from "@/chess/utils";
import { useHover } from "./useHover";
import { useAtom } from "jotai";
import { $ } from "./atoms";
import { useAtomValue, useUpdateAtom } from "jotai/utils";
import { buildMove, makeMove, sanToMove } from "@/chess/state";

export function Square({
  position,
  square,
}: {
  square: SquareType;
  position: any;
}) {
  const props = useControls("square", {
    width: { value: 2.5, step: 0.1 },
    height: { value: 2.5, step: 0.1 },
  });

  const color = squareColor(square);

  // const isMovable = selectedSquare
  //   ? game
  //       .moves({ square: selectedSquare })
  //       .some((m) => game.move(m, { dry_run: true })?.to === square)
  //   : false;

  const [isSquareHovered, setIsSquareHovered] = useAtom(
    $.isHoveredSquare(square)
  );

  const [selectedSquare, setSelectedSquare] = useAtom($.selectedSquare);

  const isSelected = selectedSquare === square;

  const [isHovered, bind] = useHover({
    onPointerEnter: (e) => {
      setIsSquareHovered(true);
      e.stopPropagation();
    },
    onPointerLeave: (e) => {
      setIsSquareHovered(false);
      // e.stopPropagation();
    },
  });

  const moves = useAtomValue($.moves(selectedSquare || "a1"));

  const availableMove = moves.find((m) => m.to === square);

  const isMovable = availableMove ? true : false;

  const updateGame = useUpdateAtom($.board);

  return (
    <mesh
      {...bind}
      onPointerDown={(e) => {
        if (isMovable) {
          updateGame((s) => makeMove(s, sanToMove(s, availableMove!.san)!));
          setSelectedSquare(null);
        }
        setSelectedSquare(square);
        e.stopPropagation();
      }}
      receiveShadow
      position={position}
      castShadow
    >
      <boxBufferGeometry args={[props.width, 2, props.height]} />
      <meshLambertMaterial
        color={
          isSquareHovered
            ? "red"
            : isSelected
            ? "gold"
            : isMovable
            ? "blue"
            : color == "light"
            ? "white"
            : "black"
        }
      />
    </mesh>
  );
}
