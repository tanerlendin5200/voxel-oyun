/* ============================================
   VoxelCraft v7 - KOMİK KEDİ + 3. ŞAHIS + YÜKSEK ZIPLAMA
   ============================================ */

// --- DEĞİŞKENLER ---
let scene, camera, renderer, raycaster;
let world = {};
let playerPos = { x: 0, y: 10, z: 6 };
let playerRotY = 0;
let isMobile = false;
let pointerLocked = false;
let keys = {};
let seciliBlok = 1;
let hareketEdiyor = { x: 0, y: 0, z: 0 };
let zipliyor = false;
let yGravity = 0;
let yerde = false;
let ziplamayaHazir = true;
let blockGroup;
let kedi; // Kedi mesh

const BLOK_TIPLERI = {
  1: { name: 'Toprak', color: 0x8B4513 },
  2: { name: 'Çimen', color: 0x4a7023 },
  3: { name: 'Taş', color: 0x808080 },
  4: { name: 'Odun', color: 0xC19A6B },
  5: { name: 'Kömür', color: 0x2c2c2c },
  6: { name: 'Kum', color: 0xf5f5dc },
};

const renderMesafesi = 8;

// --- KEDİ OLUŞTUR ---
function kediOlustur() {
  const grup = new THREE.Group();

  // Gövde (turuncu kedi)
  const govdeGeo = new THREE.BoxGeometry(0.8, 0.5, 1.2);
  const govdeMat = new THREE.MeshLambertMaterial({ color: 0xff8c00 });
  const govde = new THREE.Mesh(govdeGeo, govdeMat);
  govde.position.y = 0.3;
  grup.add(govde);

  // Kafa
  const kafaGeo = new THREE.BoxGeometry(0.7, 0.6, 0.6);
  const kafaMat = new THREE.MeshLambertMaterial({ color: 0xff8c00 });
  const kafa = new THREE.Mesh(kafaGeo, kafaMat);
  kafa.position.set(0, 0.7, 0.7);
  grup.add(kafa);

  // Gözler (beyaz)
  const gozMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  for (let side = -1; side <= 1; side += 2) {
    const goz = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), gozMat);
    goz.position.set(side * 0.25, 0.75, 0.95);
    grup.add(goz);
  }

  // Göz bebekleri (siyah)
  const bebekMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
  for (let side = -1; side <= 1; side += 2) {
    const bebek = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.12), bebekMat);
    bebek.position.set(side * 0.25, 0.73, 1);
    grup.add(bebek);
  }

  // Burun (pembe)
  const burun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: 0xff69b4 }));
  burun.position.set(0, 0.68, 1);
  grup.add(burun);

  // Ağız (çizgi)
  const agiz = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.05), new THREE.MeshLambertMaterial({ color: 0x000000 }));
  agiz.position.set(0, 0.6, 1);
  grup.add(agiz);

  // Bıyıklar (ince çubuklar)
  const biyikMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  for (let side = -1; side <= 1; side += 2) {
    for (let i = -1; i <= 1; i++) {
      const biyik = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), biyikMat);
      biyik.position.set(side * 0.45, 0.65 + i * 0.05, 0.95);
      biyik.rotation.z = side * (0.1 + i * 0.1);
      grup.add(biyik);
    }
  }

  // Kulaklar (üçgen - box ile taklit)
  const kulakMat = new THREE.MeshLambertMaterial({ color: 0xff8c00 });
  for (let side = -1; side <= 1; side += 2) {
    const kulak = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.12), kulakMat);
    kulak.position.set(side * 0.32, 0.95, 0.65);
    kulak.rotation.z = side * 0.3;
    grup.add(kulak);
    // İç kulak (pembe)
    const icKulak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.13), new THREE.MeshLambertMaterial({ color: 0xffb6c1 }));
    icKulak.position.set(side * 0.32, 0.9, 0.65);
    icKulak.rotation.z = side * 0.3;
    grup.add(icKulak);
  }

  // Ön bacaklar
  const bacakMat = new THREE.MeshLambertMaterial({ color: 0xff8c00 });
  for (let side = -1; side <= 1; side += 2) {
    const bacak = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), bacakMat);
    bacak.position.set(side * 0.3, -0.1, 0.4);
    grup.add(bacak);
  }

  // Arka bacaklar
  for (let side = -1; side <= 1; side += 2) {
    const bacak = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.18), bacakMat);
    bacak.position.set(side * 0.3, -0.05, -0.4);
    grup.add(bacak);
  }

  // Kuyruk (yukarı kalkık)
  const kuyrukMat = new THREE.MeshLambertMaterial({ color: 0xe67600 });
  const kuyruk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), kuyrukMat);
  kuyruk.position.set(0, 0.45, -0.7);
  kuyruk.rotation.x = 0.4;
  grup.add(kuyruk);

  // Kuyruk ucu
  const kuyrukUcu = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xffa500 }));
  kuyrukUcu.position.set(0, 0.65, -0.85);
  grup.add(kuyrukUcu);

  // Çizgiler (sırt)
  const cizgiMat = new THREE.MeshLambertMaterial({ color: 0xcc6600 });
  for (let i = -1; i <= 1; i++) {
    const cizgi = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.3), cizgiMat);
    cizgi.position.set(i * 0.2, 0.5, 0);
    grup.add(cizgi);
  }

  grup.position.y = 0.35;
  grup.castShadow = true;
  return grup;
}

