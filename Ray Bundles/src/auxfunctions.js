// Adds a line to the scene's rays group.
function line(p1, p2, c) {
  let material = new THREE.LineBasicMaterial({color: c});
  let geometry = new THREE.Geometry();
  geometry.vertices.push(p1, p2);
  let line = new THREE.Line(geometry, material);
  scene.rays.add(line);
}

// Load in ray bundles from json. Add each ray in bundle to scene's rays group.
function loadRayBundles(json, sf=1.0) {
    json.rayBundles.forEach(function(item, index, array) {
        let h = Math.random() * 360;
        let s = Math.random() * 50 + 50;
        let l = Math.random() * 25 + 50;
        let color = hslToHex(h, s, l);
        let length = item.length;
        for (let i=0; i < length; i+=6) {
          line(new THREE.Vector3(item[i]*sf, item[i+1]*sf, item[i+2]*sf),
               new THREE.Vector3(item[i+3]*sf, item[i+4]*sf, item[i+5]*sf),
               color);
        }
    });
}

// Load a sphere from json
function loadSphereGeometries(object, shader) {
    for (let i = 0; i < object.quadruples.length; i += 4) {
        // Set up material and shader
        let colorIndex = i * 3 / 4;
        let color = rgbToHex(object.colors[colorIndex], object.colors[colorIndex+1], object.colors[colorIndex+2]);
        let outline = new THREE.MeshLambertMaterial({emissive:color, side:THREE.BackSide});
        outline.onBeforeCompile = (shader) => {
            const token = `#include <begin_vertex>`;
            const customTransform = `vec3 transformed = position + objectNormal * 0.02;`;
            shader.vertexShader = shader.vertexShader.replace(token, customTransform);
        };

        let geometry = new THREE.SphereGeometry(object.quadruples[i+3]/4.0, 50, 50);
        geometry.translate(object.quadruples[i], object.quadruples[i+1], object.quadruples[i+2]);
        let innerMesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial());
        let outerMesh = new THREE.Mesh(geometry, outline);
        scene.addMeshs(innerMesh, outerMesh);
    }
}

// Load a triangle mesh from JSON
function loadTriangleMeshGeometries(object, shader) {
    let colorIndex = 0;
    for (let meshIndex = 0; meshIndex < object.vertices.length; meshIndex++) {
        let meshVertices = object.vertices[meshIndex];
        let meshFaces = object.faces[meshIndex];
        // Set up material and shader
        let color = rgbToHex(object.colors[colorIndex], object.colors[colorIndex+1], object.colors[colorIndex+2]);
        let outline = new THREE.MeshLambertMaterial({emissive:color, side:THREE.BackSide});
        outline.onBeforeCompile = (shader) => {
            const token = `#include <begin_vertex>`;
            const customTransform = `vec3 transformed = position + objectNormal * 0.02;`;
            shader.vertexShader = shader.vertexShader.replace(token, customTransform);
        };

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

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        let innerMesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial());
        let outerMesh = new THREE.Mesh(geometry, outline);
        console.log(innerMesh.geometry.faces);
        scene.addMeshs(innerMesh, outerMesh);
        colorIndex += 3;
    }
}

// MODIFY!
function loadScene(json) {
    let geometry;
    let shader = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent
    });
    json.scene.forEach(function(item, index, array) {

        if (item.type == "sphere") {
            loadSphereGeometries(item, shader);
        }

        if (item.type == "triangles") {
            loadTriangleMeshGeometries(item, shader);
        }
    });
}

// Converts hsl color representation to hex for easier drawing.
function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  let hexString = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  let hex = parseInt(hexString.replace(/^#/, ''), 16);
  return hex;
}

// Read in JSON file.
function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// Load obj file and add object to scene's objs group.
function loadObj(file) {
    let loader = new THREE.OBJLoader();
    loader.load(
        file,
        function(object) {
            let material = new THREE.MeshLambertMaterial({color: 0x00ff00, transparent: true, opacity: 0.0});
            object.material = material;
            let outlineMaterial = new THREE.MeshBasicMaterial({color:0xff0000, side:THREE.BackSide});
            let outlineMesh = new THREE.Mesh(object.geometry, outlineMaterial);

            scene.add(object);
        },
        function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function(error) {
            console.log('An error happened');
        }
    );
}
