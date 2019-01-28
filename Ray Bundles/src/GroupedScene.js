class GroupedScene {
    constructor() {
        this.rays = new THREE.Scene();
        this.objs = new THREE.Scene();
        this.innerMeshs = [];
        this.outerMeshs = [];

        this.lights = new THREE.Scene();
    }

    render() {

    }

    renderRays() {
        renderer.render(this.rays, camera);
    }

    renderThis() {
        renderer.clear();

        renderer.render(this.rays, camera);
        renderer.render(this.lights, camera);

        // Handle rendering of outlined meshs
        let gl = renderer.domElement.getContext('webgl');
        renderer.autoClear = false;
        let meshCount = this.innerMeshs.length;
        for (let i = 0; i < meshCount; i++) {
            let innerMesh = this.innerMeshs[i];
            let outerMesh = this.outerMeshs[i];

            gl.colorMask(false, false, false, false);
            renderer.render(innerMesh, camera);
            gl.colorMask(true, true, true, true);
            renderer.render(outerMesh, camera);
        }

    }

    addMeshs(innerMesh, outerMesh) {
        this.innerMeshs.push(innerMesh);
        this.outerMeshs.push(outerMesh);
    }
}
