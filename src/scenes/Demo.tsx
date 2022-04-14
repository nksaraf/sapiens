import { useThree } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import {
  Sky,
  OrbitControls,
  FlyControls,
  PerspectiveCamera,
  Stars,
} from "@react-three/drei";
import { Planet } from "./Planet";
import { createStore } from "../../store";
import { TransformControls } from "@react-three/drei";
import { Camera, CameraSystem } from "../../../Camera";
import { Leva } from "leva";
import { Vector3 } from "three";
import { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";
import { PointerLockControls } from "./PointerLockControls";
import { ShipControls } from "./ShipControls";
import { PlayerCamera } from "./PlayerCamera";

export const useViewer = createStore({
  position: new THREE.Vector3(0, 1050, 0),
});

export const velocity = new THREE.Vector3(0, 0, 0);
export const decceleration = new THREE.Vector3(-10, -10, -10);
export const acceleration = new THREE.Vector3(10, 10, 10);

export default function TerrainDemo() {
  const camera = useThree((t) => t.camera);
  console.log(camera);
  return (
    <>
      {/* <QuadTreeTerrain
        {...useControls("terrain", {
          width: 1000,
          height: 1000,
          maxViewDistance: 1000,
          chunkSize: 500,
          resolution: 64,
        })}
      /> */}
      {/* <gridHelper args={[300, 30]} /> */}
      <CameraSystem>
        <PlayerCamera />
        <Camera
          name="far back view"
          camera="perspective"
          position={[0, -600, 600]}
          far={10000}
          onUpdate={(c: THREE.PerspectiveCamera) => c.lookAt(0, 0, 0)}
          near={0.1}
          makeDefault
        />
        <ShipControls />
        {/* <PointerLockControls /> */}
        {/* <OrbitControls makeDefault /> */}
        <Stars
          radius={2000}
          // distance={4500}
          // sunPosition={[0, 20, -200]}
          // inclination={0}
          // azimuth={0.25}
        />
        <Planet name="planet" radius={250} position={[0, 0, 0]} />
        <Planet name="planet2" radius={250} position={[800, 400, 0]} />
        <axesHelper scale={[100, 100, 100]} />
      </CameraSystem>
    </>
  );
}
