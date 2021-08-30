import { NoiseParams, useNoiseGenerator } from "@/noise";
import { useControls } from "../../useControls";
import React from "react";
import {
  FixedHeightGenerator,
  NoisyHeightGenerator,
} from "../lib/height-generator";
import { COLORS, HyposymetricTintsGenerator } from "../lib/color-generator";
import { spline } from "@/leva-spline/Spline";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  DIRECTIONS,
  PlanetMesh as PlanetMeshImpl,
  PlanetMeshProps,
} from "../lib/PlanetMesh";
import { QuadTreeNode } from "../lib/QuadTreeNode";
import { folder } from "leva";
import { PlanetMaterial } from "./PlanetMaterial";
import { useViewer } from "./Demo";
import { utils } from "../utils";

let constantHeightGen = new FixedHeightGenerator({ height: 0 });

export function PlanetMesh(
  props: PlanetMeshProps & { object?: PlanetMeshImpl }
) {
  const ref = React.useRef<PlanetMeshProps>();

  const mesh = React.useMemo(() => {
    if (props.object === undefined) {
      return new PlanetMeshImpl();
    }

    return props.object;
  }, [props.object]);

  React.useLayoutEffect(() => {
    mesh?.resetGeometry();
  }, [mesh, props.resolution]);

  React.useLayoutEffect(() => {
    console.log("updating");
    mesh?.update();
  }, [
    props.resolution,
    props.heightGenerator,
    props.colorGenerator,
    props.width,
    props.height,
    props.chunkRadius,
    props.offset,
    props.settings,
    mesh,
  ]);

  return (
    <primitive
      object={mesh}
      ref={ref}
      receiveShadow
      castShadow={false}
      // position={props.offset}
      {...props}
    >
      <PlanetMaterial />
      {props.children}
    </primitive>
  );
}

const terrainNoiseParams = {
  octaves: 10,
  persistence: 0.5,
  lacunarity: 1.6,
  exponentiation: 7.5,
  height: 1,
  scale: 500,
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

export function useHeightGenerator(params: NoiseParams = terrainNoiseParams) {
  const terrainNoiseGenerator = useNoiseGenerator("terrain", params);

  const heightGenerator = React.useMemo(() => {
    return new NoisyHeightGenerator(terrainNoiseGenerator);
  }, [terrainNoiseGenerator]);

  return heightGenerator;
}

export const useColorGenerator = (params: NoiseParams = biomeNoiseParams) => {
  const biomeNoiseGenerator = useNoiseGenerator("biome", params);
  const controls = useControls("biome", {
    spline: spline({
      value: [
        ["#" + COLORS.DEEP_OCEAN.getHexString(), 0],
        ["#" + COLORS.SHALLOW_OCEAN.getHexString(), 0.05],
        ["#" + COLORS.FOREST_TROPICAL.getHexString(), 0.1],
        ["#" + COLORS.FOREST_TEMPERATE.getHexString(), 0.3],
        ["#" + COLORS.SNOW.getHexString(), 0.5],
      ],
    }),
  });

  const colorGenerator = React.useMemo(() => {
    return new HyposymetricTintsGenerator({
      biomeNoiseGenerator,
      spline: controls.spline,
    });
  }, [biomeNoiseGenerator, controls.spline]);

  return colorGenerator;
};

type PlanetChunkParams = {
  position: THREE.Vector3;
  chunkRadius: number;
  key: string;
  resolution: number;
};

function PlanetFace({
  radius = 100,
  direction = "UP",
  resolution = 64,
  ...props
}: PlanetSphereProps & { direction: keyof typeof DIRECTIONS }) {
  let localUp = props.localUp ?? DIRECTIONS[direction];

  const [chunks, setChunks] = React.useState<Record<string, PlanetChunkParams>>(
    {}
  );

  const tree = React.useMemo(() => {
    let chunk = new QuadTreeNode(
      {
        position: new THREE.Vector3(0, 0, 0),
        size: 100,
        detailLevelDistances: [2500, 1000, 400, 150, 70, 30, 10],
      },
      [],
      undefined,
      radius,
      0,
      (localUp as THREE.Vector3).clone().normalize().multiplyScalar(radius),
      resolution,
      localUp as THREE.Vector3
    );
    return chunk;
  }, [localUp, radius, resolution]);

  useFrame(() => {
    const { position } = useViewer.getState();

    tree.updateChunk(position);
    const children = tree.getVisibleChildren();
    let newChunks: Record<string, PlanetChunkParams> = {};
    for (let child of children) {
      let key = `${child.position.x}.${child.position.y}.${child.position.z}/${child.radius}`;
      newChunks[key] = {
        position: child.position,
        chunkRadius: child.radius,
        key: key,
        resolution: child.resolution,
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

    setChunks(newChunks);
  });

  return (
    <>
      {Object.keys(chunks).map((key) => {
        const chunk = chunks[key as keyof typeof chunks];
        return (
          <PlanetMesh
            {...props}
            localUp={localUp}
            key={key}
            offset={chunk.position}
            resolution={chunk.resolution}
            chunkRadius={chunk.chunkRadius}
            planetRadius={radius}
          />
        );
      })}
    </>
  );
}

type PlanetSphereProps = Omit<
  PlanetMeshProps,
  "chunkRadius" | "planetRadius"
> & {
  radius: number;
};

export function PlanetSphere(props: PlanetSphereProps) {
  return (
    <>
      {Object.keys(DIRECTIONS).map((key) => (
        <PlanetFace
          {...props}
          key={key}
          direction={key as keyof typeof DIRECTIONS}
        />
      ))}
      {/* <TerrainFace {...props} localUp={DIRECTIONS.BACK} /> */}
    </>
  );
}

export interface PlanetConfig {
  size: number;
  position: THREE.Vector3;
  detailLevelDistances: number[];
}

export function Planet(props: PlanetSphereProps) {
  const colorGenerator = useColorGenerator({
    octaves: 2,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 2048.0,
    noiseType: "simplex",
    seed: 2,
    exponentiation: 1,
    height: 1.0,
  });

  const heightGenerator = useHeightGenerator({
    octaves: 10,
    persistence: 0.5,
    lacunarity: 1.36,
    exponentiation: 5.5,
    height: 1,
    scale: 200,
    noiseType: "simplex",
    seed: 1,
  });

  const { worker, ...settings } = useControls("planet", {
    settings: folder({
      applyHeight: true,
      applyColor: true,
      debugColor: [0.5, 0.5, 0.5],
    }),
    worker: true,
  });

  return (
    <PlanetSphere
      heightGenerator={heightGenerator}
      colorGenerator={colorGenerator}
      worker={worker}
      settings={settings}
      {...props}
    />
  );
}
