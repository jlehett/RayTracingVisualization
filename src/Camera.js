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

        this.intersectingList = [];
        this.intersectInfoList = [];
        this.intersectingPushBack = 0.01; // This affects how far intersecting vertices are pushed back from where they intersect (to help with shadow rays)

        this.intersectingDotScene = new THREE.Scene();
        this.intersectingScene = new THREE.Scene();
        this.nonintersectingScene = new THREE.Scene();
        this.blockedShadowScene = new THREE.Scene();
        this.unblockedShadowScene = new THREE.Scene();
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
        this.intersectingList = [];

        let rayOrigin = this.position.clone();
        // Create camera (line segments) geometry
        let intersectingGeometry = new THREE.Geometry();
        let nonintersectingGeometry = new THREE.Geometry();
        // Allows access to camera obj in the forEach function
        let thisInstance = this;
        // For every ray
        for (let x = 0; x < this.imageWidth; x++) {
            for (let y = 0; y < this.imageHeight; y++) {
                let nearestIntersectInfo = new IntersectionInfo(0, new THREE.Vector3(0, 0, 0));
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
                    let intersectInfo;

                    // If the object is a sphere
                    if (node instanceof Sphere) {
                        intersectInfo = node.getIntersectionInformation(rayOrigin.clone(), rayDirection.clone().normalize());
                        intersectionDistance = intersectInfo.distance;
                    }
                    
                    if (node instanceof Triangle) {
                        intersectInfo = node.getIntersectionInformation(rayOrigin.clone(), rayDirection.clone().normalize());
                        intersectionDistance = intersectInfo.distance;
                    }

                    if (node instanceof BoundingBoxTree) {
                        intersectInfo = node.getIntersectionInformation(rayOrigin.clone(), rayDirection.clone().normalize());
                        intersectionDistance = intersectInfo.distance;
                    }

                    // Update nearest intersection if necessary 
                    if (nearestIntersection > intersectionDistance && intersectionDistance > thisInstance.nearFrustum) {
                        nearestIntersection = intersectionDistance;
                        nearestIntersectInfo = intersectInfo;
                    }
                });
                // Append the ray origin and the point on the ray with a distance equal to nearest intersection
                // distance to the line segments geometry.
                if (nearestIntersection >= this.farFrustum) {
                    let nonintersectingPoint = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(this.farFrustum));
                    nonintersectingGeometry.vertices.push(rayOrigin.clone().add(rayDirection.clone().multiplyScalar(this.nearFrustum)));
                    nonintersectingGeometry.vertices.push(nonintersectingPoint);
                } else {
                    //console.log(nearestIntersectInfo);
                    nearestIntersection -= this.intersectingPushBack;
                    if (nearestIntersection < 0)
                        nearestIntersection = 0;
                    let intersectionPoint = rayOrigin.clone().add(rayDirection.clone().normalize().multiplyScalar(nearestIntersection));
                    intersectingGeometry.vertices.push(rayOrigin.clone().add(rayDirection.clone().multiplyScalar(this.nearFrustum)));
                    intersectingGeometry.vertices.push(intersectionPoint);
                    nearestIntersectInfo.setIntersectionPoint(intersectionPoint);
                    this.intersectingList.push(intersectionPoint);
                    this.intersectInfoList.push(nearestIntersectInfo);
                }
            }
        }

        let material = new THREE.MeshBasicMaterial({color: 0xffffff});
        this.intersectingScene.add(new THREE.LineSegments(intersectingGeometry, material));
        this.nonintersectingScene.add(new THREE.LineSegments(nonintersectingGeometry, material));

        // Create sphere geometry for intersection viewing
        this.intersectingDotScene = this.createIntersectingScene();
    }

    createIntersectingScene() {
        // Create the sphere intersection scene
        let scene = new THREE.Scene();

        let material = new THREE.MeshBasicMaterial({color: 0xffffff});
        for (let i = 0; i < this.intersectInfoList.length; i++) {
            let intersectInfo = this.intersectInfoList[i];
            let center = intersectInfo.intersectPoint;
            let geometry = new THREE.CircleGeometry(0.01, 5);
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
        for (let i = 0; i < this.intersectingList.length; i++) {
            let cameraIntersectingPoint = this.intersectingList[i];
            let rayDirection = pointLight.position.clone().add(cameraIntersectingPoint.clone().negate()).normalize();
            let t = pointLight.getNearestIntersection(cameraIntersectingPoint, rayDirection, objects);
            if (!pointLight.hasIntersection(t, cameraIntersectingPoint)) {
                unblockedShadowGeometry.vertices.push(cameraIntersectingPoint.clone());
                unblockedShadowGeometry.vertices.push(cameraIntersectingPoint.clone().add(rayDirection.multiplyScalar(t)));
            } else {
                blockedShadowGeometry.vertices.push(cameraIntersectingPoint.clone());
                blockedShadowGeometry.vertices.push(cameraIntersectingPoint.clone().add(rayDirection.multiplyScalar(t)));
            }
        }
        let material = new THREE.LineBasicMaterial({color:0xffffff});
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
