import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "../../useControls";
import React from "react";
import * as THREE from "three";
import {
  Sky,
  Sphere,
  OrbitControls,
  FlyControls,
  PerspectiveCamera,
  Stars,
} from "@react-three/drei";
import { useKeyboardInput } from "src/Keyboard";
import { Planet } from "./Planet";
import { createStore } from "../../store";
import { TransformControls } from "@react-three/drei";
import { Camera, CameraSystem } from "./Camera";
import { Leva } from "leva";
import { Vector3 } from "three";
import { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";
import { PointerLockControls } from "./PointerLockControls";

export const useViewer = createStore({
  position: new THREE.Vector3(0, 1050, 0),
});

const velocity = new THREE.Vector3(0, 0, 0);
const decceleration = new THREE.Vector3(-10, -10, -10);
const acceleration = new THREE.Vector3(10, 10, 10);

function ShipControls() {
  const camera = useThree(({ camera }) => camera);

  // const con = React.useMemo(
  //   () => new PointerLockControlsImpl(camera, gl.domElement),
  //   [camera, gl.domElement]
  // );

  const { rotation, position } = React.useMemo(
    () => ({
      rotation: new THREE.Quaternion().copy(camera.quaternion),
      position: new THREE.Vector3().copy(camera.position),
    }),
    [camera]
  );

  useFrame((s) => {
    let timeInSeconds = Math.min(s.clock.getElapsedTime(), 0.1);
    const frameDecceleration = new THREE.Vector3(
      velocity.x * decceleration.x,
      velocity.y * decceleration.y,
      velocity.z * decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    velocity.add(frameDecceleration);

    // const _Q = new THREE.Quaternion();
    // const _A = new THREE.Vector3();
    // const _R = camera.quaternion.clone();

    const { controls } = useKeyboardInput.getState();

    if (controls.forward) {
      velocity.z -= 2 ** acceleration.z * timeInSeconds;
    }
    if (controls.backward) {
      velocity.z += 2 ** acceleration.z * timeInSeconds;
    }
    if (controls.left) {
      velocity.x -= 2 ** acceleration.x * timeInSeconds;
    }
    if (controls.right) {
      velocity.x += 2 ** acceleration.x * timeInSeconds;
    }
    if (controls.up) {
      velocity.y += 2 ** acceleration.y * timeInSeconds;
    }
    if (controls.down) {
      velocity.y -= 2 ** acceleration.y * timeInSeconds;
    }
    // if (this._move.rocket) {
    //   this._velocity.z -= this._acceleration.x * timeInSeconds;
    // }

    // controlObject.quaternion.copy(_R);

    // const oldPosition = new THREE.Vector3();
    // oldPosition.copy(camera.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(camera.quaternion);
    //forward.y = 0;
    forward.normalize();

    const updown = new THREE.Vector3(0, 1, 0);

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(camera.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    updown.multiplyScalar(velocity.y * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    camera.position.add(forward);
    camera.position.add(sideways);
    camera.position.add(updown);

    position.lerp(camera.position, 0.15);
    rotation.slerp(camera.quaternion, 0.15);

    useViewer.getState().position.copy(position);

    // controlObject.position.copy(this._position);
    camera.quaternion.copy(rotation);
    camera.position.copy(position);
  });

  return (
    <>
      <PointerLockControls />
      {/* <OrbitControls makeDefault /> */}
    </>
  );
}

function PlayerCamera() {
  const ref = React.useRef<THREE.Mesh>();
  const { speed } = useControls("player", {
    speed: { value: 5, min: 1, max: 100 },
  });
  const cameraRef = React.useRef<THREE.Camera>();

  useFrame(() => {
    const { position } = useViewer.getState();

    if (ref.current) {
      const { controls } = useKeyboardInput.getState();
      if (controls.forward) {
        ref.current.position.z += speed;
      }
      if (controls.backward) {
        ref.current.position.z -= speed;
      }
      if (controls.left) {
        ref.current.position.x -= speed;
      }
      if (controls.right) {
        ref.current.position.x += speed;
      }

      position.copy(ref.current.position);
    }

    // cameraRef.current?.position.copy(position);
    // cameraRef.current?.lookAt(position);
  });

  return (
    <>
      <Sphere
        ref={ref}
        args={[10, 10, 10]}
        position={useViewer.getState().position}
      >
        <meshStandardMaterial color="red" />
      </Sphere>
      <Camera
        name="player"
        camera="perspective"
        ref={cameraRef as React.Ref<THREE.Camera>}
        position={[0, 500, -500]}
        far={100000}
        near={0.1}
        makeDefault
      />
    </>
  );
}

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
        {/* <PlayerCamera /> */}
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
