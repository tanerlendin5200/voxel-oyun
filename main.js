/* =============================================
   VoxelCraft - Ana Oyun Motoru
   Three.js r128 ile voxel sandbox
   ============================================= */

// --- DEĞİŞKENLER ---
let scene, camera, renderer, raycaster;
let world = {};
let playerPos = { x: 0, y: 20, z: 0 };
let playerRotX = 0, playerRotY = 0;
let isLocked = false;
let isMobile = false;
let pointerLocked = false;
let keys = {};
let seciliBlok = 1;
let hareketEdiyor = { x: 0, y: 0, z: 0 };
let zipliyor = false;
let yGravity = 0;
let yerde = true;
let chunkGeo = {};
let blockMeshes = {};
let blockGroup;

// Blok tipleri: id -> { renk, isim }
const BLOK_TIPLERI = {
  1: { name: 'Toprak', color: 0x8B4513, emoji: '🟫' },
  2: { name: 'Çimen', color: 0x4a7023, emoji: '🟩' },
  3: { name: 'Taş', color: 0x808080, emoji: '⬜' },
  4: { name: 'Odun', color: 0xC19A6B, emoji: '🟨' },
  5: { name: 'Kömür', color: 0x2c2c2c, emoji: '⬛' },
  6: { name: 'Kum', color: 0xf5f5dc, emoji: '⬜' },
};

// Bir blok için geometri oluştur
const blokBoyut = 0.8;
const blokGeo = new THREE.BoxGeometry(blokBoyut * 0.97, blokBoyut * 0.97, blokBoyut * 0.97);

// --- AYARLAR ---
const renderMesafesi = 8;
const dünyaBoyu = 30;

// --- BAŞLAT ---
function baslat() {
  document.getElementById('info').style.display = 'none';
  document.getElementById('ui').style.display = 'block';
  
  // Mobil tespit
  isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    document.getElementById('mobilKontroller').style.display = 'flex';
  }

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 25, 40);

  // Camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(playerPos.x, playerPos.y - 0.5, playerPos.z);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // Işık
  const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffeedd, 1);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  const d = 20;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
  fillLight.position.set(-10, 10, -10);
  scene.add(fillLight);

  // Dünya
  blockGroup = new THREE.Group();
  scene.add(blockGroup);
  
  dünyaOlustur();

  // Raycaster
  raycaster = new THREE.Raycaster();
  raycaster.far = 7;

  // Kontroller
  setupKontroller();
  setupMouse();
  setupMobile();

  // Pencere yeniden boyutlandırma
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Oyun döngüsü
  loop();
}

// --- DÜNYA OLUŞTUR ---
function dünyaOlustur() {
  for (let x = -renderMesafesi; x <= renderMesafesi; x++) {
    for (let z = -renderMesafesi; z <= renderMesafesi; z++) {
      for (let y = 0; y <= 5; y++) {
        let blokTip = 0;
        
        if (y === 0) blokTip = 5; // Kömür altı
        else if (y === 1 || y === 2) blokTip = 3; // Taş
        else if (y === 3) {
          // Düz alan + tepecikler
          const noise = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1.5 + Math.sin(x * 0.2 + z * 0.3) * 1;
          if (y === 3 && noise > 0.5) blokTip = 1; // Tepe
          else if (y === 3) blokTip = 2; // Çimen üst
        }
        else if (y === 4) {
          const noise = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1.5 + Math.sin(x * 0.2 + z * 0.3) * 1;
          if (noise > 1.2) blokTip = 1;
        }
        else if (y === 5) {
          const noise = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1.5 + Math.sin(x * 0.2 + z * 0.3) * 1;
          if (noise > 1.8) blokTip = 1;
        }

        if (blokTip > 0) {
          blokEkle(x, y, z, blokTip, true);
        }
      }
    }
  }

  // Ağaçlar 
  const ağaçlar = [
    [-5, 3, -4], [4, 3, 5], [-3, 3, 6], [6, 3, -3], 
    [0, 3, -7], [-7, 3, 2], [3, 3, -6], [-6, 3, -5]
  ];
  
  ağaçlar.forEach(pos => {
    const [x, y, z] = pos;
    // Gövde
    for (let i = 0; i < 3; i++) {
      blokEkle(x, y + i, z, 4, true); // Odun
    }
    // Yapraklar
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (let dy = 2; dy <= 3; dy++) {
          if (dx === 0 && dz === 0 && dy === 2) continue;
          blokEkle(x + dx, y + dy, z + dz, 2, true);
        }
      }
    }
  });
}

