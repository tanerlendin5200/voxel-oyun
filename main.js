/* ============================================
   VoxelCraft v8 - ŞEHİR + KEDİ + ARABA
   ============================================ */

let scene, camera, renderer, raycaster;
let world = {};
let playerPos = { x: 0, y: 10, z: 6 };
let playerRotY = 0;
let playerRotX = 0.4;
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
let kedi;

const BLOK_TIPLERI = {
  1: { name: 'Toprak', color: 0x8B4513 },
  2: { name: 'Çimen', color: 0x4a7023 },
  3: { name: 'Taş', color: 0x808080 },
  4: { name: 'Odun', color: 0xC19A6B },
  5: { name: 'Kömür', color: 0x2c2c2c },
  6: { name: 'Kum', color: 0xf5f5dc },
  7: { name: 'Tuğla', color: 0xB22222 },
  8: { name: 'Çatı', color: 0x8B0000 },
  9: { name: 'Cam', color: 0x87CEEB },
  10: { name: 'Yol', color: 0x444444 },
  11: { name: 'Kaldırım', color: 0xAAAAAA },
  12: { name: 'Fener', color: 0xFFD700 },
};

const renderMesafesi = 12;

// --- KEDİ ---
function kediOlustur() {
  const grup = new THREE.Group();
  const gMat = new THREE.MeshLambertMaterial({ color: 0xff8c00 });
  const g = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), gMat);
  g.position.y = 0.3; grup.add(g);
  const k = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), gMat);
  k.position.set(0, 0.7, 0.7); grup.add(k);
  const w = new THREE.MeshLambertMaterial({ color: 0xffffff });
  for (let s=-1;s<=1;s+=2) { const e=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.1),w); e.position.set(s*0.25,0.75,0.95); grup.add(e); }
  const bMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
  for (let s=-1;s<=1;s+=2) { const e=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.15,0.12),bMat); e.position.set(s*0.25,0.73,1); grup.add(e); }
  grup.add(new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.08), new THREE.MeshLambertMaterial({color:0xff69b4})).position.set(0,0.68,1));
  const kMat = new THREE.MeshLambertMaterial({ color: 0xff8c00 });
  for (let s=-1;s<=1;s+=2) { const e=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.25,0.12),kMat); e.position.set(s*0.32,0.95,0.65); e.rotation.z=s*0.3; grup.add(e); }
  const bMat2 = new THREE.MeshLambertMaterial({ color: 0xff8c00 });
  for (let s=-1;s<=1;s+=2) { grup.add(new THREE.Mesh(new THREE.BoxGeometry(0.15,0.4,0.15),bMat2).position.set(s*0.3,-0.1,0.4)); }
  for (let s=-1;s<=1;s+=2) { grup.add(new THREE.Mesh(new THREE.BoxGeometry(0.18,0.45,0.18),bMat2).position.set(s*0.3,-0.05,-0.4)); }
  const kMat2 = new THREE.MeshLambertMaterial({ color: 0xe67600 });
  const kuy = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.5,0.08),kMat2);
  kuy.position.set(0,0.45,-0.7); kuy.rotation.x=0.4; grup.add(kuy);
  grup.scale.set(0.6,0.6,0.6); grup.position.y=0.25; grup.castShadow=true;
  return grup;
}

// --- ARABA ---
function arabaOlustur(x, y, z, renk=0xff0000) {
  const grup = new THREE.Group();
  const govde = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.2), new THREE.MeshLambertMaterial({color: renk}));
  govde.position.y = 0.3; grup.add(govde);
  const cam = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.8), new THREE.MeshLambertMaterial({color: 0x88ccff}));
  cam.position.set(0, 0.6, -0.2); grup.add(cam);
  const tMat = new THREE.MeshLambertMaterial({color: 0x222222});
  for (let s=-1;s<=1;s+=2) { for (let i=-1;i<=1;i+=2) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.15,0.2), tMat);
    t.position.set(s*0.45, 0.05, i*0.7); grup.add(t);
  }}
  const fMat = new THREE.MeshLambertMaterial({color: 0xffff00});
  const f = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.1,0.05), fMat);
  f.position.set(0, 0.3, 1.15); grup.add(f);
  const aMat = new THREE.MeshLambertMaterial({color: 0xff4444});
  for (let s=-1;s<=1;s+=2) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.1,0.1), aMat);
    a.position.set(s*0.5, 0.2, -1.1); grup.add(a);
  }
  grup.position.set(x, y, z);
  return grup;
}