// --- BAŞLAT ---
function baslat() {
  document.getElementById('info').style.display = 'none';
  document.getElementById('ui').style.display = 'block';
  
  isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) document.getElementById('mobilKontroller').style.display = 'flex';

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 30, 45);

  // KAMERA - 3. ŞAHIS (kedinin arkasından)
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);

  // Renderer - optimize
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // Işık
  scene.add(new THREE.AmbientLight(0x999999, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 15, 8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 512;
  dirLight.shadow.mapSize.height = 512;
  scene.add(dirLight);

  blockGroup = new THREE.Group();
  scene.add(blockGroup);
  
  dunyaOlustur();
  dunyaMeshOlustur();

  // KEDİYİ EKLE
  kedi = kediOlustur();
  kedi.position.set(playerPos.x, playerPos.y, playerPos.z);
  scene.add(kedi);

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

  yerde = false;
  yGravity = -0.01;
  loop();
}

// --- DÜNYA ---
function dunyaOlustur() {
  for (let x = -renderMesafesi; x <= renderMesafesi; x++) {
    for (let z = -renderMesafesi; z <= renderMesafesi; z++) {
      const yukseklik = 2 + Math.floor(
        Math.sin(x * 0.4) * Math.cos(z * 0.4) * 1.5 +
        Math.sin(x * 0.15 + z * 0.25) * 0.8
      );
      for (let y = 0; y <= yukseklik; y++) {
        let tip = 5;
        if (y > 0) {
          if (y < yukseklik - 1) tip = 3;
          else if (y === yukseklik - 1 && y > 2) tip = 1;
          else tip = 2;
        }
        world[`${x},${y},${z}`] = tip;
      }
    }
  }
  [[-5,0,-4],[4,0,5],[-3,0,6],[6,0,-3],[0,0,-7],[-7,0,2],[3,0,-6],[-6,0,-5]].forEach(([x,_,z]) => {
    let yerY = 0;
    for (let y = 10; y >= 0; y--) { if (world[`${x},${y},${z}`] !== undefined) { yerY = y + 1; break; } }
    if (yerY <= 0 || yerY > 8) return;
    for (let i = 0; i < 4; i++) world[`${x},${yerY+i},${z}`] = 4;
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++)
        for (let dy = 3; dy <= 4; dy++)
          if (!(dx === 0 && dz === 0 && dy === 3) && world[`${x+dx},${yerY+dy},${z+dz}`] === undefined)
            world[`${x+dx},${yerY+dy},${z+dz}`] = 2;
  });
}

