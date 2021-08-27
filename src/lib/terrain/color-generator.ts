import { math } from "@/math";
import { NoiseGenerator, NoiseParams } from "@/noise";
import { LinearSpline } from "@/spline";
import * as THREE from "three";

export const COLORS = {
  WHITE: new THREE.Color(0x808080),
  // OCEAN: new THREE.Color(0xd9d592),
  OCEAN: new THREE.Color("blue"),
  BEACH: new THREE.Color(0xd9d592),
  SNOW: new THREE.Color(0xffffff),
  FOREST_TROPICAL: new THREE.Color(0x4f9f0f),
  FOREST_TEMPERATE: new THREE.Color(0x2b960e),
  FOREST_BOREAL: new THREE.Color(0x29c100),
  DEEP_OCEAN: new THREE.Color(0x20020FF),
  SHALLOW_OCEAN: new THREE.Color(0x8080FF),

};

export interface ColorGenerator<T extends object = object> {
  getColor(x: number, y: number, z: number): THREE.Color;
  params: T;
}

export class FixedColourGenerator implements ColorGenerator {
  params: { color: THREE.Color; };
  constructor(params: { color: THREE.Color }) {
    this.params = params;
  }
  getColor() {
    return this.params.color;
  }
}


function colorLerp(t: number, p0: THREE.Color, p1: THREE.Color) {
  const c = p0.clone();
  return c.lerp(p1, t);
};


export interface TextureSplatterRawParams {
  biomeNoiseGenerator: NoiseGenerator
  colorNoiseGenerator: NoiseGenerator
}

export interface TextureSplatterParams extends TextureSplatterRawParams {
  splines: {
    ocean: LinearSpline,
    arid: LinearSpline,
    humid: LinearSpline,
  }
  minElevation: number;
  maxElevation: number
}

export class HyposymetricTintsGenerator implements ColorGenerator<{
  biomeNoiseGenerator: NoiseParams;
}> {
  _params: TextureSplatterParams;
  constructor(params: Partial<TextureSplatterRawParams>) {
    // Arid
    const aridSpline = new LinearSpline(colorLerp);
    aridSpline.AddPoint(0.0, new THREE.Color(0xb7a67d));
    aridSpline.AddPoint(0.5, new THREE.Color(0xf1e1bc));
    aridSpline.AddPoint(1.0, COLORS.SNOW);

    // Humid
    const humidSpline = new LinearSpline(colorLerp);
    humidSpline.AddPoint(0.0, COLORS.FOREST_BOREAL);
    humidSpline.AddPoint(0.5, new THREE.Color(0xcee59c));
    humidSpline.AddPoint(1.0, COLORS.SNOW);


    // Ocean
    const oceanSpline = new LinearSpline(colorLerp);
    oceanSpline.AddPoint(0.0, COLORS.DEEP_OCEAN);
    oceanSpline.AddPoint(0.03, COLORS.SHALLOW_OCEAN);
    oceanSpline.AddPoint(0.05, COLORS.SHALLOW_OCEAN);

    this._params = params as TextureSplatterParams;
    this._params.splines = {
      ocean: oceanSpline,
      arid: aridSpline,
      humid: humidSpline,
    };
  }

  getColor(x: any, y: any, height: number) {
    const m = this._params.biomeNoiseGenerator.get(x, y, height);
    const h = math.sat(height);

    const c1 = this._params.splines.arid.Get(h);
    const c2 = this._params.splines.humid.Get(h);

    let c = c1.lerp(c2, m);

    if (h < 0.1) {
      return this._params.splines.ocean.Get(h)
    }
    return c;
  }

  get params() {
    return {
      biomeNoiseGenerator: this._params.biomeNoiseGenerator.params
    }
  }
}

