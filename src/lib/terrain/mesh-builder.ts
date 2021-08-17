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
    for (let y = 0; y < resolution + 1; y++) {
      const yp = y * height / resolution;
      const z = heightGenerator.get(xp + offset.x, yp + offset.y);
      const color = colorGenerator.getColor(xp + offset.x, yp + offset.y, z);
      positions.push(xp - halfWidth, (yp - halfHeight), z);
      normals.push(0, 0, 1);
      colors.push(color.r, color.g, color.b);
      uvs.push(x / resolution, 1 - (y / resolution));
    }
  }

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const a = i + (resolution + 1) * j;
      const b = i + (resolution + 1) * (j + 1);
      const c = (i + 1) + (resolution + 1) * (j + 1);
      const d = (i + 1) + (resolution + 1) * j;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  return { indices, positions, uvs, normals, colors };
}