function dunyaMeshOlustur() {
  blockGroup.children.forEach(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
  blockGroup.clear();

  const dummyMat = new THREE.MeshBasicMaterial({ visible: false });
  for (const key in world) {
    const [x, y, z] = key.split(',').map(Number);
    const tip = world[key];
    const dummy = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), dummyMat);
    dummy.position.set(x, y, z);
    dummy.userData = { isBlock: true, pos: { x, y, z }, tip };
    blockGroup.add(dummy);
  }

  // Görünür mesh - sadece dış yüzler
  let posArray = [], idxArray = [], colArray = [];
  let offset = 0;
  for (const key in world) {
    const [x, y, z] = key.split(',').map(Number);
    const tip = world[key];
    const renk = BLOK_TIPLERI[tip]?.color || 0x888888;
    const r = ((renk >> 16) & 0xFF) / 255;
    const g = ((renk >> 8) & 0xFF) / 255;
    const b = (renk & 0xFF) / 255;

    // 6 yüz - sadece dışarı bakanları çiz
    const komsular = [
      [1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]
    ];
    const yuzNormals = [
      [1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]
    ];
    const yuzVertices = [
      // sağ, sol, üst, alt, ön, arka
      [[0.5,-0.5,0.5],[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[0.5,0.5,0.5]],
      [[-0.5,-0.5,-0.5],[-0.5,-0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,-0.5]],
      [[-0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5]],
      [[-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,-0.5,0.5],[-0.5,-0.5,0.5]],
      [[-0.5,-0.5,0.5],[0.5,-0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5]],
      [[0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5,0.5,-0.5],[0.5,0.5,-0.5]]
    ];

    for (let f = 0; f < 6; f++) {
      const [dx, dy, dz] = komsular[f];
      if (blokVarMi(x+dx, y+dy, z+dz)) continue; // Komşu varsa bu yüzü çizme

      const verts = yuzVertices[f];
      const n = yuzNormals[f];
      const vPos = [
        [x+verts[0][0], y+verts[0][1], z+verts[0][2]],
        [x+verts[1][0], y+verts[1][1], z+verts[1][2]],
        [x+verts[2][0], y+verts[2][1], z+verts[2][2]],
        [x+verts[3][0], y+verts[3][1], z+verts[3][2]]
      ];

      vPos.forEach(p => { posArray.push(...p); colArray.push(r, g, b); });
      idxArray.push(offset, offset+1, offset+2, offset, offset+2, offset+3);
      offset += 4;
    }
  }

  if (posArray.length > 0) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posArray, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colArray, 3));
    geo.setIndex(idxArray);
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.isDunya = true;
    blockGroup.add(mesh);
  }
}

function blokGizliMi(x, y, z) {
  return blokVarMi(x+1,y,z) && blokVarMi(x-1,y,z) && blokVarMi(x,y+1,z) && blokVarMi(x,y-1,z) && blokVarMi(x,y,z+1) && blokVarMi(x,y,z-1);
}

function blokEkle(x, y, z, tip) {
  world[`${x},${y},${z}`] = tip;
  dunyaMeshOlustur();
}

function blokSil(x, y, z) {
  const key = `${x},${y},${z}`;
  if (world[key] === undefined) return false;
  delete world[key];
  dunyaMeshOlustur();
  return true;
}

function blokVarMi(x, y, z) { return world[`${x},${y},${z}`] !== undefined; }

function altindaBlokVarMi(x, y, z) {
  const ayakY = Math.floor(y - 0.5);
  for (let ox = -1; ox <= 1; ox++)
    for (let oz = -1; oz <= 1; oz++)
      if (blokVarMi(Math.floor(x) + ox, ayakY, Math.floor(z) + oz)) return true;
  return false;
}

