/* ============================================
   VoxelCraft v6 - YAĞ GİBİ OPTİMİZE
   ============================================ */

// --- DEĞİŞKENLER ---
let scene, camera, renderer, raycaster;
let world = {};
let playerPos = { x: 0, y: 10, z: 0 };
let playerRotX = 0, playerRotY = 0;
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
let dunyaMesh = null; // Birleştirilmiş dünya meshi
let tekBlokGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75); // Raycast için küçük

const BLOK_TIPLERI = {
  1: { name: 'Toprak', color: 0x8B4513 },
  2: { name: 'Çimen', color: 0x4a7023 },
  3: { name: 'Taş', color: 0x808080 },
  4: { name: 'Odun', color: 0xC19A6B },
  5: { name: 'Kömür', color: 0x2c2c2c },
  6: { name: 'Kum', color: 0xf5f5dc },
};

const renderMesafesi = 8;

// --- BAŞLAT ---
function baslat() {
  document.getElementById('info').style.display = 'none';
  document.getElementById('ui').style.display = 'block';
  
  isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) document.getElementById('mobilKontroller').style.display = 'flex';

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 30, 45);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(playerPos.x, playerPos.y, playerPos.z);

  // OPTİMİZE RENDERER - gölge yok, pixel ratio 1
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1);
  document.body.appendChild(renderer.domElement);

  // Basit ışık - gölge yok
  scene.add(new THREE.AmbientLight(0x888888, 0.7));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(5, 15, 8);
  scene.add(dirLight);
  scene.add(new THREE.DirectionalLight(0x8888ff, 0.3).position.set(-5, 5, -5));

  blockGroup = new THREE.Group();
  scene.add(blockGroup);
  
  dunyaOlustur();
  dunyaMeshOlustur(); // Tüm blokları tek meshe çevir

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
  // Ağaçlar
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

