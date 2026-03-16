// --- 1. KONFIGURATION ---
const MODELS_TO_LOAD = {
  box: "box.glb",
  box2: "box2.glb",
  mahan: "mahan.glb",
  toilet: "toilet.glb",
  db2g: "DB2g.glb",
  db5g: "DB2g.glb",
  bb8g: "BB8g.glb",
  sc628g: "sc628g.glb",
  tk100g: "TK100g.glb",
  fart: "DB2g.glb",
  db650g: "DB2g.glb",
  
};

const OBJECT_TYPES = {
  box: {
    size: [1.5, 1.5, 1.5],
    color: 0xd2b48c,
    mass: 2,
    type: "box",
    isExplosive: false,
    scale: 1,
  },
  box2: {
    size: [1.8, 1.8, 1.8],
    color: 0xd2b48c,
    mass: 8,
    type: "box",
    isExplosive: false,
    scale: 6,
  },
  mahan: {
    size: [2, 5, 2],
    color: 0x222222,
    mass: 10,
    type: "box",
    isExplosive: false,
    scale: 2.5,
  },
    toilet: {
    size: [2.6, 2.7, 2.6],
    color: 0x222222,
    mass: 10,
    type: "box",
    isExplosive: false,
    scale: 0.3,
  },
  db2g: {
    size: [0.2, 0.7, 0.2],
    color: 0x222222,
    mass: 0.5,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 10,
    radius: 5,
    shockwaveScale: 2,
    scale: 5,
    explosionSound: "explosion_small.mp3",
    explosionVolume: 0.7,
  },
  db5g: {
    size: [0.4, 0.8, 0.4],
    color: 0x222222,
    mass: 1.0,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 25,
    radius: 10,
    shockwaveScale: 4,
    scale: 6,
    explosionSound: "explosion_small.mp3",
    explosionVolume: 1,
  },
  bb8g: {
    size: [0.15, 1, 0.15],
    color: 0x222222,
    mass: 1.5,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 40,
    radius: 18,
    shockwaveScale: 5,
    scale: 35,
    explosionSound: "explosion_small.mp3",
  },
  sc628g: {
    size: [0.15, 1, 0.15],
    color: 0x222222,
    mass: 2.0,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 120,
    radius: 25,
    shockwaveScale: 8,
    scale: 35,
    hasFuse: true,
    hasFountain: true,
    fuseSound: "fuse.wav",
    explosionSound: "explosion_small.mp3",
    explosionVolume: 1,
    fountainColor: [
      "#ffda33",
      "#ffa600",
      "#fff98b",
      "#ff8800",
      "#ff8d71"
    ],
    fountainHeight: 5,
    fountainSpread: 3,
    fountainParticleSize: 0.05,
    fountainDropRate: 0.16,
    fountainFadeSpeed: 0.015,
    fountainRate: 1,
  },
  tk100g: {
    size: [0.5, 1.5, 0.5],
    color: 0x222222,
    mass: 2.5,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 400,
    radius: 30,
    shockwaveScale: 16,
    scale: 50,
    hasFuse: true,
    hasFountain: true,
    fuseSound: "fuse.wav",
    explosionSound: "explosion_small.mp3",
    explosionVolume: 1.0,
    fountainColor: [
      "#f2ff00",
      "#ffae00",
      "#ff0000",
      "#adadad",
      "#00fff7",
      "#8c00ff",
    ],
    fountainHeight: 10.0,
    fountainSpread: 10,
    fountainParticleSize: 0.05,
    fountainDropRate: 0.25,
    fountainFadeSpeed: 0.0212,
    fountainRate: 1,
  },
  fart: {
    size: [0.4, 0.8, 0.4],
    color: 0x222222,
    mass: 2.5,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 400,
    radius: 30,
    shockwaveScale: 16,
    scale: 6,
    hasFuse: true,
    hasFountain: true,
    fuseSound: "fuse.wav",
    explosionSound: "fart.mp3",
    explosionVolume: 1.0,
    fountainColor: [
      "#218b00",
      "#412d00",
      "#452d00",
      "#6b4400",
      "#794b00",
      "#5c3300",
    ],
    fountainHeight: 10.0,
    fountainSpread: 10,
    fountainParticleSize: 0.05,
    fountainDropRate: 0.25,
    fountainFadeSpeed: 0.0212,
    fountainRate: 1,
  },
  db650g: {
    size: [1, 1.8, 1],
    color: 0x222222,
    mass: 3.0,
    type: "cylinder",
    isExplosive: true,
    timer: 2000,
    power: 2500,
    radius: 40,
    shockwaveScale: 32,
    scale: 12,
    explosionSound: "explosion_small.mp3",
  },
};

