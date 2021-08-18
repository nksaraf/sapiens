import { NoiseGenerator } from "@/noise";
import { extend, Object3DNode, Node } from "@react-three/fiber";
import React from "react";
import { NoisyHeightGenerator } from "./height-generator";
import { TerrainMesh as ThreeTerrainMesh } from "./TerrainMesh";

extend({ TerrainMesh: ThreeTerrainMesh, NoisyHeightGenerator, NoiseGenerator });

export type TerrainMeshProps = Object3DNode<
  ThreeTerrainMesh,
  typeof ThreeTerrainMesh
>;

export type NoisyHeightGeneratorProps = Node<
  NoisyHeightGenerator,
  typeof NoisyHeightGenerator
>;
export type NoiseGeneratorProps = Node<NoiseGenerator, typeof NoiseGenerator>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      terrainMesh: TerrainMeshProps;
      noisyHeightGenerator: NoisyHeightGeneratorProps;
      noiseGenerator: NoiseGeneratorProps;
    }
  }
}

export function TerrainMesh(props: TerrainMeshProps) {
  const ref = React.useRef<ThreeTerrainMesh>();

  React.useEffect(() => {
    ref.current?.update();
  }, [
    props.resolution,
    props.heightGenerator,
    props.colorGenerator,
    props.width,
    props.height,
    ...(props.offset as [number, number, number]),
  ]);

  return (
    <terrainMesh
      ref={ref}
      receiveShadow
      castShadow={false}
      position={props.offset}
      {...props}
    />
  );
}
