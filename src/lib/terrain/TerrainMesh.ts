import * as THREE from "three";
import { ColorGenerator, COLORS, FixedColourGenerator, HyposymetricTintsGenerator } from "./color-generator";
import { FixedHeightGenerator, HeightGenerator, NoisyHeightGenerator } from "./height-generator";
import * as Comlink from "comlink";
import { Vector3 } from "@react-three/fiber";
import { buildMeshData, buildSphereFaceData, MeshData, TerrainMeshParams } from "./terrain-builder";
import TerrainBuilderWorker from './terrain-builder.worker?worker'
import type { Builder, TerrainMeshWorkerParams } from "./terrain-builder.worker";
import { NoiseGenerator, NoiseParams } from "@/noise";
import { WorkerThreadPool } from "../threading";
import { DIRECTIONS } from "./TerrainSphere";

let workerPool = new WorkerThreadPool<Builder>(4, () => new TerrainBuilderWorker())

export class TerrainMesh extends THREE.Mesh {
  width: number;
  height: number;
  resolution: number;
  heightGenerator: HeightGenerator;
  colorGenerator: ColorGenerator;
  offset: Vector3
  worker: boolean = false
  applyHeight: boolean = true

  constructor(params: Partial<TerrainMeshParams> = {}) {
    super(new THREE.BufferGeometry());
    this.width = params.width ?? 500;
    this.height = params.height ?? 500;
    this.resolution = params.resolution ?? 64;
    this.heightGenerator = params.heightGenerator ?? new NoisyHeightGenerator(new NoiseGenerator());
    this.colorGenerator = params.colorGenerator ?? new HyposymetricTintsGenerator({
      biomeNoiseGenerator: new NoiseGenerator({
        octaves: 2,
        persistence: 0.5,
        lacunarity: 2.0,
        scale: 2048.0,
        noiseType: "simplex",
        seed: 2,
        exponentiation: 1,
        height: 1.0,
      })
    });
    this.offset = params.offset ?? new THREE.Vector3()
  }

  updateFromData(data: MeshData) {
    const {
      positions,
      uvs,
      normals,
      colors,
      indices
    } = data;
    this.geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute(
      'uv', new THREE.Float32BufferAttribute(uvs, 2));
    this.geometry.setAttribute(
      'normal', new THREE.Float32BufferAttribute(normals, 3));
    this.geometry.setAttribute(
      'color', new THREE.Float32BufferAttribute(colors, 3));

    if (indices && indices.length !== this.geometry.index?.array.length) {
      this.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
      this.geometry.index!.needsUpdate = true
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.computeVertexNormals()
  }

  resetGeometry() {
    this.geometry = new THREE.BufferGeometry();
  }

  update() {
    if (this.worker) {
      let offset = (this.offset as THREE.Vector3).toArray();
      workerPool.enqueue("buildMeshData", {
        width: this.width,
        height: this.height,
        resolution: this.resolution,
        offset: offset,
        heightGenerator: this.heightGenerator.params as any,
        colorGenerator: this.colorGenerator.params as any,
        applyHeight: this.applyHeight,
      }, (data) => {
        this.updateFromData(data);
      })
    }
    else {
      this.updateFromData(buildMeshData({
        width: this.width,
        height: this.height,
        resolution: this.resolution,
        offset: this.offset as THREE.Vector3,
        heightGenerator: this.heightGenerator,
        colorGenerator: this.colorGenerator,
        applyHeight: this.applyHeight
      }));
    }
  }
}

export interface TerrainSphereMeshParams extends TerrainMeshParams {
  origin: Vector3
  radius: number;
  localUp: Vector3
}

export class TerrainSphereMesh extends TerrainMesh {
  origin: Vector3;
  radius: number;
  localUp: Vector3
  constructor(params: Partial<TerrainSphereMeshParams> = {}) {
    super(params);
    this.origin = params.origin ?? new THREE.Vector3(0, 0, 0);
    this.radius = params.radius ?? 500;
    this.localUp = params.localUp ?? DIRECTIONS.UP.clone();
  }

  update() {
    if (this.worker) {
      let offset = (this.offset as THREE.Vector3).toArray();
      workerPool.enqueue('buildSphereMeshData',
        {
          width: this.width,
          height: this.height,
          resolution: this.resolution,
          offset: (this.offset as THREE.Vector3).toArray(),
          heightGenerator: this.heightGenerator.params as any,
          colorGenerator: this.colorGenerator.params as any,
          applyHeight: this.applyHeight,
          origin: (this.origin as THREE.Vector3).toArray(),
          radius: this.radius,
          localUp: (this.localUp as THREE.Vector3).toArray(),
        }, (data) => {
          this.updateFromData(data);
        })
    }
    else {
      this.updateFromData(buildSphereFaceData({
        width: this.width,
        height: this.height,
        resolution: this.resolution,
        offset: this.offset as THREE.Vector3,
        heightGenerator: this.heightGenerator,
        colorGenerator: this.colorGenerator,
        applyHeight: this.applyHeight,
        origin: this.origin as THREE.Vector3,
        radius: this.radius,
        localUp: this.localUp as THREE.Vector3,
      }));
    }
  }
}



