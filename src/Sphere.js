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

        if (centerToTMagnitude <= this.radius)
            closeEnough = true;
        if (closeEnough)
            return this.center.clone().add(centerToT.negate());
        return this.center.clone();
    }
}
