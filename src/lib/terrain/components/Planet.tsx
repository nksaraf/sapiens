import {
  NoiseGenerator,
  NoiseParams,
  noiseParamsFolder,
  useNoiseGenerator,
} from "@/noise";
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
  PlanetConfig,
  PlanetMesh as PlanetMeshImpl,
  PlanetMeshProps,
} from "../lib/PlanetMesh";
import { QuadTreeNode } from "../lib/QuadTreeNode";
import { folder } from "leva";
import { PlanetMaterial } from "./PlanetMaterial";
import { useViewer } from "./Demo";
import { utils } from "../utils";
import { ObjectPool, ObjectPoolImpl } from "./ObjectPool";
import { GradientPoint } from "@/leva-spline/spline-types";

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
      {...props}
    >
      <PlanetMaterial />
      {props.children}
    </primitive>
  );
}

// const terrainNoiseParams = {
//   octaves: 10,
//   persistence: 0.5,
//   lacunarity: 1.6,
//   exponentiation: 7.5,
//   height: 1,
//   scale: 500,
//   noiseType: "simplex",
//   seed: 1,
// } as const;

// const biomeNoiseParams = {
//   octaves: 2,
//   persistence: 0.5,
//   lacunarity: 2.0,
//   scale: 2048.0,
//   noiseType: "simplex",
//   seed: 2,
//   exponentiation: 1,
//   height: 1.0,
// } as const;

export function useHeightGenerator(name: string, params: NoiseParams) {
  const terrainNoiseParams = useControls(name, {
    terrain: folder({
      noise: noiseParamsFolder(params),
    }),
  });

  const terrainNoiseGenerator = React.useMemo(() => {
    return new NoiseGenerator(terrainNoiseParams);
  }, [terrainNoiseParams]);

  const heightGenerator = React.useMemo(() => {
    return new NoisyHeightGenerator(terrainNoiseGenerator);
  }, [terrainNoiseGenerator]);

  return heightGenerator;
}

export const useColorGenerator = (
  name: string,
  {
    gradient,
    biomeNoise,
  }: {
    gradient: GradientPoint[];
    biomeNoise: NoiseParams;
  }
) => {
  const biomeNoiseParams = useControls(name, {
    biome: folder({
      noise: noiseParamsFolder(biomeNoise),
    }),
  });

  const controls = useControls(name, {
    biome: folder({
      gradient: spline({
        value: gradient,
      }),
    }),
  });

  const biomeNoiseGenerator = React.useMemo(() => {
    return new NoiseGenerator(biomeNoiseParams);
  }, [biomeNoiseParams]);

  const colorGenerator = React.useMemo(() => {
    return new HyposymetricTintsGenerator({
      biomeNoiseGenerator,
      spline: controls.gradient,
    });
  }, [biomeNoiseGenerator, controls.gradient]);

  return colorGenerator;
};

const planetMeshPool = new ObjectPoolImpl();

function PlanetMeshPool({ children }: React.PropsWithChildren<{}>) {
  return (
    <ObjectPool
      pool={planetMeshPool}
      type={PlanetMesh}
      impl={PlanetMeshImpl}
      getParams={(props: any) => props.chunkRadius}
    >
      {children}
    </ObjectPool>
  );
}

type PlanetChunkParams = {
  position: THREE.Vector3;
  chunkRadius: number;
  key: string;
  resolution: number;
};

function PlanetFace({
  direction = "UP",
  resolution = 64,
  offset,
  planet,
  ...props
}: PlanetMeshProps & {
  direction: keyof typeof DIRECTIONS;
  planet: PlanetConfig;
}) {
  let localUp = props.localUp ?? DIRECTIONS[direction];

  const [chunks, setChunks] = React.useState<Record<string, PlanetChunkParams>>(
    {}
  );

  const tree = React.useMemo(() => {
    let chunk = new QuadTreeNode(
      planet,
      [],
      undefined,
      planet.radius,
      0,
      (localUp as THREE.Vector3)
        .clone()
        .normalize()
        .multiplyScalar(planet.radius),
      resolution,
      localUp as THREE.Vector3
    );
    return chunk;
  }, [localUp, resolution, planet]);

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

  console.log(planet.position);

  return (
    <>
      {Object.keys(chunks).map((key) => {
        const chunk = chunks[key as keyof typeof chunks];
        return (
          <PlanetMesh
            {...props}
            position={planet.position}
            localUp={localUp}
            key={key}
            offset={chunk.position}
            resolution={chunk.resolution}
            chunkRadius={chunk.chunkRadius}
            planet={planet}
            frustumCulled={false}
          />
        );
      })}
    </>
  );
}

export function PlanetSphere(
  props: PlanetMeshProps & { planet: PlanetConfig }
) {
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

function usePlanetGenerators(name: string) {
  const colorGenerator = useColorGenerator(name, {
    biomeNoise: {
      octaves: 2,
      persistence: 0.5,
      lacunarity: 2.0,
      scale: 2048.0,
      noiseType: "simplex",
      seed: 2,
      exponentiation: 1,
      height: 1.0,
    },
    gradient: [
      [COLORS.DEEP_OCEAN, 0],
      [COLORS.SHALLOW_OCEAN, 0.05],
      [COLORS.FOREST_TROPICAL, 0.1],
      ["#6f5231", 0.2],
      ["#6f5231", 0.35],
      [COLORS.SNOW, 0.4],
    ],
  });

  const heightGenerator = useHeightGenerator(name, {
    octaves: 10,
    persistence: 0.5,
    lacunarity: 1.56,
    exponentiation: 5.4,
    height: 1,
    scale: 400,
    noiseType: "simplex",
    seed: 1,
  });

  const { worker, ...settings } = useControls(name, {
    settings: folder({
      applyHeight: true,
      applyColor: true,
      debugColor: [0.5, 0.5, 0.5],
    }),
    worker: true,
  });

  return { colorGenerator, heightGenerator, worker, settings };
}

export function Planet(
  props: PlanetMeshProps & { name: string; radius: number }
) {
  const { colorGenerator, heightGenerator, worker, settings } =
    usePlanetGenerators(props.name);

  const controls = useControls(props.name, {
    resolution: 16,
    radius: { value: props.radius ?? 100, min: 1, max: 1000 },
    position: {
      value: (props.position as [number, number, number]) ?? [0, 0, 0],
      step: 1,
    },
  });

  const planetConfig = React.useMemo(
    () => ({
      radius: controls.radius,
      position: controls.position,
      detailLevelDistances: props.planet?.detailLevelDistances ?? [
        2500, 1000, 400, 150, 70, 30, 10,
      ],
    }),
    [controls.radius, controls.position, props.planet?.detailLevelDistances]
  );

  return (
    <PlanetSphere
      heightGenerator={heightGenerator}
      colorGenerator={colorGenerator}
      worker={worker}
      settings={settings}
      {...props}
      {...controls}
      planet={planetConfig}
    />
  );
}
