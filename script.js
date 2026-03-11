// --- INITIALISIERUNG ---
let mode = 'box';
const meshes = [];
const bodies = [];

// 1. Three.js Setup (Grafik)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Licht
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// 2. Cannon.js Setup (Physik)
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Schwerkraft Erde

// Boden erstellen
// Boden-Maße
const groundSize = 20;
const groundThickness = 0.5;

// Grafik (Three.js)
const groundGeo = new THREE.BoxGeometry(groundSize, groundThickness, groundSize);
const groundMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
// Wir positionieren die Oberfläche des Bodens auf y = 0
groundMesh.position.y = -groundThickness / 2; 
scene.add(groundMesh);

// Physik (Cannon.js) - Hier nutzen wir jetzt eine Box statt einer Plane
const groundBody = new CANNON.Body({ 
    mass: 0, // Mass 0 bedeutet unbeweglich (statisch)
    shape: new CANNON.Box(new CANNON.Vec3(groundSize/2, groundThickness/2, groundSize/2)) 
});
groundBody.position.set(0, -groundThickness / 2, 0);
world.addBody(groundBody);

// --- FUNKTIONEN ---

function createBox(x, y, z) {
    const size = 1;
    // Grafik
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshPhongMaterial({ color: 0xd2b48c })
    );
    scene.add(mesh);

    // Physik
    const body = new CANNON.Body({
        mass: 2,
        shape: new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2))
    });
    body.position.set(x, y, z);
    world.addBody(body);
    
    meshes.push(mesh);
    bodies.push(body);
}

function createFirecracker(x, y, z) {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.4),
        new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    scene.add(mesh);

    const body = new CANNON.Body({ mass: 0.5, shape: new CANNON.Cylinder(0.1, 0.1, 0.4, 8) });
    body.position.set(x, y, z);
    world.addBody(body);

    meshes.push(mesh);
    bodies.push(body);

    // Explosion nach Timer
    setTimeout(() => {
        // Wir holen uns die AKTUELLEN Koordinaten des Körpers,
        // egal wo er gerade hingekullert ist.
        const currentPos = new CANNON.Vec3(
            body.position.x, 
            body.position.y, 
            body.position.z
        );

        explode(currentPos); // Explosion an der echten Position auslösen

        // Objekt aus der Welt entfernen
        scene.remove(mesh);
        world.removeBody(body);
        
        // Aus den Arrays löschen, damit sie nicht weiter gerendert werden
        const index = bodies.indexOf(body);
        if (index > -1) {
            bodies.splice(index, 1);
            meshes.splice(index, 1);
        }
    }, 2000); // 2 Sekunden Zündzeit
}

function explode(pos) {
    const power = 40;
    bodies.forEach(b => {
        const dist = b.position.distanceTo(pos);
        if (dist < 6) {
            const dir = b.position.vsub(pos);
            dir.normalize();
            b.applyImpulse(dir.scale(power / (dist + 0.5)), b.position);
        }
    });

    // Kurzer Blitz-Effekt
    const flash = new THREE.Mesh(
        new THREE.SphereGeometry(1.5),
        new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 })
    );
    flash.position.set(pos.x, pos.y, pos.z);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 150);
}

// --- EVENTS ---

document.getElementById('btn-box').onclick = () => mode = 'box';
document.getElementById('btn-firework').onclick = () => mode = 'firecracker';

window.addEventListener('mousedown', (event) => {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(groundMesh);

    if (intersects.length > 0) {
        const p = intersects[0].point;
        if (mode === 'box') createBox(p.x, p.y + 1, p.z);
        else createFirecracker(p.x, p.y + 0.5, p.z);
    }
});

// Animations-Loop
function animate() {
    requestAnimationFrame(animate);
    world.step(1/60);
    
    for (let i = meshes.length - 1; i >= 0; i--) { // Rückwärts loopen beim Löschen
        meshes[i].position.copy(bodies[i].position);
        meshes[i].quaternion.copy(bodies[i].quaternion);

        // Wenn ein Objekt tief fällt, lösche es aus der Szene
        if (bodies[i].position.y < -20) {
            scene.remove(meshes[i]);
            world.removeBody(bodies[i]);
            meshes.splice(i, 1);
            bodies.splice(i, 1);
        }
    }
    renderer.render(scene, camera);
}

animate();

// Fenstergröße anpassen
window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};