/* ============================================
   VoxelCraft v3 - Düzeltilmiş Fizik + Zıplama
   ============================================ */

// --- DEĞİŞKENLER ---
let scene, camera, renderer, raycaster;
let world = {};
let playerPos = { x: 0, y: 8, z: 0 };
let playerRotX = 0, playerRotY = 0;
let isLocked = false;
let isMobile = false;
let pointerLocked = false;
let keys = {};
let oncekiKeys = {};
let seciliBlok = 1;
let hareketEdiyor = { x: 0, y: 0, z: 0 };
let zipliyor = false;
let oncekiZipliyor = false;
let yGravity = 0;
let yerde = true;
let gravityTimer = 0;
let chunkGeo = {};
let blockMeshes = {};
let blockGroup;

// Blok tipleri
const BLOK_TIPLERI = {
  1: { name: 'Toprak', color: 0x8B4513 },
  2: { name: 'Çimen', color: 0x4a7023 },
  3: { name: 'Taş', color: 0x808080 },
  4: { name: 'Odun', color: 0xC19A6B },
  5: { name: 'Kömür', color: 0x2c2c2c },
  6: { name: 'Kum', color: 0xf5f5dc },
};

const blokBoyut = 1;
const blokGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);

const renderMesafesi = 8;

// --- BAŞLAT ---
function baslat() {
  document.getElementById('info').style.display = 'none';
  document.getElementById('ui').style.display = 'block';
  
  isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    document.getElementById('mobilKontroller').style.display = 'flex';
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 25, 40);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(playerPos.x, playerPos.y, playerPos.z);

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

  blockGroup = new THREE.Group();
  scene.add(blockGroup);
  
  dunyaOlustur();

  raycaster = new THREE.Raycaster();
  raycaster.far = 7;

  setupKontroller();
  setupMouse();
  setupMobile();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  loop();
}

// --- DÜNYA ---
function dunyaOlustur() {
  for (let x = -renderMesafesi; x <= renderMesafesi; x++) {
    for (let z = -renderMesafesi; z <= renderMesafesi; z++) {
      // Yükseklik haritası (sin dalgası)
      const yukseklik = 2 + Math.floor(
        Math.sin(x * 0.4) * Math.cos(z * 0.4) * 1.5 +
        Math.sin(x * 0.15 + z * 0.25) * 0.8
      );
      
      for (let y = 0; y <= yukseklik; y++) {
        let blokTip = 0;
        if (y === 0) blokTip = 5;
        else if (y < yukseklik - 1) blokTip = 3;
        else if (y === yukseklik - 1 && y > 2) blokTip = 1;
        else blokTip = 2;
        
        blokEkle(x, y, z, blokTip, true);
      }
    }
  }

  // Ağaçlar
  const agacKonumlari = [
    [-5, 0, -4], [4, 0, 5], [-3, 0, 6], [6, 0, -3], 
    [0, 0, -7], [-7, 0, 2], [3, 0, -6], [-6, 0, -5]
  ];
  
  agacKonumlari.forEach(pos => {
    const [x, _, z] = pos;
    // Zemin yüksekliğini bul
    let yerY = 0;
    for (let y = 10; y >= 0; y--) {
      if (world[`${x},${y},${z}`] !== undefined) {
        yerY = y + 1;
        break;
      }
    }
    if (yerY <= 0 || yerY > 8) return;
    
    for (let i = 0; i < 4; i++) {
      blokEkle(x, yerY + i, z, 4, true);
    }
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (let dy = 3; dy <= 4; dy++) {
          if (dx === 0 && dz === 0 && dy === 3) continue;
          if (world[`${x+dx},${yerY+dy},${z+dz}`] !== undefined) continue;
          blokEkle(x + dx, yerY + dy, z + dz, 2, true);
        }
      }
    }
  });
}

// --- BLOK İŞLEMLERİ ---
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
    
    mesh.userData.isBlock = true;
    mesh.userData.pos = { x, y, z };
    mesh.userData.tip = tip;
    
    blockGroup.add(mesh);
    blockMeshes[key] = mesh;
  }
}

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

function blokVarMi(x, y, z) {
  return world[`${x},${y},${z}`] !== undefined;
}

