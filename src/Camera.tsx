import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React from "react";
import { folder, useControls } from "leva";

function ControlledOrthographicCamera({
  name,
  position = [10, -10, 0],
  ...props
}: { name: string } & React.ComponentProps<typeof OrthographicCamera>) {
  const { width, height } = useThree((s) => ({
    width: s.viewport.width,
    height: s.viewport.height,
  }));

  const controls = useControls(name, {
    orthographic: folder({
      position: { value: position as [number, number, number], step: 1 },
      left: { value: -width / 2, step: 1 },
      right: { value: width / 2, step: 1 },
      bottom: { value: -height / 2, step: 1 },
      top: { value: height / 2, step: 1 },
      far: { value: 1000, step: 1 },
      near: { value: -1, step: 1 },
      zoom: { value: 0.2, step: 0.01 },
    }),
  });

  return <OrthographicCamera {...props} {...controls} />;
}

function ControlledPerspectiveCamera({
  position = [-10, 10, 0],
  fov = 60,
  far = 1000,
  near = 0.1,
  zoom = 1,
  name,
  ...props
}: { name: string } & React.ComponentProps<typeof PerspectiveCamera>) {
  const controls = useControls(
    name,
    {
      perspective: folder({
        position: {
          value: position as [number, number, number],
          step: 1,
        },
        fov: {
          value: fov,
          step: 1,
        },
        far: { value: far, step: 1 },
        near: { value: near, step: 1 },
        zoom: { value: zoom, step: 0.1 },
      }),
    },
    {
      collapsed: true,
    }
  );

  return <PerspectiveCamera {...props} {...controls} />;
}

interface PerspectiveCameraProps
  extends React.ComponentProps<typeof PerspectiveCamera> {
  camera: "perspective";
}

interface OrthographicCameraProps
  extends React.ComponentProps<typeof PerspectiveCamera> {
  camera: "orthographic";
}

export function Camera({
  name,
  camera,
  ...props
}: { name: string } & (PerspectiveCameraProps | OrthographicCameraProps)) {
  const controls = useControls(
    name,
    {
      type: {
        options: ["perspective", "orthographic"] as const,
        value: camera,
      },
    },
    {
      collapsed: true,
    }
  );

  let CameraType: any =
    controls.type === "perspective"
      ? ControlledPerspectiveCamera
      : ControlledOrthographicCamera;

  return <CameraType name={name} {...props} />;
}
