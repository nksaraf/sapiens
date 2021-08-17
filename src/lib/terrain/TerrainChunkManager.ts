import { NoiseGenerator, NoiseParams } from "@/noise";
import { CubeQuadTree } from "@/quadtree";
import * as THREE from "three";
import { TextureSplatter } from "./texture-generator";
import { NoisyHeightGenerator } from "./height-generator";
import { terrainShader } from "./terrain-shader";
import { TerrainChunk, TerrainChunkParams } from "./TerrainChunk";
import { TerrainChunkRebuilder_Threaded } from "./thread";
import { utils } from "./utils";

const _MIN_CELL_SIZE = 250;
const _MIN_CELL_RESOLUTION = 64;
const _PLANET_RADIUS = 4000;

type TerrainChunkManagerRawParams = Pick<TerrainChunkParams, 'biomeNoiseParams' | 'colorNoiseParams' | 'heightNoiseParams'> & {
  camera: THREE.Camera
};

type TerrainChunkManagerParams = TerrainChunkManagerRawParams & Pick<TerrainChunkParams, 'biomeNoiseGenerator' | 'textureSplatter' | 'colorNoiseGenerator' | 'heightGenerators' | 'heightNoiseGenerator' | 'material'>;


class TerrainChunkManager extends THREE.Group {
  builder: TerrainChunkRebuilder_Threaded;
  groups: THREE.Group[];
  chunks: Record<string, PositionedTerrainChunk>
  params: TerrainChunkManagerParams;
  constructor(params: TerrainChunkManagerRawParams) {
    super();
    this.params = params as TerrainChunkManagerParams;
    this.params.material = loadTextureAtlas();
    this.builder = new TerrainChunkRebuilder_Threaded();
    // this._builder = new terrain_builder.TerrainChunkRebuilder();

    const biomeNoiseParams = {
      octaves: 2,
      persistence: 0.5,
      lacunarity: 2.0,
      scale: 2048.0,
      noiseType: 'simplex',
      seed: 2,
      exponentiation: 1,
      height: 1.0
    } as NoiseParams;
    this.params.biomeNoiseParams = biomeNoiseParams;
    this.params.biomeNoiseGenerator = new NoiseGenerator(biomeNoiseParams);

    const colourParams = {
      octaves: 1,
      persistence: 0.5,
      lacunarity: 2.0,
      exponentiation: 1.0,
      scale: 256.0,
      noiseType: 'simplex',
      seed: 2,
      height: 1.0,
    } as NoiseParams;
    this.params.colorNoiseGenerator = new NoiseGenerator(colourParams);
    this.params.colorNoiseParams = colourParams;

    const heightNoiseParams = {
      octaves: 10,
      persistence: 0.5,
      lacunarity: 1.6,
      exponentiation: 7.5,
      height: 900.0,
      scale: 1800.0,
      noiseType: 'simplex',
      seed: 1
    } as NoiseParams;
    this.params.heightNoiseParams = heightNoiseParams;
    this.params.heightNoiseGenerator = new NoiseGenerator(heightNoiseParams);

    this.params.textureSplatter = new TextureSplatter({
      biomeNoiseGenerator: this.params.biomeNoiseGenerator,
      colorNoiseGenerator: this.params.colorNoiseGenerator,
    });

    this.params.heightGenerators = [new NoisyHeightGenerator(this.params.heightNoiseGenerator)];
    this.chunks = {};
    this.groups = [...new Array(6)].map(() => new THREE.Group());
    this.add(...this.groups)
  }

  cellIndex(p: THREE.Vector3) {
    const xp = p.x + _MIN_CELL_SIZE * 0.5;
    const yp = p.z + _MIN_CELL_SIZE * 0.5;
    const x = Math.floor(xp / _MIN_CELL_SIZE);
    const z = Math.floor(yp / _MIN_CELL_SIZE);
    return [x, z];
  }

  createTerrainChunk(group: THREE.Group, offset: THREE.Vector3, width: number, resolution: number) {
    const params = {
      group: group,
      width: width,
      offset: offset,
      radius: _PLANET_RADIUS,
      resolution: resolution,
      scale: 1,
      material: this.params.material,
      biomeNoiseParams: this.params.biomeNoiseParams,
      biomeNoiseGenerator: this.params.biomeNoiseGenerator,
      heightNoiseParams: this.params.heightNoiseParams,
      heightNoiseGenerator: this.params.heightNoiseGenerator,
      heightGenerators: this.params.heightGenerators,
      colorNoiseParams: this.params.colorNoiseParams,
      colorNoiseGenerator: this.params.colorNoiseGenerator,
      textureSplatter: this.params.textureSplatter,
    } as TerrainChunkParams;

    return this.builder.allocateChunk(params);
  }

