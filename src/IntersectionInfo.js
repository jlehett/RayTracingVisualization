class IntersectionInfo {

    constructor(distance, normal, intersectPoint) {
        let INTERSECT_PUSH_BACK = 0.2;

        this.distance = distance;
        this.normal = normal;
        if (intersectPoint == undefined)
            intersectPoint = new THREE.Vector3(0, 0, 0);
        this.intersectPoint = intersectPoint.clone().add(this.normal.clone().multiplyScalar(INTERSECT_PUSH_BACK));
    }
}