// TÜM BLOKLARI TEK MESH'TE BİRLEŞTİR
function dunyaMeshOlustur() {
  if (dunyaMesh) { blockGroup.remove(dunyaMesh); dunyaMesh.geometry.dispose(); dunyaMesh.material.dispose(); }
  
  const groups = {};
  for (const key in world) {
    const tip = world[key];
    if (!groups[tip]) groups[tip] = [];
    const [x, y, z] = key.split(',').map(Number);
    // Görünmeyen yüzleri atla - eğer 6 yüzü de kapalıysa bloku ekleme
    if (blokGizliMi(x, y, z)) continue;
    groups[tip].push({ x, y, z });
  }
  
  const materyaller = {};
  for (const tip in groups) {
    const renk = BLOK_TIPLERI[tip]?.color || 0x888888;
    materyaller[tip] = new THREE.MeshLambertMaterial({ color: renk });
  }
  
  // Her blok tipi için ayrı merged mesh
  const meshParcalari = [];
  for (const tip in groups) {
    const positions = groups[tip];
    if (positions.length === 0) continue;
    
    // Sadece görünen yüzleri olan bloklar için mesh oluştur
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = materyaller[tip];
    
    for (const pos of positions) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.updateMatrix();
      meshParcalari.push(mesh);
    }
    
    geo.dispose(); // Her blok için ayrı geo kullanma, referans al
  }
  
  // Tüm mesh'leri birleştir
  if (meshParcalari.length > 0) {
    const merged = THREE.BufferGeometryUtils ? null : null;
    
    // Eğer BufferGeometryUtils varsa kullan, yoksa her tip için ayrı merged
    if (typeof THREE.BufferGeometryUtils !== 'undefined' && THREE.BufferGeometryUtils.mergeGeometries) {
      const geos = meshParcalari.map(m => {
        m.updateMatrix();
        const g = m.geometry.clone();
        g.applyMatrix4(m.matrix);
        return g;
      });
      const mergedGeo = THREE.BufferGeometryUtils.mergeGeometries(geos, false);
      const mergedMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 }); // Varsayılan renk
      dunyaMesh = new THREE.Mesh(mergedGeo, mergedMat);
      dunyaMesh.userData.isDunya = true;
      blockGroup.add(dunyaMesh);
      geos.forEach(g => g.dispose());
    } else {
      // Fallback: her tip için ayrı mesh (yine de her blok ayrı olmaktan iyi)
      for (const tip in groups) {
        const bloklar = groups[tip];
        if (bloklar.length === 0) continue;
        
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = materyaller[tip];
        const tempGroup = new THREE.Group();
        
        for (const pos of bloklar) {
          const m = new THREE.Mesh(geo, mat);
          m.position.set(pos.x, pos.y, pos.z);
          m.updateMatrix();
          tempGroup.add(m);
        }
        
        // Tek seferde birleştir
        const positions_array = [];
        const normals_array = [];
        const uvs_array = [];
        const indices_array = [];
        let offset = 0;
        
        for (const pos of bloklar) {
          // 6 yüz * 4 vertex = 24 vertex
          const [px, py, pz] = [pos.x, pos.y, pos.z];
          const half = 0.5;
          
          // Ön yüz
          const v = [
            [-half+px, -half+py,  half+pz], [ half+px, -half+py,  half+pz], [ half+px,  half+py,  half+pz], [-half+px,  half+py,  half+pz]
          ];
          const idx = offset;
          v.forEach(p => { positions_array.push(...p); normals_array.push(0,0,1); uvs_array.push(0,0); });
          indices_array.push(idx, idx+1, idx+2, idx, idx+2, idx+3);
          offset += 4;
          
          // Arka yüz
          v.forEach((_,i) => {
            const p = [[ half+px, -half+py, -half+pz], [-half+px, -half+py, -half+pz], [-half+px,  half+py, -half+pz], [ half+px,  half+py, -half+pz]][i];
            positions_array.push(...p); normals_array.push(0,0,-1); uvs_array.push(0,0);
          });
          indices_array.push(offset, offset+1, offset+2, offset, offset+2, offset+3);
          offset += 4;
          
          // Üst yüz
          v.forEach((_,i) => {
            const p = [[-half+px,  half+py,  half+pz], [ half+px,  half+py,  half+pz], [ half+px,  half+py, -half+pz], [-half+px,  half+py, -half+pz]][i];
            positions_array.push(...p); normals_array.push(0,1,0); uvs_array.push(0,0);
          });
          indices_array.push(offset, offset+1, offset+2, offset, offset+2, offset+3);
          offset += 4;
          
          // Alt yüz
          v.forEach((_,i) => {
            const p = [[-half+px, -half+py, -half+pz], [ half+px, -half+py, -half+pz], [ half+px, -half+py,  half+pz], [-half+px, -half+py,  half+pz]][i];
            positions_array.push(...p); normals_array.push(0,-1,0); uvs_array.push(0,0);
          });
          indices_array.push(offset, offset+1, offset+2, offset, offset+2, offset+3);
          offset += 4;
          
          // Sağ yüz
          v.forEach((_,i) => {
            const p = [[ half+px, -half+py,  half+pz], [ half+px, -half+py, -half+pz], [ half+px,  half+py, -half+pz], [ half+px,  half+py,  half+pz]][i];
            positions_array.push(...p); normals_array.push(1,0,0); uvs_array.push(0,0);
          });
          indices_array.push(offset, offset+1, offset+2, offset, offset+2, offset+3);
          offset += 4;
          
          // Sol yüz
          v.forEach((_,i) => {
            const p = [[-half+px, -half+py, -half+pz], [-half+px, -half+py,  half+pz], [-half+px,  half+py,  half+pz], [-half+px,  half+py, -half+pz]][i];
            positions_array.push(...p); normals_array.push(-1,0,0); uvs_array.push(0,0);
          });
          indices_array.push(offset, offset+1, offset+2, offset, offset+2, offset+3);
          offset += 4;
        }
        
        const mergedGeo = new THREE.BufferGeometry();
        mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions_array, 3));
        mergedGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals_array, 3));
        mergedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs_array, 2));
        mergedGeo.setIndex(indices_array);
        mergedGeo.computeVertexNormals();
        
        const mergedMesh = new THREE.Mesh(mergedGeo, mat);
        mergedMesh.userData.isDunya = true;
        mergedMesh.userData.blokTipi = parseInt(tip);
        blockGroup.add(mergedMesh);
      }
    }
  }
  
  // Blok kırma/koyma için görünmez hitbox mesh'leri oluştur (sadece raycast için)
  // Bunları küçük ve basit tut
  for (const key in world) {
    const [x, y, z] = key.split(',').map(Number);
    const tip = world[key];
    const goster = new THREE.BoxGeometry(1, 1, 1);
    const m = new THREE.MeshBasicMaterial({ visible: false }); // Görünmez!
    const dummy = new THREE.Mesh(goster, m);
    dummy.position.set(x, y, z);
    dummy.userData = { isBlock: true, pos: { x, y, z }, tip };
    blockGroup.add(dummy);
  }
  
  meshParcalari.forEach(m => { m.geometry.dispose(); m.material.dispose(); });
}

