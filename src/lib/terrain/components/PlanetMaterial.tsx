import { MeshStandardMaterialProps } from "@react-three/fiber";
import { useControls } from "../../useControls";
import React from "react";
import * as THREE from "three";

export let planetMaterial = new THREE.MeshStandardMaterial({
  side: THREE.FrontSide,
  vertexColors: true,
});

export function PlanetMaterial(props: MeshStandardMaterialProps) {
  const materialControls = useControls("planet", {
    wireframe: false,
    flatShading: false,
  });

  React.useLayoutEffect(() => {
    planetMaterial.needsUpdate = true;
  }, [materialControls.flatShading]);

  return (
    <primitive
      attach="material"
      object={planetMaterial}
      {...props}
      {...materialControls}
    />
  );
}
