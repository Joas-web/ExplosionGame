// --- 1. KONFIGURATION (Hier kannst du einfach erweitern) ---
const OBJECT_TYPES = {
  box: {
    size: [1, 1, 1],
    color: 0xd2b48c,
    mass: 2,
    type: "box",
    isExplosive: false,
  },
  db2g: {
    size: [0.1, 0.4, 0.1],
    color: 0x222222,
    mass: 0.5,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 10,
    radius: 8,
  },
  db5g: {
    size: [0.11, 0.5, 0.11],
    color: 0x222222,
    mass: 1.0,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 25,
    radius: 12,
  },
  bb8g: {
    size: [0.12, 0.6, 0.12],
    color: 0x222222,
    mass: 1.0,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 40,
    radius: 14,
  },
  sc628g: {
    size: [0.13, 0.7, 0.13],
    color: 0x222222,
    mass: 1.0,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 140,
    radius: 18,
    hasFuse: true,
  },
  db650g: {
    size: [0.2, 1.0, 0.2],
    color: 0x222222,
    mass: 1.0,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 2000,
    radius: 40,
  },
};

let mode = "box";
const meshes = [];
const bodies = [];

// --- 2. THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 8, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// --- 3. CANNON.JS SETUP (Physik) ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Boden
const groundSize = 20;
const groundThickness = 1.5;
const groundGeo = new THREE.BoxGeometry(
  groundSize,
  groundThickness,
  groundSize,
);
const groundMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.position.y = -groundThickness / 2;
scene.add(groundMesh);

const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(
    new CANNON.Vec3(groundSize / 2, groundThickness / 2, groundSize / 2),
  ),
});
groundBody.position.set(0, -groundThickness / 2, 0);
world.addBody(groundBody);

// --- 4. FUNKTIONEN ---

