import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import React from "react";
import * as THREE from "three";
// import { TerrainMesh as ThreeTerrainMesh } from "./TerrainMesh";
import {
  useTerrainGenerator,
  useViewer,
  terrainMaterial,
  TerrainMaterial,
} from "./Demo";
import { TerrainMesh, TerrainMeshProps } from "./components";
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

  let ref = React.useRef(``);

  // let position = useViewer((s) => s.position);
  // let children = React.useMemo(() => {
  //   let tree = new QuadTree2({
  //     min: new THREE.Vector2(-10000, -10000),
  //     max: new THREE.Vector2(10000, 10000),
  //     minNodeSize: 500,
  //   });

  //   const { position } = useViewer.getState();

  //   tree.insert(position);
  //   return tree.getChildren();
  // }, []);

  useFrame(() => {
    let tree = new QuadTree2({
      min: new THREE.Vector2(-10000, -10000),
      max: new THREE.Vector2(10000, 10000),
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
      console.log("no change");
      return;
    }

    console.log(difference, toDelete);
    // const [chunkX, chunkZ] = getCellIndex(position, chunkSize);
    // const key = `${chunkX}.${chunkZ}`;
    // if (key === ref.current) {
    //   return;
    // }

    // let visibleChunks = Math.floor(maxViewDistance / chunkSize);

    // ref.current = key;
    setChunks(newChunks);

    //   return { ...chunks, ...newChunks };
    // });
  });

  return (
    <>
      {Object.keys(chunks).map((k) => {
        let chunk = chunks[k];
        return (
          <TerrainChunk
            key={chunk.key}
            size={chunk.size}
            offset={chunk.offset}
            resolution={resolution}
            heightGenerator={heightGenerator}
            colorGenerator={colorGenerator}
            // maxViewDistance={maxViewDistance}
            frustumCulled={false}
          >
            <TerrainMaterial />
          </TerrainChunk>
        );
      })}
      {/* {children.map((child) => {
        return (
          <TerrainChunk
            key={`${child.center.x}.${child.center.y}/${child.size.x}`}
            size={child.size.x}
            offset={[child.center.x, 0, child.center.y]}
            resolution={resolution}
            heightGenerator={heightGenerator}
            colorGenerator={colorGenerator}
            // maxViewDistance={maxViewDistance}
            frustumCulled={false}
          >
            <TerrainMaterial />
          </TerrainChunk>
        );
      })} */}
      {/* <TerrainChunk
        size={200}
        offset={[0, 0, 0]}
        resolution={resolution}
        heightGenerator={heightGenerator}
        colorGenerator={colorGenerator}
        // maxViewDistance={maxViewDistance}
        frustumCulled={false}
      >
        <TerrainMaterial />
      </TerrainChunk>
      <TerrainChunk
        size={200}
        offset={[0, 0, -200]}
        resolution={resolution}
        heightGenerator={heightGenerator}
        colorGenerator={colorGenerator}
        // maxViewDistance={maxViewDistance}
        frustumCulled={false}
      >
        <TerrainMaterial />
      </TerrainChunk> */}
      {/* <TerrainChunk
        size={200}
        offset={[200, 0, 100]}
        resolution={resolution}
        heightGenerator={heightGenerator}
        colorGenerator={colorGenerator}
        visible={useControls("terrain", { v2: true }).v2}
        // maxViewDistance={maxViewDistance}
        frustumCulled={false}
      >
        <TerrainMaterial />
      </TerrainChunk> */}
      {/* <TerrainChunk
        size={200}
        offset={[200, 0, -100]}
        resolution={resolution}
        heightGenerator={heightGenerator}
        colorGenerator={colorGenerator}
        // maxViewDistance={maxViewDistance}
        frustumCulled={false}
      >
        <TerrainMaterial />
      </TerrainChunk> */}
      {/* <TerrainChunk
        size={200}
        offset={[200, 0, -300]}
        resolution={resolution}
        heightGenerator={heightGenerator}
        colorGenerator={colorGenerator}
        // maxViewDistance={maxViewDistance}
        frustumCulled={false}
      >
        <TerrainMaterial />
      </TerrainChunk> */}
      {/* <TerrainChunk
        size={400}
        offset={[300, 0, 0]}
        resolution={resolution}
        heightGenerator={heightGenerator}
        colorGenerator={colorGenerator}
        visible={useControls("terrain", { v1: true }).v1}
        // maxViewDistance={maxViewDistance}
        frustumCulled={false}
      >
        <TerrainMaterial />
      </TerrainChunk> */}
      <gridHelper scale={100} />
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
