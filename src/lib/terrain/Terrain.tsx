import { math } from "@/math";
import React from "react";
import * as THREE from "three";
import { Vector2 } from "three";
import create from "zustand";
import { $ } from "../../atoms";
import { NoiseGenerator, useNoiseGenerator } from "../noise";
import { LinearSpline } from "../spline";
import { NoisyHeightGenerator } from "./HeightGenerator";

const colors = {
  WHITE: new THREE.Color(0x808080),
  // OCEAN: new THREE.Color(0xd9d592),
  OCEAN: new THREE.Color("blue"),
  BEACH: new THREE.Color(0xd9d592),
  SNOW: new THREE.Color(0xffffff),
  FOREST_TROPICAL: new THREE.Color(0x4f9f0f),
  FOREST_TEMPERATE: new THREE.Color(0x2b960e),
  FOREST_BOREAL: new THREE.Color(0x29c100),
};

function getHyposemetricTints(
  {
    noiseGenerator,
    splines,
  }: {
    noiseGenerator: NoiseGenerator;
    splines: {
      arid: LinearSpline;
      humid: LinearSpline;
    };
  },
  x: number,
  y: number,
  z: number
) {
  const m = noiseGenerator.get(x, z);
  const h = y / 100.0;

  if (h < 0.05) {
    return colors.OCEAN;
  }

  const c1 = splines.arid.Get(h);
  const c2 = splines.humid.Get(h);
  return c1.lerpHSL(c2, m);
}

export function TerrainChunk({
  width,
  scale,
  offset,
  splines,
  material,
  biomeGenerator,
  heightGenerators,
}: {
  width: number;
  scale: number;
  offset: THREE.Vector3;
  biomeGenerator: NoiseGenerator;
  material: THREE.Material;
  splines: {
    arid: LinearSpline;
    humid: LinearSpline;
  };
  heightGenerators: NoisyHeightGenerator[];
}) {
  const size = React.useMemo(() => {
    return new THREE.Vector3(width * scale, 0, width * scale);
  }, [width, scale]);

  const object = React.useMemo(() => {
    const geometry = new THREE.Mesh(
      new THREE.PlaneGeometry(size.x, size.z, 128, 128),
      material
    );
    geometry.position.add(offset);
    geometry.receiveShadow = true;
    geometry.castShadow = false;
    geometry.material.vertexColors = true;
    return geometry;
  }, [size, offset, material]);

  React.useLayoutEffect(() => {
    let position = object.geometry.getAttribute("position");
    const colors = [];
    for (var i = 0; i < position.count; i++) {
      const heightPairs = [];
      let normalization = 0;
      let z = 0;
      let x = position.getX(i);
      let y = position.getY(i);

      for (let gen of heightGenerators) {
        heightPairs.push(gen.get(x + offset.x, y + offset.y));
        normalization += heightPairs[heightPairs.length - 1][1];
      }

      if (normalization > 0) {
        for (let h of heightPairs) {
          z += (h[0] * h[1]) / normalization;
        }
      }
      position.setZ(i, z);
      let color = getHyposemetricTints(
        { noiseGenerator: biomeGenerator, splines },
        x + offset.x,
        z,
        y + offset.y
      );
      colors.push(color.r, color.g, color.b);
    }
    object.geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3, true)
    );
    object.geometry.attributes.position.needsUpdate = true;
    object.geometry.computeBoundingBox();
    object.geometry.computeVertexNormals();
  }, [object, offset, heightGenerators]);
  return <primitive object={object} />;
}

function colorLerp(t: number, p0: THREE.Color, p1: THREE.Color) {
  const c = p0.clone();

  return c.lerpHSL(p1, t);
}

interface HyposemetricTintsParams {
  biomeGenerator: NoiseGenerator;
  splines: {
    arid: LinearSpline;
    humid: LinearSpline;
  };
}

export function Terrain({ chunkSize = 500 }) {
  const terrainNoise = useNoiseGenerator("terrain", {
    octaves: 6,
    persistence: 0.707,
    lacunarity: 1.8,
    exponentiation: 4.5,
    height: 300.0,
    scale: 1100.0,
    noiseType: "simplex",
  });

  const biomeNoise = useNoiseGenerator("biome", {
    octaves: 2,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 2048.0,
    noiseType: "simplex",
    exponentiation: 1,
    height: 1,
  });

  const splines = useHyposemetricTintsSplines();

  const material = React.useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
    });
  }, []);

  const chunks = React.useMemo(() => {
    const offset = new THREE.Vector3(0, 0, 0);
    const props = [
      {
        offset,
        heightGenerators: [new NoisyHeightGenerator(terrainNoise)],
      },
    ];
    return props;
  }, [terrainNoise]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {chunks.map((chunk, index) => (
        <TerrainChunk
          material={material}
          splines={splines}
          key={index}
          scale={1}
          biomeGenerator={biomeNoise}
          width={chunkSize}
          {...chunk}
        />
      ))}
    </group>
  );
}

class TerrainObject extends THREE.Group {
  constructor(chunkSize: any) {
    super();
  }
}

function useHyposemetricTintsSplines() {
  return React.useMemo(() => {
    const aridSpline = new LinearSpline(colorLerp);
    const humidSpline = new LinearSpline(colorLerp);

    // Arid
    aridSpline.AddPoint(0.0, new THREE.Color(0xb7a67d));
    aridSpline.AddPoint(0.5, new THREE.Color(0xf1e1bc));
    aridSpline.AddPoint(1.0, colors.SNOW);

    // Humid
    humidSpline.AddPoint(0.0, colors.FOREST_BOREAL);
    humidSpline.AddPoint(0.5, new THREE.Color(0xcee59c));
    humidSpline.AddPoint(1.0, colors.SNOW);

    return { arid: aridSpline, humid: humidSpline };
  }, []);
}
