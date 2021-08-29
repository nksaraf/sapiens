import { useHelper } from "@react-three/drei";
import { useRef } from "react";
import { DirectionalLightHelper, SpotLightHelper } from "three";
import React from "react";
import { useControls } from "./lib/useControls";

export function Light() {
  let ref = useRef();
  useHelper(ref, SpotLightHelper);
  return (
    <>
      <ambientLight
        {...useControls("ambientLight", {
          intensity: { value: 0.3, step: 0.1 },
        })}
      />
      <spotLight
        ref={ref}
        castShadow
        {...useControls("directionalLight", {
          position: { value: [-450, 500, -450] },
          // target: { value: [0, 0, 5] },
          intensity: { value: 1.0, step: 0.1 },
        })}
      ></spotLight>
    </>
  );
}
