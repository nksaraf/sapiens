import React from "react";

export const useHover = () => {
  const [hover, setHover] = React.useState(false);
  return [
    hover,
    {
      onPointerEnter: () => {
        setHover(true);
      },
      onPointerOut: () => {
        console.log("pointer out");
        setHover(false);
      },
    },
  ] as const;
};
