import * as THREE from "three";
import { ColorGenerator, COLORS, FixedColourGenerator, HyposymetricTintsGenerator, TextureSplatter } from "./texture-generator";
import { FixedHeightGenerator, HeightGenerator, NoisyHeightGenerator } from "./height-generator";
import * as Comlink from "comlink";
import { Vector3 } from "@react-three/fiber";
import { buildMeshData, MeshData, TerrainMeshParams } from "./terrain-builder";
import TerrainBuilderWorker from './terrain-builder.worker?worker'
import type { TerrainMeshWorkerParams } from "./terrain-builder.worker";
import { NoiseGenerator, NoiseParams } from "@/noise";
import { WorkerThreadPool } from "../threading";

let workerPool = new WorkerThreadPool<{ buildMeshData(params: TerrainMeshWorkerParams): MeshData }>(4, () => new TerrainBuilderWorker())

export class TerrainMesh extends THREE.Mesh {
  width: number;
  height: number;
  resolution: number;
  heightGenerator: HeightGenerator;
  colorGenerator: ColorGenerator;
  offset: Vector3

  constructor(params: Partial<TerrainMeshParams> = {}) {
    super(new THREE.BufferGeometry());
    this.width = params.width ?? 100;
    this.height = params.height ?? 100;
    this.resolution = params.resolution ?? 1;
    this.heightGenerator = params.heightGenerator ?? new NoisyHeightGenerator(new NoiseGenerator());
    this.colorGenerator = params.colorGenerator ?? new HyposymetricTintsGenerator({
      biomeNoiseGenerator: new NoiseGenerator()
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

    if (indices) {
      this.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
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
    let offset = (this.offset as THREE.Vector3).toArray();
    console.time(`updating ${offset}`);
    workerPool.enqueue({
      name: "buildMeshData",
      params: {
        width: this.width,
        height: this.height,
        resolution: this.resolution,
        offset: offset,
        heightGenerator: this.heightGenerator.params as any,
        colorGenerator: this.colorGenerator.params as any
      }
    }, (data) => {
      this.resetGeometry()
      this.updateFromData(data);
      console.timeEnd(`updating ${offset}`);
    })

    // worker.buildMeshData({
    //   width: this.width,
    //   height: this.height,
    //   resolution: this.resolution,
    //   offset: offset,
    //   heightGenerator: this.heightGenerator.params as any,
    //   colorGenerator: this.colorGenerator.params as any
    // }).then(data => {
    //   this.updateFromData(data);
    //   console.timeEnd(`updating ${offset}`);
    // });

    // this.updateFromData(buildMeshData({
    //   width: this.width,
    //   height: this.height,
    //   resolution: this.resolution,
    //   offset: this.offset as THREE.Vector3,
    //   heightGenerator: this.heightGenerator,
    //   colorGenerator: this.colorGenerator
    // }));

    // console.timeEnd(`updating ${offset}`);

  }
}




