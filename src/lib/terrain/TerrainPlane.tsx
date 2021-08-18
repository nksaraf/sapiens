import { useControls } from "leva";
import React from "react";
import { TerrainMesh } from "./components";
import { useTerrainGenerator, terrainMaterial } from "./Demo";

function TerrainPlane({
  width = 1000, height = 1000, chunkSize = 500, resolution = 100,
}) {
  const { colorGenerator, heightGenerator } = useTerrainGenerator();

  let chunksX = Math.ceil(width / chunkSize);
  let chunksY = Math.ceil(height / chunkSize);
  const materialControls = useControls("terrain", {
    wireframe: true,
  });

  return (
    <>
      {[...new Array(chunksX).fill(0)].map((_, x) => [...new Array(chunksY).fill(0)].map((_, y) => {
        return (
          <TerrainMesh
            key={`${x}.${y}`}
            offset={[chunkSize * x, -chunkSize * y, 0]}
            width={chunkSize}
            height={chunkSize}
            resolution={resolution}
            heightGenerator={heightGenerator}
            colorGenerator={colorGenerator}
          >
            <primitive
              attach="material"
              object={terrainMaterial}
              {...materialControls} />
          </TerrainMesh>
        );
      })
      )}
    </>
  );
}
