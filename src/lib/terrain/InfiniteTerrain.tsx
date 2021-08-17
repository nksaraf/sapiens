import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import React from "react";
import * as THREE from "three";
import { TerrainMesh as _TerrainMesh } from "./TerrainMesh";
import {
  useTerrainGenerator,
  useCameraPosition,
  TerrainMesh,
  terrainMaterial,
} from "./Demo";

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
    const { position } = useCameraPosition.getState();
    const [chunkX, chunkY] = getCellIndex(position, chunkSize);
    const key = `${chunkX}.${chunkY}`;
    if (key === ref.current) {
      return;
    }

    let visibleChunks = maxViewDistance / chunkSize;

    ref.current = key;
    setChunks((chunks) => {
      let newChunks = {};
      for (var xOffset = -visibleChunks; xOffset < visibleChunks; xOffset++) {
        for (var yOffset = -visibleChunks; yOffset < visibleChunks; yOffset++) {
          chunks[`${chunkX + xOffset}.${chunkY + yOffset}`] = {
            offset: [chunkX + xOffset, chunkY + yOffset],
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
          <TerrainMesh
            key={`${x}.${y}`}
            offset={[chunkSize * x, chunkSize * y, 0]}
            width={chunkSize}
            height={chunkSize}
            resolution={resolution}
            heightGenerator={heightGenerator}
            colorGenerator={colorGenerator}
          >
            <primitive
              attach="material"
              object={terrainMaterial}
              {...materialControls}
            />
          </TerrainMesh>
        );
      })}
    </>
  );
}

// function TerrainChunk({ offset, size, resolution }: TerrainMeshProps) {
//   let [x, y] = offset;
//   return (
//     <TerrainMesh
//       key={`${x}.${y}`}
//       offset={[size * x, size * y, 0]}
//       width={size}
//       height={size}
//       resolution={resolution}
//       heightGenerator={heightGenerator}
//       colorGenerator={colorGenerator}
//     >
//       <primitive
//         attach="material"
//         object={terrainMaterial}
//         {...materialControls}
//       />
//     </TerrainMesh>
//   );
// }
