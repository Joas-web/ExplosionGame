// --- 1. KONFIGURATION ---
const MODELS_TO_LOAD = {
    box: 'box.glb',
    db2g: 'DB2g.glb', 
    sc628g: 'Untitled.glb'
};

const OBJECT_TYPES = {
    box: { 
        size: [1, 1, 1], color: 0xd2b48c, mass: 2, type: "box", 
        isExplosive: false, scale: 0.7 
    },
    db2g: { 
        size: [0.1, 0.6, 0.1], color: 0x222222, mass: 0.5, type: "cylinder", 
        isExplosive: true, timer: 2000, power: 10, radius: 5, shockwaveScale: 2, scale: 5
    },
    db5g: { 
        size: [0.11, 0.5, 0.11], color: 0x222222, mass: 1.0, type: "cylinder", 
        isExplosive: true, timer: 2000, power: 25, radius: 10, shockwaveScale: 4,
    },
    bb8g: { 
        size: [0.12, 0.6, 0.12], color: 0x222222, mass: 1.0, type: "cylinder", 
        isExplosive: true, timer: 2000, power: 40, radius: 18, shockwaveScale: 5 
    },
    sc628g: { 
        size: [0.13, 0.7, 0.13], color: 0x222222, mass: 1.0, type: "cylinder", 
        isExplosive: true, timer: 2000, power: 120, radius: 25, hasFuse: true, 
        scale: 0.2, shockwaveScale: 8 
    },
    db650g: { 
        size: [0.2, 1.0, 0.2], color: 0x222222, mass: 1.2, type: "cylinder", 
        isExplosive: true, timer: 2000, power: 2500, radius: 40, 
        scale: 0.3, shockwaveScale: 18 
    }
};

let mode = "box";
const meshes = [];
const bodies = [];
const loadedModels = {}; 

// --- 2. THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const basePos = new THREE.Vector3(0, 8, 12); 
camera.position.copy(basePos);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// --- 3. LOADER ---
const loader = new THREE.GLTFLoader();
Object.entries(MODELS_TO_LOAD).forEach(([key, url]) => {
    loader.load(url, (gltf) => {
        loadedModels[key] = gltf.scene;
    });
});

// --- 4. PHYSIK SETUP ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const groundMesh = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 40), new THREE.MeshPhongMaterial({ color: 0x555555 }));
groundMesh.position.y = -0.5;
scene.add(groundMesh);

const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(20, 0.5, 20)) });
groundBody.position.set(0, -0.5, 0);
world.addBody(groundBody);

// --- 5. FUNKTIONEN ---
function spawnObject(type, x, y, z) {
    const config = OBJECT_TYPES[type];
    if (!config) return;

    let mesh, shape, body;

    if (loadedModels[type]) {
        mesh = loadedModels[type].clone();
        if (config.scale) mesh.scale.set(config.scale, config.scale, config.scale);
    } else {
        const geo = config.type === "box" ? new THREE.BoxGeometry(...config.size) : new THREE.CylinderGeometry(config.size[0], config.size[0], config.size[1], 16);
        mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: config.color }));
    }

    if (config.type === "box") {
        shape = new CANNON.Box(new CANNON.Vec3(config.size[0]/2, config.size[1]/2, config.size[2]/2));
        body = new CANNON.Body({ mass: config.mass, shape: shape });
    } else {
        shape = new CANNON.Cylinder(config.size[0], config.size[0], config.size[1], 16);
        body = new CANNON.Body({ mass: config.mass });
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        body.addShape(shape, new CANNON.Vec3(), q);
    }

    // FALL-EFFEKT: Wir spawnen den Böller 2 Einheiten über dem Klick-Punkt
    body.position.set(x, y + 2.0, z);
    // Leichte zufällige Drehung beim Fallen
    body.quaternion.setFromEuler(Math.random()*0.2, Math.random()*Math.PI, Math.random()*0.2);

    scene.add(mesh);
    world.addBody(body);
    meshes.push(mesh);
    bodies.push(body);

    if (config.isExplosive && config.hasFuse) {
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
        const fLight = new THREE.PointLight(0xffaa00, 2, 3);
        scene.add(flame, fLight);
        mesh.userData.flame = flame;
        mesh.userData.light = fLight;
        mesh.userData.flameOffset = config.size[1] / 2;
    }

    if (config.isExplosive) {
        setTimeout(() => {
            if (bodies.includes(body)) {
                if (mesh.userData.flame) {
                    scene.remove(mesh.userData.flame);
                    scene.remove(mesh.userData.light);
                }
                explode(body.position.clone(), config.power, config.radius, config.shockwaveScale || 1);
                removeObject(body);
            }
        }, config.timer);
    }
}

