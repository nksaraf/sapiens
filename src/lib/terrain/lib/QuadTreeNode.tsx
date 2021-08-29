import * as THREE from "three";
import { PlanetConfig } from "../components/Planet";

export class QuadTreeNode {
  resolution: number;
  localUp: THREE.Vector3;
  radius: number;
  axisA: THREE.Vector3;
  axisB: THREE.Vector3;
  parent?: QuadTreeNode;
  detailLevel: number;
  planetConfig: PlanetConfig;
  position: THREE.Vector3;
  children: QuadTreeNode[] = [];

  constructor(
    planetConfig: PlanetConfig,
    children: QuadTreeNode[],
    parent: QuadTreeNode | undefined,
    radius: number,
    detailLevel: number,
    position: THREE.Vector3,
    resolution: number,
    localUp: THREE.Vector3
  ) {
    this.resolution = resolution;
    this.localUp = localUp;
    this.radius = radius;
    this.position = position;
    this.children = children;
    this.detailLevel = detailLevel;
    this.planetConfig = planetConfig;
    this.parent = parent;
    this.axisA = new THREE.Vector3(localUp.y, localUp.z, localUp.x);
    this.axisB = localUp.clone().cross(this.axisA);
  }

  distanceToPlayer() {
    let distanceToPlayer = 100;

    return distanceToPlayer;
  }

  generateChildren() {
    // If the detail level is under max level and above 0. Max level depends on how many detail levels are defined in planets and needs to be changed manually.
    let distanceToPlayer = this.distanceToPlayer();

    if (this.detailLevel < this.planetConfig.detailLevelDistances.length &&
      this.detailLevel >= 0) {
      if (distanceToPlayer <=
        this.planetConfig.detailLevelDistances[this.detailLevel]) {
        // Assign the chunks children (grandchildren not included).
        // Position is calculated on a cube and based on the fact that each child has 1/2 the radius of the parent
        // Detail level is increased by 1. This doesn't change anything itself, but rather symbolizes that something HAS been changed (the detail).
        this.children = [
          new QuadTreeNode(
            this.planetConfig,
            [],
            this,
            this.radius / 2,
            this.detailLevel + 1,
            this.position
              .clone()
              .add(this.axisA.clone().multiplyScalar(this.radius / 2))
              .add(this.axisB.clone().multiplyScalar(this.radius / 2)),
            this.resolution,
            this.localUp
          ),
          new QuadTreeNode(
            this.planetConfig,
            [],
            this,
            this.radius / 2,
            this.detailLevel + 1,
            this.position
              .clone()
              .add(this.axisA.clone().multiplyScalar(this.radius / 2))
              .sub(this.axisB.clone().multiplyScalar(this.radius / 2)),
            this.resolution,
            this.localUp
          ),
          new QuadTreeNode(
            this.planetConfig,
            [],
            this,
            this.radius / 2,
            this.detailLevel + 1,
            this.position
              .clone()
              .sub(this.axisA.clone().multiplyScalar(this.radius / 2))
              .add(this.axisB.clone().multiplyScalar(this.radius / 2)),
            this.resolution,
            this.localUp
          ),
          new QuadTreeNode(
            this.planetConfig,
            [],
            this,
            this.radius / 2,
            this.detailLevel + 1,
            this.position
              .clone()
              .sub(this.axisA.clone().multiplyScalar(this.radius / 2))
              .sub(this.axisB.clone().multiplyScalar(this.radius / 2)),
            this.resolution,
            this.localUp
          ),
        ];

        // new QuadThreeChunk(planetScript, [], this, position + axisA * radius / 2 + axisB * radius / 2, radius / 2, detailLevel + 1, localUp, axisA, axisB), new QuadThreeChunk(planetScript, new Chunk[0], this, position + axisA * radius / 2 - axisB * radius / 2, radius / 2, detailLevel + 1, localUp, axisA, axisB), new QuadThreeChunk(planetScript, new Chunk[0], this, position - axisA * radius / 2 + axisB * radius / 2, radius / 2, detailLevel + 1, localUp, axisA, axisB), new QuadThreeChunk(planetScript, new Chunk[0], this, position - axisA * radius / 2 - axisB * radius / 2, radius / 2, detailLevel + 1, localUp, axisA, axisB)]
        this.children.forEach((child) => {
          child.generateChildren();
        });
      }
    }
  }

  getVisibleChildren() {
    let visibleChildren: QuadTreeNode[] = [];

    if (this.children.length > 0) {
      this.children.forEach((child) => {
        visibleChildren.push(...child.getVisibleChildren());
      });
    } else {
      return [this];
    }

    return visibleChildren;
  }

  updateChunk() {
    let distanceToPlayer = this.distanceToPlayer();

    // Vector3.Distance(
    //   planetScript.transform.TransformDirection(
    //     position.normalized * planetScript.size
    //   ) + planetScript.transform.position,
    //   planetScript.player.position
    // );
    if (this.detailLevel <= this.planetConfig.detailLevelDistances.length) {
      if (distanceToPlayer >
        this.planetConfig.detailLevelDistances[this.detailLevel]) {
        this.children = [];
      } else {
        if (this.children.length > 0) {
          this.children.forEach((child) => {
            child.updateChunk();
          });
        } else {
          this.generateChildren();
        }
      }
    }
  }
}
