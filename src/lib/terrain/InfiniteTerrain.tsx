import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import React from "react";
import * as THREE from "three";
// import { TerrainMesh as ThreeTerrainMesh } from "./TerrainMesh";
import { useTerrainGenerator, useViewer, terrainMaterial } from "./Demo";
import { TerrainMesh, TerrainMeshProps } from "./components";

function getCellIndex(p: THREE.Vector3, chunkSize: number) {
  const xp = p.x + chunkSize * 0.5;
  const yp = p.y + chunkSize * 0.5;
  const x = Math.floor(xp / chunkSize);
  const y = Math.floor(yp / chunkSize);
  return [x, y];
}

export function InfiniteTerrain({
  maxViewDistance = 400,
  chunkSize = 200,
  resolution = 64,
}) {
  const { heightGenerator, colorGenerator } = useTerrainGenerator();

  const [chunks, setChunks] = React.useState(
    () =>
      ({} as Record<
        string,
        { offset: [number, number]; size: number; resolution: number }
      >)
  );

  let ref = React.useRef(``);

  useFrame(() => {
    const { position } = useViewer.getState();
    const [chunkX, chunkY] = getCellIndex(position, chunkSize);
    const key = `${chunkX}.${chunkY}`;
    if (key === ref.current) {
      return;
    }

    let visibleChunks = Math.ceil(maxViewDistance / chunkSize);

    ref.current = key;
    setChunks((chunks) => {
      let newChunks = {};
      for (var xOffset = -visibleChunks; xOffset <= visibleChunks; xOffset++) {
        for (
          var yOffset = -visibleChunks;
          yOffset <= visibleChunks;
          yOffset++
        ) {
          chunks[`${chunkX + xOffset}.${chunkY + yOffset}`] = {
            offset: [
              (chunkX + xOffset) * chunkSize,
              (chunkY + yOffset) * chunkSize,
            ],
            size: chunkSize,
            resolution: resolution,
          };
        }
      }

      return { ...chunks, ...newChunks };
    });
  });

  const materialControls = useControls("terrain", {
    wireframe: true,
  });

  return (
    <>
      {Object.keys(chunks).map((k) => {
        let chunk = chunks[k];
        let [x, y] = chunk.offset;
        return (
          <TerrainChunk
            key={`${x}.${y}`}
            size={chunkSize}
            offset={[x, y, 0]}
            resolution={resolution}
            heightGenerator={heightGenerator}
            colorGenerator={colorGenerator}
            frustumCulled={false}
          >
            <primitive
              attach="material"
              object={terrainMaterial}
              {...materialControls}
            />
          </TerrainChunk>
        );
      })}
    </>
  );
}

function TerrainChunk({
  size,
  resolution,
  ...props
}: TerrainMeshProps & { size: number }) {
  useFrame(() => {
    const { position } = useViewer.getState();

    // if ()
  });
  return (
    <TerrainMesh
      width={size - 10}
      height={size - 10}
      resolution={resolution}
      {...props}
    />
  );
}
