/* ============================================
   VoxelCraft MC - Minecraft Klonu
   ============================================ */
let S,C,R,Rc,W={},pRotY=0,pRotX=0.3,isM=false,locked=false,K={},sBlok=1,hx=0,hz=0,zpl=false,g=0,yer=false,hazir=true,BG,steve,kms=5,fps=0,lfps=0,ft=0;

const BT={1:{n:'Toprak',c:0x8B4513},2:{n:'Çimen',c:0x4a7023},3:{n:'Taş',c:0x808080},4:{n:'Odun',c:0xC19A6B},5:{n:'Kömür',c:0x2c2c2c},6:{n:'Kum',c:0xf5f5dc},7:{n:'Tuğla',c:0xB22222},8:{n:'Çatı',c:0x8B0000},9:{n:'Cam',c:0x87CEEB},10:{n:'Yol',c:0x444444},11:{n:'Kaldırım',c:0xAAAAAA},12:{n:'Fener',c:0xFFD700},13:{n:'Kar',c:0xFFFFFF},14:{n:'Kitap',c:0xDEB887}};

// MC KARAKTERİ (Steve)
function steveOlustur(){
  const g=new THREE.Group();
  // Bacaklar
  for(let s=-1;s<=1;s+=2){const b=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.5,0.2),new THREE.MeshLambertMaterial({color:0x3344AA}));b.position.set(s*0.15,0,0);g.add(b);}
  // Gövde
  const gv=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.5,0.2),new THREE.MeshLambertMaterial({color:0x33AA33}));gv.position.set(0,0.35,0);g.add(gv);
  // Kollar
  for(let s=-1;s<=1;s+=2){const k=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.45,0.15),new THREE.MeshLambertMaterial({color:0xCC8844}));k.position.set(s*0.3,0.35,0);g.add(k);}
  // Kafa
  const kf=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.4,0.4),new THREE.MeshLambertMaterial({color:0xCC8844}));kf.position.set(0,0.7,0);g.add(kf);
  // Gözler
  for(let s=-1;s<=1;s+=2){const e=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.05),new THREE.MeshLambertMaterial({color:0x222222}));e.position.set(s*0.12,0.73,0.23);g.add(e);}
  // Ağız
  const ag=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.03,0.05),new THREE.MeshLambertMaterial({color:0x444444}));ag.position.set(0,0.62,0.23);g.add(ag);
  // Saç (kahverengi)
  const sc=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.08,0.42),new THREE.MeshLambertMaterial({color:0x5C3317}));sc.position.set(0,0.88,0);g.add(sc);
  g.scale.set(0.6,0.6,0.6);g.position.y=0.35;g.castShadow=true;
  return g;
}

function baslat(){
  document.getElementById('info').style.display='none';document.getElementById('ui').style.display='block';
  isM=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(isM)document.getElementById('mobilKontroller').style.display='flex';
  S=new THREE.Scene();S.background=new THREE.Color(0x87CEEB);S.fog=new THREE.Fog(0x87CEEB,40,60);
  C=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,70);
  R=new THREE.WebGLRenderer({antialias:false});R.setSize(window.innerWidth,window.innerHeight);R.setPixelRatio(1);
  R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;document.body.appendChild(R.domElement);
  S.add(new THREE.AmbientLight(0x888888,0.6));const dl=new THREE.DirectionalLight(0xffffff,0.8);dl.position.set(15,25,15);dl.castShadow=true;dl.shadow.mapSize.width=512;dl.shadow.mapSize.height=512;S.add(dl);
  BG=new THREE.Group();S.add(BG);
  mcHarita();meshOlustur();
  // Spawn yüksekliğini bul (blok içinde kalmasın)
  let spY=3;for(let y=10;y>=0;y--)if(blokV(0,y,0)){spY=y+2;break;}
  steve=steveOlustur();steve.position.set(0,spY,0);S.add(steve);
  Rc=new THREE.Raycaster();Rc.far=7;
  kntrl();fare();mobil();
  window.addEventListener('resize',()=>{C.aspect=window.innerWidth/window.innerHeight;C.updateProjectionMatrix();R.setSize(window.innerWidth,window.innerHeight);});
  yer=false;g=-0.01;loop();
}

