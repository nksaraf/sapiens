import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import React from "react";
import * as THREE from "three";
import { TerrainMesh as ThreeTerrainMesh } from "./TerrainMesh";
import { useTerrainGenerator, useViewer } from "./Demo";
import { TerrainMaterial, TerrainMesh, TerrainMeshProps } from "./components";
import { QuadTree2 } from "@/quadtree";
import { utils } from "./utils";

function getCellIndex(p: THREE.Vector3, chunkSize: number) {
  const xp = p.x + chunkSize * 0.5;
  const zp = p.z + chunkSize * 0.5;
  const x = Math.floor(xp / chunkSize);
  const z = Math.floor(zp / chunkSize);
  return [x, z];
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
    const [chunkX, chunkZ] = getCellIndex(position, chunkSize);
    const key = `${chunkX}.${chunkZ}`;
    if (key === ref.current) {
      return;
    }

    let visibleChunks = Math.floor(maxViewDistance / chunkSize);

    ref.current = key;
    setChunks((chunks) => {
      let newChunks = {};
      for (var xOffset = -visibleChunks; xOffset <= visibleChunks; xOffset++) {
        for (
          var zOffset = -visibleChunks;
          zOffset <= visibleChunks;
          zOffset++
        ) {
          chunks[`${chunkX + xOffset}.${chunkZ + zOffset}`] = {
            offset: [
              (chunkX + xOffset) * chunkSize,
              (chunkZ + zOffset) * chunkSize,
            ],
            size: chunkSize,
            resolution: resolution,
          };
        }
      }

      return { ...chunks, ...newChunks };
    });
  });

  return (
    <>
      {Object.keys(chunks).map((k) => {
        let chunk = chunks[k];
        let [x, z] = chunk.offset;
        return (
          <TerrainChunk
            key={`${x}.${z}`}
            size={chunkSize}
            offset={[x, 0, z]}
            resolution={resolution}
            heightGenerator={heightGenerator}
            colorGenerator={colorGenerator}
            maxViewDistance={maxViewDistance}
            frustumCulled={false}
          >
            <TerrainMaterial />
          </TerrainChunk>
        );
      })}
    </>
  );
}

class TerrainChunkPool {}

let pool: Record<number, ThreeTerrainMesh[]> = {};
let active: Record<string, ThreeTerrainMesh> = {};

// function retireChunks(chunks: Record<string, TerrainChunkParams>) {
//   for (let c of chunks) {
//     if (!(c.width in pool)) {
//       this._pool[c.chunk._params.width] = [];
//     }

//     c.chunk.Hide();
//     this._pool[c.chunk._params.width].push(c.chunk);
//   }
// }

function TerrainBuilder({ children }: React.PropsWithChildren<{}>) {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        let chunkElement = child as React.ReactElement;
        if (chunkElement.type === TerrainMesh) {
          console.log(child);
          let mesh;

          if (active[chunkElement.key!]) {
            mesh = active[chunkElement.key!];
          } else {
            let w = chunkElement.props.size;
            if (!(w in pool)) {
              pool[w] = [];
            }

            if (pool[w].length > 0) {
              mesh = pool[w].pop();
            } else {
              mesh = new ThreeTerrainMesh();
            }
          }

          active[chunkElement.key!] = mesh!;

          return (
            <TerrainMesh
              key={chunkElement.key}
              object={mesh}
              {...chunkElement.props}
            />
          );
        }
        return null;
      })}
    </>
  );
}

export function QuadTreeTerrain({
  // maxViewDistance = 400,
  // chunkSize = 200,
  resolution = 64,
}) {
  const { heightGenerator, colorGenerator } = useTerrainGenerator();

  interface TerrainChunkParams {
    offset: [number, number, number];
    size: number;
    resolution: number;
    key: string;
  }

  const [chunks, setChunks] = React.useState(
    () => ({} as Record<string, TerrainChunkParams>)
  );
  const [toDelete, setToDelete] = React.useState(
    () => ({} as Record<string, TerrainChunkParams>)
  );

  let ref = React.useRef(``);

  useFrame(() => {
    let tree = new QuadTree2({
      min: new THREE.Vector2(-1000, -1000),
      max: new THREE.Vector2(1000, 1000),
      minNodeSize: 500,
    });

    const { position } = useViewer.getState();

    tree.insert(position);
    const children = tree.getChildren();
    let newChunks: Record<string, TerrainChunkParams> = {};
    for (let child of children) {
      newChunks[`${child.center.x}.${child.center.y}/${child.size.x}`] = {
        offset: [child.center.x, 0, child.center.y],
        size: child.size.x,
        resolution: resolution,
        key: `${child.center.x}.${child.center.y}/${child.size.x}`,
      };
    }

    let difference = utils.DictDifference(newChunks, chunks);
    let toDelete = utils.DictDifference(chunks, newChunks);
    if (
      Object.keys(difference).length === 0 &&
      Object.keys(toDelete).length === 0
    ) {
      return;
    }

    console.log(newChunks);

    console.log(difference, toDelete);
    setChunks(newChunks);
  });

  return (
    <>
      <TerrainBuilder>
        {Object.keys(chunks).map((k) => {
          let chunk = chunks[k];
          return (
            <TerrainMesh
              key={chunk.key}
              width={chunk.size}
              height={chunk.size}
              offset={chunk.offset}
              resolution={resolution}
              heightGenerator={heightGenerator}
              colorGenerator={colorGenerator}
              // maxViewDistance={maxViewDistance}
              frustumCulled={false}
            >
              <TerrainMaterial />
            </TerrainMesh>
          );
        })}
      </TerrainBuilder>
    </>
  );
}

function TerrainChunk({
  size,
  resolution,
  // maxViewDistance,
  ...props
}: TerrainMeshProps & { size: number; maxViewDistance: number }) {
  const [visible, setVisible] = React.useState(true);
  // useFrame(() => {
  //   const { position } = useViewer.getState();
  //   const offset = new THREE.Vector3(
  //     ...(props.offset as [number, number, number])
  //   );
  //   if (offset.distanceTo(position) > maxViewDistance && visible) {
  //     setVisible(false);
  //   } else if (offset.distanceTo(position) < maxViewDistance && !visible) {
  //     setVisible(true);
  //   }
  // });
  return (
    <TerrainMesh
      width={size}
      height={size}
      visible={visible}
      resolution={resolution}
      {...props}
    />
  );
}


