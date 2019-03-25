class GUI {

    constructor(mainWindow, inputTag) {
        this.displayIntersecting = true;
        this.gui = new dat.GUI();
        this.mainWindow = mainWindow;
        this.inputTag = inputTag;

        this.effectController = {
            edgeWidth: 0.01,
            frustumLength: 10,
            numRaysSent: 20
        };

        this.displayIntersecting = false;
        this.displayShadowRays = false;
        this.renderOutline = true;

        this.addFileSelectButton(this.inputTag);
        this.addRayTraceCameraButton();
        
        this.placeFolder = this.gui.addFolder("Place")
        this.addCameraPlaceButton();
        this.placeLightsFolder = this.placeFolder.addFolder("Lights");
        this.addPointLightPlaceButton();

        this.settingsFolder = this.gui.addFolder("Settings");
        this.cameraSettingsFolder = this.settingsFolder.addFolder("Camera Settings");
            this.addFrustumSlider();
            this.addNumRaysSlider();
        this.addEdgeWidthSlider();
        this.addOutlineToggle();
        this.addIntersectToggle();
        this.addShadowRayToggle();
    }

    addFrustumSlider() {
        var thisInstance = this;
        var mainWindow = this.mainWindow;
        this.cameraSettingsFolder.add(this.effectController, 'frustumLength', 1, 4000).name('Frustum Length').onChange(
            function() {
                mainWindow.cameraObj.farFrustum = thisInstance.effectController['frustumLength'];
                mainWindow.rayTraceCamera();
            }
        )
    }

    addNumRaysSlider() {
        var thisInstance = this;
        var mainWindow = this.mainWindow;
        this.cameraSettingsFolder.add(this.effectController, 'numRaysSent', 1, 100).name('Rays Sent').onChange(
            function() {
                mainWindow.cameraObj.imageHeight = Math.round(thisInstance.effectController['numRaysSent']);
                mainWindow.cameraObj.imageWidth = Math.round(thisInstance.effectController['numRaysSent']);
                mainWindow.rayTraceCamera();
            }
        )
    }

    addEdgeWidthSlider() {
        var thisInstance = this;
        this.settingsFolder.add(this.effectController, 'edgeWidth', 0.000001, 1.0).name('Edge Width').onChange(
            function() {
                thisInstance.mainWindow.changeEdgeSize(thisInstance.effectController.edgeWidth);
            }
        );
    }

    addFileSelectButton(inputTag) {
        // Given the id to the hidden input tag, create a GUI button for selecting files
        let params = {
            loadFile : function() {
                document.getElementById(inputTag).click();
            }
        };
        var mainWindow = this.mainWindow;
        document.getElementById(inputTag).addEventListener('change', function(evt) {
            let filename = evt.target.files[0].name;
            if (filename.includes('.json')) {
                filename = 'Bundles/' + filename;
                mainWindow.loadJSON(filename);
            } else if (filename.includes('.obj')) {
                filename = 'OBJ/' + filename;
                mainWindow.loadOBJ(filename);
            }
        }, false);
        this.gui.add(params, 'loadFile').name('Load File');
    }

    addCameraPlaceButton() {
        // Place the camera in the world.
        var mainWindow = this.mainWindow;
        let params = {
            placeCamera : function() {
                mainWindow.placeCameraMesh();
            }
        };
        this.placeFolder.add(params, 'placeCamera').name('Place Camera');
    }

    addPointLightPlaceButton() {
        // Place the point light in the world.
        var mainWindow = this.mainWindow;
        let params = {
            placePointLight : function() {
                mainWindow.placePointLight();
            }
        };
        this.placeLightsFolder.add(params, 'placePointLight').name('Place Point Light');
    }

    addRayTraceCameraButton() {
        // Ray trace the camera
        var mainWindow = this.mainWindow;
        var thisInstance = this;
        let params = {
            rayTraceCamera : function() {
                mainWindow.rayTraceCamera();
            }
        };
        this.gui.add(params, 'rayTraceCamera').name('Ray Trace Camera');
    }

    addIntersectToggle() {
        // Checkbox that allows you to select whether to draw intersecting rays or only
        // non-intersecting rays
        var mainWindow = this.mainWindow;
        var thisInstance = this;
        let params = {
            'Display Intersecting':this.displayIntersecting
        }
        this.settingsFolder.add(params, 'Display Intersecting').listen().onFinishChange(
            function() {
                thisInstance.displayIntersecting = params['Display Intersecting'];
                mainWindow.renderThis();
            }
        )
    }

    addShadowRayToggle() {
        // Checkbox that allows you to select whether to draw shadow rays or not
        var mainWindow = this.mainWindow;
        var thisInstance = this;
        let params = {
            'Display Shadow Rays':this.displayIntersecting
        }
        this.settingsFolder.add(params, 'Display Shadow Rays').listen().onFinishChange(
            function() {
                thisInstance.displayShadowRays = params['Display Shadow Rays'];
                mainWindow.renderThis();
            }
        )
    }

    addOutlineToggle() {
        // Checkbox that allows you to select whether to display objects in scene as outlines or solid
        var mainWindow = this.mainWindow;
        var thisInstance = this;
        let params = {
            'Render Outline':this.renderOutline
        }
        this.settingsFolder.add(params, 'Render Outline').listen().onFinishChange(
            function() {
                mainWindow.toggleOutlineRender();
                mainWindow.renderThis();
            }
        )
    }

}
