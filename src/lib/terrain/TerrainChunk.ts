import { NoiseGenerator, NoiseParams } from "@/noise";
import * as THREE from "three";
import { TextureSplatter } from "./TextureSplatter";
import { HeightGenerator } from "./HeightGenerator";

export interface TerrainChunkRawParams {
  width: number;
  scale: number;
  offset: THREE.Vector3;
  biomeNoiseParams: NoiseParams;
  colorNoiseParams: NoiseParams;
  material: THREE.Material;
  resolution: number;
  radius: number;
  heightNoiseParams: NoiseParams;
}

export interface TerrainChunkParams extends TerrainChunkRawParams {
  biomeNoiseGenerator: NoiseGenerator;
  textureSplatter: TextureSplatter;
  heightNoiseGenerator: NoiseGenerator;
  colorNoiseGenerator: NoiseGenerator;
  material: THREE.Material;
  group: THREE.Group;
  heightGenerators: HeightGenerator[];
}

export class TerrainChunk extends THREE.Mesh {
  params: TerrainChunkParams;
  geometry: THREE.BufferGeometry;

  constructor(params: TerrainChunkParams) {
    let geometry = new THREE.BufferGeometry();
    super(geometry, params.material);
    this.params = params;
    this.geometry = geometry;
    this.castShadow = false;
    this.receiveShadow = true;
    this.params.group.add(this);
  }

  destroy() {
    this.params.group.remove(this);
  }

  hide() {
    this.visible = false;
  }

  show() {
    this.visible = true;
  }