function karakterCarpiyorMu(x, y, z) {
  const bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z);
  for (let ox = -1; ox <= 1; ox++)
    for (let oz = -1; oz <= 1; oz++)
      for (let oy = 0; oy <= 1; oy++) {
        if (!blokVarMi(bx+ox, by+oy, bz+oz)) continue;
        if (x+0.3>bx+ox-0.5 && x-0.3<bx+ox+0.5 && y+0.8>by+oy-0.5 && y-0.5<by+oy+0.5 && z+0.3>bz+oz-0.5 && z-0.3<bz+oz+0.5) return true;
      }
  return false;
}

// --- KONTROLLER ---
function setupKontroller() {
  document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; if (e.key === ' ') e.preventDefault(); });
  document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; if (e.key === ' ') ziplamayaHazir = true; });
}

function setupMouse() {
  const canvas = renderer.domElement;
  canvas.addEventListener('click', () => { if (!pointerLocked && !isMobile) canvas.requestPointerLock(); });
  document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === canvas; });
  document.addEventListener('mousemove', (e) => {
    if (!pointerLocked || isMobile) return;
    playerRotY -= e.movementX * 0.003;
  });
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0 && pointerLocked) blokKirYap(); });
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); if (pointerLocked) blokKoyYap(); });
}

function setupMobile() {
  if (!isMobile) return;
  const jp = document.getElementById('joypad'), ji = document.getElementById('joy-icerik');
  jp.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  jp.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0], r = jp.getBoundingClientRect();
    let dx = t.clientX - (r.left+r.width/2), dy = t.clientY - (r.top+r.height/2);
    const m = r.width/2 - 15, d = Math.sqrt(dx*dx+dy*dy);
    if (d > m) { dx = dx/d*m; dy = dy/d*m; }
    ji.style.transform = `translate(${-25+dx}px,${-25+dy}px)`;
    hareketEdiyor.x = dx/m; hareketEdiyor.z = -dy/m;
  }, { passive: false });
  jp.addEventListener('touchend', e => { e.preventDefault(); ji.style.transform = 'translate(-25px,-25px)'; hareketEdiyor.x = 0; hareketEdiyor.z = 0; }, { passive: false });
  document.getElementById('btn-zıpla').addEventListener('touchstart', e => { e.preventDefault(); zipliyor = true; }, { passive: false });
  document.getElementById('btn-zıpla').addEventListener('touchend', e => { e.preventDefault(); zipliyor = false; }, { passive: false });
  document.getElementById('btn-yer').addEventListener('touchstart', e => { e.preventDefault(); blokKoyYap(); }, { passive: false });
  renderer.domElement.addEventListener('touchstart', e => {
    if (e.touches.length === 1 && !e.target.closest('#mobilKontroller') && !e.target.closest('#blokSecim')) {
      setTimeout(() => blokKirYap(new THREE.Vector2((e.touches[0].clientX/window.innerWidth)*2-1, -(e.touches[0].clientY/window.innerHeight)*2+1)), 10);
    }
  }, { passive: true });
  document.querySelectorAll('.blok-item').forEach(el => { el.addEventListener('click', () => { document.querySelectorAll('.blok-item').forEach(i => i.classList.remove('active')); el.classList.add('active'); seciliBlok = parseInt(el.dataset.tip); }); });
}

function blokKirYap(mousePos) {
  const center = mousePos || new THREE.Vector2(0, 0);
  raycaster.setFromCamera(center, camera);
  for (const hit of raycaster.intersectObjects(blockGroup.children)) {
    if (hit.object.userData?.isBlock) { blokSil(hit.object.userData.pos.x, hit.object.userData.pos.y, hit.object.userData.pos.z); return; }
  }
}

