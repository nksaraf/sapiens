import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  addComponent,
  addEntity,
  addMapComponent,
  addObject3DComponent,
  addObject3DEntity,
  Component,
  createWorld,
  MapComponent,
  pipe,
  removeComponent,
  removeEntity,
  removeMapComponent,
  removeObject3DComponent,
} from "../core/bitecs";
import React from "react";
import {
  CameraComponent,
  Object3DComponent,
  SceneComponent,
} from "../components";
import {
  ActiveCameraComponent,
  ActiveSceneComponent,
  RendererComponent,
  RendererSystem,
} from "../systems/RendererSystem";
import { ActionMappingSystem } from "../systems/ActionMappingSystem";
import { createStore } from "@/store";

export function World({
  systems = [],
  afterRenderSystems = [],
}: React.ComponentProps<typeof Canvas> & {
  systems?: any[];
  afterRenderSystems?: any[];
}) {
  const camera = useThree((s) => s.camera);
  const clock = useThree((s) => s.clock);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  const world = useGame((s) => s.world);
  const connect = useGame((s) => s.connect);
  const disconnect = useGame((s) => s.disconnect);

  React.useLayoutEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const sceneEntity = useEntity();
  useObject3DComponent(sceneEntity, scene);
  useComponent(sceneEntity, SceneComponent);
  useComponent(sceneEntity, ActiveSceneComponent);

  const cameraEntity = useEntity();
  useObject3DComponent(cameraEntity, camera, scene);
  useComponent(cameraEntity, CameraComponent);
  useComponent(cameraEntity, ActiveCameraComponent);

  const rendererEntity = useEntity();
  useMapComponent(rendererEntity, RendererComponent, gl);

  let pipeline = React.useMemo(() => {
    return pipe(
      ActionMappingSystem,
      ...systems,
      RendererSystem,
      ...afterRenderSystems
    );
  }, []);

  useFrame(() => {
    world.dt = clock.getDelta();
    world.time = clock.getElapsedTime();
    pipeline(world);
    world.input.set("Mouse/movementX", 0);
    world.input.set("Mouse/movementY", 0);
  }, 1);

  return <></>;
}

const useGame = createStore({}, () => {
  let world = createWorld();
  world.dt = 0;
  world.time = 0;
  world.objectEntityMap = new Map();
  world.input = new Map();
  world.actionMaps = [];
  world.actions = new Map();

  // @ts-ignore
  window.WORLD = world;

  let handleKeyDown = (e: KeyboardEvent) => {
    world.input.set(`Keyboard/${e.key}`, 1);
  };

  let handleKeyUp = (e: KeyboardEvent) => {
    world.input.set(`Keyboard/${e.key}`, 0);
  };

  return {
    world,
    connect: () => {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    },
    disconnect: () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    },
  };
});

function useEntity() {
  const world = useGame((s) => s.world);
  const entity = React.useMemo(() => {
    return addEntity(world);
  }, [world]);

  React.useLayoutEffect(() => {
    return () => {
      removeEntity(world, entity);
    };
  }, [world, entity]);

  return entity;
}

function useComponent(entity: number, component: Component) {
  const world = useGame((s) => s.world);

  React.useLayoutEffect(() => {
    addComponent(world, component, entity);
    return () => {
      removeComponent(world, component, entity);
    };
  }, [world, entity]);
}

function useObject3DComponent(entity: number, obj: any, parent?: any) {
  const world = useGame((s) => s.world);

  React.useLayoutEffect(() => {
    addObject3DComponent(world, entity, obj, parent);
    return () => {
      removeObject3DComponent(world, entity);
    };
  }, [world, entity, obj, parent]);
}

function useMapComponent(
  entity: number,
  component: MapComponent<any>,
  map: any
) {
  const world = useGame((s) => s.world);

  React.useLayoutEffect(() => {
    addMapComponent(world, component, entity, map);
    return () => {
      removeMapComponent(world, component, entity);
    };
  }, [world, entity, map]);
}