// --- ÇARPIŞMA ---
function karakterCarpiyorMu(x, y, z) {
  const bx = Math.floor(x);
  const by = Math.floor(y);
  const bz = Math.floor(z);
  
  for (let ox = -1; ox <= 1; ox++) {
    for (let oz = -1; oz <= 1; oz++) {
      for (let oy = 0; oy <= 1; oy++) {
        const key = `${bx+ox},${by+oy},${bz+oz}`;
        if (world[key] !== undefined) {
          const blkX = bx + ox;
          const blkY = by + oy;
          const blkZ = bz + oz;
          
          // AABB: oyuncu = 0.6x0.6 genişlik, 0.8 yükseklik
          // blok = 1x1x1, kamera göz hizasında (y+0.5)
          if (x + 0.3 > blkX - 0.5 && x - 0.3 < blkX + 0.5 &&
              y + 0.8 > blkY - 0.5 && y - 0.5 < blkY + 0.5 &&
              z + 0.3 > blkZ - 0.5 && z - 0.3 < blkZ + 0.5) {
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
  
  canvas.addEventListener('click', () => {
    if (!pointerLocked && !isMobile) {
      canvas.requestPointerLock();
    }
  });
  
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!pointerLocked || isMobile) return;
    playerRotY -= e.movementX * 0.002;
    playerRotX -= e.movementY * 0.002;
    playerRotX = Math.max(-1.2, Math.min(1.2, playerRotX));
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 && pointerLocked) blokKirYap();
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (pointerLocked) blokKoyYap();
  });
}

// --- MOBİL ---
function setupMobile() {
  if (!isMobile) return;
  
  const joypad = document.getElementById('joypad');
  const joyIcerik = document.getElementById('joy-icerik');
  
  joypad.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  
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
    joyIcerik.style.transform = 'translate(-25px, -25px)';
    hareketEdiyor.x = 0;
    hareketEdiyor.z = 0;
  }, { passive: false });

  document.getElementById('btn-zıpla').addEventListener('touchstart', (e) => {
    e.preventDefault();
    zipliyor = true;
  }, { passive: false });
  document.getElementById('btn-zıpla').addEventListener('touchend', (e) => {
    e.preventDefault();
    zipliyor = false;
  }, { passive: false });

  document.getElementById('btn-yer').addEventListener('touchstart', (e) => {
    e.preventDefault();
    blokKoyYap();
  }, { passive: false });

  renderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && !e.target.closest('#mobilKontroller') && !e.target.closest('#blokSecim')) {
      const touch = e.touches[0];
      const mouse = new THREE.Vector2(
        (touch.clientX / window.innerWidth) * 2 - 1,
        -(touch.clientY / window.innerHeight) * 2 + 1
      );
      setTimeout(() => blokKirYap(mouse), 10);
    }
  }, { passive: true });

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

// --- BLOK KIR/KOY ---
function blokKirYap(mousePos) {
  const center = mousePos || new THREE.Vector2(0, 0);
  raycaster.setFromCamera(center, camera);
  const intersects = raycaster.intersectObjects(blockGroup.children, false);
  for (const intersect of intersects) {
    const obj = intersect.object;
    if (obj.userData && obj.userData.isBlock) {
      blokSil(obj.userData.pos.x, obj.userData.pos.y, obj.userData.pos.z);
      return;
    }
  }
}

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
      
      // Karakterin üzerine koyma
      const px = Math.floor(camera.position.x);
      const py = Math.floor(camera.position.y);
      const pz = Math.floor(camera.position.z);
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
    // Hareket girdisi
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
    
    // Normalize
    if (hx !== 0 || hz !== 0) {
      const len = Math.sqrt(hx*hx + hz*hz);
      if (len > 1) { hx /= len; hz /= len; }
    }
    
    // Kamera yönü
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY);
    
    const hiz = 0.1;
    let moveX = forward.x * hz + right.x * hx;
    let moveZ = forward.z * hz + right.z * hx;
    
    // X hareket + çarpışma
    const ySimdiki = camera.position.y;
    if (moveX !== 0) {
      const yeniX = camera.position.x + moveX * hiz;
      if (!karakterCarpiyorMu(yeniX, ySimdiki, camera.position.z)) {
        camera.position.x = yeniX;
      }
    }
    
    // Z hareket + çarpışma
    if (moveZ !== 0) {
      const yeniZ = camera.position.z + moveZ * hiz;
      if (!karakterCarpiyorMu(camera.position.x, ySimdiki, yeniZ)) {
        camera.position.z = yeniZ;
      }
    }
    
    // === FİZİK (Yerçekimi + Zıplama) ===
    // Space'e yeni basıldı mı kontrolü (basılı tutunca tekrar zıplamasın)
    const spaceBasildi = keys[' '] && !oncekiKeys[' '];
    const mobilZiplaBasildi = zipliyor && !oncekiZipliyor;
    
    if (yerde) {
      yGravity = 0;
      // Sadece yeni basıldıysa zıpla
      if (spaceBasildi || mobilZiplaBasildi) {
        yGravity = 0.28;
        yerde = false;
      }
    } else {
      // Havada - yerçekimi uygula
      yGravity -= 0.015;
      const yeniY = camera.position.y + yGravity;
      
      if (!karakterCarpiyorMu(camera.position.x, yeniY, camera.position.z)) {
        camera.position.y = yeniY;
      } else {
        // Bir bloğa çarptı
        if (yGravity < 0) {
          // Düşüyordu -> yere indi
          camera.position.y = Math.floor(camera.position.y) + 0.6;
          yGravity = 0;
          yerde = true;
        } else {
          // Yükseliyordu -> kafasını vurdu
          yGravity = 0;
        }
      }
    }
    
    // Bir önceki frame'in key durumunu sakla (space basılı tutma kontrolü için)
    oncekiKeys[' '] = keys[' '];
    oncekiZipliyor = zipliyor;
    
    // Oyuncu düşünce spawn
    if (camera.position.y < -20) {
      camera.position.set(0, 10, 0);
      yGravity = 0;
      yerde = false;
    }
    
    // Kamera rotasyonu
    camera.quaternion.setFromEuler(new THREE.Euler(playerRotX, playerRotY, 0, 'YXZ'));
    
    // Koordinat göster
    document.getElementById('koordinat').textContent = 
      `${Math.round(camera.position.x)}, ${Math.floor(camera.position.y)}, ${Math.round(camera.position.z)}`;
  }
  
  renderer.render(scene, camera);
}