let mode = "box";
let ignitionMode = "auto";
const meshes = [];
const bodies = [];
const loadedModels = {};
const waitingForLight = new Map();
const fountainParticles = [];

// --- CURSOR DOT ---
const cursorDot = document.getElementById("cursor-dot");

window.addEventListener("mousemove", (e) => {
  cursorDot.style.left = e.clientX + "px";
  cursorDot.style.top  = e.clientY + "px";
  cursorDot.className = "";
  if (mode === "lighter") cursorDot.classList.add("lighter");
  if (mode === "delete")  cursorDot.classList.add("delete");
});

// --- 2. THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
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

const groundMesh = new THREE.Mesh(
  new THREE.BoxGeometry(40, 1, 40),
  new THREE.MeshPhongMaterial({ color: 0x555555 }),
);
groundMesh.position.y = -0.5;
scene.add(groundMesh);

const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(20, 0.5, 20)),
});
groundBody.position.set(0, -0.5, 0);
world.addBody(groundBody);

// --- 5. FUNKTIONEN ---

function playSound(file, volume = 1.0) {
  if (!file) return;
  const audio = new Audio(file);
  audio.volume = volume;
  audio.play().catch(() => {});
}

function parseColor(c) {
  if (typeof c === "string") {
    const col = new THREE.Color(c);
    return [col.r, col.g, col.b];
  }
  return c;
}

function spawnObject(type, x, y, z) {
  const config = OBJECT_TYPES[type];
  if (!config) return;

  let mesh, shape, body;

  if (loadedModels[type]) {
    mesh = loadedModels[type].clone();
    if (config.scale) mesh.scale.set(config.scale, config.scale, config.scale);
  } else {
    const geo =
      config.type === "box"
        ? new THREE.BoxGeometry(...config.size)
        : new THREE.CylinderGeometry(
            config.size[0],
            config.size[0],
            config.size[1],
            16,
          );
    mesh = new THREE.Mesh(
      geo,
      new THREE.MeshPhongMaterial({ color: config.color }),
    );
  }

  if (config.type === "box") {
    shape = new CANNON.Box(
      new CANNON.Vec3(
        config.size[0] / 2,
        config.size[1] / 2,
        config.size[2] / 2,
      ),
    );
    body = new CANNON.Body({ mass: config.mass, shape: shape });
  } else {
    shape = new CANNON.Cylinder(
      config.size[0],
      config.size[0],
      config.size[1],
      16,
    );
    body = new CANNON.Body({ mass: config.mass });
    const q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    body.addShape(shape, new CANNON.Vec3(), q);
  }

  body.position.set(x, y + 3.0, z);
  body.quaternion.setFromEuler(
    Math.random() * 0.2,
    Math.random() * Math.PI,
    Math.random() * 0.2,
  );

  scene.add(mesh);
  world.addBody(body);
  meshes.push(mesh);
  bodies.push(body);

  if (!config.isExplosive) return;

  if (ignitionMode === "auto") {
    scheduleExplosion(body, mesh, config);
  } else {
    mesh.userData.waitingForLight = true;
    waitingForLight.set(body, config);
  }
}