// export function createThreeWorld(options: GLTFWorldOptions = {}) {
//   const {
//     pointerLock,
//     systems,
//     afterRenderSystems,
//     rendererParameters,
//     actionMaps,
//   } = Object.assign(
//     {
//       pointerLock: false,
//       actionMaps: [],
//       systems: [],
//       afterRenderSystems: [],
//       rendererParameters: {},
//     },
//     options
//   );

//   const world = createWorld();
//   world.dt = 0;
//   world.time = 0;
//   world.objectEntityMap = new Map();
//   world.input = new Map();
//   world.actionMaps = actionMaps || [];
//   world.actions = new Map();
//   world.resizeViewport = true;

//   function onResize() {
//     world.resizeViewport = true;
//   }

//   window.addEventListener("resize", onResize);

//   const scene = new Scene();
//   const sceneEid = addObject3DEntity(world, scene);
//   addComponent(world, SceneComponent, sceneEid);

//   const camera = new PerspectiveCamera();
//   const cameraEid = addObject3DEntity(world, camera, scene);
//   addComponent(world, CameraComponent, cameraEid);

//   const rendererEid = addEntity(world);
//   const renderer = new WebGLRenderer({
//     antialias: true,
//     ...rendererParameters,
//   });
//   renderer.setPixelRatio(window.devicePixelRatio);

//   if (!rendererParameters.canvas) {
//     document.body.appendChild(renderer.domElement);
//   }

//   const canvasParentStyle = renderer.domElement.parentElement!.style;
//   canvasParentStyle.position = "relative";

//   const canvasStyle = renderer.domElement.style;
//   canvasStyle.position = "absolute";
//   canvasStyle.width = "100%";
//   canvasStyle.height = "100%";

//   addMapComponent(world, RendererComponent, rendererEid, renderer);

//   if (pointerLock) {
//     renderer.domElement.addEventListener("mousedown", () => {
//       renderer.domElement.requestPointerLock();
//     });
//   }

//   window.addEventListener("keydown", (e) => {
//     world.input.set(`Keyboard/${e.code}`, 1);
//   });

//   window.addEventListener("keyup", (e) => {
//     world.input.set(`Keyboard/${e.code}`, 0);
//   });

//   window.addEventListener("mousemove", (e) => {
//     if (pointerLock && document.pointerLockElement === renderer.domElement) {
//       world.input.set(
//         "Mouse/movementX",
//         world.input.get("Mouse/movementX")! + e.movementX
//       );
//       world.input.set(
//         "Mouse/movementY",
//         world.input.get("Mouse/movementY")! + e.movementY
//       );
//     }
//   });

//   window.addEventListener("blur", () => {
//     for (const key of world.input.keys()) {
//       world.input.set(key, 0);
//     }
//   });

//   if (typeof (window as any).__THREE_DEVTOOLS__ !== "undefined") {
//     (window as any).__THREE_DEVTOOLS__.dispatchEvent(
//       new CustomEvent("observe", { detail: scene })
//     );
//     (window as any).__THREE_DEVTOOLS__.dispatchEvent(
//       new CustomEvent("observe", { detail: renderer })
//     );
//   }

//   const clock = new Clock();

//   const pipeline = pipe(
//     ActionMappingSystem,
//     ...systems,
//     RendererSystem,
//     ...afterRenderSystems
//   );

//   return {
//     world,
//     sceneEid,
//     scene,
//     cameraEid,
//     camera,
//     rendererEid,
//     renderer,
//     start() {
//       renderer.setAnimationLoop(() => {
//         world.dt = clock.getDelta();
//         world.time = clock.getElapsedTime();
//         pipeline(world);
//         world.input.set("Mouse/movementX", 0);
//         world.input.set("Mouse/movementY", 0);
//       });
//     },
//   };
// }
