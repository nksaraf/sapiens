import { useFrame, useThree } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import { useKeyboardInput } from "src/Keyboard";
import { velocity, decceleration, acceleration, useViewer } from "./Demo";

export function ShipControls() {
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
      {/* <PointerLockControls /> */}
      {/* <OrbitControls makeDefault /> */}
    </>
  );
}