function blokKoyYap() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  for (const hit of raycaster.intersectObjects(blockGroup.children)) {
    if (!hit.object.userData?.isBlock) continue;
    const p = hit.object.userData.pos, n = hit.face.normal;
    const nx = p.x+Math.round(n.x), ny = p.y+Math.round(n.y), nz = p.z+Math.round(n.z);
    const px = Math.floor(kedi.position.x), py = Math.floor(kedi.position.y), pz = Math.floor(kedi.position.z);
    if (nx === px && (ny === py || ny === py+1) && nz === pz) return;
    if (blokVarMi(nx, ny, nz)) return;
    blokEkle(nx, ny, nz, seciliBlok); return;
  }
}

// --- OYUN DÖNGÜSÜ ---
function loop() {
  requestAnimationFrame(loop);
  if (!pointerLocked && !isMobile) { renderer.render(scene, camera); return; }
  
  let hx = 0, hz = 0;
  if (!isMobile) {
    if (keys['w']||keys['arrowup']) hz = -1;
    if (keys['s']||keys['arrowdown']) hz = 1;
    if (keys['a']||keys['arrowleft']) hx = 1;
    if (keys['d']||keys['arrowright']) hx = -1;
  } else { hx = hareketEdiyor.x; hz = hareketEdiyor.z; }
  
  if (hx !== 0 || hz !== 0) { const l = Math.sqrt(hx*hx+hz*hz); if (l>1) { hx/=l; hz/=l; } }
  
  const fwd = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), playerRotY);
  const rgt = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), playerRotY);
  const hiz = 0.04;
  let mx = fwd.x*hz + rgt.x*hx, mz = fwd.z*hz + rgt.z*hx;
  
  const kx = kedi.position.x, ky = kedi.position.y, kz = kedi.position.z;
  
  if (mx !== 0) { const xn = kx+mx*hiz; if (!karakterCarpiyorMu(xn, ky, kz)) kedi.position.x = xn; }
  if (mz !== 0) { const zn = kz+mz*hiz; if (!karakterCarpiyorMu(kedi.position.x, ky, zn)) kedi.position.z = zn; }
  
  // Kedi fareyle birlikte dönsün (akıcı)
  kedi.rotation.y = playerRotY;
  
  // Fizik
  if (altindaBlokVarMi(kedi.position.x, kedi.position.y, kedi.position.z) && yGravity <= 0) {
    yerde = true; yGravity = 0;
    if (ziplamayaHazir && (keys[' '] || zipliyor)) {
      yGravity = 0.32; // YÜKSEK ZIPLAMA!
      yerde = false; ziplamayaHazir = false;
    }
  } else {
    yerde = false; yGravity -= 0.025;
    if (yGravity < -0.3) yGravity = -0.3;
    const yn = kedi.position.y + yGravity;
    if (!karakterCarpiyorMu(kedi.position.x, yn, kedi.position.z)) kedi.position.y = yn;
    else if (yGravity < 0) { kedi.position.y = Math.floor(kedi.position.y)+0.35; yGravity = 0; yerde = true; }
    else yGravity = 0;
  }
  
  if (kedi.position.y < -20) {
    let ey = 2;
    for (let x=-2;x<=2;x++) for (let z=-2;z<=2;z++) for (let y=10;y>=0;y--) if (blokVarMi(x,y,z)) { ey=Math.max(ey,y); break; }
    kedi.position.set(0, ey+2, 6); yGravity = -0.01; yerde = false;
  }
  
  // 3. ŞAHIS KAMERA - kedinin arkasından
  const kameraMesafe = 5;
  const kameraYukseklik = 3;
  const kameraX = kedi.position.x - Math.sin(playerRotY) * kameraMesafe;
  const kameraZ = kedi.position.z - Math.cos(playerRotY) * kameraMesafe;
  camera.position.set(kameraX, kedi.position.y + kameraYukseklik, kameraZ);
  camera.lookAt(kedi.position.x, kedi.position.y + 1, kedi.position.z);
  
  document.getElementById('koordinat').textContent = 
    `Kedi: ${Math.round(kedi.position.x)}, ${Math.floor(kedi.position.y)}, ${Math.round(kedi.position.z)}`;
  renderer.render(scene, camera);
}
