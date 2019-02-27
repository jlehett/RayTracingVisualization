var MAX_DISTANCE = 10000000;

class Sphere {

    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }

    getNearestIntersection(rayOrigin, rayDirection) {
        let closeEnough = false;
        // Get the vector going from ray origin to sphere center
        let originToCenter = this.center.clone().add(rayOrigin.clone().negate());
        // Find the parameter, t, required to get to the point on the ray closest to the sphere
        let t = originToCenter.dot(rayDirection);
        // Find the vector representing point t on the ray
        let tVector = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(t));
        // Get the vector going from center of sphere to point t
        let centerToT = this.center.clone().add(tVector.clone().negate());
        // Get magnitude of centerToT
        let centerToTMagnitude = Math.sqrt(centerToT.dot(centerToT));

        // If the magnitude of the vector from t to circle center is greater than the circle radius,
        // the ray does not intersect the circle.
        if (centerToTMagnitude > this.radius)
            return MAX_DISTANCE;

        // Find t1 (first intersection point)
        let originToT = tVector.clone().add(rayOrigin.clone().negate());
        let originToTMagnitude = Math.sqrt(originToT.dot(originToT));
        let c = Math.sqrt(this.radius*this.radius - centerToTMagnitude);
        let di1 = originToTMagnitude + c;

        return t;
    }
}
