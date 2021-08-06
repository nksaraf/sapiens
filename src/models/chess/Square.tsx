import React from "react";
import { folder, useControls } from "leva";
import { Square as SquareType } from "src/lib/chess";
import { squareColor } from "@/chess/utils";
import { useHover } from "../../lib/useHover";
import { useAtom } from "jotai";
import { $ } from "../../atoms";
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
    color: folder({
      light: "#d7ff7e",
      dark: "#456f1b",
    }),
  });

  const color = squareColor(square);

  const piece = useAtomValue($.piece(square));

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

  const moves = useAtomValue($.moves(selectedSquare || "none"));

  const availableMove = moves.find((m) => m.to === square);

  const isMovable = availableMove ? true : false;

  const updateGame = useUpdateAtom($.board);

  const turn = useAtomValue($.turn);

  const isSelectable = piece ? piece.color === turn : false;
  const isKilling = isMovable && piece && piece.color != turn;

  return (
    <mesh
      {...bind}
      onPointerDown={(e) => {
        if (isMovable) {
          updateGame((s) => makeMove(s, sanToMove(s, availableMove!.san)!));
          setSelectedSquare("none");
        }
        if (piece?.color === turn) {
          setSelectedSquare(square);
        }
        e.stopPropagation();
      }}
      receiveShadow
      position={position}
      castShadow
    >
      <boxBufferGeometry args={[props.width, 2, props.height]} />
      <meshToonMaterial
        color={
          isMovable && isSquareHovered
            ? "green"
            : isSquareHovered && isSelectable
            ? "gold"
            : isSelected
            ? "gold"
            : isKilling
            ? "red"
            : isMovable
            ? "blue"
            : color == "light"
            ? props.light
            : props.dark
        }
      />
    </mesh>
  );
}
