import * as THREE from "three";
import { Object3DNode, Vector3 } from "@react-three/fiber";
import { buildPlanetMeshData as buildPlanetMeshData, TerrainMeshParams } from "./terrain-builder";
import { TerrainMesh, workerPool } from "./TerrainMesh";

export const DIRECTIONS = {
  UP: new THREE.Vector3(0, 1, 0),
  DOWN: new THREE.Vector3(0, -1, 0),
  LEFT: new THREE.Vector3(-1, 0, 0),
  RIGHT: new THREE.Vector3(1, 0, 0),
  FRONT: new THREE.Vector3(0, 0, 1),
  BACK: new THREE.Vector3(0, 0, -1),
};

export interface PlanetConfig {
  position: [number, number, number];
  radius: number;
  detailLevelDistances: number[];
}

export interface PlanetMeshParams extends TerrainMeshParams {
  origin: THREE.Vector3;
  chunkRadius: number;
  planet: PlanetConfig;
  localUp: THREE.Vector3;
}

export class PlanetMesh extends TerrainMesh {
  origin: THREE.Vector3;
  chunkRadius: number;
  planet: PlanetConfig;
  localUp: THREE.Vector3;
  constructor(params: Partial<PlanetMeshParams> = {}) {
    super(params);
    this.origin = params.origin ?? new THREE.Vector3(0, 0, 0);
    this.chunkRadius = params.chunkRadius ?? 100;
    this.localUp = params.localUp ?? DIRECTIONS.UP.clone();
    this.planet = params.planet ?? { position: [0, 0, 0], radius: 100, detailLevelDistances: [1600, 400, 100] };
  }

  update() {
    if (this.worker) {
      workerPool.enqueue('buildPlanetMeshData',
        {
          width: this.width,
          height: this.height,
          resolution: this.resolution,
          offset: this.offset.toArray(),
          heightGenerator: this.heightGenerator.params as any,
          colorGenerator: this.colorGenerator.params as any,
          settings: this.settings,
          origin: this.origin.toArray(),
          chunkRadius: this.chunkRadius,
          planet: this.planet,
          localUp: this.localUp.toArray(),
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
        chunkRadius: this.chunkRadius,
        planet: this.planet,
        localUp: this.localUp as THREE.Vector3,
      });
      this.updateFromData(data);
    }
  }
}

export type PlanetMeshProps = Object3DNode<
  PlanetMesh,
  typeof PlanetMesh
>;

