import { NoiseGenerator, NoiseParams } from "../../noise";
import * as THREE from "three";
import { HyposymetricTintsGenerator, TextureSplatterRawParams } from "./color-generator";
import { NoisyHeightGenerator } from "./height-generator";
import { buildTerrainMeshData, buildPlanetMeshData, MeshData, TerrainMeshParams } from "./terrain-builder";
import { expose } from "../../threading";
import { PlanetMeshParams } from "./PlanetMesh";

export type TerrainMeshWorkerParams = Omit<TerrainMeshParams, "offset" | "heightGenerator" | "colorGenerator"> & {
  colorGenerator: TextureSplatterRawParams;
  heightGenerator: NoiseParams;
  offset: [number, number, number];
};

export type PlanetMeshWorkerParams = Omit<PlanetMeshParams, "offset" | "localUp" | "origin" | "heightGenerator" | "colorGenerator"> & {
  colorGenerator: TextureSplatterRawParams;
  heightGenerator: NoiseParams;
  offset: [number, number, number];
  origin: [number, number, number];
  localUp: [number, number, number];
};

let builder = {
  buildTerrainMeshData: function (params: TerrainMeshWorkerParams): MeshData {
    const heightGenerator = new NoisyHeightGenerator(new NoiseGenerator(params.heightGenerator));
    const colorGenerator = new HyposymetricTintsGenerator({ biomeNoiseGenerator: new NoiseGenerator(params.colorGenerator.biomeNoiseGenerator), spline: params.colorGenerator.spline });
    const offset = new THREE.Vector3();
    offset.fromArray(params.offset)
    return buildTerrainMeshData({ ...params, heightGenerator, colorGenerator, offset })
  },
  buildPlanetMeshData: function (params: PlanetMeshWorkerParams): MeshData {
    const heightGenerator = new NoisyHeightGenerator(new NoiseGenerator(params.heightGenerator));
    console.log(params);
    const colorGenerator = new HyposymetricTintsGenerator({ biomeNoiseGenerator: new NoiseGenerator(params.colorGenerator.biomeNoiseGenerator), spline: params.colorGenerator.spline });
    const offset = new THREE.Vector3().fromArray(params.offset);
    const origin = new THREE.Vector3().fromArray(params.origin);
    const localUp = new THREE.Vector3().fromArray(params.localUp);
    return buildPlanetMeshData({ ...params, heightGenerator, colorGenerator, offset, origin, localUp })
  }
};

export type Builder = typeof builder;

expose(builder)