// MC TARZI GENİŞ HARİTA
function mcHarita(){
  const R=16;
  for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){
    let yk=1;if(Math.abs(x)>5||Math.abs(z)>5)yk=1+Math.floor(Math.sin(x*0.15)*Math.cos(z*0.15)*1.5+Math.sin(x*0.07+z*0.09)*0.8+Math.sin(x*0.03+z*0.05)*0.5);
    else yk=0;yk=Math.max(0,Math.min(5,yk));
    for(let y=0;y<=yk;y++){let t=5;if(y>0)t=(y<yk)?3:2;W[`${x},${y},${z}`]=t;}}
  // Tepe
  for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++){const d=Math.sqrt(x*x+z*z);if(d<5){const yk=Math.floor(4-d*0.8);for(let y=1;y<=yk;y++)W[`${x},${y},${z}`]=3;if(yk>0)W[`${x},${yk},${z}`]=2;}}
  // Ağaçlar
  const ag=[[-10,0,-10],[-10,0,10],[10,0,-10],[10,0,10],[-12,0,3],[12,0,-3],[3,0,-12],[-3,0,12],[-8,0,-8],[8,0,8],[-15,0,-5],[15,0,5],[-5,0,-15],[5,0,15]];
  ag.forEach(([ax,_,az])=>{let ay=0;for(let y=10;y>=0;y--)if(W[`${ax},${y},${az}`]!==undefined){ay=y+1;break;}if(ay<=0||ay>8)return;for(let i=0;i<4;i++)W[`${ax},${ay+i},${az}`]=4;for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const d=Math.abs(dx)+Math.abs(dz);if(d>2)continue;const yOff=(d<2)?3:2;W[`${ax+dx},${ay+yOff},${az+dz}`]=2;}});
  // Çiçekler (renkli bloklar)
  const cicekler=[[-4,0,4],[4,0,4],[-4,0,-4],[4,0,-4],[-6,0,6],[6,0,6],[-6,0,-6],[6,0,-6]];
  cicekler.forEach(([cx,_,cz])=>{let cy=0;for(let y=10;y>=0;y--)if(W[`${cx},${y},${cz}`]!==undefined){cy=y+1;break;}W[`${cx},${cy},${cz}`]=6;});
  // Gölet
  for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++){const d=Math.sqrt(x*x+z*z);if(d<3.5){for(let y=10;y>=1;y--){const k=`${x+8},${y},${z+8}`;if(W[k]!==undefined){delete W[k];break;}}}}
}

function meshOlustur(){
  BG.children.forEach(c=>{if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});BG.clear();
  const dm=new THREE.MeshBasicMaterial({visible:false});
  for(const k in W){const[x,y,z]=k.split(',').map(Number);const t=W[k];const d=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),dm);d.position.set(x,y,z);d.userData={isBlock:true,pos:{x,y,z},tip:t};BG.add(d);}
  let pA=[],iA=[],cA=[];let o=0;
  for(const k in W){const[x,y,z]=k.split(',').map(Number);const t=W[k];const rnk=BT[t]?.c||0x888888;const r=((rnk>>16)&0xFF)/255,gr=((rnk>>8)&0xFF)/255,b=(rnk&0xFF)/255;
  const ks=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];const yV=[[[0.5,-0.5,0.5],[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[0.5,0.5,0.5]],[[-0.5,-0.5,-0.5],[-0.5,-0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,-0.5]],[[-0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5]],[[-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,-0.5,0.5],[-0.5,-0.5,0.5]],[[-0.5,-0.5,0.5],[0.5,-0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5]],[[0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5,0.5,-0.5],[0.5,0.5,-0.5]]];
  for(let f=0;f<6;f++){const[dx,dy,dz]=ks[f];if(blokV(x+dx,y+dy,z+dz))continue;const v=yV[f];[[x+v[0][0],y+v[0][1],z+v[0][2]],[x+v[1][0],y+v[1][1],z+v[1][2]],[x+v[2][0],y+v[2][1],z+v[2][2]],[x+v[3][0],y+v[3][1],z+v[3][2]]].forEach(p=>{pA.push(...p);cA.push(r,gr,b);});iA.push(o,o+1,o+2,o,o+2,o+3);o+=4;}}
  if(pA.length>0){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pA,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(cA,3));geo.setIndex(iA);geo.computeVertexNormals();BG.add(new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true})));}
}

