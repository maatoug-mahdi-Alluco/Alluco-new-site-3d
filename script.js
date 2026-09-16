import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas = document.querySelector('#webgl');
const loader = document.querySelector('#loader');
const loaderStatus = document.querySelector('#loader-status');
const loaderProgress = document.querySelector('#loader-progress');
const fallback = document.querySelector('#webgl-fallback');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 820px)').matches;

document.querySelector('#year').textContent = new Date().getFullYear();

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

function setLoader(progress, text) {
  loaderProgress.style.width = `${progress}%`;
  if (text) loaderStatus.textContent = text;
}

setLoader(18, 'INITIALIZING GLOBAL SUPPLY CHAIN...');

const menuToggle = document.querySelector('#menu-toggle');
const navLinks = document.querySelector('#nav-links');
menuToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
});
navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navLinks.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}));

// Native reveal animations are intentionally used instead of ScrollTrigger.
// They remain reliable when the site is rendered inside Streamlit's iframe.
const revealElements = [...document.querySelectorAll('.reveal')];
const heroReveal = [...document.querySelectorAll('#home .reveal')];

heroReveal.forEach((el, index) => {
  if (prefersReducedMotion) return;
  el.animate(
    [
      { opacity: 0, transform: 'translateY(24px)', filter: 'blur(6px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }
    ],
    { duration: 850, delay: 180 + index * 120, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }
  );
});

const laterReveal = revealElements.filter((el) => !el.closest('#home'));
if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.animate(
        [
          { opacity: 0, transform: 'translateY(28px)', filter: 'blur(6px)' },
          { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }
        ],
        { duration: 760, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }
      );
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  laterReveal.forEach((el) => observer.observe(el));
}

if (!webglAvailable()) {
  fallback.hidden = false;
  canvas.style.display = 'none';
  setLoader(100, 'READY');
  setTimeout(() => loader.classList.add('is-hidden'), 300);
} else {
  init3D();
}

