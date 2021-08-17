import * as THREE from "three";
import { ColorGenerator, COLORS, FixedColourGenerator, HyposymetricTintsGenerator, TextureSplatter } from "./texture-generator";
import { FixedHeightGenerator, HeightGenerator, NoisyHeightGenerator } from "./height-generator";
import * as Comlink from "comlink";
import { Vector3 } from "@react-three/fiber";
import { MeshData, TerrainMeshParams } from "./mesh-builder";
import MeshWorker from './mesh-worker?worker'
import type { TerrainMeshWorkerParams } from "./mesh-worker";
import { NoiseGenerator, NoiseParams } from "@/noise";

const worker = Comlink.wrap<{ buildMeshData(params: TerrainMeshWorkerParams): MeshData }>(new MeshWorker());

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

    worker.buildMeshData({
      width: this.width,
      height: this.height,
      resolution: this.resolution,
      offset: offset,
      heightGenerator: this.heightGenerator.params as any,
      colorGenerator: this.colorGenerator.params as any
    }).then(data => {
      this.updateFromData(data);
      console.timeEnd(`updating ${offset}`);
    });
  }
}

