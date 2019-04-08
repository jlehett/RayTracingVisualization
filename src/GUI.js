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

        this.displayIntersecting = true;
        this.intersectDots = true;
        this.displayShadowRays = true;
        this.renderOutline = true;
        this.displayPartial = false;
        this.displayObjects = true;

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
            this.displayFolder = this.settingsFolder.addFolder("Display");
                this.intersectFolder = this.displayFolder.addFolder("Intersecting");
                    this.addIntersectToggle();
                    this.addDotToggle();
                this.shadowFolder = this.displayFolder.addFolder("Shadow");
                    this.addShadowRayToggle();
                    this.addPartialToggle();
                this.objectsFolder = this.displayFolder.addFolder("Objects");
                    this.addDisplayObjectsToggle();
                    this.addOutlineToggle();
                    this.addEdgeWidthSlider();
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
        this.objectsFolder.add(this.effectController, 'edgeWidth', 0.000001, 1.0).name('Edge Width').onChange(
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
                mainWindow.placePointLight(
                    new THREE.Color(1.0, 1.0, 1.0),
                    1.0
                );
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
            'On':this.displayIntersecting
        }
        this.intersectFolder.add(params, 'On').listen().onFinishChange(
            function() {
                thisInstance.displayIntersecting = params['On'];
                mainWindow.renderThis();
            }
        )
    }

    addDisplayObjectsToggle() {
        // Checkbox that allows you to select whether to draw objects or not.
        var mainWindow = this.mainWindow;
        var thisInstance = this;
        let params = {
            'On': this.displayObjects
        }
        this.objectsFolder.add(params, 'On').listen().onFinishChange(
            function() {
                thisInstance.displayObjects = params['On'];
                mainWindow.renderThis();
            }
        )
    }

    addDotToggle() {
        // Checkbox that allows you to select whether to use dots or rays for intersection points
        var mainWindow = this.mainWindow;
        var thisInstance = this;
        let params = {
            'Dots':this.intersectDots
        }
        this.intersectFolder.add(params, 'Dots').listen().onFinishChange(
            function() {
                thisInstance.intersectDots = params['Dots'];
                mainWindow.renderThis();
            }
        )
    }

    addShadowRayToggle() {
        // Checkbox that allows you to select whether to draw shadow rays or not
        var mainWindow = this.mainWindow;
        var thisInstance = this;
        let params = {
            'On':this.displayIntersecting
        }
        this.shadowFolder.add(params, 'On').listen().onFinishChange(
            function() {
                thisInstance.displayShadowRays = params['On'];
                mainWindow.renderThis();
            }
        )
    }

    addPartialToggle() {
        // Checkbox that allows you to select whether to view blocked shadow rays or not
        var mainWindow = this.mainWindow;
        var thisInstance = this;
        let params = {
            'Partial':this.displayPartial
        }
        this.shadowFolder.add(params, 'Partial').listen().onFinishChange(
            function() {
                thisInstance.displayPartial = params['Partial'];
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
        this.objectsFolder.add(params, 'Render Outline').listen().onFinishChange(
            function() {
                mainWindow.toggleOutlineRender();
                mainWindow.renderThis();
            }
        )
    }

}
