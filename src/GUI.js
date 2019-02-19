class GUI {

    constructor(mainWindow) {
        this.gui = new dat.GUI();
        this.mainWindow = mainWindow;

        this.effectController = {
            edgeWidth: 0.01
        };

        var thisInstance = this;

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

}
