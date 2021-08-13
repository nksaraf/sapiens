import { NoiseGenerator } from "@/noise";
import * as THREE from "three";
import { ColorGenerator, COLORS, FixedColourGenerator, TextureSplatter } from "./TextureSplatter";
import { HeightGenerator } from "./HeightGenerator";

export interface TerrainMeshParams {
  width: number;
  // scale: number;
  offset: THREE.Vector3;
  resolution: number;
  // radius: number; 
  // biomeNoiseGenerator: NoiseGenerator;
  textureSplatter: TextureSplatter;
  heightGenerators: HeightGenerator[];
}

export class TerrainMesh extends THREE.Mesh {
  width: number;
  height: number;
  resolution: number;
  heightGenerators: HeightGenerator[];
  colorGenerator: ColorGenerator;
  needsUpdate: boolean = true;
  offset: THREE.Vector3 | [number, number, number]

  constructor() {
    super(new THREE.BufferGeometry());
    this.width = 100;
    this.height = 100;
    this.resolution = 1;
    this.heightGenerators = [];
    this.colorGenerator = new FixedColourGenerator({ color: COLORS.DEEP_OCEAN });
    this.offset = new THREE.Vector3()
    this.update()
  }

  updateFromData(data: {
    positions: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    colors: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    normals: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    tangents: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    weights1: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    weights2: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    uvs: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
  }) {
    const {
      positions,
      uvs,
      normals,
      colors
    } = data;
    this.geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute(
      'uv', new THREE.Float32BufferAttribute(uvs, 2));
    this.geometry.setAttribute(
      'normal', new THREE.Float32BufferAttribute(normals, 3));
    this.geometry.setAttribute(
      'color', new THREE.Float32BufferAttribute(colors, 3));

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
    this.resetGeometry();
    const positions = [];
    const uvs = [];
    const normals = [];
    const colors = [];
    const indices = [];
    let resolution = Math.floor(this.resolution);
    let offset = this.offset as THREE.Vector3
    let width = this.width;
    let height = this.height;
    let halfWidth = width / 2
    let halfHeight = height / 2
    for (let x = 0; x < resolution + 1; x++) {
      const xp = x * width / resolution;
      for (let y = 0; y < resolution + 1; y++) {
        const yp = y * height / resolution;
        const z = this.heightGenerators.length > 0 ? this.heightGenerators[0].get(xp + offset.x, yp + offset.y)[0] : 0
        const color = this.colorGenerator.getColor(xp + offset.x, yp + offset.y, z);
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

    this.geometry.setIndex(indices);
    this.geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute(
      'uv', new THREE.Float32BufferAttribute(uvs, 2));
    this.geometry.setAttribute(
      'normal', new THREE.Float32BufferAttribute(normals, 3));
    this.geometry.setAttribute(
      'color', new THREE.Float32BufferAttribute(colors, 3));

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.computeVertexNormals()
  }

  // *rebuild() {
  //   const _D = new THREE.Vector3();
  //   const _D1 = new THREE.Vector3();
  //   const _D2 = new THREE.Vector3();
  //   const _P = new THREE.Vector3();
  //   const _H = new THREE.Vector3();
  //   const _W = new THREE.Vector3();
  //   const _C = new THREE.Vector3();
  //   const _S = new THREE.Vector3();

  //   const _N = new THREE.Vector3();
  //   const _N1 = new THREE.Vector3();
  //   const _N2 = new THREE.Vector3();
  //   const _N3 = new THREE.Vector3();

  //   const positions = [];
  //   const colors = [];
  //   const normals = [];
  //   const tangents = [];
  //   const uvs = [];
  //   const indices = [];

  //   // const localToWorld = this.params.group.matrix;
  //   const resolution = this.params.resolution;
  //   // const radius = this.params.radius;
  //   const offset = this.params.offset;
  //   const width = this.params.width;
  //   const half = width / 2;

  //   for (let x = 0; x < resolution + 1; x++) {
  //     const xp = width * x / resolution;
  //     for (let y = 0; y < resolution + 1; y++) {
  //       const yp = width * y / resolution;

  //       // Compute position
  //       _P.set(xp - half, yp - half, radius);
  //       _P.add(offset);
  //       _P.normalize();
  //       _D.copy(_P);
  //       _P.multiplyScalar(radius);
  //       _P.z -= radius;

  //       // Compute a world space position to sample noise
  //       _W.copy(_P);
  //       _W.applyMatrix4(localToWorld);

  //       const [height, normalization] = this.params.heightGenerators[0].get(_W.x, _W.y, _W.z);
  //       const color = this.params.textureSplatter.getColor(_W.x, _W.y, height);

  //       // Purturb height along z-vector
  //       _H.copy(_D);
  //       _H.multiplyScalar(height);
  //       _P.add(_H);

  //       positions.push(_P.x, _P.y, _P.z);
  //       colors.push(color.r, color.g, color.b);
  //       normals.push(_D.x, _D.y, _D.z);
  //       tangents.push(1, 0, 0, 1);
  //       uvs.push(_P.x / 10, _P.y / 10);
  //     }
  //   }
  //   yield;

  //   for (let i = 0; i < resolution; i++) {
  //     for (let j = 0; j < resolution; j++) {
  //       indices.push(
  //         i * (resolution + 1) + j,
  //         (i + 1) * (resolution + 1) + j + 1,
  //         i * (resolution + 1) + j + 1);
  //       indices.push(
  //         (i + 1) * (resolution + 1) + j,
  //         (i + 1) * (resolution + 1) + j + 1,
  //         i * (resolution + 1) + j);
  //     }
  //   }
  //   yield;

  //   for (let i = 0, n = indices.length; i < n; i += 3) {
  //     const i1 = indices[i] * 3;
  //     const i2 = indices[i + 1] * 3;
  //     const i3 = indices[i + 2] * 3;

  //     _N1.fromArray(positions, i1);
  //     _N2.fromArray(positions, i2);
  //     _N3.fromArray(positions, i3);

  //     _D1.subVectors(_N3, _N2);
  //     _D2.subVectors(_N1, _N2);
  //     _D1.cross(_D2);

  //     normals[i1] += _D1.x;
  //     normals[i2] += _D1.x;
  //     normals[i3] += _D1.x;

  //     normals[i1 + 1] += _D1.y;
  //     normals[i2 + 1] += _D1.y;
  //     normals[i3 + 1] += _D1.y;

  //     normals[i1 + 2] += _D1.z;
  //     normals[i2 + 2] += _D1.z;
  //     normals[i3 + 2] += _D1.z;
  //   }
  //   yield;

  //   for (let i = 0, n = normals.length; i < n; i += 3) {
  //     _N.fromArray(normals, i);
  //     _N.normalize();
  //     normals[i] = _N.x;
  //     normals[i + 1] = _N.y;
  //     normals[i + 2] = _N.z;
  //   }
  //   yield;

  //   this.geometry.setAttribute(
  //     'position', new THREE.Float32BufferAttribute(positions, 3));
  //   this.geometry.setAttribute(
  //     'color', new THREE.Float32BufferAttribute(colors, 3));
  //   this.geometry.setAttribute(
  //     'normal', new THREE.Float32BufferAttribute(normals, 3));
  //   this.geometry.setAttribute(
  //     'tangent', new THREE.Float32BufferAttribute(tangents, 4));
  //   this.geometry.setAttribute(
  //     'uv', new THREE.Float32BufferAttribute(uvs, 2));
  //   this.geometry.setIndex(
  //     new THREE.BufferAttribute(new Uint32Array(indices), 1));
  // }
}