// --- BLOK EKLE ---
function blokEkle(x, y, z, tip, meshEkle = true) {
  const key = `${x},${y},${z}`;
  world[key] = tip;
  
  if (meshEkle) {
    const renk = BLOK_TIPLERI[tip] ? BLOK_TIPLERI[tip].color : 0x888888;
    const mat = new THREE.MeshLambertMaterial({ color: renk });
    const mesh = new THREE.Mesh(blokGeo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Blok kenarları (daha Minecraft havası için)
    const edges = new THREE.EdgesGeometry(blokGeo);
    const edgeMat = new THREE.LineBasicMaterial({ 
      color: 0x000000, 
      transparent: true, 
      opacity: 0.15 
    });
    const edgeLine = new THREE.LineSegments(edges, edgeMat);
    mesh.add(edgeLine);
    
    mesh.userData.isBlock = true;
    mesh.userData.pos = { x, y, z };
    mesh.userData.tip = tip;
    
    blockGroup.add(mesh);
    blockMeshes[key] = mesh;
  }
}

// --- BLOK SİL ---
function blokSil(x, y, z) {
  const key = `${x},${y},${z}`;
  if (world[key] !== undefined) {
    delete world[key];
    if (blockMeshes[key]) {
      blockGroup.remove(blockMeshes[key]);
      blockMeshes[key].geometry.dispose();
      blockMeshes[key].material.dispose();
      delete blockMeshes[key];
    }
    return true;
  }
  return false;
}

// --- BLOK VAR MI ---
function blokVarMi(x, y, z) {
  return world[`${x},${y},${z}`] !== undefined;
}

// --- KARAKTER POZİSYONUNDA BLOK VAR MI ---
function karakterCarpiyorMu(px, py, pz) {
  const cX = Math.round(px);
  const cY = Math.floor(py);
  const cZ = Math.round(pz);
  
  for (let ix = -1; ix <= 1; ix++) {
    for (let iy = -1; iy <= 1; iy++) {
      for (let iz = -1; iz <= 1; iz++) {
        const key = `${cX + ix},${cY + iy},${cZ + iz}`;
        if (world[key] !== undefined) {
          const bx = cX + ix;
          const by = cY + iy;
          const bz = cZ + iz;
          // Kaba hitbox kontrolü
          if (px > bx - 0.6 && px < bx + 0.6 &&
              py > by - 0.0 && py < by + 1.0 &&
              pz > bz - 0.6 && pz < bz + 0.6) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// --- KONTROLLER ---
function setupKontroller() {
  document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') e.preventDefault();
  });
  document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });
}

function setupMouse() {
  const canvas = renderer.domElement;
  
  canvas.addEventListener('click', (e) => {
    if (!pointerLocked && !isMobile) {
      canvas.requestPointerLock();
    }
  });
  
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!pointerLocked || isMobile) return;
    const sensitivity = 0.002;
    playerRotY -= e.movementX * sensitivity;
    playerRotX -= e.movementY * sensitivity;
    playerRotX = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, playerRotX));
  });

  // Sol tık - blok kır
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 && pointerLocked) {
      blokKirYap();
    }
  });

  // Sağ tık - blok koy
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (pointerLocked) {
      blokKoyYap();
    }
  });
}

// --- MOBİL KONTROLLER ---
function setupMobile() {
  if (!isMobile) return;
  
  // Joystick
  const joypad = document.getElementById('joypad');
  const joyIcerik = document.getElementById('joy-icerik');
  let joyTouching = false;
  
  joypad.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joyTouching = true;
  }, { passive: false });
  
  joypad.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joypad.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    let dx = touch.clientX - cx;
    let dy = touch.clientY - cy;
    const maxDist = rect.width/2 - 15;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > maxDist) {
      dx = dx/dist * maxDist;
      dy = dy/dist * maxDist;
    }
    joyIcerik.style.transform = `translate(${-25 + dx}px, ${-25 + dy}px)`;
    hareketEdiyor.x = dx / maxDist;
    hareketEdiyor.z = -dy / maxDist;
  }, { passive: false });
  
  joypad.addEventListener('touchend', (e) => {
    e.preventDefault();
    joyTouching = false;
    joyIcerik.style.transform = 'translate(-25px, -25px)';
    hareketEdiyor.x = 0;
    hareketEdiyor.z = 0;
  }, { passive: false });

  // Zıpla
  document.getElementById('btn-zıpla').addEventListener('touchstart', (e) => {
    e.preventDefault();
    zipliyor = true;
  }, { passive: false });
  document.getElementById('btn-zıpla').addEventListener('touchend', (e) => {
    e.preventDefault();
    zipliyor = false;
  }, { passive: false });

  // Blok yerleştir
  document.getElementById('btn-yer').addEventListener('touchstart', (e) => {
    e.preventDefault();
    blokKoyYap();
  }, { passive: false });

  // Blok seçimi (dokunarak)
  // Ekrana tıkla - blok kır
  renderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && !e.target.closest('#mobilKontroller') && !e.target.closest('#blokSecim')) {
      const touch = e.touches[0];
      const mouse = new THREE.Vector2(
        (touch.clientX / window.innerWidth) * 2 - 1,
        -(touch.clientY / window.innerHeight) * 2 + 1
      );
      
      // Kısa süre sonra mı uzun basma mı?
      setTimeout(() => {
        blokKirYap(mouse);
      }, 10);
    }
  }, { passive: true });

  // Blok seçici
  document.querySelectorAll('.blok-item').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.blok-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      seciliBlok = parseInt(el.dataset.tip);
    });
    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      document.querySelectorAll('.blok-item').forEach(i => i.classList.remove('active'));
      el.classList.add('active');
      seciliBlok = parseInt(el.dataset.tip);
    });
  });
}

