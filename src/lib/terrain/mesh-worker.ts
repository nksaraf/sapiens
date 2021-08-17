import { NoiseGenerator, NoiseParams } from "../noise";
import * as THREE from "three";
import { HyposymetricTintsGenerator, TextureSplatter } from "./texture-generator";
import { NoisyHeightGenerator } from "./height-generator";
import type { TerrainChunkRawParams } from "./TerrainChunk";
import * as Comlink from 'comlink';
import { buildMeshData, MeshData, TerrainMeshParams } from "./mesh-builder";

export type TerrainMeshWorkerParams = Omit<TerrainMeshParams, "offset" | "heightGenerator" | "colorGenerator"> & {
  colorGenerator: {
    biomeNoiseGenerator: NoiseParams;
  };
  heightGenerator: NoiseParams;
  offset: [number, number, number];
};

const worker = {
  buildMeshData: function (params: TerrainMeshWorkerParams): MeshData {
    const heightGenerator = new NoisyHeightGenerator(new NoiseGenerator(params.heightGenerator));
    const colorGenerator = new HyposymetricTintsGenerator({ biomeNoiseGenerator: new NoiseGenerator(params.colorGenerator.biomeNoiseGenerator) });
    const offset = new THREE.Vector3();
    offset.fromArray(params.offset)
    return buildMeshData({ heightGenerator, colorGenerator, offset, height: params.height, resolution: params.resolution, width: params.width })
  }
}

Comlink.expose(worker);

