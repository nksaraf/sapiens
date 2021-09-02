import { Object3D } from "three";
import { defineComponent, defineMapComponent } from "./core/bitecs";

export const Object3DComponent = defineMapComponent<Object3D>();

export const SceneComponent = defineComponent({});

export const CameraComponent = defineComponent({});
