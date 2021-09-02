import { PerspectiveCamera, WebGLRenderer } from "three";
import { CameraComponent, SceneComponent } from "../components";
import { Object3DComponent } from "../components";
import {
  IWorld,
  defineQuery,
  defineSystem,
  defineMapComponent,
  defineComponent,
  singletonQuery,
} from "../core/bitecs";

export const RendererComponent = defineMapComponent<WebGLRenderer>();
export const ActiveSceneComponent = defineComponent();
export const ActiveCameraComponent = defineComponent();

export const rendererQuery = defineQuery([RendererComponent]);
export const sceneQuery = defineQuery([Object3DComponent, SceneComponent, ActiveSceneComponent]);
export const activeSceneQuery = singletonQuery(sceneQuery);
export const cameraQuery = defineQuery([Object3DComponent, CameraComponent, ActiveCameraComponent]);
export const activeCameraQuery = singletonQuery(cameraQuery);

export const RendererSystem = defineSystem(function RendererSystem(
  world: IWorld
) {
  const renderers = rendererQuery(world);
  const scenes = sceneQuery(world);
  const cameras = cameraQuery(world);

  if (renderers.length > 0 && scenes.length > 0 && cameras.length > 0) {
    const rendererEid = renderers[0];
    const renderer = RendererComponent.storage.get(rendererEid)!;

    const sceneEid = scenes[0];
    const scene = Object3DComponent.storage.get(sceneEid);

    const cameraEid = cameras[0];
    const camera = Object3DComponent.storage.get(
      cameraEid
    ) as PerspectiveCamera;

    if (renderer && scene && camera) {
      // if (world.resizeViewport) {
      //   const canvasParent = renderer.domElement.parentElement as HTMLElement;

      //   if (camera.isPerspectiveCamera) {
      //     camera.aspect = canvasParent.clientWidth / canvasParent.clientHeight;
      //     camera.updateProjectionMatrix();
      //   }

      //   renderer.setSize(
      //     canvasParent.clientWidth,
      //     canvasParent.clientHeight,
      //     false
      //   );

      //   world.resizeViewport = false;
      // }

      renderer.render(scene, camera);
    }
  }
});
