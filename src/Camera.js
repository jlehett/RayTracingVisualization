class Camera {

    constructor() {
        this.imageWidth = 10;
        this.imageHeight = 10;
        this.fov = 36;
        this.aspect = 1.0;
        this.nearFrustum = 0.01;
        this.farFrustum = 10;
        this.position = new THREE.Vector3(0, 0, 0);
        this.updateCamera();
    }

    updateCamera() {
        this.camera = new THREE.PerspectiveCamera(this.fov, window.innerWidth / window.innerHeight, 0.01, 100000);
    }

    setResolution(width, height) {
        this.imageWidth = width;
        this.imageHeight = height;
    }

    setFarFrustum(distance) {
        this.farFrustum = distance;
        this.updateCamera();
    }

    setNearFrustum(distance) {
        this.nearFrustum = distance;
        this.updateCamera();
    }

    setFOV(fov) {
        this.fov = fov;
        this.updateCamera();
    }

    setAspect(aspect) {
        this.aspect = aspect;
        this.updateCamera();
    }

    placeCamera() {
        // Place the camera at the THREE.Vector3 position
        this.position = this.camera.position.clone();
        this.quaternion = this.camera.quaternion.clone();
    }

    getCameraDirection() {
        // Returns a normalized direction vector for where the camera is currently facing.
        let vector = new THREE.Vector3(0, 0, -1);
        vector.applyQuaternion(this.camera.quaternion);
        return this.camera.getWorldDirection(vector).normalize();
    }

    createRayTracedCameraGeometry(objects) {
        // Create the camera geometry for the raytraced camera.

        let rayOrigin = this.position.clone();
        // Create camera (line segments) geometry
        let cameraGeometry = new THREE.Geometry();
        // Allows access to camera obj in the forEach function
        let thisInstance = this;
        // For every ray
        for (let x = 0; x < this.imageWidth; x++) {
            for (let y = 0; y < this.imageHeight; y++) {
                // Set nearest intersection to farFrustum (default length of ray)
                let nearestIntersection = this.farFrustum;
                // Find ray direction (and apply camera quaternion for proper orientation)
                let scale = Math.tan(this.fov * 0.5 * Math.PI / 180.0);
                let Px = (2.0 * (x + 0.5) / this.imageWidth - 1.0) * this.aspect * scale;
                let Py = (1.0 - 2.0 * (y + 0.5) / this.imageHeight) * scale;
                let rayDirection = new THREE.Vector3(Px, Py, -1);
                rayDirection.applyQuaternion(this.quaternion);
                // For every object in scene
                objects.forEach(function(node) {
                    let intersectionDistance;

                    // If the object is a sphere
                    if (node instanceof Sphere) {
                        intersectionDistance = node.getNearestIntersection(rayOrigin.clone(), rayDirection.clone().normalize());
                    }

                    // Update nearest intersection if necessary
                    if (nearestIntersection > intersectionDistance)
                        nearestIntersection = intersectionDistance;
                });
                // Append the ray origin and the point on the ray with a distance equal to nearest intersection
                // distance to the line segments geometry.
                let revisedRayDirection;
                if (nearestIntersection == this.farFrustum)
                    revisedRayDirection = rayDirection.clone();
                else
                    revisedRayDirection = rayDirection.clone();
                cameraGeometry.vertices.push(rayOrigin.clone().add(revisedRayDirection.clone().multiplyScalar(this.nearFrustum)));
                cameraGeometry.vertices.push(rayOrigin.clone().add(revisedRayDirection.clone().multiplyScalar(nearestIntersection)));
            }
        }
        // Return the line segments geometry
        return cameraGeometry;
    }

    getRayTracedCameraMesh(objects) {
        // Returns a raytraced mesh for the camera at the position it was last placed.
        let geometry = this.createRayTracedCameraGeometry(objects);
        let cameraMesh = new THREE.LineSegments(geometry,
            new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:1}));
        return cameraMesh;
    }

    getCameraMesh() {
        // Place the camera mesh wherever the camera currently is in the world.
        let cameraPos = this.camera.position.clone();
        this.placeCamera();
        let geometry = this.createCameraGeometry(cameraPos);
        let cameraMesh = new THREE.LineSegments(geometry,
            new THREE.LineBasicMaterial({color:0xffffff}));
        return cameraMesh;
    }

    createCameraGeometry(position, direction) {
        // Create the camera geometry for initial placement of camera (not raytraced).
        let cameraGeometry = new THREE.Geometry();
        let scale = Math.tan( this.fov * 0.5 * Math.PI / 180.0 );
        for (let x = 0; x < this.imageWidth; x++) {
            for (let y = 0; y < this.imageHeight; y++) {
                let Px = (2.0 * (x + 0.5) / this.imageWidth - 1.0) * this.aspect * scale;
                let Py = (1.0 - 2.0 * (y + 0.5) / this.imageHeight) * scale;
                let rayDirection = new THREE.Vector3(Px, Py, -1);
                rayDirection.applyQuaternion(this.camera.quaternion);
                cameraGeometry.vertices.push(position.clone().add(rayDirection.clone().multiplyScalar(this.nearFrustum)));
                cameraGeometry.vertices.push(position.clone().add(rayDirection.clone().multiplyScalar(this.farFrustum)));
            }
        }
        return cameraGeometry;
    }
}