function init3D() {
  setLoader(35, 'LOADING 3D ENVIRONMENT...');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080d);
  scene.fog = new THREE.FogExp2(0x05080d, isMobile ? 0.019 : 0.0135);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.35 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = !isMobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(18, 9, 22);
  scene.add(camera);

  const hemi = new THREE.HemisphereLight(0xd8e8f6, 0x0a0d11, 2.25);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 6.2);
  key.position.set(15, 22, 10);
  key.castShadow = !isMobile;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const blue = new THREE.PointLight(0x168cff, 78, 62, 2);
  blue.position.set(-8, 6, 4);
  scene.add(blue);

  const metal = new THREE.MeshStandardMaterial({ color: 0xaeb8c2, metalness: 0.92, roughness: 0.3 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x18212b, metalness: 0.78, roughness: 0.5 });
  const black = new THREE.MeshStandardMaterial({ color: 0x080b10, metalness: 0.55, roughness: 0.55 });
  const whiteMetal = new THREE.MeshStandardMaterial({ color: 0xdce3e8, metalness: 0.72, roughness: 0.34 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x168cff, metalness: 0.55, roughness: 0.3, emissive: 0x062b50, emissiveIntensity: 1.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xa8d9ff, metalness: 0.05, roughness: 0.05, transmission: 0.62, transparent: true, opacity: 0.44 });

  const world = new THREE.Group();
  scene.add(world);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(380, 160), new THREE.MeshStandardMaterial({ color: 0x080c12, roughness: 0.9, metalness: 0.18 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(78, -2.25, 0);
  floor.receiveShadow = !isMobile;
  world.add(floor);

  const grid = new THREE.GridHelper(380, 90, 0x213344, 0x101820);
  grid.position.set(78, -2.2, 0);
  grid.material.transparent = true;
  grid.material.opacity = 0.25;
  world.add(grid);

  function box(group, size, pos, material = metal, rot = [0,0,0]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = !isMobile;
    mesh.receiveShadow = !isMobile;
    group.add(mesh);
    return mesh;
  }

  function cylinder(group, radius, depth, pos, material = metal, rot = [0,0,0]) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 24), material);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    mesh.castShadow = !isMobile;
    group.add(mesh);
    return mesh;
  }

  // SCENE 0 — INDUSTRIAL HERO
  const hero = new THREE.Group();
  hero.position.set(0, 0, 0);
  world.add(hero);
  for (let i = 0; i < 8; i++) {
    const x = -7 + (i % 4) * 4.2;
    const z = -3 + Math.floor(i / 4) * 5;
    box(hero, [3.8, 2.2, 2.1], [x, -1.1, z], i % 3 === 0 ? blueMat : darkMetal);
    for (let r = -1; r <= 1; r++) box(hero, [0.06, 1.8, 2.12], [x + r * 1.1, -1.08, z + 0.01], metal);
  }
  for (let i = 0; i < 11; i++) {
    const y = -1.55 + (i % 4) * 0.42;
    box(hero, [10, 0.14, 0.14], [3, y, 6.5 + Math.floor(i / 4) * .45], whiteMetal, [0, 0.08 * (i % 2), 0]);
  }
  box(hero, [15, 0.25, 8], [0, -2, 1.5], black);
  box(hero, [1.8, 1.5, 3.6], [8.5, -1.2, 2], whiteMetal);
  cylinder(hero, .58, .35, [8, -2, .9], black, [0,0,Math.PI/2]);
  cylinder(hero, .58, .35, [9.2, -2, .9], black, [0,0,Math.PI/2]);

  // SCENE 1 — GLOBE
  const globeGroup = new THREE.Group();
  globeGroup.position.set(32, 1, 0);
  world.add(globeGroup);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(5.2, 42, 42), new THREE.MeshStandardMaterial({ color: 0x15202a, metalness: .7, roughness: .5, wireframe: true, transparent: true, opacity: .78 }));
  globeGroup.add(globe);
  const globeCore = new THREE.Mesh(new THREE.SphereGeometry(5.0, 40, 40), new THREE.MeshStandardMaterial({ color: 0x080e14, metalness: .4, roughness: .8, transparent:true, opacity:.55 }));
  globeGroup.add(globeCore);
  function arc(a, b, color=0x168cff) {
    const mid = a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(8.2);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 56, .035, 5, false);
    const m = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.8 });
    globeGroup.add(new THREE.Mesh(geo,m));
  }
  arc(new THREE.Vector3(-4,2,2.5), new THREE.Vector3(3.5,-1.3,3));
  arc(new THREE.Vector3(-3,-2.7,-2), new THREE.Vector3(4,2.2,-1));
  arc(new THREE.Vector3(1,4.5,1.7), new THREE.Vector3(4,-2,-1.9), 0x8fd0ff);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(6.9,.025,6,90), new THREE.MeshBasicMaterial({ color:0x44596d, transparent:true, opacity:.5 }));
  orbit.rotation.x = 1.14;
  globeGroup.add(orbit);

  // SCENE 2 — SHIP
  const ship = new THREE.Group(); ship.position.set(63,-.35,0); world.add(ship);
  box(ship,[14,1.5,4.2],[0,-.55,0],darkMetal);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(2.1,4.5,4),darkMetal); bow.rotation.z = Math.PI/2; bow.rotation.y = Math.PI/4; bow.position.set(8.15,-.55,0); ship.add(bow);
  box(ship,[3,4,3],[-5,1.5,0],whiteMetal);
  box(ship,[2.4,1.2,2.6],[-5,4,0],glass);
  let cIndex=0;
  [-2.5,0,2.5].forEach((x)=>[-1.15,1.15].forEach((z)=>{
    box(ship,[2.2,1.2,1.9],[x,.8,z], cIndex++%3===0?blueMat:metal);
    box(ship,[2.2,1.2,1.9],[x,2.05,z], cIndex++%4===0?blueMat:darkMetal);
  }));
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(38,18,18,10), new THREE.MeshStandardMaterial({ color:0x071523, roughness:.28, metalness:.42, transparent:true, opacity:.8 }));
  sea.rotation.x = -Math.PI/2; sea.position.set(0,-1.45,0); ship.add(sea);

  // SCENE 3 — TUNISIA ABSTRACT
  const tunisia = new THREE.Group(); tunisia.position.set(92,0,0); world.add(tunisia);
  const mapShape = new THREE.Shape();
  mapShape.moveTo(-1.4,4.4); mapShape.lineTo(.4,4.9); mapShape.lineTo(1.9,3.5); mapShape.lineTo(1.1,2.0); mapShape.lineTo(1.5,.5); mapShape.lineTo(.8,-1.2); mapShape.lineTo(.2,-4.9); mapShape.lineTo(-1.1,-3.1); mapShape.lineTo(-1.3,-1.3); mapShape.lineTo(-2.0,.2); mapShape.lineTo(-1.6,1.8); mapShape.closePath();
  const map = new THREE.Mesh(new THREE.ExtrudeGeometry(mapShape,{depth:.38,bevelEnabled:true,bevelSize:.08,bevelThickness:.08}), metal);
  map.rotation.x = -.35; map.rotation.y = -.48; map.position.y = 1.2; tunisia.add(map);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(.34,18,18), blueMat); hub.position.set(-.4,1.55,1.25); tunisia.add(hub);
  const hubRing = new THREE.Mesh(new THREE.TorusGeometry(.75,.035,8,40),new THREE.MeshBasicMaterial({color:0x168cff})); hubRing.position.copy(hub.position); hubRing.rotation.x = Math.PI/2; tunisia.add(hubRing);

  // SCENE 4 — WAREHOUSE
  const warehouse = new THREE.Group(); warehouse.position.set(121,0,0); world.add(warehouse);
  for(let side=-1; side<=1; side+=2){
    for(let i=0;i<5;i++){
      const x=-7+i*3.5;
      box(warehouse,[.16,6,.16],[x,.7,side*4.2],darkMetal);
      for(let h=0;h<4;h++) box(warehouse,[3.2,.12,1.8],[x+1.5,-1.4+h*1.65,side*4.2],metal);
      for(let h=0;h<3;h++) box(warehouse,[1.1,.48,1.2],[x+1.5,-1.02+h*1.65,side*4.2], h%2?darkMetal:whiteMetal);
    }
  }
  box(warehouse,[18,.2,11],[0,-2,0],black);
  // forklift
  box(warehouse,[2,1.15,1.6],[0,-1.25,0],blueMat); box(warehouse,[.2,3,.2],[.9,.1,.6],metal); box(warehouse,[.2,3,.2],[.9,.1,-.6],metal);
  box(warehouse,[2.4,.12,.12],[2.0,-1.65,.55],metal); box(warehouse,[2.4,.12,.12],[2.0,-1.65,-.55],metal);
  cylinder(warehouse,.42,.3,[-.55,-2,.85],black,[0,0,Math.PI/2]); cylinder(warehouse,.42,.3,[.65,-2,.85],black,[0,0,Math.PI/2]);

  // SCENE 5 — PROFILE
  const profileGroup = new THREE.Group(); profileGroup.position.set(151,0,0); world.add(profileGroup);
  const profileOuter = new THREE.Mesh(new THREE.BoxGeometry(3.8,3.8,12), metal); profileOuter.position.y=.5; profileGroup.add(profileOuter);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(2.7,2.7,12.4), new THREE.MeshStandardMaterial({color:0x05080d, metalness:.2, roughness:.85})); inner.position.y=.5; profileGroup.add(inner);
  box(profileGroup,[.35,3.5,12.2],[0,.5,0],metal); box(profileGroup,[3.5,.35,12.2],[0,.5,0],metal);
  const profileHalo = new THREE.PointLight(0x168cff,48,22,2); profileHalo.position.set(2,4,3); profileGroup.add(profileHalo);

  // SCENE 6 — DATA RING
  const tech = new THREE.Group(); tech.position.set(181,0,0); world.add(tech);
  for(let i=0;i<7;i++){
    const tor = new THREE.Mesh(new THREE.TorusGeometry(3.2+i*.55,.035,8,80),new THREE.MeshBasicMaterial({color:i%2?0x168cff:0x6c8195,transparent:true,opacity:.42}));
    tor.rotation.set(Math.PI/2 + i*.12, i*.17, i*.08); tech.add(tor);
  }
  for(let i=0;i<22;i++){
    const angle=i/22*Math.PI*2;
    const r=4.5+(i%4)*.6;
    const p=new THREE.Mesh(new THREE.SphereGeometry(.07,10,10),new THREE.MeshBasicMaterial({color:i%3===0?0x168cff:0xcfe4f7}));
    p.position.set(Math.cos(angle)*r, Math.sin(angle*1.7)*1.8, Math.sin(angle)*r); tech.add(p);
  }

  // SCENE 7 — FINAL MONOLITH
  const finalGroup = new THREE.Group(); finalGroup.position.set(211,0,0); world.add(finalGroup);
  for(let i=0;i<8;i++) box(finalGroup,[.28,7+i*.4,.28],[-5+i*1.45,1,0],i===4?blueMat:metal,[0,0,(i-4)*.03]);
  box(finalGroup,[13,.12,8],[0,-2,0],black);

  setLoader(72, 'CALIBRATING CAMERA...');

  const sections = [...document.querySelectorAll('[data-scene]')];
  const cameraStops = [
    { pos:[18,8.5,22], target:[0,0,1] },
    { pos:[42,8,16], target:[32,1,0] },
    { pos:[74,6.5,17], target:[63,0,0] },
    { pos:[102,6,14], target:[92,0,0] },
    { pos:[132,5.5,16], target:[121,0,0] },
    { pos:[164,5.5,18], target:[151,.5,0] },
    { pos:[193,7,17], target:[181,0,0] },
    { pos:[222,8,20], target:[211,0,0] },
  ];

  const camPos = new THREE.Vector3(...cameraStops[0].pos);
  const camTarget = new THREE.Vector3(...cameraStops[0].target);
  camera.position.copy(camPos);
  camera.lookAt(camTarget);

  function scrollState() {
    const y = window.scrollY + window.innerHeight * .5;
    let idx = 0;
    let local = 0;
    for (let i=0; i<sections.length; i++) {
      const rectTop = sections[i].offsetTop;
      const nextTop = i < sections.length-1 ? sections[i+1].offsetTop : document.documentElement.scrollHeight;
      if (y >= rectTop && y < nextTop) {
        idx = i;
        local = THREE.MathUtils.clamp((y-rectTop) / Math.max(1,nextTop-rectTop),0,1);
        break;
      }
    }
    return { idx, local };
  }

  function updateCamera() {
    const { idx, local } = scrollState();
    const a = cameraStops[idx];
    const b = cameraStops[Math.min(idx+1,cameraStops.length-1)];
    const t = prefersReducedMotion ? 0 : local;
    const eased = t*t*(3-2*t);
    camPos.set(...a.pos).lerp(new THREE.Vector3(...b.pos), eased);
    camTarget.set(...a.target).lerp(new THREE.Vector3(...b.target), eased);
    camera.position.lerp(camPos, prefersReducedMotion ? 1 : .08);
    camera.lookAt(camTarget);
  }

  const clock = new THREE.Clock();
  function animate() {
    const elapsed = clock.getElapsedTime();
    updateCamera();
    if (!prefersReducedMotion) {
      globeGroup.rotation.y = elapsed * .08;
      profileGroup.rotation.y = elapsed * .16;
      hubRing.scale.setScalar(1 + Math.sin(elapsed*2)*.12);
      tech.rotation.y = elapsed * .08;
      ship.position.y = -.35 + Math.sin(elapsed*.8)*.08;
      blue.intensity = 74 + Math.sin(elapsed*1.3)*8;
    }
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 820 ? 1.35 : 1.75));
  });

  setLoader(94, 'READY');
  requestAnimationFrame(() => {
    animate();
    setTimeout(() => {
      setLoader(100, 'READY');
      setTimeout(() => loader.classList.add('is-hidden'), 280);
    }, 450);
  });
}