function blokV(x,y,z){return W[`${x},${y},${z}`]!==undefined;}
function blokE(x,y,z,t){W[`${x},${y},${z}`]=t;meshOlustur();}
function blokS(x,y,z){const k=`${x},${y},${z}`;if(W[k]===undefined)return false;delete W[k];meshOlustur();return true;}
function altB(x,y,z){const ay=Math.floor(y-0.2);for(let o=-1;o<=1;o++)for(let p=-1;p<=1;p++)if(blokV(Math.floor(x)+o,ay,Math.floor(z)+p))return true;return false;}
function carp(x,y,z){const bx=Math.floor(x),by=Math.floor(y),bz=Math.floor(z);for(let ox=-1;ox<=1;ox++)for(let oz=-1;oz<=1;oz++)for(let oy=0;oy<=1;oy++){if(!blokV(bx+ox,by+oy,bz+oz))continue;if(x+0.2>bx+ox-0.5&&x-0.2<bx+ox+0.5&&y+0.5>by+oy-0.5&&y-0.2<by+oy+0.5&&z+0.2>bz+oz-0.5&&z-0.2<bz+oz+0.5)return true;}return false;}
function kntrl(){document.addEventListener('keydown',e=>{K[e.key.toLowerCase()]=true;if(e.key===' ')e.preventDefault();});document.addEventListener('keyup',e=>{K[e.key.toLowerCase()]=false;if(e.key===' ')hazir=true;});}
function fare(){const c=R.domElement;c.addEventListener('click',()=>{if(!locked&&!isM)c.requestPointerLock();});document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===c;});document.addEventListener('mousemove',e=>{if(!locked||isM)return;pRotY-=e.movementX*0.003;pRotX+=e.movementY*0.003;pRotX=Math.max(-1.5,Math.min(1.5,pRotX));});c.addEventListener('mousedown',e=>{if(e.button===0&&locked)bkYap();if(e.button===2&&locked){bkKoy();e.preventDefault();}});c.addEventListener('contextmenu',e=>{e.preventDefault();});c.addEventListener('wheel',e=>{if(!locked)return;kms+=e.deltaY*0.01;kms=Math.max(2,Math.min(12,kms));e.preventDefault();},{passive:false});}
function mobil(){if(!isM)return;const jp=document.getElementById('joypad'),ji=document.getElementById('joy-icerik');jp.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});jp.addEventListener('touchmove',e=>{e.preventDefault();const t=e.touches[0],r=jp.getBoundingClientRect();let dx=t.clientX-(r.left+r.width/2),dy=t.clientY-(r.top+r.height/2);const m=r.width/2-15,d=Math.sqrt(dx*dx+dy*dy);if(d>m){dx=dx/d*m;dy=dy/d*m;}ji.style.transform=`translate(${-25+dx}px,${-25+dy}px)`;hx=dx/m;hz=-dy/m;},{passive:false});jp.addEventListener('touchend',e=>{e.preventDefault();ji.style.transform='translate(-25px,-25px)';hx=0;hz=0;},{passive:false});document.getElementById('btn-zıpla').addEventListener('touchstart',e=>{e.preventDefault();zpl=true;},{passive:false});document.getElementById('btn-zıpla').addEventListener('touchend',e=>{e.preventDefault();zpl=false;},{passive:false});document.getElementById('btn-yer').addEventListener('touchstart',e=>{e.preventDefault();bkKoy();},{passive:false});R.domElement.addEventListener('touchstart',e=>{if(e.touches.length===1&&!e.target.closest('#mobilKontroller')&&!e.target.closest('#blokSecim')){setTimeout(()=>bkYap(new THREE.Vector2((e.touches[0].clientX/window.innerWidth)*2-1,-(e.touches[0].clientY/window.innerHeight)*2+1)),10);}},{passive:true});document.querySelectorAll('.blok-item').forEach(el=>{el.addEventListener('click',()=>{document.querySelectorAll('.blok-item').forEach(i=>i.classList.remove('active'));el.classList.add('active');sBlok=parseInt(el.dataset.tip);});});}
function bkYap(mp){const c=mp||new THREE.Vector2(0,0);Rc.setFromCamera(c,C);for(const h of Rc.intersectObjects(BG.children)){if(h.object.userData?.isBlock){const p=h.object.userData.pos;blokS(p.x,p.y,p.z);return;}}}
function bkKoy(){Rc.setFromCamera(new THREE.Vector2(0,0),C);for(const h of Rc.intersectObjects(BG.children)){if(!h.object.userData?.isBlock)continue;const p=h.object.userData.pos,n=h.face.normal,nx=p.x+Math.round(n.x),ny=p.y+Math.round(n.y),nz=p.z+Math.round(n.z),px=Math.floor(steve.position.x),py=Math.floor(steve.position.y),pz=Math.floor(steve.position.z);if(nx===px&&(ny===py||ny===py+1)&&nz===pz)return;if(blokV(nx,ny,nz))return;blokE(nx,ny,nz,sBlok);return;}}