function removeObject(body) {
    const index = bodies.indexOf(body);
    if (index > -1) {
        scene.remove(meshes[index]);
        world.removeBody(bodies[index]);
        bodies.splice(index, 1);
        meshes.splice(index, 1);
    }
}

function explode(pos, power, radius, shockwaveScale) {
    // 1. Physik Impuls
    bodies.forEach(b => {
        const dist = b.position.distanceTo(pos);
        if (dist < radius) {
            const dir = b.position.vsub(pos);
            dir.normalize();
            b.applyImpulse(dir.scale(power / (dist + 0.5)), b.position);
        }
    });

    // 2. WEISSER EXPLOSIONSPUNKT (Blitz)
    const flashGeo = new THREE.SphereGeometry(radius / 5, 16, 16);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xfffff0, transparent: true, opacity: 0.9 });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos);
    scene.add(flash);
    // Verschwindet nach 50ms
    setTimeout(() => scene.remove(flash), 50);

    // 3. Gelbe Druckwelle
    const shockGeo = new THREE.TorusGeometry(1, 0.15, 8, 32);
    const shockMat = new THREE.MeshBasicMaterial({ color: 0xfffff1, transparent: true, opacity: 0.5 });
    const shockWave = new THREE.Mesh(shockGeo, shockMat);
    shockWave.position.set(pos.x, 0.2, pos.z);
    shockWave.rotation.x = Math.PI / 2;
    scene.add(shockWave);

    let s = 1;
    function ani() {
        s += 5;
        shockWave.scale.set(s * shockwaveScale, s * shockwaveScale, 1);
        shockMat.opacity -= 0.05;
        if (shockMat.opacity > 0) requestAnimationFrame(ani);
        else scene.remove(shockWave);
    }
    ani();

    // 4. Wackeln
    let frames = 20;
    const intensity = Math.min(1.8, (power / 350));
    function shake() {
        if (frames > 0) {
            camera.position.x = basePos.x + (Math.random() - 0.5) * intensity;
            camera.position.y = basePos.y + (Math.random() - 0.5) * intensity;
            camera.lookAt(0, 0, 0);
            frames--;
            requestAnimationFrame(shake);
        } else {
            camera.position.copy(basePos);
            camera.lookAt(0, 0, 0);
        }
    }
    shake();
}

// --- 6. LOOP & EVENTS ---
window.onclick = (e) => {
    if (e.target.tagName === 'BUTTON') return;
    const mouse = new THREE.Vector2((e.clientX/window.innerWidth)*2-1, -(e.clientY/window.innerHeight)*2+1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(groundMesh);
    if (intersects.length > 0) spawnObject(mode, intersects[0].point.x, 0, intersects[0].point.z);
};

document.querySelectorAll("button").forEach(btn => {
    btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.id;
        if(id === "btn-box") mode = "box";
        else if(id === "dumbum2g") mode = "db2g";
        else if(id === "dumbum5g") mode = "db5g";
        else if(id === "bigbang8g") mode = "bb8g";
        else if(id === "supercobra6") mode = "sc628g";
        else if(id === "dumbum650g") mode = "db650g";
    };
});

function animate() {
    requestAnimationFrame(animate);
    world.step(1/60);
    for (let i = meshes.length - 1; i >= 0; i--) {
        meshes[i].position.copy(bodies[i].position);
        meshes[i].quaternion.copy(bodies[i].quaternion);

        if (meshes[i].userData.flame) {
            const m = meshes[i];
            const offset = new THREE.Vector3(0, m.userData.flameOffset, 0).applyQuaternion(m.quaternion);
            m.userData.flame.position.copy(m.position).add(offset);
            m.userData.light.position.copy(m.userData.flame.position);
            m.userData.light.intensity = 1 + Math.random() * 2;
        }
    }
    renderer.render(scene, camera);
}
animate();