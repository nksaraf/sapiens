import React from "react";
import { TerrainMaterial } from "./TerrainMaterial";
import {
  TerrainMesh as TerrainMeshImpl,
  TerrainMeshProps,
} from "../lib/TerrainMesh";

export function TerrainMesh(
  props: TerrainMeshProps & { object?: TerrainMeshImpl }
) {
  const ref = React.useRef<TerrainMeshImpl>();
  const mesh = React.useMemo(() => {
    if (props.object === undefined) {
      return new TerrainMeshImpl();
    }

    return props.object;
  }, [props.object]);

  React.useEffect(() => {
    ref.current?.update();
  }, [
    props.resolution,
    props.heightGenerator,
    props.colorGenerator,
    props.width,
    props.height,
    props.offset,
    props.settings,
  ]);

  return (
    <primitive
      object={mesh}
      ref={ref}
      receiveShadow
      castShadow={false}
      position={props.offset}
      {...props}
    >
      <TerrainMaterial />
      {props.children}
    </primitive>
  );
}
