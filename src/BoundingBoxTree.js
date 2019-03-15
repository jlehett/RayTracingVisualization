var MAX_DISTANCE = 10000000;

class BoundingBoxTree {

    constructor(numTriangles) {
        // Construct a BST style bounding box data structure for fast ray-triangle intersection detection.
        this.numTriangles = numTriangles;
        this.root = new BoundingBox(this.numTriangles);
    }

    addTriangle(v1, v2, v3) {
        // Add a triangle to the binary search tree (this call handles all placements appropriately)
        this.root.addTriangle(v1, v2, v3);
    }

    computeBoundingBoxes() {
        this.root.computeBoundingBox();
    }

    maxDepth() {
        return Math.ceil(Math.log2(this.numTriangles)) - 1;
    }

    createMesh(boundingBoxList) {
        this.createMeshHelper(boundingBoxList, this.maxDepth(), this.root, 0);
    }

    createMeshHelper(boundingBoxList, level, root, currentLevel) {
        if (currentLevel == level) {
            let width = root.vmax.x - root.vmin.x;
            let height = root.vmax.y - root.vmin.y;
            let depth = root.vmax.z - root.vmin.z;
            let center = new THREE.Vector3(root.vmin.x + width / 2.0, root.vmin.y + height / 2.0, root.vmin.z + depth / 2.0);
            let geometry = new THREE.BoxGeometry(width, height, depth);
            geometry.translate(center.x, center.y, center.z);
            let mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true, opacity: 0.05, transparent: true}));
            boundingBoxList.add(mesh);
            return;
        }
        this.createMeshHelper(boundingBoxList, level, root.left, currentLevel+1);
        this.createMeshHelper(boundingBoxList, level, root.right, currentLevel+1);
    }

    getNearestIntersection(rayOrigin, rayDirection) {
        return this.getNearestIntersectionHelper(rayOrigin, rayDirection, this.root);
    }

    getNearestIntersectionHelper(rayOrigin, rayDirection, root) {
        if (root instanceof BoundingBox) {
            if (!root.hasIntersection(rayOrigin, rayDirection))
                return MAX_DISTANCE;
            let leftMin = this.getNearestIntersectionHelper(rayOrigin, rayDirection, root.left);
            let rightMin = this.getNearestIntersectionHelper(rayOrigin, rayDirection, root.right);
            return Math.min(leftMin, rightMin);
        }
        if (root instanceof Triangle) {
            return root.getNearestIntersection(rayOrigin, rayDirection);
        }
        return MAX_DISTANCE;
    }
}