function scheduleExplosion(body, mesh, config) {
  if (config.hasFuse) {
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.06),
      new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    );
    const fLight = new THREE.PointLight(0xffaa00, 2, 3);
    scene.add(flame, fLight);
    mesh.userData.flame = flame;
    mesh.userData.light = fLight;
    mesh.userData.flameOffset = config.size[1] / 2;
    playSound(config.fuseSound, 0.8);
  }

  if (config.hasFountain) {
    startFountain(mesh, config);
  }

  setTimeout(() => {
    if (bodies.includes(body)) {
      mesh.userData.fountainActive = false;
      if (mesh.userData.flame) {
        scene.remove(mesh.userData.flame);
        scene.remove(mesh.userData.light);
      }
      playSound(config.explosionSound, config.explosionVolume ?? 1.0);
      explode(
        body.position.clone(),
        config.power,
        config.radius,
        config.shockwaveScale || 1,
      );
      removeObject(body);
    }
  }, config.timer);
}

function startFountain(mesh, config) {
  let fc = config.fountainColor || ["#ffcc00"];
  if (!Array.isArray(fc)) fc = [fc];
  fc = fc.map(parseColor);

  mesh.userData.fountainActive = true;
  mesh.userData.fountainStartTime = performance.now() + 100;
  mesh.userData.fountainDuration = config.timer;
  mesh.userData.fountainConfig = {
    fc,
    fw: config.fountainSpread || 0.08,
    fh: config.fountainHeight || 4.0,
    fps: config.fountainParticleSize || 0.035,
    fdr: config.fountainDropRate || 0.06,
    ffd: config.fountainFadeSpeed || 0.018,
    frr: config.fountainRate || 0.7,
    size1half: config.size[1] / 2,
  };
}

function lightFuse(body) {
  if (!waitingForLight.has(body)) return;
  const config = waitingForLight.get(body);
  waitingForLight.delete(body);

  const index = bodies.indexOf(body);
  if (index === -1) return;
  const mesh = meshes[index];
  mesh.userData.waitingForLight = false;

  scheduleExplosion(body, mesh, config);
}

function removeObject(body) {
  waitingForLight.delete(body);
  const index = bodies.indexOf(body);
  if (index > -1) {
    const mesh = meshes[index];
    if (mesh.userData.flame) {
      scene.remove(mesh.userData.flame);
      scene.remove(mesh.userData.light);
    }
    scene.remove(mesh);
    world.removeBody(body);
    bodies.splice(index, 1);
    meshes.splice(index, 1);
  }
}

function explode(pos, power, radius, shockwaveScale) {
  const bodiesSnapshot = [...bodies];
  bodiesSnapshot.forEach((b) => {
    const dist = b.position.distanceTo(pos);
    if (dist < radius) {
      const dir = b.position.vsub(pos);
      dir.normalize();
      b.applyImpulse(dir.scale(power / (dist + 0.5)), b.position);
      if (waitingForLight.has(b)) {
        lightFuse(b);
      }
    }
  });

  const flashGeo = new THREE.SphereGeometry(radius / 5, 16, 16);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xfffff0,
    transparent: true,
    opacity: 0.9,
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.copy(pos);
  scene.add(flash);
  setTimeout(() => scene.remove(flash), 50);

  const shockGeo = new THREE.TorusGeometry(1, 0.15, 8, 32);
  const shockMat = new THREE.MeshBasicMaterial({
    color: 0xfffff1,
    transparent: true,
    opacity: 0.5,
  });
  const shockWave = new THREE.Mesh(shockGeo, shockMat);
  shockWave.position.set(pos.x, pos.y, pos.z);
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

  let frames = 20;
  const intensity = Math.min(1.8, power / 350);
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

// --- 6. INPUT ---
function handleTap(clientX, clientY) {
  const mouse = new THREE.Vector2(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Löschen-Modus
  if (mode === "delete") {
    const hits = raycaster.intersectObjects(meshes, true);
    if (hits.length > 0) {
      let hitMesh = hits[0].object;
      while (hitMesh && !meshes.includes(hitMesh)) {
        hitMesh = hitMesh.parent;
      }
      if (hitMesh) {
        const idx = meshes.indexOf(hitMesh);
        if (idx !== -1) removeObject(bodies[idx]);
      }
    }
    return;
  }

  // Feuerzeug-Tool: nur zünden, nie spawnen
  if (ignitionMode === "manual" && mode === "lighter") {
    const waitingMeshes = bodies
      .filter((b) => waitingForLight.has(b))
      .map((b) => meshes[bodies.indexOf(b)]);

    if (waitingMeshes.length > 0) {
      const hits = raycaster.intersectObjects(waitingMeshes, true);
      if (hits.length > 0) {
        let hitMesh = hits[0].object;
        while (hitMesh && !meshes.includes(hitMesh)) {
          hitMesh = hitMesh.parent;
        }
        if (hitMesh) {
          const idx = meshes.indexOf(hitMesh);
          if (idx !== -1) lightFuse(bodies[idx]);
        }
      }
    }
    return; // Nie auf den Boden spawnen im Feuerzeug-Tool-Modus
  }

  // Normaler Platzier-Modus
  if (mode !== "lighter") {
    // Zuerst auf Objekte prüfen, dann auf den Boden
    const objectHits = raycaster.intersectObjects(meshes, true);
    if (objectHits.length > 0) {
      const pt = objectHits[0].point;
      spawnObject(mode, pt.x, pt.y, pt.z);
      return;
    }
    const groundHits = raycaster.intersectObject(groundMesh);
    if (groundHits.length > 0) {
      const pt = groundHits[0].point;
      spawnObject(mode, pt.x, 0, pt.z);
    }
  }
}

window.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") return;
  handleTap(e.clientX, e.clientY);
});

