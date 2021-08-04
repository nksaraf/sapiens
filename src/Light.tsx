import { useHelper } from "@react-three/drei";
import React, { useRef } from "react";
import { useControls } from "leva";
import { DirectionalLightHelper } from "three";

export function Light() {
  let ref = useRef();
  useHelper(ref, DirectionalLightHelper);
  return (
    <>
      <ambientLight
        {...useControls("ambientLight", {
          intensity: { value: 0.3, step: 0.1 },
        })} />
      <spotLight
        ref={ref}
        castShadow
        {...useControls("directionalLight", {
          position: { value: [-10, 30, -10] },
          // target: { value: [0, 0, 5] },
          intensity: { value: 1, step: 0.1 },
        })}
      ></spotLight>
    </>
  );
}
