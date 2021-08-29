import { NoiseParams, useNoiseGenerator } from "@/noise";
import { useControls } from "../../useControls";
import React from "react";
import {
  FixedHeightGenerator,
  NoisyHeightGenerator,
} from "../lib/height-generator";
import { COLORS, HyposymetricTintsGenerator } from "../lib/color-generator";
import { spline } from "@/leva-spline/Spline";
import { DIRECTIONS } from "../lib/TerrainMesh";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { TerrainMaterial } from "./TerrainMaterial";
import {
  PlanetMesh as PlanetMeshImpl,
  PlanetMeshProps,
} from "../lib/PlanetMesh";
import { QuadTreeNode } from "../lib/QuadTreeNode";

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
    props.radius,
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
      <TerrainMaterial />
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

function PlanetFace(props: PlanetMeshProps) {
  const tree = React.useMemo(() => {
    let chunk = new QuadTreeNode(
      {
        position: new THREE.Vector3(0, 0, 0),
        size: 100,
        detailLevelDistances: [320, 40, 10],
      },
      [],
      undefined,
      props.radius ?? 100,
      0,
      (props.localUp as THREE.Vector3).clone().normalize().multiplyScalar(100),
      64,
      props.localUp as THREE.Vector3
    );

    console.log(chunk);
    chunk.updateChunk();
    let visibleChildren = chunk.getVisibleChildren();
    console.log(visibleChildren);
    return visibleChildren;
  }, [props.localUp, props.radius]);

  useFrame(() => {});

  return (
    <>
      {tree.map((child) => (
        <PlanetMesh
          {...props}
          offset={child.position}
          radius={child.radius}
          // resolution={1}
        />
      ))}
      {/* <TerrainSphereMesh
        // offset={child.position}
        // radius={child.radius}
        // resolution={1}
        {...props}
        {...useControls("planet", {
          radius: 100,
          offset: [child.position.x, child.position.y, child.position.z],
        })}
      /> */}
    </>
  );
}

export function PlanetSphere(props: PlanetMeshProps) {
  return (
    <>
      {Object.keys(DIRECTIONS).map((key) => (
        <PlanetFace
          {...props}
          key={key}
          localUp={DIRECTIONS[key as keyof typeof DIRECTIONS]}
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

export function Planet(props: PlanetMeshProps & PlanetConfig) {
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

  return (
    <PlanetSphere
      heightGenerator={heightGenerator}
      colorGenerator={colorGenerator}
      worker={true}
      {...props}
    />
  );
}