// --- BAŞLAT ---
function baslat() {
  document.getElementById('info').style.display = 'none';
  document.getElementById('ui').style.display = 'block';
  isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) document.getElementById('mobilKontroller').style.display = 'flex';

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 35, 50);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 60);
  renderer = new THREE.WebGLRenderer({antialias:false});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0x999999,0.6));
  const dl = new THREE.DirectionalLight(0xffffff,0.8);
  dl.position.set(10,20,10); dl.castShadow=true;
  dl.shadow.mapSize.width=512; dl.shadow.mapSize.height=512;
  scene.add(dl);

  blockGroup = new THREE.Group();
  scene.add(blockGroup);

  sehirYap();
  dunyaMeshOlustur();

  kedi = kediOlustur();
  kedi.position.set(3, 5, 3);
  scene.add(kedi);

  // Arabaları ekle
  scene.add(arabaOlustur(5, 1, 2, 0xff0000));
  scene.add(arabaOlustur(-4, 1, -2, 0x0000ff));
  scene.add(arabaOlustur(2, 1, -5, 0x00aa00));

  raycaster = new THREE.Raycaster(); raycaster.far = 7;
  setupKontroller(); setupMouse(); setupMobile();
  window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
  yerde=false; yGravity=-0.01;
  loop();
}