  rebuildMeshFromData(data: {
    positions: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    colours: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    normals: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    tangents: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    weights1: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    weights2: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
    uvs: number | Iterable<number> | ArrayLike<number> | ArrayBuffer;
  }) {
    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(data.positions, 3)
    );
    this.geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(data.colours, 3)
    );
    this.geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(data.normals, 3)
    );
    this.geometry.setAttribute(
      "tangent",
      new THREE.Float32BufferAttribute(data.tangents, 4)
    );
    this.geometry.setAttribute(
      "weights1",
      new THREE.Float32BufferAttribute(data.weights1, 4)
    );
    this.geometry.setAttribute(
      "weights2",
      new THREE.Float32BufferAttribute(data.weights2, 4)
    );
    this.geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(data.uvs, 2)
    );
  }

  generateHeight(v: THREE.Vector3) {
    return this.params.heightGenerators[0].get(v.x, v.y, v.z)[0];
  }

  *rebuild() {
    const _D = new THREE.Vector3();
    const _D1 = new THREE.Vector3();
    const _D2 = new THREE.Vector3();
    const _P = new THREE.Vector3();
    const _H = new THREE.Vector3();
    const _W = new THREE.Vector3();
    // const _C = new THREE.Vector3();
    // const _S = new THREE.Vector3();

    const _N = new THREE.Vector3();
    const _N1 = new THREE.Vector3();
    const _N2 = new THREE.Vector3();
    const _N3 = new THREE.Vector3();

    const positions = [];
    const colors = [];
    const normals = [];
    const tangents = [];
    const uvs = [];
    const weights1 = [];
    const weights2 = [];
    const indices: number[] = [];
    const wsPositions = [];

    const localToWorld = this.params.group.matrix;
    const resolution = this.params.resolution;
    const radius = this.params.radius;
    const offset = this.params.offset;
    const width = this.params.width;
    const half = width / 2;

    for (let x = 0; x < resolution + 1; x++) {
      const xp = (width * x) / resolution;
      for (let y = 0; y < resolution + 1; y++) {
        const yp = (width * y) / resolution;

        // Compute position
        _P.set(xp - half, yp - half, radius);
        _P.add(offset);
        _P.normalize();
        _D.copy(_P);
        _P.multiplyScalar(radius);
        _P.z -= radius;

        // Compute a world space position to sample noise
        _W.copy(_P);
        _W.applyMatrix4(localToWorld);

        const height = this.generateHeight(_W);

        // Purturb height along z-vector
        _H.copy(_D);
        _H.multiplyScalar(height);
        _P.add(_H);

        positions.push(_P.x, _P.y, _P.z);

        const color = this.params.textureSplatter.getColor(_W.x, _W.y, height);
        colors.push(color.r, color.g, color.b);
        normals.push(_D.x, _D.y, _D.z);
        tangents.push(1, 0, 0, 1);
        wsPositions.push(_W.x, _W.y, height);
        // TODO GUI
        uvs.push(_P.x / 200.0, _P.y / 200.0);
      }
    }
    yield;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        indices.push(
          i * (resolution + 1) + j,
          (i + 1) * (resolution + 1) + j + 1,
          i * (resolution + 1) + j + 1
        );
        indices.push(
          (i + 1) * (resolution + 1) + j,
          (i + 1) * (resolution + 1) + j + 1,
          i * (resolution + 1) + j
        );
      }
    }
    yield;

    const up = [...normals];

    for (let i = 0, n = indices.length; i < n; i += 3) {
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;

      _N1.fromArray(positions, i1);
      _N2.fromArray(positions, i2);
      _N3.fromArray(positions, i3);

      _D1.subVectors(_N3, _N2);
      _D2.subVectors(_N1, _N2);
      _D1.cross(_D2);

      normals[i1] += _D1.x;
      normals[i2] += _D1.x;
      normals[i3] += _D1.x;

      normals[i1 + 1] += _D1.y;
      normals[i2 + 1] += _D1.y;
      normals[i3 + 1] += _D1.y;

      normals[i1 + 2] += _D1.z;
      normals[i2 + 2] += _D1.z;
      normals[i3 + 2] += _D1.z;
    }
    yield;

    for (let i = 0, n = normals.length; i < n; i += 3) {
      _N.fromArray(normals, i);
      _N.normalize();
      normals[i] = _N.x;
      normals[i + 1] = _N.y;
      normals[i + 2] = _N.z;
    }
    yield;

    let count = 0;
    for (let i = 0, n = indices.length; i < n; i += 3) {
      const splats: ReturnType<TextureSplatter['getSplat']>[] = [];
      type SplatType = keyof typeof splats[0];
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;
      const indexes = [i1, i2, i3];
      for (let j = 0; j < 3; j++) {
        const j1 = indexes[j];
        _P.fromArray(wsPositions, j1);
        _N.fromArray(normals, j1);
        _D.fromArray(up, j1);
        const s = this.params.textureSplatter.getSplat(_P.x, _P.y, _P.z);
        splats.push(s);
      }

      const splatStrengths: Record<string, any> = {};
      for (let k in splats[0]) {
        splatStrengths[k] = { key: k, strength: 0.0 };
      }
      for (let curSplat of splats) {
        for (let k in curSplat) {
          splatStrengths[k].strength += curSplat[k as keyof typeof curSplat].strength;
        }
      }

      let typeValues = Object.values(splatStrengths);
      typeValues.sort((a, b) => {
        if (a.strength < b.strength) {
          return 1;
        }
        if (a.strength > b.strength) {
          return -1;
        }
        return 0;
      });

      const w1 = indices[i] * 4;
      const w2 = indices[i + 1] * 4;
      const w3 = indices[i + 2] * 4;

      for (let s = 0; s < 3; s++) {
        let total =
          splats[s][typeValues[0].key as SplatType].strength +
          splats[s][typeValues[1].key as SplatType].strength +
          splats[s][typeValues[2].key as SplatType].strength +
          splats[s][typeValues[3].key as SplatType].strength;
        const normalization = 1.0 / total;

        splats[s][typeValues[0].key as SplatType].strength *= normalization;
        splats[s][typeValues[1].key as SplatType].strength *= normalization;
        splats[s][typeValues[2].key as SplatType].strength *= normalization;
        splats[s][typeValues[3].key as SplatType].strength *= normalization;
      }

      weights1.push(splats[0][typeValues[3].key as SplatType].index);
      weights1.push(splats[0][typeValues[2].key as SplatType].index);
      weights1.push(splats[0][typeValues[1].key as SplatType].index);
      weights1.push(splats[0][typeValues[0].key as SplatType].index);

      weights1.push(splats[1][typeValues[3].key as SplatType].index);
      weights1.push(splats[1][typeValues[2].key as SplatType].index);
      weights1.push(splats[1][typeValues[1].key as SplatType].index);
      weights1.push(splats[1][typeValues[0].key as SplatType].index);

      weights1.push(splats[2][typeValues[3].key as SplatType].index);
      weights1.push(splats[2][typeValues[2].key as SplatType].index);
      weights1.push(splats[2][typeValues[1].key as SplatType].index);
      weights1.push(splats[2][typeValues[0].key as SplatType].index);

      weights2.push(splats[0][typeValues[3].key as SplatType].strength);
      weights2.push(splats[0][typeValues[2].key as SplatType].strength);
      weights2.push(splats[0][typeValues[1].key as SplatType].strength);
      weights2.push(splats[0][typeValues[0].key as SplatType].strength);

      weights2.push(splats[1][typeValues[3].key as SplatType].strength);
      weights2.push(splats[1][typeValues[2].key as SplatType].strength);
      weights2.push(splats[1][typeValues[1].key as SplatType].strength);
      weights2.push(splats[1][typeValues[0].key as SplatType].strength);

      weights2.push(splats[2][typeValues[3].key as SplatType].strength);
      weights2.push(splats[2][typeValues[2].key as SplatType].strength);
      weights2.push(splats[2][typeValues[1].key as SplatType].strength);
      weights2.push(splats[2][typeValues[0].key as SplatType].strength);

      count++;
      if (count % 10000 == 0) {
        yield;
      }
    }
    yield;

    function _Unindex(src: any[], stride: number) {
      const dst = [];
      for (let i = 0, n = indices.length; i < n; i += 3) {
        const i1 = indices[i] * stride;
        const i2 = indices[i + 1] * stride;
        const i3 = indices[i + 2] * stride;

        for (let j = 0; j < stride; j++) {
          dst.push(src[i1 + j]);
        }
        for (let j = 0; j < stride; j++) {
          dst.push(src[i2 + j]);
        }
        for (let j = 0; j < stride; j++) {
          dst.push(src[i3 + j]);
        }
      }
      return dst;
    }

    const uiPositions = _Unindex(positions, 3);
    yield;

    const uiColours = _Unindex(colors, 3);
    yield;

    const uiNormals = _Unindex(normals, 3);
    yield;

    const uiTangents = _Unindex(tangents, 4);
    yield;

    const uiUVs = _Unindex(uvs, 2);
    yield;

    const uiWeights1 = weights1;
    const uiWeights2 = weights2;

    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(uiPositions, 3)
    );
    this.geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(uiColours, 3)
    );
    this.geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(uiNormals, 3)
    );
    this.geometry.setAttribute(
      "tangent",
      new THREE.Float32BufferAttribute(uiTangents, 4)
    );
    this.geometry.setAttribute(
      "weights1",
      new THREE.Float32BufferAttribute(uiWeights1, 4)
    );
    this.geometry.setAttribute(
      "weights2",
      new THREE.Float32BufferAttribute(uiWeights2, 4)
    );
    this.geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(uiUVs, 2)
    );
  }
}


