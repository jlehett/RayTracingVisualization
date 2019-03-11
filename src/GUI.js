class GUI {

    constructor(mainWindow) {
        this.displayIntersecting = true;
        this.gui = new dat.GUI();
        this.mainWindow = mainWindow;

        this.effectController = {
            edgeWidth: 0.01
        };

        var thisInstance = this;

        this.displayIntersecting = false;
        this.displayShadowRays = false;
        this.renderOutline = true;

        // Edge width slider
        this.gui.add(this.effectController, 'edgeWidth', 0.000001, 1.0).name('Edge Width').onChange(
            function() {
                thisInstance.mainWindow.changeEdgeSize(thisInstance.effectController.edgeWidth);
            });
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
        this.gui.add(params, 'placeCamera').name('Place Camera');
    }

    addPointLightPlaceButton() {
        // Place the point light in the world.
        var mainWindow = this.mainWindow;
        let params = {
            placePointLight : function() {
                mainWindow.placePointLight();
            }
        };
        this.gui.add(params, 'placePointLight').name('Place Point Light');
    }

    addRayTraceCameraButton() {
        // Ray trace the camera
        var mainWindow = this.mainWindow;
        var thisInstance = this;
        let params = {
            rayTraceCamera : function() {
                mainWindow.rayTraceCamera(thisInstance.displayIntersecting, thisInstance.displayShadowRays);
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
        this.gui.add(params, 'Display Intersecting').listen().onFinishChange(
            function() {
                thisInstance.displayIntersecting = params['Display Intersecting'];
                mainWindow.rayTraceCamera(thisInstance.displayIntersecting, thisInstance.displayShadowRays);
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
        this.gui.add(params, 'Display Shadow Rays').listen().onFinishChange(
            function() {
                thisInstance.displayShadowRays = params['Display Shadow Rays'];
                mainWindow.rayTraceCamera(thisInstance.displayIntersecting, thisInstance.displayShadowRays);
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
        this.gui.add(params, 'Render Outline').listen().onFinishChange(
            function() {
                mainWindow.toggleOutlineRender();
                mainWindow.renderThis();
            }
        )
    }

}
