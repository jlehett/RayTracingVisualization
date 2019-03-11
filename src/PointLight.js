var MAX_DISTANCE = 10000000;

class PointLight {

    constructor(position) {
        this.position = position;
        this.mesh = this.createMesh();
    }

    createMesh() {
        let geometry = new THREE.SphereGeometry(0.1, 10, 10);
        geometry.translate(this.position.x, this.position.y, this.position.z);
        let mesh = new THREE.Mesh(geometry,
            new THREE.LineBasicMaterial({color:0xffffff})
        );
        return mesh;
    }

    getNearestIntersection(rayOrigin, rayDirection, objects) {
        // Get the default t value (if there is no intersection)
        let defaultT = this.position.clone().add(rayOrigin.clone().negate());
        defaultT = Math.sqrt(defaultT.dot(defaultT));
        // Keep track of the smallest t value (greater than zero)
        let smallestT = defaultT;
        // For every object in the scene, check if the ray intersects
        for (let i = 0; i < objects.length; i++) {
            let object = objects[i];
            let newT = object.getNearestIntersection(rayOrigin, rayDirection);
            if (newT >= 0 && newT < smallestT)
                smallestT = newT;
        }
        return smallestT;
    }
}
