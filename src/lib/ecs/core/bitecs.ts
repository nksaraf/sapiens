import {
  IWorld,
  Component,
  defineComponent,
  addComponent,
  addEntity,
  Query,
  removeComponent,
  removeEntity,
} from "bitecs";

export type { IWorld as World };
import { Object3D } from "three";
import { Object3DComponent } from "../components";
import { ActionMap, ActionState } from "../systems/ActionMappingSystem";

export { pipe } from "bitecs";

declare module "bitecs" {
  export interface IWorld {
    dt: number;
    time: number;
    input: Map<string, number>;
    actionMaps: ActionMap[];
    actions: Map<string, ActionState>;
    objectEntityMap: Map<Object3D, number>;
  }
}

// export interface World extends IWorld {
//   dt: number;
//   time: number;
//   input: Map<string, number>;
//   actionMaps: ActionMap[];
//   actions: Map<string, ActionState>;
//   objectEntityMap: Map<Object3D, number>;
// }

export type MapComponent<V> = Component & { storage: Map<number, V> };

export function defineMapComponent<V>(): MapComponent<V> {
  const component = defineComponent({});
  (component as any).storage = new Map();
  return component as MapComponent<V>;
}

export function addMapComponent<V>(
  world: IWorld,
  component: MapComponent<V>,
  eid: number,
  value: V
) {
  addComponent(world, component, eid);
  component.storage.set(eid, value);
}

export function removeMapComponent(
  world: IWorld,
  component: MapComponent<any>,
  eid: number
) {
  removeComponent(world, component, eid);
  component.storage.delete(eid);
}

export function addObject3DComponent(
  world: IWorld,
  eid: number,
  obj: Object3D,
  parent?: Object3D
) {
  if (parent) {
    parent.add(obj);
  }

  addMapComponent(world, Object3DComponent, eid, obj);
  world.objectEntityMap.set(obj, eid);
}

export function addObject3DEntity(
  world: IWorld,
  obj: Object3D,
  parent?: Object3D
) {
  const eid = addEntity(world);
  addObject3DComponent(world, eid, obj, parent);
  return eid;
}

export function removeObject3DComponent(world: IWorld, eid: number) {
  const obj = Object3DComponent.storage.get(eid);

  if (!obj) {
    return;
  }

  if (obj.parent) {
    obj.parent.remove(obj);
  }

  removeMapComponent(world, Object3DComponent, eid);
  world.objectEntityMap.delete(obj);

  obj.traverse((child) => {
    if (child === obj) {
      return;
    }

    const childEid = getObject3DEntity(world, child);

    if (childEid) {
      removeEntity(world, childEid);
      Object3DComponent.storage.delete(childEid);
      world.objectEntityMap.delete(child);
    }
  });
}

export function removeObject3DEntity(world: IWorld, eid: number) {
  removeObject3DComponent(world, eid);
  removeEntity(world, eid);
}

export function getObject3DEntity(
  world: IWorld,
  obj: Object3D
): number | undefined {
  return world.objectEntityMap.get(obj);
}

export function setEntityObject3D(world: IWorld, eid: number, obj: Object3D) {
  addMapComponent(world, Object3DComponent, eid, obj);
  world.objectEntityMap.set(obj, eid);
}

export function singletonQuery(
  query: Query
): (world: IWorld) => number | undefined {
  return (world: IWorld) => {
    const entities = query(world);
    return entities.length > 0 ? entities[0] : undefined;
  };
}

export * from 'bitecs'
