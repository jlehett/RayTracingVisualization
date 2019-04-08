

class Lambert {

    constructor(color) {
        this.color = new THREE.Color(color.r, color.g, color.b);
    }

    calculateLighting(pointLight, intersectInfo) {
        let L = intersectInfo.intersectPoint.clone().negate().add(pointLight.position);
        L = L.normalize();
        let intensityDiffuse = L.dot(intersectInfo.normal) * pointLight.intensity;
        if (intensityDiffuse > 1.0)
            console.log(intensityDiffuse);
        let intensityR = intensityDiffuse * pointLight.color.r;
        let intensityG = intensityDiffuse * pointLight.color.g;
        let intensityB = intensityDiffuse * pointLight.color.b;
        let r = Math.min(this.color.r + intensityR, 1.0);
        let g = Math.min(this.color.g + intensityG, 1.0);
        let b = Math.min(this.color.b + intensityB, 1.0);
        this.color = new THREE.Color(r, g, b);
    }
}