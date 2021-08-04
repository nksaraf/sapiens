import React from "react";
import { useControls } from "leva";
import { Piece } from "./Piece";
import { algebraic, file, rank, SQUARES } from "src/lib/chess";
import { Square as SquareType } from "src/lib/chess";
import { $ } from "src/atoms";
import { useAtomValue } from "jotai/utils";
import { Square } from "./Square";

function BoardSquare({ square }: { square: SquareType }) {
  let index = SQUARES[square as SquareType];
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
          0,
          y * props.ySquareSize + props.yOffset,
        ]}
      />
      {piece && (
        <Piece
          position={[
            x * props.xSquareSize + props.xOffset,
            1,
            y * props.ySquareSize + props.yOffset,
          ]}
          square={square as SquareType}
          key={piece.color + piece.type + index}
          piece={piece.type}
          color={piece.color}
        />
      )}
    </>
  );
}

export function Board() {
  return (
    <>
      {Object.keys(SQUARES).map((square) => (
        <BoardSquare key={square} square={square as SquareType} />
      ))}
    </>
  );
}
