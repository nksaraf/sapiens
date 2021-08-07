const _MIN_NODE_SIZE = 500;

interface QuadTreeUnit {
  bounds: THREE.Box2;
  children: QuadTreeUnit[];
  center: THREE.Vector2;
  size: THREE.Vector2;
}

class QuadTree {
  root: QuadTreeUnit;
  constructor(params: { min: THREE.Vector2; max: THREE.Vector2 }) {
    const b = new THREE.Box2(params.min, params.max);
    this.root = {
      bounds: b,
      children: [],
      center: b.getCenter(new THREE.Vector2()),
      size: b.getSize(new THREE.Vector2()),
    };
  }

  GetChildren() {
    const children: QuadTreeUnit[] = [];
    this.getChildrenRecursive(this.root, children);
    return children;
  }

  getChildrenRecursive(node: QuadTreeUnit, target: QuadTreeUnit[]) {
    if (node.children.length == 0) {
      target.push(node);
      return;
    }

    for (let c of node.children) {
      this.getChildrenRecursive(c, target);
    }
  }

  Insert(pos: THREE.Vector3) {
    this._Insert(this.root, new THREE.Vector2(pos.x, pos.z));
  }

  _Insert(child: QuadTreeUnit, pos: THREE.Vector2) {
    const distToChild = this._DistanceToChild(child, pos);

    if (distToChild < child.size.x && child.size.x > _MIN_NODE_SIZE) {
      child.children = this._CreateChildren(child);

      for (let c of child.children) {
        this._Insert(c, pos);
      }
    }
  }

  _DistanceToChild(child: QuadTreeUnit, pos: any) {
    return child.center.distanceTo(pos);
  }

  _CreateChildren(child: QuadTreeUnit) {
    const midpoint = child.bounds.getCenter(new THREE.Vector2());

    // Bottom left
    const b1 = new THREE.Box2(child.bounds.min, midpoint);

    // Bottom right
    const b2 = new THREE.Box2(
      new THREE.Vector2(midpoint.x, child.bounds.min.y),
      new THREE.Vector2(child.bounds.max.x, midpoint.y)
    );

    // Top left
    const b3 = new THREE.Box2(
      new THREE.Vector2(child.bounds.min.x, midpoint.y),
      new THREE.Vector2(midpoint.x, child.bounds.max.y)
    );

    // Top right
    const b4 = new THREE.Box2(midpoint, child.bounds.max);

    const children = [b1, b2, b3, b4].map((b) => {
      return {
        bounds: b,
        children: [],
        center: b.getCenter(new THREE.Vector2()),
        size: b.getSize(new THREE.Vector2()),
      };
    });

    return children;
  }
}