function blokGizliMi(x, y, z) {
  // 6 yönün hepsinde blok varsa bu blok içte = çizilmesine gerek yok
  return blokVarMi(x+1,y,z) && blokVarMi(x-1,y,z) && blokVarMi(x,y+1,z) && blokVarMi(x,y-1,z) && blokVarMi(x,y,z+1) && blokVarMi(x,y,z-1);
}

function blokEkle(x, y, z, tip) {
  const key = `${x},${y},${z}`;
  world[key] = tip;
  // Görünür dummy mesh ekle (raycast için)
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ visible: false });
  const dummy = new THREE.Mesh(geo, mat);
  dummy.position.set(x, y, z);
  dummy.userData = { isBlock: true, pos: { x, y, z }, tip };
  blockGroup.add(dummy);
  dunyaMeshOlustur(); // Ana mesh'i yeniden oluştur
}

function blokSil(x, y, z) {
  const key = `${x},${y},${z}`;
  if (world[key] === undefined) return false;
  delete world[key];
  // Dummy mesh'leri temizle (yeniden oluşturulacak)
  while(blockGroup.children.length > 0) {
    const child = blockGroup.children[0];
    blockGroup.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }
  dunyaMeshOlustur(); // Ana mesh'i yeniden oluştur
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
        const blkX = bx+ox, blkY = by+oy, blkZ = bz+oz;
        if (x+0.3 > blkX-0.5 && x-0.3 < blkX+0.5 && y+0.8 > blkY-0.5 && y-0.5 < blkY+0.5 && z+0.3 > blkZ-0.5 && z-0.3 < blkZ+0.5) return true;
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
    playerRotY -= e.movementX * 0.002;
    playerRotX -= e.movementY * 0.002;
    playerRotX = Math.max(-1.2, Math.min(1.2, playerRotX));
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
    const px = Math.floor(camera.position.x), py = Math.floor(camera.position.y), pz = Math.floor(camera.position.z);
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
    if (keys['w']||keys['arrowup']) hz = 1;
    if (keys['s']||keys['arrowdown']) hz = -1;
    if (keys['a']||keys['arrowleft']) hx = -1;
    if (keys['d']||keys['arrowright']) hx = 1;
  } else { hx = hareketEdiyor.x; hz = hareketEdiyor.z; }
  
  if (hx !== 0 || hz !== 0) { const l = Math.sqrt(hx*hx+hz*hz); if (l>1) { hx/=l; hz/=l; } }
  
  const fwd = new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0), playerRotY);
  const rgt = new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0), playerRotY);
  const hiz = 0.035;
  const mx = fwd.x*hz + rgt.x*hx, mz = fwd.z*hz + rgt.z*hx, ys = camera.position.y;
  
  if (mx !== 0) { const xn = camera.position.x+mx*hiz; if (!karakterCarpiyorMu(xn, ys, camera.position.z)) camera.position.x = xn; }
  if (mz !== 0) { const zn = camera.position.z+mz*hiz; if (!karakterCarpiyorMu(camera.position.x, ys, zn)) camera.position.z = zn; }
  
  if (altindaBlokVarMi(camera.position.x, camera.position.y, camera.position.z) && yGravity <= 0) {
    yerde = true; yGravity = 0;
    if (ziplamayaHazir && (keys[' '] || zipliyor)) { yGravity = 0.20; yerde = false; ziplamayaHazir = false; }
  } else {
    yerde = false; yGravity -= 0.02;
    if (yGravity < -0.25) yGravity = -0.25;
    const yn = camera.position.y + yGravity;
    if (!karakterCarpiyorMu(camera.position.x, yn, camera.position.z)) camera.position.y = yn;
    else if (yGravity < 0) { camera.position.y = Math.floor(camera.position.y)+0.6; yGravity = 0; yerde = true; }
    else yGravity = 0;
  }
  
  if (camera.position.y < -20) {
    let ey = 2;
    for (let x=-2;x<=2;x++) for (let z=-2;z<=2;z++) for (let y=10;y>=0;y--) if (blokVarMi(x,y,z)) { ey=Math.max(ey,y); break; }
    camera.position.set(0, ey+2, 0); yGravity = -0.01; yerde = false;
  }
  
  camera.quaternion.setFromEuler(new THREE.Euler(playerRotX, playerRotY, 0, 'YXZ'));
  document.getElementById('koordinat').textContent = `${Math.round(camera.position.x)}, ${Math.floor(camera.position.y)}, ${Math.round(camera.position.z)}`;
  renderer.render(scene, camera);
}
