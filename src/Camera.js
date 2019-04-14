class Camera {

    constructor() {
        this.imageWidth = 20;
        this.imageHeight = 20;
        this.fov = 36;
        this.aspect = 1.0;
        this.nearFrustum = 0.001;
        this.farFrustum = 10;
        this.position = new THREE.Vector3(0, 0, 0);
        this.updateCamera();

        this.intersectInfoList = [];

        this.intersectingDotScene = new THREE.Scene();
        this.intersectingScene = new THREE.Scene();
        this.nonintersectingScene = new THREE.Scene();
        this.blockedShadowScene = new THREE.Scene();
        this.unblockedShadowScene = new THREE.Scene();

        this.background = new THREE.Color(0.2, 0.2, 0.2);
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
        console.log(this.imageHeight, this.imageWidth);
    }

    getCameraDirection() {
        // Returns a normalized direction vector for where the camera is currently facing.
        let vector = new THREE.Vector3(0, 0, -1);
        vector.applyQuaternion(this.camera.quaternion);
        return this.camera.getWorldDirection(vector).normalize();
    }

    createRayTracedCameraGeometry(objects) {
        // Create the camera geometry for the raytraced camera.
        this.intersectingScene = new THREE.Scene();
        this.nonintersectingScene = new THREE.Scene();

        this.intersectInfoList = [];

        let rayOrigin = this.position.clone();
        // Create camera (line segments) geometry
        let intersectingGeometry = new THREE.Geometry();
        let nonintersectingGeometry = new THREE.Geometry();
        // Allows access to camera obj in the forEach function
        let thisInstance = this;
        // Precompute some variables
        let scale = Math.tan(this.fov * 0.5 * Math.PI / 180.0);
        // For every ray
        for (let x = 0; x < this.imageWidth; x++) {
            for (let y = 0; y < this.imageHeight; y++) {
                let nearestIntersectInfo = new IntersectionInfo(this.farFrustum, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new Lambert(new THREE.Color(0, 0, 0)));
                // Find ray direction (and apply camera quaternion for proper orientation)
                let Px = (2.0 * (x + 0.5) / this.imageWidth - 1.0) * this.aspect * scale;
                let Py = (1.0 - 2.0 * (y + 0.5) / this.imageHeight) * scale;
                let rayDirection = new THREE.Vector3(Px, Py, -1);
                var farFrustum = this.farFrustum
                rayDirection.applyQuaternion(this.quaternion);
                // For every object in scene
                objects.forEach(function(node) {
                    let intersectInfo;

                    // If the object is a sphere
                    if (node instanceof Sphere) {
                        intersectInfo = node.getIntersectionInformation(rayOrigin.clone(), rayDirection.clone().normalize());
                    }
                    
                    if (node instanceof Triangle) {
                        intersectInfo = node.getIntersectionInformation(rayOrigin.clone(), rayDirection.clone().normalize());
                    }

                    if (node instanceof BoundingBoxTree) {
                        intersectInfo = node.getIntersectionInformation(rayOrigin.clone(), rayDirection.clone().normalize());
                    }

                    if (node instanceof Metaballs) {
                        intersectInfo = node.getIntersectionInformation(rayOrigin.clone(), rayDirection.clone().normalize(), farFrustum);
                    }

                    // Update nearest intersection if necessary 
                    if (nearestIntersectInfo.distance > intersectInfo.distance && intersectInfo.distance > thisInstance.nearFrustum) {
                        nearestIntersectInfo = intersectInfo;
                    }
                });
                // Append the ray origin and the point on the ray with a distance equal to nearest intersection
                // distance to the line segments geometry.
                if (nearestIntersectInfo.distance >= this.farFrustum) {
                    let nonintersectingPoint = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(this.farFrustum));
                    nonintersectingGeometry.vertices.push(rayOrigin.clone().add(rayDirection.clone().multiplyScalar(this.nearFrustum)));
                    nonintersectingGeometry.vertices.push(nonintersectingPoint);
                } else {
                    intersectingGeometry.vertices.push(rayOrigin.clone().add(rayDirection.clone().multiplyScalar(this.nearFrustum)));
                    intersectingGeometry.vertices.push(nearestIntersectInfo.intersectPoint.clone());
                    this.intersectInfoList.push(nearestIntersectInfo);
                }
            }
        }

        let material = new THREE.MeshBasicMaterial({color: 0xffffff});
        this.intersectingScene.add(new THREE.LineSegments(intersectingGeometry, material));
        this.nonintersectingScene.add(new THREE.LineSegments(nonintersectingGeometry, material));

        this.applyBackgroundColor();
    }

    applyBackgroundColor() {
        for (let i = 0; i < this.intersectInfoList.length; i++) {
            let intersectInfo = this.intersectInfoList[i];
            let color = intersectInfo.material.color;
            let darkColor = new THREE.Color(color.r * this.background.r, color.g * this.background.g, color.b * this.background.b);
            intersectInfo.applyDarkness(darkColor);
        }
    }

    createIntersectScene() {
        let scene = new THREE.Scene();

        for (let i = 0; i < this.intersectInfoList.length; i++) {
            let intersectInfo = this.intersectInfoList[i];
            let material = new THREE.MeshBasicMaterial({color: intersectInfo.material.color});
            let center = intersectInfo.intersectPoint;
            //let geometry = new THREE.CircleGeometry(0.005, 10);
            let geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
            geometry.lookAt(intersectInfo.normal);
            geometry.translate(center.x, center.y, center.z);
            let disc = new THREE.Mesh(geometry, material);
            scene.add(disc);
        }

        return scene;
    }

    createCameraOutlineGeometry() {
        // Creates the outline geometry of the camera (the boundaries of the camera rays)
        let closePoints = [], farPoints = []
        let cameraGeometry = new THREE.Geometry();
        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 2; y++) {
                let rayOrigin = this.position.clone();
                let scale = Math.tan(this.fov * 0.5 * Math.PI / 180.0) * 2.0;
                let Px = (2.0 * (x + 0.5) / 2.0 - 1.0) * this.aspect * scale;
                let Py = (1.0 - 2.0 * (y + 0.5) / 2.0) * scale;
                let rayDirection = new THREE.Vector3(Px, Py, -1);
                rayDirection.applyQuaternion(this.quaternion);
                let closePoint = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(this.nearFrustum));
                let farPoint = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(this.farFrustum));
                closePoints.push(closePoint);
                farPoints.push(farPoint);
                cameraGeometry.vertices.push(closePoint);
                cameraGeometry.vertices.push(farPoint);
            }
        }
        cameraGeometry.vertices.push(closePoints[0]);
        cameraGeometry.vertices.push(closePoints[1]);
        cameraGeometry.vertices.push(farPoints[0]);
        cameraGeometry.vertices.push(farPoints[1]);
        
        cameraGeometry.vertices.push(closePoints[0]);
        cameraGeometry.vertices.push(closePoints[2]);
        cameraGeometry.vertices.push(farPoints[0]);
        cameraGeometry.vertices.push(farPoints[2]);
        
        cameraGeometry.vertices.push(closePoints[2]);
        cameraGeometry.vertices.push(closePoints[3]);
        cameraGeometry.vertices.push(farPoints[2]);
        cameraGeometry.vertices.push(farPoints[3]);

        cameraGeometry.vertices.push(closePoints[1]);
        cameraGeometry.vertices.push(closePoints[3]);
        cameraGeometry.vertices.push(farPoints[1]);
        cameraGeometry.vertices.push(farPoints[3]);
        
        return cameraGeometry;
    }

    getPointLightMesh(pointLight, objects) {
        // Returns the shadow ray mesh for a given point light
        let geometry = this.createPointLightGeometry(pointLight, objects);
        let pointLightMesh = new THREE.LineSegments(geometry, 
            new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:1.0}));
        return pointLightMesh;
    }

    getCameraOutlineMesh() {
        // Returns the outline mesh of the camera (the boundaries of the camera rays)
        let geometry = this.createCameraOutlineGeometry();
        let cameraMesh = new THREE.LineSegments(geometry,
            new THREE.LineBasicMaterial({color:0xff0000}));
        return cameraMesh;
    }

    getRayTracedCameraMesh(objects, displayIntersect, intersectingList) {
        // Returns a raytraced mesh for the camera at the position it was last placed.
        let geometry = this.createRayTracedCameraGeometry(objects, displayIntersect, intersectingList);
        let cameraMesh = new THREE.LineSegments(geometry,
            new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:1.0}));
        return cameraMesh;
    }

    getCameraMesh(objects) {
        // Place the camera mesh wherever the camera currently is in the world.
        this.placeCamera();
        this.createRayTracedCameraGeometry(objects);
    }

    getMainCameraPos() {
        // Get the position of the viewing camera (NOT a placed camera)
        return this.camera.position.clone();
    }

    updateShadowRays(pointLight, objects) {
        let blockedShadowGeometry = new THREE.Geometry();
        let unblockedShadowGeometry = new THREE.Geometry();
        for (let i = 0; i < this.intersectInfoList.length; i++) {
            let cameraIntersectingPoint = this.intersectInfoList[i].intersectPoint;
            let rayDirection = pointLight.position.clone().add(cameraIntersectingPoint.clone().negate()).normalize();
            let t = pointLight.getNearestIntersection(cameraIntersectingPoint, rayDirection, objects);
            if (!pointLight.hasIntersection(t, cameraIntersectingPoint)) {
                unblockedShadowGeometry.vertices.push(cameraIntersectingPoint.clone());
                unblockedShadowGeometry.vertices.push(cameraIntersectingPoint.clone().add(rayDirection.multiplyScalar(t)));
                // Add to intersecting dot scene
                let intersectInfo = this.intersectInfoList[i];
                intersectInfo.calculateLighting(pointLight);
            } else {
                blockedShadowGeometry.vertices.push(cameraIntersectingPoint.clone());
                blockedShadowGeometry.vertices.push(cameraIntersectingPoint.clone().add(rayDirection.multiplyScalar(t)));
            }
        }
        let material = new THREE.LineBasicMaterial({color:pointLight.color});
        let unblockedShadowMesh = new THREE.LineSegments(unblockedShadowGeometry, material);
        let blockedShadowMesh = new THREE.LineSegments(blockedShadowGeometry, material);

        this.blockedShadowScene.add(blockedShadowMesh);
        this.unblockedShadowScene.add(unblockedShadowMesh);
    }

    createPointLightGeometry(pointLight, objects) {
        // Create the shadow ray geometry for the given point light.
        let shadowRayGeometry = new THREE.Geometry();
        for (let i = 0; i < this.intersectingList.length; i++) {
            let cameraIntersectingPoint = this.intersectingList[i];
            let rayDirection = pointLight.position.clone().add(cameraIntersectingPoint.clone().negate()).normalize();
            let t = pointLight.getNearestIntersection(cameraIntersectingPoint, rayDirection, objects);
            shadowRayGeometry.vertices.push(cameraIntersectingPoint.clone());
            shadowRayGeometry.vertices.push(cameraIntersectingPoint.clone().add(rayDirection.multiplyScalar(t)));
        }
        return shadowRayGeometry;
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
