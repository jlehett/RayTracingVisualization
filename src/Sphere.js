class Sphere {

    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }

    getIntersections(rayOrigin, rayDirection) {
        // Get intersections via geometric interpretation of a sphere. 
        let pc = this.center.clone().add(rayOrigin.clone().negate());
        let t = pc.clone().dot(rayDirection);
        let q = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(t));
        let cq = this.center.clone().add(q.clone().negate());
        if (Math.sqrt(cq.clone().dot(cq)) > this.radius)
            return [1000000, -1];
        let c = Math.sqrt(this.radius * this.radius - cq.clone().dot(cq));
        let pcp = pc.clone().add(rayOrigin.clone().negate());
        let di1 = Math.sqrt(pcp.clone().dot(pcp)) - c;
        let di2 = di1 + 2 * c;
        // This should return [di1, di2], but for testing, currently returns
        // the distance at which the ray projects onto the sphere.
        return [t, t];
    }
}