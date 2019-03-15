var EPSILON = 0.0000001;
var MAX_DISTANCE = 10000000;

class Triangle {

    constructor(vertex1, vertex2, vertex3) {
        this.v0 = vertex1;
        this.v1 = vertex2;
        this.v2 = vertex3;
    }

    getNearestIntersection(rayOrigin, rayDirection) {
        let edge1 = this.v1.clone().add(this.v0.clone().negate());
        let edge2 = this.v2.clone().add(this.v0.clone().negate());
        let h = rayDirection.clone().cross(edge2.clone());
        let a = edge1.dot(h);
        if (a > -EPSILON && a < EPSILON) {
            return MAX_DISTANCE;
        }
        let f = 1.0 / a;
        let s = rayOrigin.clone().add(this.v0.clone().negate());
        let u = f * (s.dot(h));
        if (u < 0.0 || u > 1.0) {
            return MAX_DISTANCE;
        }
        let q = s.clone().cross(edge1.clone());
        let v = f * rayDirection.dot(q);
        if (v < 0.0 || u + v > 1.0) {
            return MAX_DISTANCE;
        }
        let t = f * edge2.dot(q);
        if (t > EPSILON) // ray intersection
        {
            return t;
        } else // This means that there is a line intersection but not a ray intersection.
        {
            return MAX_DISTANCE;
        }
    }
}
