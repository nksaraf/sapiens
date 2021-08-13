import { NoiseGenerator } from "@/noise";

export class FixedHeightGenerator implements HeightGenerator {
  constructor() { }
  get(x: number, y: number, z: number = 0): [number, number] {
    return [50, 1];
  }
}

export interface HeightGenerator {
  get(x: number, y: number, z?: number): [number, number];
}

export class NoisyHeightGenerator implements HeightGenerator {
  noiseGenerator: NoiseGenerator;
  constructor(noiseGenerator?: NoiseGenerator) {
    this.noiseGenerator = noiseGenerator ?? new NoiseGenerator();
  }
  get(x: number, y: number, z?: number): [number, number] {
    return [this.noiseGenerator.get(x, y, z), 1];
  }

  get params() {
    return this.noiseGenerator.params;
  }
}
