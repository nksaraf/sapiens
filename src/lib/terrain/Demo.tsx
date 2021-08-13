import { NoiseGenerator, NoiseType, useNoiseGenerator } from "@/noise";
import {
  extend,
  Object3DNode,
  Node,
  useFrame,
  useThree,
} from "@react-three/fiber";
import { folder, useControls } from "leva";
import React from "react";
import * as THREE from "three";
import { HyposymetricTintsGenerator } from "./TextureSplatter";
import { NoisyHeightGenerator } from "./HeightGenerator";
import { TerrainMesh as _TerrainMesh } from "./TerrainMesh";
import { Sphere, useHelper } from "@react-three/drei";
import { useInput } from "src/Keyboard";
import create from "zustand";
import { combine } from "zustand/middleware";
import { AxesHelper } from "three";

extend({ TerrainMesh: _TerrainMesh, NoisyHeightGenerator, NoiseGenerator });

type TerrainMeshProps = Object3DNode<_TerrainMesh, typeof _TerrainMesh>;
type NoisyHeightGeneratorProps = Node<
  NoisyHeightGenerator,
  typeof NoisyHeightGenerator
>;
type NoiseGeneratorProps = Node<NoiseGenerator, typeof NoiseGenerator>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      terrainMesh: TerrainMeshProps;
      noisyHeightGenerator: NoisyHeightGeneratorProps;
      noiseGenerator: NoiseGeneratorProps;
    }
  }
}

const terrainNoiseParams = {
  octaves: 10,
  persistence: 0.5,
  lacunarity: 1.6,
  exponentiation: 7.5,
  height: 900.0,
  scale: 372.0,
  noiseType: "simplex",
  seed: 1,
} as const;

const biomeNoiseParams = {
  octaves: 2,
  persistence: 0.5,
  lacunarity: 2.0,
  scale: 2048.0,
  noiseType: "simplex",
  seed: 2,
  exponentiation: 1,
  height: 1.0,
} as const;

// function ControlledTerrainMesh(props: TerrainMeshProps) {
//   const controls = useControls("terrain", {
//     width: props.width ?? 500,
//     height: props.height ?? 500,
//     resolution: props.resolution ?? 100,
//   });

//   return (
//     <TerrainMesh receiveShadow castShadow={false} {...controls} {...props} />
//   );
// }

function TerrainMesh(props: TerrainMeshProps) {
  const ref = React.useRef<_TerrainMesh>();

  React.useLayoutEffect(() => {
    ref.current?.update();
  });

  return <terrainMesh ref={ref} receiveShadow castShadow={false} {...props} />;
}

const useTerrainGenerator = () => {
  const terrainNoiseGenerator = useNoiseGenerator(
    "terrain",
    terrainNoiseParams
  );

  const biomeNoiseGenerator = useNoiseGenerator("biome", biomeNoiseParams);

  const colorGenerator = React.useMemo(() => {
    return new HyposymetricTintsGenerator({
      biomeNoiseGenerator,
    });
  }, [biomeNoiseGenerator]);

  const heightGenerator = React.useMemo(() => {
    return new NoisyHeightGenerator(terrainNoiseGenerator);
  }, [terrainNoiseGenerator]);

  return { colorGenerator, heightGenerator };
};

const terrainMaterial = new THREE.MeshStandardMaterial({
  side: THREE.FrontSide,
  vertexColors: true,
});

function TerrainChunk({
  width = 1000,
  height = 1000,
  chunkSize = 500,
  resolution = 100,
}) {
  const { colorGenerator, heightGenerator } = useTerrainGenerator();

  let chunksX = Math.ceil(width / chunkSize);
  let chunksY = Math.ceil(height / chunkSize);
  const materialControls = useControls("terrain", {
    wireframe: true,
  });

  return (
    <>
      {[...new Array(chunksX).fill(0)].map((_, x) =>
        [...new Array(chunksY).fill(0)].map((_, y) => {
          return (
            <TerrainMesh
              key={`${x}.${y}`}
              offset={[chunkSize * x, -chunkSize * y, 0]}
              position={[chunkSize * x, -chunkSize * y, 0]}
              width={chunkSize}
              height={chunkSize}
              resolution={resolution}
              heightGenerators={[heightGenerator]}
              colorGenerator={colorGenerator}
            >
              <primitive
                attach="material"
                object={terrainMaterial}
                {...materialControls}
              />
            </TerrainMesh>
          );
        })
      )}
    </>
  );
}

const useCameraPosition = create(
  combine(
    {
      position: new THREE.Vector3(0, 50, 0),
    },
    (set, get) => ({ set, get })
  )
);

function PlayerCamera() {
  const ref = React.useRef<THREE.Mesh>();
  const { speed } = useControls("player", {
    speed: { value: 5, min: 1, max: 100 },
  });
  const camera = useThree((c) => c.camera);
  useFrame(() => {
    if (!ref.current) {
      return;
    }

    const { position } = useCameraPosition.getState();

    const { controls } = useInput.getState();
    if (controls.forward) {
      position.y += speed;
    }
    if (controls.backward) {
      position.y -= speed;
    }
    if (controls.left) {
      position.x -= speed;
    }
    if (controls.right) {
      position.x += speed;
    }

    ref.current.position.copy(position);
    // camera.lookAt(ref.current.position);
  });
  return (
    <Sphere ref={ref} args={[10, 10, 10]}>
      <meshStandardMaterial color="red" />
    </Sphere>
  );
}

let _MIN_CELL_SIZE = 500;

function getCellIndex(p: THREE.Vector3) {
  const xp = p.x + _MIN_CELL_SIZE * 0.5;
  const yp = p.y + _MIN_CELL_SIZE * 0.5;
  const x = Math.floor(xp / _MIN_CELL_SIZE);
  const z = Math.floor(yp / _MIN_CELL_SIZE);
  return [x, -z];
}

function Terrain({ chunkSize = 500, resolution = 64 }) {
  const { heightGenerator, colorGenerator } = useTerrainGenerator();

  const [chunks, setChunks] = React.useState(
    () => ({} as Record<string, { offset: [number, number] }>)
  );

  useFrame(() => {
    const { position } = useCameraPosition.getState();
    const [xc, yc] = getCellIndex(position);
    const key = `${xc}.${yc}`;
    if (key in chunks) {
      return;
    }

    setChunks((chunks) => {
      return {
        ...chunks,
        [key]: {
          offset: [xc, yc],
        },
      };
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
            offset={[chunkSize * x, -chunkSize * y, 0]}
            position={[chunkSize * x, -chunkSize * y, 0]}
            width={chunkSize}
            height={chunkSize}
            resolution={resolution}
            heightGenerators={[heightGenerator]}
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

export default function TerrainDemo() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <PlayerCamera />
      <Terrain
        {...useControls("terrain", {
          width: 1000,
          height: 1000,
          chunkSize: 500,
          resolution: 100,
        })}
      />
      <axesHelper scale={[100, 100, 100]} />
    </group>
  );
}