// MC BİREBİR FİZİK
function loop(){
  requestAnimationFrame(loop);
  // FPS sayacı
  ft++;const sn=Date.now()/1000;if(sn-lfps>1){fps=ft;ft=0;lfps=sn;document.getElementById('fps').textContent=fps+' FPS';}
  if(!locked&&!isM){R.render(S,C);return;}
  let _hx=0,_hz=0;
  if(!isM){if(K['w']||K['arrowup'])_hz=-1;if(K['s']||K['arrowdown'])_hz=1;if(K['a']||K['arrowleft'])_hx=1;if(K['d']||K['arrowright'])_hx=-1;}
  else{_hx=hx;_hz=hz;}
  if(_hx!==0||_hz!==0){const l=Math.sqrt(_hx*_hx+_hz*_hz);if(l>1){_hx/=l;_hz/=l;}}
  const fwd=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),pRotY);
  const rgt=new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),pRotY);
  const spd=0.042;let mx=fwd.x*_hz+rgt.x*_hx,mz=fwd.z*_hz+rgt.z*_hx;
  const sx=steve.position.x,sy=steve.position.y,sz=steve.position.z;
  if(mx!==0){const xn=sx+mx*spd;if(!carp(xn,sy,sz))steve.position.x=xn;}
  if(mz!==0){const zn=sz+mz*spd;if(!carp(steve.position.x,sy,zn))steve.position.z=zn;}
  steve.rotation.y=pRotY;
  // MC BİREBİR FİZİK
  // 1. Ayağın altında blok var mı? (hitbox alt sınırı y-0.2)
  const blokAltinda = altB(steve.position.x, steve.position.y, steve.position.z);
  
  // 2. Yerdeyse gravity sıfırla
  if (blokAltinda) {
    yerde = true;
    g = 0;
    // Yere oturt (küçük sapmaları düzelt)
    steve.position.y = Math.floor(steve.position.y - 0.2) + 0.35;
    // Zıplama - sadece yeni basıldıysa
    if (hazir && (K[' '] || zpl)) {
      g = 0.18;
      yerde = false;
      hazir = false;
    }
  } else {
    yerde = false;
    g -= 0.012;
    if (g < -0.25) g = -0.25;
    const yeniY = steve.position.y + g;
    if (!carp(steve.position.x, yeniY, steve.position.z)) {
      steve.position.y = yeniY;
    } else {
      if (g < 0) {
        steve.position.y = Math.floor(yeniY) + 0.35;
        g = 0;
        yerde = true;
      } else {
        g = 0;
      }
    }
  }
  // Düşünce spawn
  if(steve.position.y<-30){let ey=0;for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)for(let y=10;y>=0;y--)if(blokV(x,y,z)){ey=Math.max(ey,y+2);break;}steve.position.set(0,Math.max(ey,4),0);g=-0.01;yer=false;}
  // 3. ŞAHIS KAMERA
  const kyt=2.5+pRotX*2,kx2=steve.position.x-Math.sin(pRotY)*kms,kz2=steve.position.z-Math.cos(pRotY)*kms;
  C.position.set(kx2,steve.position.y+kyt,kz2);C.lookAt(steve.position.x,steve.position.y+1,steve.position.z);
  document.getElementById('koordinat').textContent=`${Math.round(steve.position.x)},${Math.floor(steve.position.y)},${Math.round(steve.position.z)}`;
  R.render(S,C);
}
