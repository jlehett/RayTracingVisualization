class IntersectionInfo {

    constructor(distance, normal, intersectPoint, material) {
        let INTERSECT_PUSH_BACK = 0.002;

        this.distance = distance;
        this.normal = normal;
        if (intersectPoint == undefined)
            this.intersectPoint = new THREE.Vector3(0, 0, 0);
        this.intersectPoint = intersectPoint.clone().add(this.normal.clone().multiplyScalar(INTERSECT_PUSH_BACK));
        this.material = new Lambert(material.color);
    }

    applyDarkness(color) {
        this.material.color = color;
    }

    calculateLighting(pointLight) {
        this.material.calculateLighting(pointLight, this);
    }
}