  update() {
    this.builder.update();
    if (!this.builder.busy) {
      this.updateVisibleChunks();
    }
  }

  updateVisibleChunks() {
    function getKey(c: PositionedTerrainChunk) {
      return c.position[0] + '/' + c.position[1] + ' [' + c.size + ']' + ' [' + c.index + ']';
    }

    const quadTree = new CubeQuadTree({
      radius: _PLANET_RADIUS,
      min_node_size: _MIN_CELL_SIZE,
    });

    quadTree.Insert(this.params.camera.position);

    const sides = quadTree.getChildren();

    let newTerrainChunks: Record<string, PositionedTerrainChunk> = {};
    const center = new THREE.Vector3();
    const dimensions = new THREE.Vector3();
    for (let i = 0; i < sides.length; i++) {
      this.groups[i].matrix = sides[i].transform;
      this.groups[i].matrixAutoUpdate = false;
      for (let c of sides[i].children) {
        c.bounds.getCenter(center);
        c.bounds.getSize(dimensions);

        const child = {
          index: i,
          group: this.groups[i],
          position: [center.x, center.y, center.z],
          bounds: c.bounds,
          size: dimensions.x,
        } as PositionedTerrainChunk;

        const k = getKey(child);
        newTerrainChunks[k] = child;
      }
    }

    const intersection = utils.DictIntersection(this.chunks, newTerrainChunks);
    const difference = utils.DictDifference(newTerrainChunks, this.chunks);
    const recycle = Object.values(utils.DictDifference(this.chunks, newTerrainChunks));

    this.builder.retireChunks(recycle);

    newTerrainChunks = intersection;

    for (let k in difference) {
      const [xp, yp, zp] = difference[k].position;

      const offset = new THREE.Vector3(xp, yp, zp);
      newTerrainChunks[k] = {
        position: [xp, 0, zp],
        chunk: this.createTerrainChunk(
          difference[k].group, offset, difference[k].size, _MIN_CELL_RESOLUTION),
      };
    }

    this.chunks = newTerrainChunks;
  }
}

function loadTextureAtlas() {
  const loader = new THREE.TextureLoader();

  const noiseTexture = loader.load('./resources/simplex-noise.png');
  noiseTexture.wrapS = THREE.RepeatWrapping;
  noiseTexture.wrapT = THREE.RepeatWrapping;

  let material = new THREE.RawShaderMaterial({
    uniforms: {
      diffuseMap: {
        value: 0
      },
      normalMap: {
        value: 0
      },
      noiseMap: {
        value: noiseTexture
      },
    },
    vertexShader: terrainShader.vertexShader,
    fragmentShader: terrainShader.fragmentShader,
    side: THREE.FrontSide
  });


  const diffuse = new TextureAtlas();
  diffuse.load('diffuse', [
    '/resources/dirt_01_diffuse-1024.png',
    '/resources/grass1-albedo3-1024.png',
    '/resources/sandyground-albedo-1024.png',
    '/resources/worn-bumpy-rock-albedo-1024.png',
    '/resources/rock-snow-ice-albedo-1024.png',
    '/resources/snow-packed-albedo-1024.png',
    '/resources/rough-wet-cobble-albedo-1024.png',
    '/resources/sandy-rocks1-albedo-1024.png',
  ]);
  diffuse.onLoad = () => {
    material.uniforms.diffuseMap.value = diffuse.Info['diffuse'].atlas;
  };

  const normal = new TextureAtlas();
  normal.load('normal', [
    '/resources/dirt_01_normal-1024.jpg',
    '/resources/grass1-normal-1024.jpg',
    '/resources/sandyground-normal-1024.jpg',
    '/resources/worn-bumpy-rock-normal-1024.jpg',
    '/resources/rock-snow-ice-normal-1024.jpg',
    '/resources/snow-packed-normal-1024.jpg',
    '/resources/rough-wet-cobble-normal-1024.jpg',
    '/resources/sandy-rocks1-normal-1024.jpg',
  ]);
  normal.onLoad = () => {
    material.uniforms.normalMap.value = normal.Info['normal'].atlas;
  };

  return material
}

export interface PositionedTerrainChunk {
  position: number[];
  chunk: TerrainChunk;
  group: THREE.Group;
  bounds: THREE.Box3;
  size: number;
  index: number
}