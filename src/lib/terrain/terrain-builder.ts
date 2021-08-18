import { Vector3 } from "@react-three/fiber";
import { HeightGenerator } from "./height-generator";
import { ColorGenerator } from "./texture-generator";

export interface TerrainMeshParams {
  width: number;
  height: number;
  offset: THREE.Vector3;
  resolution: number;
  colorGenerator: ColorGenerator;
  heightGenerator: HeightGenerator;
}

export interface MeshData {
  positions: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
  colors: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
  normals: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
  indices?: number[];
  // tangents: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
  // weights1: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
  // weights2: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
  uvs: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
}

export function buildMeshData({ resolution, offset, width, height, heightGenerator, colorGenerator }: TerrainMeshParams) {
  const positions = [];
  const uvs = [];
  const normals = [];
  const colors = [];
  const indices = [];

  let halfWidth = width / 2
  let halfHeight = height / 2
  for (let x = 0; x < resolution + 1; x++) {
    const xp = x * width / resolution;
    for (let z = 0; z < resolution + 1; z++) {
      const zp = z * height / resolution;
      const y = heightGenerator.get(xp + offset.x - halfWidth, zp + offset.z - halfHeight);
      console.log(xp + offset.x, zp + offset.z, y);
      const color = colorGenerator.getColor(xp + offset.x - halfWidth, zp + offset.z - halfHeight, y);
      positions.push(xp - halfWidth, y, zp - halfHeight);
      normals.push(0, 1, 0);
      colors.push(color.r, color.g, color.b);
      uvs.push(x / resolution, 1 - (y / resolution));
    }
  }

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const a = i + (resolution + 1) * j;
      const b = (i + 1) + (resolution + 1) * j;
      const c = i + (resolution + 1) * (j + 1);
      const d = (i + 1) + (resolution + 1) * (j + 1);

      indices.push(a, b, d);
      indices.push(c, a, d);
    }
  }

  return { indices, positions, uvs, normals, colors };
}
