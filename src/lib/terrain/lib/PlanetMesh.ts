import * as THREE from "three";
import { Object3DNode, Vector3 } from "@react-three/fiber";
import { buildPlanetMeshData as buildPlanetMeshData, TerrainMeshParams } from "./terrain-builder";
import { TerrainMesh, DIRECTIONS, workerPool } from "./TerrainMesh";


export interface PlanetMeshParams extends TerrainMeshParams {
  origin: Vector3;
  radius: number;
  localUp: Vector3;
}

export class PlanetMesh extends TerrainMesh {
  origin: Vector3;
  radius: number;
  localUp: Vector3;
  constructor(params: Partial<PlanetMeshParams> = {}) {
    super(params);
    this.origin = params.origin ?? new THREE.Vector3(0, 0, 0);
    this.radius = params.radius ?? 500;
    this.localUp = params.localUp ?? DIRECTIONS.UP.clone();
  }

  update() {
    if (this.worker) {
      workerPool.enqueue('buildPlanetMeshData',
        {
          width: this.width,
          height: this.height,
          resolution: this.resolution,
          offset: (this.offset as THREE.Vector3).toArray(),
          heightGenerator: this.heightGenerator.params as any,
          colorGenerator: this.colorGenerator.params as any,
          settings: this.settings,
          origin: (this.origin as THREE.Vector3).toArray(),
          radius: this.radius,
          localUp: (this.localUp as THREE.Vector3).toArray(),
        }, (data) => {
          this.updateFromData(data);
        });
    }
    else {
      let data = buildPlanetMeshData({
        width: this.width,
        height: this.height,
        resolution: this.resolution,
        offset: this.offset as THREE.Vector3,
        heightGenerator: this.heightGenerator,
        colorGenerator: this.colorGenerator,
        settings: this.settings,
        origin: this.origin as THREE.Vector3,
        radius: this.radius,
        localUp: this.localUp as THREE.Vector3,
      });
      console.log(data);
      this.updateFromData(data);
    }
  }
}

export type PlanetMeshProps = Object3DNode<
  PlanetMesh,
  typeof PlanetMesh
>;