// --- ŞEHİR ---
function sehirYap() {
  // Geniş arazi
  for (let x = -renderMesafesi; x <= renderMesafesi; x++) {
    for (let z = -renderMesafesi; z <= renderMesafesi; z++) {
      let yukseklik = 1;
      if (Math.abs(x) > 6 || Math.abs(z) > 6) {
        yukseklik = 2 + Math.floor(Math.sin(x*0.3)*Math.cos(z*0.3)*1.2 + Math.sin(x*0.12+z*0.2)*0.6);
      }
      for (let y = 0; y <= yukseklik; y++) {
        let tip = 5;
        if (y > 0) { tip = y < yukseklik ? 3 : 2; }
        world[`${x},${y},${z}`] = tip;
      }
    }
  }
  // Şehir merkezi (düz alan)
  for (let x = -6; x <= 6; x++)
    for (let z = -6; z <= 6; z++)
      world[`${x},1,${z}`] = 11;
  for (let x = -6; x <= 6; x++)
    world[`${x},1,0`] = 10;
  for (let z = -6; z <= 6; z++)
    world[`${0},1,${z}`] = 10;
  for (let x = -6; x <= 6; x++) {
    world[`${x},1,3`] = 10; world[`${x},1,-3`] = 10;
  }
  for (let z = -6; z <= 6; z++) {
    world[`${3},1,${z}`] = 10; world[`${-3},1,${z}`] = 10;
  }

  // EV 1 (sağ üst)
  for (let x = 4; x <= 7; x++) for (let z = 4; z <= 7; z++) {
    world[`${x},1,${z}`] = 7;
    if (x===4||x===7||z===4||z===7) for (let y=2;y<=4;y++) world[`${x},${y},${z}`] = 7;
  }
  for (let x=3;x<=8;x++) for (let z=3;z<=8;z++) world[`${x},5,${z}`] = 8;
  world[`${5},2,${4}`]=4; world[`${6},2,${4}`]=4;

  // EV 2 (sol üst)
  for (let x = -7; x <= -4; x++) for (let z = 4; z <= 7; z++) {
    world[`${x},1,${z}`] = 7;
    if (x===-7||x===-4||z===4||z===7) for (let y=2;y<=4;y++) world[`${x},${y},${z}`] = 7;
  }
  for (let x=-8;x<=-3;x++) for (let z=3;z<=8;z++) world[`${x},5,${z}`] = 8;
  world[`${-5},2,${7}`]=4; world[`${-6},2,${7}`]=4;

  // EV 3 (sağ alt)
  for (let x = 4; x <= 7; x++) for (let z = -7; z <= -4; z++) {
    world[`${x},1,${z}`] = 7;
    if (x===4||x===7||z===-4||z===-7) for (let y=2;y<=4;y++) world[`${x},${y},${z}`] = 7;
  }
  for (let x=3;x<=8;x++) for (let z=-8;z<=-3;z++) world[`${x},5,${z}`] = 8;
  world[`${5},2,${-4}`]=4; world[`${6},2,${-4}`]=4;

  // EV 4 (sol alt)
  for (let x = -7; x <= -4; x++) for (let z = -7; z <= -4; z++) {
    world[`${x},1,${z}`] = 7;
    if (x===-7||x===-4||z===-4||z===-7) for (let y=2;y<=4;y++) world[`${x},${y},${z}`] = 7;
  }
  for (let x=-8;x<=-3;x++) for (let z=-8;z<=-3;z++) world[`${x},5,${z}`] = 8;

  // EV 5 (sol orta)
  for (let x = -7; x <= -4; x++) for (let z = -2; z <= 1; z++) {
    world[`${x},1,${z}`] = 7;
    if (x===-7||x===-4||z===-2||z===1) for (let y=2;y<=4;y++) world[`${x},${y},${z}`] = 7;
  }
  for (let x=-8;x<=-3;x++) for (let z=-3;z<=2;z++) world[`${x},5,${z}`] = 8;

  // EV 6 (sağ orta)
  for (let x = 4; x <= 7; x++) for (let z = -2; z <= 1; z++) {
    world[`${x},1,${z}`] = 7;
    if (x===4||x===7||z===-2||z===1) for (let y=2;y<=4;y++) world[`${x},${y},${z}`] = 7;
  }
  for (let x=3;x<=8;x++) for (let z=-3;z<=2;z++) world[`${x},5,${z}`] = 8;

  // Fenerler
  const fenerler = [[-2,1,5],[2,1,5],[-5,1,5],[5,1,5],[-2,1,-5],[2,1,-5],[-5,1,-5],[5,1,-5]];
  fenerler.forEach(([fx,fy,fz]) => {
    world[`${fx},${fy+1},${fz}`] = 11;
    world[`${fx},${fy+2},${fz}`] = 11;
    world[`${fx},${fy+3},${fz}`] = 12;
  });

  // Ağaçlar (şehir dışı)
  const agaclar = [[-9,0,-9],[-9,0,9],[9,0,-9],[9,0,9],[-10,0,0],[10,0,0],[0,0,-10],[0,0,10],[-10,-5],[5,-10]];
  agaclar.forEach(([ax,az]) => {
    let ay = 0;
    for (let y=10;y>=0;y--) if (world[`${ax},${y},${az}`]!==undefined) { ay=y+1; break; }
    if (ay<=0||ay>6) return;
    for (let i=0;i<3;i++) world[`${ax},${ay+i},${az}`] = 4;
    for (let dx=-1;dx<=1;dx++) for (let dz=-1;dz<=1;dz++) world[`${ax+dx},${ay+2},${az+dz}`] = 2;
  });
}

// --- MESH ---
function dunyaMeshOlustur() {
  blockGroup.children.forEach(c=>{if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});
  blockGroup.clear();
  const dummyMat = new THREE.MeshBasicMaterial({visible:false});
  for (const key in world) {
    const [x,y,z]=key.split(',').map(Number);
    const tip=world[key];
    const d=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),dummyMat);
    d.position.set(x,y,z); d.userData={isBlock:true,pos:{x,y,z},tip}; blockGroup.add(d);
  }
  let posArray=[],idxArray=[],colArray=[]; let offset=0;
  for (const key in world) {
    const [x,y,z]=key.split(',').map(Number);
    const tip=world[key]; const renk=BLOK_TIPLERI[tip]?.color||0x888888;
    const r=((renk>>16)&0xFF)/255,g=((renk>>8)&0xFF)/255,b=(renk&0xFF)/255;
    const komsular=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    const yuzV=[[[0.5,-0.5,0.5],[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[0.5,0.5,0.5]],[[-0.5,-0.5,-0.5],[-0.5,-0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,-0.5]],[[-0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5]],[[-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,-0.5,0.5],[-0.5,-0.5,0.5]],[[-0.5,-0.5,0.5],[0.5,-0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5]],[[0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5,0.5,-0.5],[0.5,0.5,-0.5]]];
    for (let f=0;f<6;f++) {
      const [dx,dy,dz]=komsular[f];
      if (blokVarMi(x+dx,y+dy,z+dz)) continue;
      const v=yuzV[f];
      [[x+v[0][0],y+v[0][1],z+v[0][2]],[x+v[1][0],y+v[1][1],z+v[1][2]],[x+v[2][0],y+v[2][1],z+v[2][2]],[x+v[3][0],y+v[3][1],z+v[3][2]]].forEach(p=>{posArray.push(...p);colArray.push(r,g,b);});
      idxArray.push(offset,offset+1,offset+2,offset,offset+2,offset+3); offset+=4;
    }
  }
  if (posArray.length>0) {
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(posArray,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colArray,3));
    geo.setIndex(idxArray); geo.computeVertexNormals();
    blockGroup.add(new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true})));
  }
}

