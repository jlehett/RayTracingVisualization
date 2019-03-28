var EPSILON = 0.0000001;
var MAX_DISTANCE = 10000000;

class Triangle {

    constructor(vertex1, vertex2, vertex3) {
        this.v0 = vertex1;
        this.v1 = vertex2;
        this.v2 = vertex3;
    }

    precompute() {
        if (!this.negativeV0) {
            this.negativeV0 = this.v0.clone().negate();
            this.edge1 = this.negativeV0.clone().add(this.v1);
            this.edge2 = this.negativeV0.clone().add(this.v2);
            this.normal = (this.negativeV0.clone().add(this.v1)).cross(this.negativeV0.clone().add(this.v2));
        }
    }

    getIntersectionInformation(rayOrigin, rayDirection)
    {
        this.precompute();

        let distance = this.getNearestIntersection(rayOrigin, rayDirection);
        let normal = this.normal;
        let intersectPoint = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(distance));

        return new IntersectionInfo(distance, normal, intersectPoint);
    }

    getNearestIntersection(rayOrigin, rayDirection) {
        this.precompute();

        let h = rayDirection.clone().cross(this.edge2);
        let a = this.edge1.dot(h);
        if (a > -EPSILON && a < EPSILON) {
            return MAX_DISTANCE;
        }
        let f = 1.0 / a;
        let s = this.negativeV0.clone().add(rayOrigin);
        let u = f * (s.dot(h));
        if (u < 0.0 || u > 1.0) {
            return MAX_DISTANCE;
        }
        let q = s.cross(this.edge1);
        let v = f * rayDirection.dot(q);
        if (v < 0.0 || u + v > 1.0) {
            return MAX_DISTANCE;
        }
        let t = f * this.edge2.dot(q);
        if (t > EPSILON) // ray intersection
        {
            return t;
        } else // This means that there is a line intersection but not a ray intersection.
        {
            return MAX_DISTANCE;
        }
    }
}