window.addEventListener(
  "touchend",
  (e) => {
    if (e.target.tagName === "BUTTON") return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    handleTap(touch.clientX, touch.clientY);
  },
  { passive: false },
);

// --- 7. BUTTONS ---
function addTapListener(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  let tapped = false;
  el.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      tapped = true;
      fn();
      setTimeout(() => {
        tapped = false;
      }, 300);
    },
    { passive: false },
  );
  el.addEventListener("click", (e) => {
    if (tapped) return;
    fn();
  });
}

addTapListener("btn-hide-menu", () => {
  document.getElementById("panel").classList.add("hidden");
  document.getElementById("btn-show-menu").classList.add("visible");
});

addTapListener("btn-show-menu", () => {
  document.getElementById("panel").classList.remove("hidden");
  document.getElementById("btn-show-menu").classList.remove("visible");
});

document.querySelectorAll("button").forEach((btn) => {
  function onSelect(e) {
    e.stopPropagation();
    e.preventDefault();
    const id = btn.id;

    if (id === "btn-hide-menu" || id === "btn-show-menu") return;

    // Zündungs-Toggle
    if (id === "btn-ignition") {
      ignitionMode = ignitionMode === "auto" ? "manual" : "auto";
      btn.querySelector(".btn-text").textContent =
        ignitionMode === "auto" ? "Auto-Zündung" : "Manuelle-Zündung 🔥";
      btn.querySelector(".btn-icon").textContent =
        ignitionMode === "auto" ? "🔁" : "🔥";
      btn.classList.toggle("active", ignitionMode === "auto");

      // Feuerzeug-Button ein-/ausblenden
      const lighterBtn = document.getElementById("btn-lighter");
      if (lighterBtn) {
        lighterBtn.style.display = ignitionMode === "manual" ? "" : "none";
      }

      // Zurück zu Auto: Feuerzeug-Tool deaktivieren, Box auswählen
      if (ignitionMode === "auto" && mode === "lighter") {
        mode = "box";
        document.querySelectorAll(".btn-item").forEach((b) => b.classList.remove("active"));
        document.getElementById("btn-box")?.classList.add("active");
      }
      return;
    }

    const map = {
      "btn-box": "box",
      "btn-box2": "box2",
      "btn-mahan": "mahan",
      "btn-toilet": "toilet",
      dumbum2g: "db2g",
      dumbum5g: "db5g",
      bigbang8g: "bb8g",
      supercobra6: "sc628g",
      theking100g: "tk100g",
      fart: "fart",
      dumbum650g: "db650g",
      "btn-delete": "delete",
      "btn-lighter": "lighter",
    };
    if (map[id]) {
      mode = map[id];
      document
        .querySelectorAll(".btn-item")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    }
  }

  let touchFired = false;
  btn.addEventListener(
    "touchend",
    (e) => {
      touchFired = true;
      onSelect(e);
      setTimeout(() => {
        touchFired = false;
      }, 300);
    },
    { passive: false },
  );
  btn.addEventListener("click", (e) => {
    if (touchFired) return;
    onSelect(e);
  });
});

