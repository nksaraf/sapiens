import { MeshStandardMaterialProps } from "@react-three/fiber";
import { useControls } from "../../useControls";
import React from "react";
import * as THREE from "three";


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
      {...materialControls} />
  );
}
