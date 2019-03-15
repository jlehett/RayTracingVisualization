class MainWindow {
    // Handles rendering of rays and meshes (Aids rendering of outlined meshes)
    constructor() {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.autoClear = false;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.renderer.setClearColor(0x000000, 1);
        // Camera
        this.camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100000);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();
        var thisInstance = this;
        var renderFunction = this.renderThis;
        console.log(renderFunction);
        this.controls.addEventListener('change', function(){
            renderFunction(thisInstance);
        });
        // Resizing
        var thisInstance = this;
        window.addEventListener('resize', function() {
            thisInstance.camera.aspect = window.innerWidth / window.innerHeight;
            thisInstance.camera.updateProjectionMatrix();
            thisInstance.renderer.setSize(window.innerWidth, window.innerHeight);
            thisInstance.renderThis(thisInstance);
        }, false);
        // Rays
        this.rays = new THREE.Scene();
        this.cameraRays = new THREE.Scene();
        this.shadowRays = new THREE.Scene();
        // Inner mesh and outer meshes are rendered in two separate passes to give
        // transparent effect.
        this.innerMeshes = new THREE.Scene();
        this.outerMeshes = new THREE.Scene();
        // Crease mesh is rendered in yet another pass.
        this.creaseMeshes = new THREE.Scene();

        // Objects for ray intersection detection
        this.objects = [];

        // Settings for rendering outline
        this.renderOutline = true;

        // Lights
        this.pointLights = [];
        this.pointLightScene = new THREE.Scene();

        // Involved in initial placement and zoom of the camera within the scene.
        this.minCoords = new THREE.Vector3(null, null, null);
        this.maxCoords = new THREE.Vector3(null, null, null);
        // Boolean flag that tells obj whether any meshes have been added to the scene.
        // (Allows the first mesh placed in scene to become the baseline bounding box)
        this.targetAvailable = false;

        // MATERIALS

        // Basic 3D Mesh material (Used by inner mesh in outlined mesh rendering)
        this.inMaterial = new THREE.RawShaderMaterial( {
            uniforms: {
                color: {type: "v3", value: new THREE.Vector3(1, 0, 1)},
            },
            vertexShader: document.getElementById('vertexShaderIn').textContent,
            fragmentShader: document.getElementById('fragmentShaderIn').textContent,
        });

        // Crease 3D Mesh material
        this.creaseMaterial = new THREE.RawShaderMaterial( {
            vertexShader: document.getElementById('vertexShaderCrease').textContent,
            fragmentShader: document.getElementById('fragmentShaderCrease').textContent
        });

        // Outline 3D Mesh material (Used by outer mesh in outlined mesh rendering)
        this.outMaterial = new THREE.RawShaderMaterial( {
            uniforms: {
                color: {type: "v3", value: new THREE.Vector3( 1, 0, 1 ) },
                edgeWidth: {type: "float", value: 0.01}
            },
            side:THREE.BackSide,
            vertexShader: document.getElementById('vertexShaderOut').textContent,
            fragmentShader: document.getElementById('fragmentShaderOut').textContent
        });
    }

    rayTraceCamera(displayIntersect, displayShadowRays) {
        // Ray trace the current camera obj
        this.intersectingCameraRays = [];
        this.cameraRays = new THREE.Scene();
        let cameraMesh = this.cameraObj.getRayTracedCameraMesh(this.objects, displayIntersect);
        let cameraOutlineMesh = this.cameraObj.getCameraOutlineMesh();
        this.cameraRays.add(cameraMesh);
        this.cameraRays.add(cameraOutlineMesh);
        if (displayShadowRays)
            this.rayTracePointLights();
        this.renderThis();
    }

    rayTracePointLights() {
        // Ray trace all point lights to intersecting camera rays
        this.shadowRays = new THREE.Scene();
        for (let i = 0; i < this.pointLights.length; i++) {
            let pointLight = this.pointLights[i];
            this.rayTracePointLight(pointLight);
        }
        this.renderThis();
    }

    rayTracePointLight(pointLight) {
        // Ray trace the intersecting camera rays to a point light
        let rayMesh = this.cameraObj.getPointLightMesh(pointLight, this.objects);
        this.shadowRays.add(rayMesh);
    }

    toggleOutlineRender() {
        this.renderOutline = !this.renderOutline;
    }

    setCamera(cameraObj) {
        // Setup camera by introducing orbit controls.
        this.cameraObj = cameraObj;
        this.camera = cameraObj.camera;
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();
        var thisInstance = this;
        var renderFunction = this.renderThis;
        this.controls.addEventListener('change', function(){
            renderFunction(thisInstance);
        });
    }

    placeCameraMesh() {
        // Place camera mesh wherever the camera currently is in the world.
        this.cameraRays = new THREE.Scene();
        let cameraMesh = this.cameraObj.getCameraMesh();
        let cameraOutlineMesh = this.cameraObj.getCameraOutlineMesh();
        this.cameraRays.add(cameraMesh);
        this.cameraRays.add(cameraOutlineMesh);
        this.renderThis();
    }

    placePointLight() {
        // Place point light wherever the camera currently is in the world.
        let position = this.cameraObj.getMainCameraPos();
        let pointLight = new PointLight(position);
        let pointLightMesh = pointLight.mesh;
        this.pointLights.push(pointLight);
        this.pointLightScene.add(pointLightMesh);
        this.renderThis();
    }

    renderThis(thisInstance=null) {
        console.log("rendering");
        if (thisInstance == null)
            thisInstance = this;
        thisInstance.renderer.clear();

        // Render all rays first
        thisInstance.renderer.render(thisInstance.cameraRays, thisInstance.camera);
        thisInstance.renderer.render(thisInstance.shadowRays, thisInstance.camera);
        thisInstance.renderer.render(thisInstance.pointLightScene, thisInstance.camera);
        thisInstance.renderer.render(thisInstance.rays, thisInstance.camera);

        // Render the outlined meshes using colorMask technique
        let gl = thisInstance.renderer.domElement.getContext('webgl');
        thisInstance.renderer.autoClear = false;
        if (thisInstance.renderOutline)
            gl.colorMask(false, false, false, false);
        else
            gl.colorMask(true, true, true, true);
        thisInstance.renderer.render(thisInstance.innerMeshes, thisInstance.camera);
        gl.colorMask(true, true, true, true);
        if (thisInstance.renderOutline)
            thisInstance.renderer.render(thisInstance.outerMeshes, thisInstance.camera);

        // Render the crease meshes
        //this.renderer.render(this.creaseMeshes, this.camera);
    }

    getCameraTarget() {
        // Return the center of the scene's bounding box. If no bounding box exists, set
        // center to Vector3(0, 0, 0)
        let center = new THREE.Vector3(0, 0, 0);
        if (this.minCoords.x != null) {
            center.add(this.minCoords);
            center.add(this.maxCoords);
            center.multiplyScalar(0.5);
        }
        return center;
    }

    updateSceneBox(mesh) {
        // Update the scene's bounding box by checking if the input mesh will increase the
        // current bounding box
        mesh.geometry.computeBoundingBox();

        // If a mesh has yet to be added, this mesh's bounding box becomes the current
        // bounding box.
        if (this.targetAvailable == false) {
            this.minCoords = mesh.geometry.boundingBox.min;
            this.maxCoords = mesh.geometry.boundingBox.max;
            this.targetAvailable = true;
            return;
        }
        // Checks if the current mesh would update the scene's bounding box in any way
        if (this.minCoords.x < mesh.geometry.boundingBox.min.x) this.minCoords.x = mesh.geometry.boundingBox.min.x;
        if (this.minCoords.y < mesh.geometry.boundingBox.min.y) this.minCoords.y = mesh.geometry.boundingBox.min.y;
        if (this.minCoords.z < mesh.geometry.boundingBox.min.z) this.minCoords.z = mesh.geometry.boundingBox.min.z;
        if (this.maxCoords.x > mesh.geometry.boundingBox.max.x) this.maxCoords.x = mesh.geometry.boundingBox.max.x;
        if (this.maxCoords.y > mesh.geometry.boundingBox.max.y) this.maxCoords.y = mesh.geometry.boundingBox.max.y;
        if (this.maxCoords.z > mesh.geometry.boundingBox.max.z) this.maxCoords.z = mesh.geometry.boundingBox.max.z;
    }

    addMeshes(innerMesh, outerMesh, creaseMesh) {
        // Add a mesh to the scene. This will add them to the rendering pipeline as well as
        // automatically update the scene's bounding box if needed.
        this.updateSceneBox(outerMesh);
        this.innerMeshes.add(innerMesh);
        this.outerMeshes.add(outerMesh);
        this.creaseMeshes.add(creaseMesh);
    }

    addRays(lineMesh) {
        // Add a ray bundle to the scene (or any line mesh). This will add them to the
        // rendering pipeline as well as automatically update the scene's bounding box if needed.
        this.updateSceneBox(lineMesh);
        this.rays.add(lineMesh);
    }

    loadRayBundles(json, sf=1.0) {
        var thisInstance = this;
        // Load in ray bundles from JSON. Add each ray in bundle to scene's rays group.
        json.rayBundles.forEach(function(item, index, array) {
            // Generate random color in HSL format
            let h = Math.floor(Math.random() * 360);
            let s = Math.floor(Math.random() * 50 + 50);
            let l = Math.floor(Math.random() * 25 + 50);
            let length = item.length;
            let material = new THREE.LineBasicMaterial({color: new THREE.Color("hsl("+h+","+s+"%,"+l+"%)")});
            // Construct line segment geometry and mesh, then add to scene
            let geometry = new THREE.Geometry();
            for (let i=0; i < length; i+=6) {
                geometry.vertices.push(new THREE.Vector3(item[i]*sf, item[i+1]*sf, item[i+2]*sf),
                                       new THREE.Vector3(item[i+3]*sf, item[i+4]*sf, item[i+5]*sf));
            }
            let rayMesh = new THREE.LineSegments(geometry, material);
            thisInstance.addRays(rayMesh);
        });
    }

    loadSphereGeometries(object) {
        // Load spheres from JSON. Add each sphere to scene's meshes group.
        for (let i = 0; i < object.quadruples.length; i += 4) {
            // Quadruple: xPos, yPos, zPos, radius

            // Color only has 3 values per sphere while quad has 4 values per sphere.
            let colorIndex = i * 3 / 4;
            // Construct material based off outline material. Need to clone outline material because
            // we will be changing its color for each sphere. No need to change color of inner material.
            let localoutMaterial = this.outMaterial.clone();
            let localinMaterial = this.inMaterial.clone();
            localoutMaterial.uniforms.color.value.set(object.color[colorIndex]/255, object.color[colorIndex+1]/255, object.color[colorIndex+2]/255);
            localinMaterial.uniforms.color.value.set(object.color[colorIndex]/255, object.color[colorIndex+1]/255, object.color[colorIndex+2]/255);
            // Construct sphere geometry and translate to proper position.
            let geometry = new THREE.SphereGeometry(object.quadruples[i+3], 50, 50);
            geometry.translate(object.quadruples[i], object.quadruples[i+1], object.quadruples[i+2]);
            // Create separate meshes for outlining algorithm and add them to their respective scenes.
            let innerMesh = new THREE.Mesh(geometry, localinMaterial);
            let outerMesh = new THREE.Mesh(geometry, localoutMaterial);
            let creaseMesh = new THREE.Mesh(geometry, this.creaseMaterial);
            this.addMeshes(innerMesh, outerMesh, creaseMesh);
            // Create sphere object for ray intersection detection
            this.objects.push(new Sphere(
                new THREE.Vector3(object.quadruples[i], object.quadruples[i+1], object.quadruples[i+2]),
                object.quadruples[i+3]
            ));
        }
    }

    loadTriangleMeshGeometries(object) {
        // Load triangle meshes from JSON. Add each triangle to scene's meshes group.
        let colorIndex = 0;
        // Vertices are stored in a 2D array where each row is a new mesh.
        // Each row is a 1D array that contains 3n floating values for x, y, z, vertice positions.
        //
        // Faces are stored in a 2D array where each row is a new mesh.
        // Each row is a 1D array that contains 3n int values for vertex indices to connect.
        for (let meshIndex = 0; meshIndex < object.vertices.length; meshIndex++) {
            // Get vertex and face arrays for the current mesh.
            let meshVertices = object.vertices[meshIndex];
            let meshFaces = object.faces[meshIndex];

            // Construct geometry based on vertex and face information.
            let geometry = new THREE.Geometry();
            for (let vertexIndex = 0; vertexIndex < meshVertices.length; vertexIndex += 3) {
                let v1 = meshVertices[vertexIndex];
                let v2 = meshVertices[vertexIndex+1];
                let v3 = meshVertices[vertexIndex+2];
                geometry.vertices.push(new THREE.Vector3(v1, v2, v3));
            }
            for (let faceIndex = 0; faceIndex < meshFaces.length; faceIndex += 3) {
                let f1 = meshFaces[faceIndex];
                let f2 = meshFaces[faceIndex+1];
                let f3 = meshFaces[faceIndex+2];
                geometry.faces.push(new THREE.Face3(f1, f2, f3));
            }

            // Compute normals for use in outlining algorithm.
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            // Construct material based off outline material. Need to clone outline material because
            // we will be changing its color for each sphere. No need to change color of inner material.
            let localoutMaterial = this.outMaterial.clone();
            let localinMaterial = this.inMaterial.clone();
            localoutMaterial.uniforms.color.value.set(object.color[colorIndex]/255, object.color[colorIndex+1]/255, object.color[colorIndex+2]/255);
            localinMaterial.uniforms.color.value.set(object.color[colorIndex]/255, object.color[colorIndex+1]/255, object.color[colorIndex+2]/255);
            // Create separate meshes for outlining algorithm and add them to their respective scenes.
            let innerMesh = new THREE.Mesh(geometry, localinMaterial);
            let outerMesh = new THREE.Mesh(geometry, localoutMaterial);
            let creaseMesh = new THREE.Mesh(geometry, this.creaseMaterial);
            this.addMeshes(innerMesh, outerMesh, creaseMesh);

            // Create triangle object for ray intersection detection
            for (let i = 0; i < geometry.vertices.length-2; i++) {
                this.objects.push(new Triangle(geometry.vertices[i], geometry.vertices[i+1], geometry.vertices[i+2]));
            }

            // Color index needs to be bumped up by 3 for next mesh (each mesh has r, g, b values for color)
            colorIndex += 3;
        }
    }

    loadScene(json) {
        var thisInstance = this;
        // Load in scene definitions from JSON. Each type of mesh defined by item.type will
        // be handled in a separate helper function.
        json.scene.forEach(function(item, index, array) {

            if (item.type == "spheres") {
                thisInstance.loadSphereGeometries(item);
            }

            if (item.type == "triangles") {
                thisInstance.loadTriangleMeshGeometries(item);
            }
        });
    }

    loadJSON(file) {
        // Load json file and add rays and objects to rendering pipeline.
        this.readTextFile(file, function(text, thisInstance) {
            // Load scene definitions
            let myObj = JSON.parse(text);
            thisInstance.loadRayBundles(myObj, 1.0);
            thisInstance.loadScene(myObj);
            // Set orbit controls center to scene center.
            let targetVec = thisInstance.getCameraTarget();
            thisInstance.controls.target.set(targetVec.x, targetVec.y, targetVec.z);
            thisInstance.controls.update();
            // Zoom camera by 3x the range of the scene's bounding box z-coords.
            thisInstance.camera.position.set(targetVec.x, targetVec.y, (thisInstance.maxCoords.z-thisInstance.minCoords.z)*3.0);
            thisInstance.renderThis();
        });
    }

    loadOBJ(file) {
        var thisInstance = this;
        // Load obj file and add object to scene's objs group.
        let loader = new THREE.OBJLoader();
        loader.load(
            file,
            function(object) {
                object.traverse(function(child) {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.computeFaceNormals();
                        child.geometry.computeVertexNormals();
                        let positions = child.geometry.attributes.position.array;
                        let innerMesh = new THREE.Mesh(child.geometry, thisInstance.inMaterial);
                        let outerMesh = new THREE.Mesh(child.geometry, thisInstance.outMaterial);
                        let creaseMesh = new THREE.Mesh(child.geometry, thisInstance.creaseMaterial);
                        thisInstance.addMeshes(innerMesh, outerMesh, creaseMesh);
                        for (let i = 0; i < positions.length; i += 9) {
                            let v1 = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
                            let v2 = new THREE.Vector3(positions[i+3], positions[i+4], positions[i+5]);
                            let v3 = new THREE.Vector3(positions[i+6], positions[i+7], positions[i+8]);
                            thisInstance.objects.push(new Triangle(v1, v2, v3));
                        }
                    }
                });
                // Set orbit controls center to scene center.
                let targetVec = thisInstance.getCameraTarget();
                thisInstance.controls.target.set(targetVec.x, targetVec.y, targetVec.z);
                thisInstance.controls.update();
                // Zoom camera by 3x the range of the scene's bounding box z-coords.
                thisInstance.camera.position.set( targetVec.x, targetVec.y, (thisInstance.maxCoords.z-thisInstance.minCoords.z)*3.0 );
                thisInstance.renderThis();
            },
            function(xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.log('An error happened');
            }
        );
    }

    readTextFile(file, callback) {
        var thisInstance = this;
        // Read in JSON file.
        var rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", file, true);
        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4 && rawFile.status == "200") {
                callback(rawFile.responseText, thisInstance);
            }
        }
        rawFile.send(null);
    }

    changeEdgeSize(size) {
        // Outline 3D Mesh material (Used by outer mesh in outlined mesh rendering)
        this.outMaterial.uniforms['edgeWidth'].value = size;
        this.renderThis();
    }

}