// --- 8. RESIZE ---
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- 9. LOOP ---
function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  // Fountain Partikel spawnen
  for (let i = meshes.length - 1; i >= 0; i--) {
    const m = meshes[i];
    if (!m.userData.fountainActive) continue;

    const cfg = m.userData.fountainConfig;
    const elapsed = performance.now() - m.userData.fountainStartTime;

    if (elapsed > 0 && elapsed < m.userData.fountainDuration) {
      if (Math.random() < cfg.frr) {
        const fc = cfg.fc[Math.floor(Math.random() * cfg.fc.length)];

        const geo = new THREE.SphereGeometry(cfg.fps, 4, 4);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(
            Math.min(1, fc[0] + (Math.random() - 0.5) * 0.15),
            Math.min(1, fc[1] + (Math.random() - 0.5) * 0.15),
            Math.min(1, fc[2] + (Math.random() - 0.5) * 0.15),
          ),
          transparent: true,
          opacity: 1.0,
        });
        const p = new THREE.Mesh(geo, mat);
        scene.add(p);

        const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
          m.quaternion,
        );
        const offset = localUp.clone().multiplyScalar(cfg.size1half);
        p.position.copy(m.position).add(offset);

        const speed = cfg.fh * (0.8 + Math.random() * 0.4);
        p.userData.vel = new THREE.Vector3(
          localUp.x * speed + (Math.random() - 0.5) * 0.02,
          localUp.y * speed + (Math.random() - 0.5) * 0.02,
          localUp.z * speed + (Math.random() - 0.5) * 0.02,
        );
        p.userData.spread = cfg.fw;
        p.userData.life = 1.0;
        p.userData.peaked = false;
        p.userData.fdr = cfg.fdr;
        p.userData.ffd = cfg.ffd;
        fountainParticles.push(p);
      }
    }
  }

  // Fountain Partikel updaten
  for (let i = fountainParticles.length - 1; i >= 0; i--) {
    const p = fountainParticles[i];

    p.userData.vel.y -= p.userData.fdr;
    p.userData.vel.x += (Math.random() - 0.5) * p.userData.spread * 0.1;
    p.userData.vel.z += (Math.random() - 0.5) * p.userData.spread * 0.1;
    p.position.add(p.userData.vel.clone().multiplyScalar(0.016));

    if (p.position.y <= 0) {
      p.position.y = 0;
      p.userData.vel.set(0, 0, 0);
      p.userData.peaked = true;
    }

    if (!p.userData.peaked && p.userData.vel.y < 0) {
      p.userData.peaked = true;
    }

    if (p.userData.peaked) {
      p.userData.life -= p.userData.ffd;
      p.material.opacity = Math.max(0, p.userData.life);
    }

    if (p.userData.life <= 0) {
      scene.remove(p);
      p.material.dispose();
      p.geometry.dispose();
      fountainParticles.splice(i, 1);
    }
  }

  // Meshes updaten
  for (let i = meshes.length - 1; i >= 0; i--) {
    meshes[i].position.copy(bodies[i].position);
    meshes[i].quaternion.copy(bodies[i].quaternion);

    if (meshes[i].userData.flame) {
      const m = meshes[i];
      const offset = new THREE.Vector3(
        0,
        m.userData.flameOffset,
        0,
      ).applyQuaternion(m.quaternion);
      m.userData.flame.position.copy(m.position).add(offset);
      m.userData.light.position.copy(m.userData.flame.position);
      m.userData.light.intensity = 1 + Math.random() * 2;
    }
  }

  renderer.render(scene, camera);
}
animate();