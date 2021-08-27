import { NoiseGenerator } from "@/noise";
import {
  extend,
  Object3DNode,
  Node,
  MaterialProps,
  MeshStandardMaterialProps,
} from "@react-three/fiber";
import { useControls } from "leva";
import React from "react";
import * as THREE from "three";
import { NoisyHeightGenerator } from "./height-generator";
import * as TERRAIN from "./TerrainMesh";

extend({
  TerrainMesh: TERRAIN.TerrainMesh,
  TerrainSphereMesh: TERRAIN.TerrainSphereMesh,
  NoisyHeightGenerator,
  NoiseGenerator,
});

export type TerrainMeshProps = Object3DNode<
  TERRAIN.TerrainMesh,
  typeof TERRAIN.TerrainMesh
>;

export type TerrainSphereMeshProps = Object3DNode<
  TERRAIN.TerrainSphereMesh,
  typeof TERRAIN.TerrainSphereMesh
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
      terrainSphereMesh: TerrainSphereMeshProps;
      noisyHeightGenerator: NoisyHeightGeneratorProps;
      noiseGenerator: NoiseGeneratorProps;
    }
  }
}

export let terrainMaterial = new THREE.MeshStandardMaterial({
  side: THREE.FrontSide,
  vertexColors: true,
});

export function TerrainMaterial(props: MeshStandardMaterialProps) {
  const materialControls = useControls("terrain", {
    wireframe: false,
    flatShading: false,
  });

  React.useLayoutEffect(() => {
    terrainMaterial.needsUpdate = true;
  }, [materialControls.flatShading]);

  return (
    <primitive
      attach="material"
      object={terrainMaterial}
      {...props}
      {...materialControls}
    />
  );
}

export function TerrainMesh(
  props: TerrainMeshProps & { object?: TERRAIN.TerrainMesh }
) {
  const ref = React.useRef<TERRAIN.TerrainMesh>();

  React.useEffect(() => {
    ref.current?.update();
  }, [
    props.resolution,
    props.heightGenerator,
    props.colorGenerator,
    props.width,
    props.height,
    ...((props.offset ?? [0, 0, 0]) as [number, number, number]),
    props.applyHeight,
  ]);

  if (props.object) {
    return (
      <primitive
        object={props.object}
        ref={ref}
        receiveShadow
        castShadow={false}
        position={props.offset}
        {...props}
      >
        <TerrainMaterial />
        {props.children}
      </primitive>
    );
  }

  return (
    <terrainMesh
      ref={ref}
      receiveShadow
      castShadow={false}
      position={props.offset}
      {...props}
    >
      <TerrainMaterial />
      {props.children}
    </terrainMesh>
  );
}

export function TerrainSphereMesh(
  props: TerrainSphereMeshProps & { object?: TERRAIN.TerrainSphereMesh }
) {
  const ref = React.useRef<TERRAIN.TerrainSphereMesh>();

  React.useLayoutEffect(() => {
    ref.current?.resetGeometry();
  }, [props.resolution]);

  React.useLayoutEffect(() => {
    ref.current?.update();
  }, [
    props.resolution,
    props.heightGenerator,
    props.colorGenerator,
    props.width,
    props.height,
    props.radius,
    ...((props.offset ?? [0, 0, 0]) as [number, number, number]),
    props.applyHeight,
  ]);

  if (props.object) {
    return (
      <primitive
        object={props.object}
        ref={ref}
        receiveShadow
        castShadow={false}
        position={props.offset}
        {...props}
      >
        <TerrainMaterial />
        {props.children}
      </primitive>
    );
  }

  return (
    <terrainSphereMesh
      ref={ref}
      receiveShadow
      castShadow={false}
      position={props.offset}
      {...props}
    >
      <TerrainMaterial />
      {props.children}
    </terrainSphereMesh>
  );
}
