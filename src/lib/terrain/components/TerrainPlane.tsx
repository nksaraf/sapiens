import { useControls } from "leva";
import React from "react";
import { TerrainMesh } from "./components";
import { useColorGenerator, useHeightGenerator } from "./Planet";

export function TerrainPlane({
  width = 1000,
  height = 1000,
  chunkSize = 250,
  resolution = 64,
}) {
  const colorGenerator = useColorGenerator();
  const heightGenerator = useHeightGenerator();

  let chunksX = Math.ceil(width / chunkSize);
  let chunksZ = Math.ceil(height / chunkSize);

  return (
    <>
      {[...new Array(chunksX).fill(0)].map((_, x) =>
        [...new Array(chunksZ).fill(0)].map((_, z) => {
          return (
            <TerrainMesh
              key={`${x}.${z}`}
              offset={[chunkSize * x, 0, chunkSize * z]}
              width={chunkSize}
              height={chunkSize}
              resolution={resolution}
              heightGenerator={heightGenerator}
              colorGenerator={colorGenerator}
            />
          );
        })
      )}
    </>
  );
}