// export class TextureSplatter implements ColorGenerator {
//   params: TextureSplatterParams;
//   constructor(params: Partial<TextureSplatterRawParams>) {
//     // Arid
//     const aridSpline = new LinearSpline(colorLerp);
//     aridSpline.AddPoint(0.0, new THREE.Color(0xb7a67d));
//     aridSpline.AddPoint(0.5, new THREE.Color(0xf1e1bc));
//     aridSpline.AddPoint(1.0, COLORS.SNOW);

//     // Humid
//     const humidSpline = new LinearSpline(colorLerp);
//     humidSpline.AddPoint(0.0, COLORS.FOREST_BOREAL);
//     humidSpline.AddPoint(0.5, new THREE.Color(0xcee59c));
//     humidSpline.AddPoint(1.0, COLORS.SNOW);


//     // Ocean
//     const oceanSpline = new LinearSpline(colorLerp);
//     oceanSpline.AddPoint(0.0, COLORS.DEEP_OCEAN);
//     oceanSpline.AddPoint(0.03, COLORS.SHALLOW_OCEAN);
//     oceanSpline.AddPoint(0.05, COLORS.SHALLOW_OCEAN);

//     this.params = params as TextureSplatterParams;
//     this.params.splines = {
//       ocean: oceanSpline,
//       arid: aridSpline,
//       humid: humidSpline,
//     };

//   }

//   getBaseColor(x: any, y: any, height: number) {
//     const m = this.params.biomeNoiseGenerator.get(x, y, height);
//     const h = math.sat(height);

//     const c1 = this.params.splines.arid.Get(h);
//     const c2 = this.params.splines.humid.Get(h);

//     let c = c1.lerp(c2, m);

//     if (h < 0.1) {
//       c = this.params.splines.ocean.Get(h);

//     }
//     return c;
//   }

//   getColor(x: number, y: number, height: number) {
//     const c = this.getBaseColor(x, y, height);
//     const r = this.params.colorNoiseGenerator.get(x, y, height) * 2.0 - 1.0;
//     c.offsetHSL(0.0, 0.0, r * 0.01);
//     return c;
//   }

//   getSplat(x: number, y: number, height: number) {
//     const m = this.params.biomeNoiseGenerator.get(x, y, height);
//     const h = height / 100.0;

//     const types = {
//       dirt: { index: 0, strength: 0.0 },
//       grass: { index: 1, strength: 0.0 },
//       gravel: { index: 2, strength: 0.0 },
//       rock: { index: 3, strength: 0.0 },
//       snow: { index: 4, strength: 0.0 },
//       snowrock: { index: 5, strength: 0.0 },
//       cobble: { index: 6, strength: 0.0 },
//       sandyrock: { index: 7, strength: 0.0 },
//     };

//     type TerrainType = keyof typeof types;

//     function applyWeights(dst: TerrainType, v: number, m: number) {
//       for (let k in types) {
//         types[k as TerrainType].strength *= m;
//       }
//       types[dst].strength = v;
//     };

//     types.grass.strength = 1.0;
//     applyWeights('gravel', 1.0 - m, m);

//     if (h < 0.2) {
//       const s = 1.0 - math.sat((h - 0.1) / 0.05);
//       applyWeights('cobble', s, 1.0 - s);

//       if (h < 0.1) {
//         const s = 1.0 - math.sat((h - 0.05) / 0.05);
//         applyWeights('sandyrock', s, 1.0 - s);
//       }
//     } else {
//       if (h > 0.125) {
//         const s = (math.sat((h - 0.125) / 1.25));
//         applyWeights('rock', s, 1.0 - s);
//       }

//       if (h > 1.5) {
//         const s = math.sat((h - 0.75) / 2.0);
//         applyWeights('snow', s, 1.0 - s);
//       }
//     }

//     // In case nothing gets set.
//     types.dirt.strength = 0.01;

//     let total = 0.0;
//     for (let k in types) {
//       total += types[k as TerrainType].strength;
//     }
//     if (total < 0.01) {
//       const a = 0;
//     }
//     const normalization = 1.0 / total;

//     for (let k in types) {
//       types[k as TerrainType].strength / normalization;
//     }

//     return types;
//   }
// }