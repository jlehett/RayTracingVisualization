var MAX_DISTANCE = 10000000;

class BoundingBox {

    constructor(numTrianglesHere) {
        // Construct a bounding box node for the BoundingBoxTree.
        this.maxX = -MAX_DISTANCE;
        this.maxY = -MAX_DISTANCE;
        this.maxZ = -MAX_DISTANCE;

        this.minX = MAX_DISTANCE;
        this.minY = MAX_DISTANCE;
        this.minZ = MAX_DISTANCE;

        this.vertices = [];

        this.numTrianglesHere = numTrianglesHere;
        this.numTrianglesLeft = Math.ceil(this.numTrianglesHere / 2);
        this.numTrianglesRight = this.numTrianglesHere - this.numTrianglesLeft;

        this.triangleCounter = 0;

        this.left = null;
        this.right = null;
        if (this.numTrianglesHere >= 2) {
            if (this.numTrianglesLeft == 1)
                this.left = new Triangle(null, null, null);
            else
                this.left = new BoundingBox(this.numTrianglesLeft);
            if (this.numTrianglesRight > 0) {
                if (this.numTrianglesRight == 1)
                    this.right = new Triangle(null, null, null);
                else
                    this.right = new BoundingBox(this.numTrianglesRight);
            }
        }
    }

    addTriangle(v1, v2, v3) {
        // Recursively add the specified triangle (given by the three vertices the make up the triangle)
        // to this bounding box node as well as either the left or right children (BST style)
        let vectorList = [v1, v2, v3];
        for (let i = 0; i < 3; i++) {
            let v = vectorList[i];
            if (v.x < this.minX) this.minX = v.x;
            if (v.y < this.minY) this.minY = v.y;
            if (v.z < this.minZ) this.minZ = v.z;

            if (v.x > this.maxX) this.maxX = v.x;
            if (v.y > this.maxY) this.maxY = v.y;
            if (v.z > this.maxZ) this.maxZ = v.z;
        }
        this.vertices.push(v1);
        this.vertices.push(v2);
        this.vertices.push(v3);

        if (this.numTrianglesHere != 1) {
            if (this.triangleCounter < this.numTrianglesLeft)
            {
                if (this.left instanceof Triangle)
                    this.left = new Triangle(v1, v2, v3);
                else
                    this.left.addTriangle(v1, v2, v3);
            } else {
                if (this.right instanceof Triangle)
                    this.right = new Triangle(v1, v2, v3);
                else
                    this.right.addTriangle(v1, v2, v3);
            }
        }
        
        this.triangleCounter++;
    }

    computeBoundingBox() {
        // Compute the bounding box by merging the min and max values into 2 separate vectors.
        this.vmin = new THREE.Vector3(this.minX, this.minY, this.minZ);
        this.vmax = new THREE.Vector3(this.maxX, this.maxY, this.maxZ);
        if (this.left && this.left instanceof BoundingBox)
            this.left.computeBoundingBox();
        if (this.right && this.right instanceof BoundingBox)
            this.right.computeBoundingBox();
    }

    hasIntersection(rayOrigin, rayDirection) {
        // Returns true if there is an intersection between the bounding box and the ray, false otherwise
        // Uses the slab computation method. See (https://tavianator.com/fast-branchless-raybounding-box-intersections/)
        let tmin = -MAX_DISTANCE, tmax = MAX_DISTANCE;

        if (rayDirection.x != 0.0) {
            let tx1 = (this.vmin.x - rayOrigin.x) / rayDirection.x;
            let tx2 = (this.vmax.x - rayOrigin.x) / rayDirection.x;

            tmin = Math.max(tmin, Math.min(tx1, tx2));
            tmax = Math.min(tmax, Math.max(tx1, tx2));
        }

        if (rayDirection.y != 0.0) {
            let ty1 = (this.vmin.y - rayOrigin.y) / rayDirection.y;
            let ty2 = (this.vmax.y - rayOrigin.y) / rayDirection.y;

            tmin = Math.max(tmin, Math.min(ty1, ty2));
            tmax = Math.min(tmax, Math.max(ty1, ty2));
        }

        if (rayDirection.z != 0.0) {
            let tz1 = (this.vmin.z - rayOrigin.z) / rayDirection.z;
            let tz2 = (this.vmax.z - rayOrigin.z) / rayDirection.z;

            tmin = Math.max(tmin, Math.min(tz1, tz2));
            tmax = Math.min(tmax, Math.max(tz1, tz2));
        }

        return tmax >= tmin;
    }
}
