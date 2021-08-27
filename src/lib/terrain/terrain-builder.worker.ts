import { NoiseGenerator, NoiseParams } from "../noise";
import * as THREE from "three";
import { HyposymetricTintsGenerator, TextureSplatter } from "./color-generator";
import { NoisyHeightGenerator } from "./height-generator";
import { buildMeshData, buildSphereFaceData, MeshData, TerrainMeshParams } from "./terrain-builder";
import { expose } from "../threading";
import { TerrainSphereMeshParams } from "./TerrainMesh";

export type TerrainMeshWorkerParams = Omit<TerrainMeshParams, "offset" | "heightGenerator" | "colorGenerator"> & {
  colorGenerator: {
    biomeNoiseGenerator: NoiseParams;
  };
  heightGenerator: NoiseParams;
  offset: [number, number, number];
};

export type TerrainSphereMeshWorkerParams = Omit<TerrainSphereMeshParams, "offset" | "localUp" | "origin" | "heightGenerator" | "colorGenerator"> & {
  colorGenerator: {
    biomeNoiseGenerator: NoiseParams;
  };
  heightGenerator: NoiseParams;
  offset: [number, number, number];
  origin: [number, number, number];
  localUp: [number, number, number];
};

let builder = {
  buildMeshData: function (params: TerrainMeshWorkerParams): MeshData {
    const heightGenerator = new NoisyHeightGenerator(new NoiseGenerator(params.heightGenerator));
    const colorGenerator = new HyposymetricTintsGenerator({ biomeNoiseGenerator: new NoiseGenerator(params.colorGenerator.biomeNoiseGenerator) });
    const offset = new THREE.Vector3();
    offset.fromArray(params.offset)
    return buildMeshData({ ...params, heightGenerator, colorGenerator, offset })
  },
  buildSphereMeshData: function (params: TerrainSphereMeshWorkerParams): MeshData {
    const heightGenerator = new NoisyHeightGenerator(new NoiseGenerator(params.heightGenerator));
    const colorGenerator = new HyposymetricTintsGenerator({ biomeNoiseGenerator: new NoiseGenerator(params.colorGenerator.biomeNoiseGenerator) });
    const offset = new THREE.Vector3().fromArray(params.offset);
    const origin = new THREE.Vector3().fromArray(params.origin);
    const localUp = new THREE.Vector3().fromArray(params.localUp);
    return buildSphereFaceData({ ...params, heightGenerator, colorGenerator, offset, origin, localUp })
  }
};

export type Builder = typeof builder;

expose(builder)
