

class Metaball {

    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }

    getInfluence(point) {
        return this.radius / this.center.distanceTo(point);
    }
}

class Metaballs {

    constructor(material) {
        this.metaballList = [];
        this.marchingStep = 0.5;
        this.minInfluence = 0.1;
        this.maxBinarySearchDepth = 5;
        this.material = material;
    }

    addMetaBall(center, radius) {
        this.metaballList.push(new Metaball(center, radius));
    }

    getIntersectionInformation(rayOrigin, rayDirection, farFrustum) {
        let distance = this.getNearestIntersection(rayOrigin, rayDirection, farFrustum);

        let point = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(distance));
        let normal = new THREE.Vector3(0, 0, 0);

        return new IntersectionInfo(distance, normal, point, this.material);
    }

    getNearestIntersection(rayOrigin, rayDirection, farFrustum) {
        // Ray marching
        let prev = 0.0;
        let next = prev + this.marchingStep;
        let influence;

        // March ray until find point with influence > minInfluence
        do {
            influence = 0.0;
            let point = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(next));
            for (let i = 0; i < this.metaballList.length; i++) {
                influence += this.metaballList[i].getInfluence(point);
            }
            prev = next;
            next = prev + this.marchingStep;
        } while (influence < this.minInfluence && next < farFrustum);

        if (next >= farFrustum)
            return farFrustum;

        // From there, binary search until point where the minInfluence is still reached is found
        let binarySearchDepth = 0;
        let left = prev;
        let right = next;
        let middle = (left + right) / 2.0;
        do {
            let influence = 0.0;
            let point = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(next));
            for (let i = 0; i < this.metaballList.length; i++)
                influence += this.metaballList[i].getInfluence(point);
            if (influence < this.minInfluence)
                left = middle;
            else if (influence > this.minInfluence)
                right = middle;
            binarySearchDepth++;
            middle = (left + right) / 2.0;
        } while (binarySearchDepth < this.maxBinarySearchDepth);

        return middle;
    }
}