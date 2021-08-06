import { ThreeEvent } from "@react-three/fiber";
import React from "react";

export const useHover = ({
  onPointerEnter,
  onPointerLeave,
}: {
  onPointerEnter: (event: ThreeEvent<PointerEvent>) => void;
  onPointerLeave: (event: ThreeEvent<PointerEvent>) => void;
}) => {
  const [hover, setHover] = React.useState(false);
  return [
    hover,
    {
      onPointerEnter: (e: ThreeEvent<PointerEvent>) => {
        setHover(true);
        onPointerEnter(e);
      },
      onPointerOut: (e: ThreeEvent<PointerEvent>) => {
        setHover(false);
        onPointerLeave(e);
      },
    },
  ] as const;
};