// --- BLOK KIR ---
function blokKirYap(mousePos) {
  const center = mousePos || new THREE.Vector2(0, 0);
  raycaster.setFromCamera(center, camera);
  
  const intersects = raycaster.intersectObjects(blockGroup.children, false);
  
  for (const intersect of intersects) {
    const obj = intersect.object;
    if (obj.userData && obj.userData.isBlock) {
      const { x, y, z } = obj.userData.pos;
      blokSil(x, y, z);
      return;
    }
  }
}

// --- BLOK KOY ---
function blokKoyYap() {
  const center = new THREE.Vector2(0, 0);
  raycaster.setFromCamera(center, camera);
  
  const intersects = raycaster.intersectObjects(blockGroup.children, false);
  
  for (const intersect of intersects) {
    const obj = intersect.object;
    if (obj.userData && obj.userData.isBlock) {
      const { x, y, z } = obj.userData.pos;
      const normal = intersect.face.normal;
      
      const nx = x + Math.round(normal.x);
      const ny = y + Math.round(normal.y);
      const nz = z + Math.round(normal.z);
      
      // Karakterin üstüne koyma
      const px = Math.round(camera.position.x);
      const py = Math.floor(camera.position.y);
      const pz = Math.round(camera.position.z);
      
      if (nx === px && (ny === py || ny === py + 1) && nz === pz) return;
      if (blokVarMi(nx, ny, nz)) return;
      
      blokEkle(nx, ny, nz, seciliBlok);
      return;
    }
  }
}

// --- OYUN DÖNGÜSÜ ---
function loop() {
  requestAnimationFrame(loop);
  
  if (pointerLocked || isMobile) {
    // Hareket
    let hiz = 0.12;
    let hx = 0, hz = 0;
    
    if (!isMobile) {
      if (keys['w'] || keys['arrowup']) hz = 1;
      if (keys['s'] || keys['arrowdown']) hz = -1;
      if (keys['a'] || keys['arrowleft']) hx = -1;
      if (keys['d'] || keys['arrowright']) hx = 1;
    } else {
      hx = hareketEdiyor.x;
      hz = hareketEdiyor.z;
    }
    
    // Hız normalize
    if (Math.abs(hx) + Math.abs(hz) > 1) {
      const len = Math.sqrt(hx*hx + hz*hz);
      hx /= len;
      hz /= len;
    }
    
    // Kamera yönüne göre hareket
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY);
    
    let moveX = forward.x * hz + right.x * hx;
    let moveZ = forward.z * hz + right.z * hx;
    
    // Çarpışma kontrolü - X ekseni
    const newX = camera.position.x + moveX * hiz;
    if (!karakterCarpiyorMu(newX, camera.position.y, camera.position.z)) {
      camera.position.x = newX;
    }
    
    // Çarpışma kontrolü - Z ekseni
    const newZ = camera.position.z + moveZ * hiz;
    if (!karakterCarpiyorMu(camera.position.x, camera.position.y, newZ)) {
      camera.position.z = newZ;
    }
    
    // Zıplama
    if ((keys[' '] || zipliyor) && yerde && !isMobile) {
      yGravity = 0.2;
      yerde = false;
    }
    if (zipliyor && yerde && isMobile) {
      yGravity = 0.2;
      yerde = false;
    }
    
    // Yerçekimi
    yGravity -= 0.015;
    const newY = camera.position.y + yGravity;
    
    if (!karakterCarpiyorMu(camera.position.x, newY, camera.position.z)) {
      camera.position.y = newY;
      yerde = false;
    } else {
      if (yGravity < 0) {
        camera.position.y = Math.floor(camera.position.y) + 0.3;
        yerde = true;
        yGravity = 0;
      } else {
        yGravity = 0;
      }
    }
    
    // Oyuncu düşünce spawn'a geri dön
    if (camera.position.y < -20) {
      camera.position.set(0, 20, 0);
      yGravity = 0;
    }
    
    // Kamera rotasyonu
    const euler = new THREE.Euler(playerRotX, playerRotY, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
    
    // Koordinat
    document.getElementById('koordinat').textContent = 
      `${Math.round(camera.position.x)}, ${Math.floor(camera.position.y)}, ${Math.round(camera.position.z)}`;
  }
  
  renderer.render(scene, camera);
}

// --- İlk odak ---
window.addEventListener('load', () => {
  // Dünya yükleme göstergesi
  setTimeout(() => {
    document.getElementById('baslaBtn').textContent = '▶ OYUNU BAŞLAT';
  }, 100);
});
