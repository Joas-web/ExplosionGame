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
    power: 1500,
    radius: 40,
  },
};

let mode = "box";
const meshes = [];
const bodies = [];

// --- 2. THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// --- 3. CANNON.JS SETUP ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const groundSize = 20;
const groundThickness = 1.5;
const groundMesh = new THREE.Mesh(
  new THREE.BoxGeometry(groundSize, groundThickness, groundSize),
  new THREE.MeshPhongMaterial({ color: 0x555555 })
);
groundMesh.position.y = -groundThickness / 2;
scene.add(groundMesh);

const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(groundSize / 2, groundThickness / 2, groundSize / 2)),
});
groundBody.position.set(0, -groundThickness / 2, 0);
world.addBody(groundBody);

// --- 4. FUNKTIONEN ---
function spawnObject(type, x, y, z) {
  const config = OBJECT_TYPES[type];
  if (!config) return;

  let mesh, shape, body;
  let finalX = x, finalY = y + 0.5, finalZ = z;
  let rotX = 0, rotY = 0, rotZ = 0;

  if (config.type === "cylinder") {
    const jitter = 0.3;
    finalX = x + (Math.random() - 0.5) * jitter;
    finalZ = z + (Math.random() - 0.5) * jitter;
    finalY = y + 0.8;
    rotY = Math.random() * Math.PI * 2;
    rotX = (Math.random() - 0.5) * 1;
    rotZ = (Math.random() - 0.5) * 1;

    mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(config.size[0], config.size[0], config.size[1], 16),
      new THREE.MeshPhongMaterial({ color: config.color })
    );
    shape = new CANNON.Cylinder(config.size[0], config.size[0], config.size[1], 16);
    const q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    body = new CANNON.Body({ mass: config.mass });
    body.addShape(shape, new CANNON.Vec3(), q);
  } else {
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...config.size),
      new THREE.MeshPhongMaterial({ color: config.color })
    );
    shape = new CANNON.Box(new CANNON.Vec3(config.size[0] / 2, config.size[1] / 2, config.size[2] / 2));
    body = new CANNON.Body({ mass: config.mass, shape: shape });
    finalY = y + config.size[1] / 2;
  }

  body.position.set(finalX, finalY, finalZ);
  body.quaternion.setFromEuler(rotX, rotY, rotZ);

  scene.add(mesh);
  world.addBody(body);
  meshes.push(mesh);
  bodies.push(body);

  if (config.isExplosive) {
    if (config.hasFuse) {
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
      const fLight = new THREE.PointLight(0xffaa00, 2, 3);
      scene.add(flame, fLight);
      mesh.userData.flame = flame;
      mesh.userData.light = fLight;
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
  const flash = new THREE.Mesh(new THREE.SphereGeometry(radius / 4), new THREE.MeshBasicMaterial({ color: 0xffffed, transparent: true, opacity: 0.6 }));
  flash.position.set(pos.x, pos.y, pos.z);
  scene.add(flash);
  setTimeout(() => scene.remove(flash), 80);
}

// --- 5. EVENTS & LOOP ---
const btnBox = document.getElementById("btn-box");
const db2g = document.getElementById("dumbum2g");
const db5g = document.getElementById("dumbum5g");
const bb8g = document.getElementById("bigbang8g");
const sc628g = document.getElementById("supercobra6");
const db650g = document.getElementById("dumbum650g");

// Button-Handler mit Stopp der Event-Weiterleitung
const setMode = (e, newMode) => {
  e.stopPropagation();
  mode = newMode;
};

if (btnBox) btnBox.onclick = (e) => setMode(e, "box");
if (db2g) db2g.onclick = (e) => setMode(e, "db2g");
if (db5g) db5g.onclick = (e) => setMode(e, "db5g");
if (bb8g) bb8g.onclick = (e) => setMode(e, "bb8g");
if (sc628g) sc628g.onclick = (e) => setMode(e, "sc628g");
if (db650g) db650g.onclick = (e) => setMode(e, "db650g");

function handleInput(clientX, clientY, target) {
  // Verhindert Spawn, wenn auf UI geklickt wird
  if (target.tagName === 'BUTTON' || target.closest('#menu')) return;

  const mouse = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(groundMesh);

  if (intersects.length > 0) {
    const p = intersects[0].point;
    spawnObject(mode, p.x, p.y + 1, p.z);
  }
}

window.addEventListener("mousedown", (e) => handleInput(e.clientX, e.clientY, e.target));

window.addEventListener("touchstart", (e) => {
  const target = e.target;
  // Wenn kein Button getroffen wurde, verhindern wir das doppelte "mousedown"
  if (target.tagName !== 'BUTTON' && !target.closest('#menu')) {
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    handleInput(touch.clientX, touch.clientY, target);
  }
}, { passive: false });

function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);
  for (let i = meshes.length - 1; i >= 0; i--) {
    meshes[i].position.copy(bodies[i].position);
    meshes[i].quaternion.copy(bodies[i].quaternion);
    if (meshes[i].userData.flame) {
      const m = meshes[i];
      const offset = new THREE.Vector3(0, m.userData.flameOffset, 0).applyQuaternion(m.quaternion);
      m.userData.flame.position.copy(m.position).add(offset);
      m.userData.light.position.copy(m.userData.flame.position);
      m.userData.light.intensity = 1 + Math.random() * 1.5;
    }
    if (bodies[i].position.y < -20) removeObject(bodies[i]);
  }
  renderer.render(scene, camera);
}
animate();

window.onresize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

const btnHide = document.getElementById("btn-hide-menu");
if (btnHide) {
  btnHide.addEventListener("click", (e) => {
    e.stopPropagation();
    const menu = document.getElementById("menu");
    const isHidden = menu.style.display === "none";
    menu.style.display = isHidden ? "block" : "none";
    btnHide.innerText = isHidden ? "Ausblenden" : "Einblenden";
  });
}