function blokVarMi(x,y,z){return world[`${x},${y},${z}`]!==undefined;}
function blokEkle(x,y,z,tip){world[`${x},${y},${z}`]=tip;dunyaMeshOlustur();}
function blokSil(x,y,z){const k=`${x},${y},${z}`;if(world[k]===undefined)return false;delete world[k];dunyaMeshOlustur();return true;}
function altindaBlokVarMi(x,y,z){const ay=Math.floor(y-0.5);for(let o=-1;o<=1;o++)for(let p=-1;p<=1;p++)if(blokVarMi(Math.floor(x)+o,ay,Math.floor(z)+p))return true;return false;}
function karakterCarpiyorMu(x,y,z){const bx=Math.floor(x),by=Math.floor(y),bz=Math.floor(z);for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++)for(let oy=0;oy<=1;oy++){if(!blokVarMi(bx+ox,by+oy,bz+oz))continue;if(x+0.2>bx+ox-0.5&&x-0.2<bx+ox+0.5&&y+0.5>by+oy-0.5&&y-0.2<by+oy+0.5&&z+0.2>bz+oz-0.5&&z-0.2<bz+oz+0.5)return true;}return false;}
function setupKontroller(){document.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key===' ')e.preventDefault();});document.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.key===' ')ziplamayaHazir=true;});}
function setupMouse(){const c=renderer.domElement;c.addEventListener('click',()=>{if(!pointerLocked&&!isMobile)c.requestPointerLock();});document.addEventListener('pointerlockchange',()=>{pointerLocked=document.pointerLockElement===c;});document.addEventListener('mousemove',e=>{if(!pointerLocked||isMobile)return;playerRotY-=e.movementX*0.003;playerRotX-=e.movementY*0.003;playerRotX=Math.max(-0.5,Math.min(1.0,playerRotX));});c.addEventListener('mousedown',e=>{if(e.button===0&&pointerLocked)blokKirYap();});c.addEventListener('contextmenu',e=>{e.preventDefault();if(pointerLocked)blokKoyYap();});}
function setupMobile(){if(!isMobile)return;const jp=document.getElementById('joypad'),ji=document.getElementById('joy-icerik');jp.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});jp.addEventListener('touchmove',e=>{e.preventDefault();const t=e.touches[0],r=jp.getBoundingClientRect();let dx=t.clientX-(r.left+r.width/2),dy=t.clientY-(r.top+r.height/2);const m=r.width/2-15,d=Math.sqrt(dx*dx+dy*dy);if(d>m){dx=dx/d*m;dy=dy/d*m;}ji.style.transform=`translate(${-25+dx}px,${-25+dy}px)`;hareketEdiyor.x=dx/m;hareketEdiyor.z=-dy/m;},{passive:false});jp.addEventListener('touchend',e=>{e.preventDefault();ji.style.transform='translate(-25px,-25px)';hareketEdiyor.x=0;hareketEdiyor.z=0;},{passive:false});document.getElementById('btn-zıpla').addEventListener('touchstart',e=>{e.preventDefault();zipliyor=true;},{passive:false});document.getElementById('btn-zıpla').addEventListener('touchend',e=>{e.preventDefault();zipliyor=false;},{passive:false});document.getElementById('btn-yer').addEventListener('touchstart',e=>{e.preventDefault();blokKoyYap();},{passive:false});renderer.domElement.addEventListener('touchstart',e=>{if(e.touches.length===1&&!e.target.closest('#mobilKontroller')&&!e.target.closest('#blokSecim')){setTimeout(()=>blokKirYap(new THREE.Vector2((e.touches[0].clientX/window.innerWidth)*2-1,-(e.touches[0].clientY/window.innerHeight)*2+1)),10);}},{passive:true});document.querySelectorAll('.blok-item').forEach(el=>{el.addEventListener('click',()=>{document.querySelectorAll('.blok-item').forEach(i=>i.classList.remove('active'));el.classList.add('active');seciliBlok=parseInt(el.dataset.tip);});});}
function blokKirYap(mp){const c=mp||new THREE.Vector2(0,0);raycaster.setFromCamera(c,camera);for(const h of raycaster.intersectObjects(blockGroup.children)){if(h.object.userData?.isBlock){blokSil(h.object.userData.pos.x,h.object.userData.pos.y,h.object.userData.pos.z);return;}}}
function blokKoyYap(){raycaster.setFromCamera(new THREE.Vector2(0,0),camera);for(const h of raycaster.intersectObjects(blockGroup.children)){if(!h.object.userData?.isBlock)continue;const p=h.object.userData.pos,n=h.face.normal,nx=p.x+Math.round(n.x),ny=p.y+Math.round(n.y),nz=p.z+Math.round(n.z),px=Math.floor(kedi.position.x),py=Math.floor(kedi.position.y),pz=Math.floor(kedi.position.z);if(nx===px&&(ny===py||ny===py+1)&&nz===pz)return;if(blokVarMi(nx,ny,nz))return;blokEkle(nx,ny,nz,seciliBlok);return;}}