function spawnObject(type, x, y, z) {
  const config = OBJECT_TYPES[type];
  if (!config) return;

  let mesh, shape, body;

  // Standardmäßig nutzen wir die exakten Klick-Koordinaten
  let finalX = x;
  let finalY = y + 0.5; // Standard-Höhe über Grund
  let finalZ = z;

  // Standard-Rotation (keine Drehung)
  let rotX = 0,
    rotY = 0,
    rotZ = 0;

  // --- NUR BEI BÖLLERN (Cylinder) ZUFALL ANWENDEN ---
  if (config.type === "cylinder") {
    const jitter = 0.3;
    finalX = x + (Math.random() - 0.5) * jitter;
    finalZ = z + (Math.random() - 0.5) * jitter;
    finalY = y + 0.8; // Böller fallen ein Stück

    rotY = Math.random() * Math.PI * 2; // Zufällige Drehung um die eigene Achse
    rotX = (Math.random() - 0.5) * 1; // Leichter Tilt
    rotZ = (Math.random() - 0.5) * 1;
  }

  if (config.type === "cylinder") {
    // Grafik Böller
    const geometry = new THREE.CylinderGeometry(
      config.size[0],
      config.size[0],
      config.size[1],
      16,
    );
    const material = new THREE.MeshPhongMaterial({ color: config.color });
    mesh = new THREE.Mesh(geometry, material);

    // Physik Böller
    shape = new CANNON.Cylinder(
      config.size[0],
      config.size[0],
      config.size[1],
      16,
    );
    const q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);

    body = new CANNON.Body({ mass: config.mass });
    body.addShape(shape, new CANNON.Vec3(), q);
  } else {
    // Grafik Kiste
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...config.size),
      new THREE.MeshPhongMaterial({ color: config.color }),
    );
    // Physik Kiste
    shape = new CANNON.Box(
      new CANNON.Vec3(
        config.size[0] / 2,
        config.size[1] / 2,
        config.size[2] / 2,
      ),
    );
    body = new CANNON.Body({ mass: config.mass, shape: shape });

    // Bei Kisten setzen wir y etwas präziser, damit sie nicht hüpfen
    finalY = y + config.size[1] / 2;
  }

  // Position und Rotation anwenden
  body.position.set(finalX, finalY, finalZ);
  body.quaternion.setFromEuler(rotX, rotY, rotZ);

  // Hinzufügen
  scene.add(mesh);
  world.addBody(body);
  meshes.push(mesh);
  bodies.push(body);

  // --- Explosions-Logik & Vorbrenner ---
  if (config.isExplosive) {
    if (config.hasFuse) {
      const flameGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const flameMesh = new THREE.Mesh(flameGeo, flameMat);
      const flameLight = new THREE.PointLight(0xffaa00, 2, 3);

      scene.add(flameMesh);
      scene.add(flameLight);

      mesh.userData.flame = flameMesh;
      mesh.userData.light = flameLight;
      mesh.userData.flameOffset = config.size[1] / 2;
    }

    setTimeout(() => {
      if (bodies.includes(body)) {
        const explosionPos = body.position.clone();
        if (mesh.userData.flame) {
          scene.remove(mesh.userData.flame);
          scene.remove(mesh.userData.light);
        }
        explode(explosionPos, config.power, config.radius);
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

function explode(pos, power, radius) {
  bodies.forEach((b) => {
    const dist = b.position.distanceTo(pos);
    if (dist < radius) {
      const dir = b.position.vsub(pos);
      dir.normalize();
      b.applyImpulse(dir.scale(power / (dist + 0.5)), b.position);
    }
  });

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(radius / 4),
    new THREE.MeshBasicMaterial({
      color: 0xffffed,
      transparent: true,
      opacity: 0.6,
    }),
  );
  flash.position.set(pos.x, pos.y, pos.z);
  scene.add(flash);
  setTimeout(() => scene.remove(flash), 80);
}

// --- 5. EVENTS & LOOP ---

// Stelle sicher, dass deine HTML-Buttons die IDs 'btn-box', 'dumbum2g' etc. haben
const btnBox = document.getElementById("btn-box");
const db2g = document.getElementById("dumbum2g");
const db5g = document.getElementById("dumbum5g");
const bb8g = document.getElementById("bigbang8g");
const sc628g = document.getElementById("supercobra6");
const db650g = document.getElementById("dumbum650g");

if (btnBox) btnBox.onclick = () => (mode = "box");
if (db2g) db2g.onclick = () => (mode = "db2g");
if (db5g) db5g.onclick = () => (mode = "db5g");
if (bb8g) bb8g.onclick = () => (mode = "bb8g");
if (sc628g) sc628g.onclick = () => (mode = "sc628g");
if (db650g) db650g.onclick = () => (mode = "db650g");

function handleInput(clientX, clientY) {
  // 1. Verhindern, dass Objekte gespawnt werden, wenn man auf ein UI-Element klickt
  if (event.target.tagName === 'BUTTON' || event.target.closest('#menu')) {
    return;
  }

  const mouse = new THREE.Vector2(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  // Wir prüfen nur die Kollision mit dem Boden
  const intersects = raycaster.intersectObject(groundMesh);

  if (intersects.length > 0) {
    const p = intersects[0].point;
    spawnObject(mode, p.x, p.y + 1, p.z);
  }
}

// --- 5. EVENTS & LOOP ---

// Diese Funktion verarbeitet die Logik für beide Eingabearten (Maus & Touch)
function handleInput(clientX, clientY, event) {
  // Prüfen, ob man auf ein UI-Element (Button oder Menü) geklickt hat
  if (event.target.tagName === 'BUTTON' || event.target.closest('#menu')) {
    return; // Abbrechen, damit kein Objekt hinter dem Button spawnt
  }

  const mouse = new THREE.Vector2(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(groundMesh);

  if (intersects.length > 0) {
    const p = intersects[0].point;
    spawnObject(mode, p.x, p.y + 1, p.z);
  }
}

// Event-Listener für PC (Maus)
window.addEventListener("mousedown", (e) => {
  handleInput(e.clientX, e.clientY, e);
});

// Event-Listener für Handy (Touch)
window.addEventListener("touchstart", (e) => {
  // Verhindert das zusätzliche "Geister-Mousedown" Event auf Mobilgeräten
  if (e.cancelable) e.preventDefault(); 
  
  const touch = e.touches[0];
  handleInput(touch.clientX, touch.clientY, e);
}, { passive: false });

// ... Hier folgen dann deine Button-Zuweisungen (btnBox.onclick etc.)

// Event-Listener für Touch (Handy)
window.addEventListener("touchstart", (e) => {
  // Verhindert Scrollen/Zoomen beim Platzieren, falls gewünscht:
  // e.preventDefault(); 
  const touch = e.touches[0];
  handleInput(touch.clientX, touch.clientY);
}, { passive: false });

function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  for (let i = meshes.length - 1; i >= 0; i--) {
    meshes[i].position.copy(bodies[i].position);
    meshes[i].quaternion.copy(bodies[i].quaternion);

    if (meshes[i].userData.flame) {
      const m = meshes[i];

      const offset = new THREE.Vector3(0, m.userData.flameOffset, 0);
      offset.applyQuaternion(m.quaternion);

      m.userData.flame.position.copy(m.position).add(offset);
      m.userData.light.position.copy(m.userData.flame.position);

      m.userData.light.intensity = 1 + Math.random() * 1.5;
    }

    if (bodies[i].position.y < -20) {
      removeObject(bodies[i]);
    }
  }
  renderer.render(scene, camera);
}

animate();

window.onresize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

document.getElementById("btn-hide-menu").addEventListener("click", () => {
  const menu = document.getElementById("menu");
  if (menu.style.display === "none") {
    menu.style.display = "block";
    document.getElementById("btn-hide-menu").innerText = "Ausblenden";
  } else {
    menu.style.display = "none";
    document.getElementById("btn-hide-menu").innerText = "Einblenden";
  }
});