// --- LOOP ---
function loop(){requestAnimationFrame(loop);if(!pointerLocked&&!isMobile){renderer.render(scene,camera);return;}
let hx=0,hz=0;if(!isMobile){if(keys['w']||keys['arrowup'])hz=-1;if(keys['s']||keys['arrowdown'])hz=1;if(keys['a']||keys['arrowleft'])hx=1;if(keys['d']||keys['arrowright'])hx=-1;}else{hx=hareketEdiyor.x;hz=hareketEdiyor.z;}
if(hx!==0||hz!==0){const l=Math.sqrt(hx*hx+hz*hz);if(l>1){hx/=l;hz/=l;}}
const fwd=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),playerRotY);
const rgt=new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),playerRotY);
const hz2=0.04;let mx=fwd.x*hz+rgt.x*hx,mz=fwd.z*hz+rgt.z*hx;
const kx=kedi.position.x,ky=kedi.position.y,kz=kedi.position.z;
if(mx!==0){const xn=kx+mx*hz2;if(!karakterCarpiyorMu(xn,ky,kz))kedi.position.x=xn;}
if(mz!==0){const zn=kz+mz*hz2;if(!karakterCarpiyorMu(kedi.position.x,ky,zn))kedi.position.z=zn;}
kedi.rotation.y=playerRotY;
if(altindaBlokVarMi(kedi.position.x,kedi.position.y,kedi.position.z)&&yGravity<=0){yerde=true;yGravity=0;if(ziplamayaHazir&&(keys[' ']||zipliyor)){yGravity=0.32;yerde=false;ziplamayaHazir=false;}}else{yerde=false;yGravity-=0.025;if(yGravity<-0.3)yGravity=-0.3;const yn=kedi.position.y+yGravity;if(!karakterCarpiyorMu(kedi.position.x,yn,kedi.position.z))kedi.position.y=yn;else if(yGravity<0){kedi.position.y=Math.floor(kedi.position.y)+0.25;yGravity=0;yerde=true;}else yGravity=0;}
if(kedi.position.y<-20){let ey=2;for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)for(let y=10;y>=0;y--)if(blokVarMi(x,y,z)){ey=Math.max(ey,y);break;}kedi.position.set(0,ey+2,6);yGravity=-0.01;yerde=false;}
const km=5,kyt=2.5+playerRotX*2,kx2=kedi.position.x-Math.sin(playerRotY)*km,kz2=kedi.position.z-Math.cos(playerRotY)*km;camera.position.set(kx2,kedi.position.y+kyt,kz2);camera.lookAt(kedi.position.x,kedi.position.y+1,kedi.position.z);
document.getElementById('koordinat').textContent=`Kedi: ${Math.round(kedi.position.x)},${Math.floor(kedi.position.y)},${Math.round(kedi.position.z)}`;renderer.render(scene,camera);}
