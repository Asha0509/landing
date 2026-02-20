/* =============================================
   A2S — main.js  v3.0
   Proptech · Teal+Copper · Three.js
   ============================================= */

// ── CURSOR ──────────────────────────────────────
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursorDot.style.left = mx + 'px';
  cursorDot.style.top = my + 'px';
});
(function animRing() {
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top = ry + 'px';
  requestAnimationFrame(animRing);
})();

// ── NAVBAR ──────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── ANCHOR SCROLL ───────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── SCROLL REVEAL ───────────────────────────────
new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.09 }).observe
  ? (() => {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); }
      });
    }, { threshold: 0.09 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  })()
  : document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));

// ── THREE.JS SCENE ──────────────────────────────
(function initScene() {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
  camera.position.set(0, 0, 16);

  // Lighting — teal key, copper fill
  const tealLight = new THREE.PointLight(0x1A8AAD, 3.5, 70);
  tealLight.position.set(8, 8, 12);
  scene.add(tealLight);

  const copperLight = new THREE.PointLight(0xC47A4A, 2, 60);
  copperLight.position.set(-10, -5, 4);
  scene.add(copperLight);

  scene.add(new THREE.AmbientLight(0x070C10, 0.6));

  // Shared wireframe material — teal tint
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0x1A8AAD, wireframe: true,
    transparent: true, opacity: 0.15,
  });
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x111820, roughness: 0.4, metalness: 0.6,
    transparent: true, opacity: 0.7,
  });

  function makeDuo(geo, x, y, z) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, solidMat.clone()));
    const w = new THREE.Mesh(geo, wireMat.clone());
    w.scale.setScalar(1.012);
    g.add(w);
    g.position.set(x, y, z);
    scene.add(g);
    return g;
  }

  const bigBox = makeDuo(new THREE.BoxGeometry(3.6, 3.6, 3.6), 0, 0.5, 0);
  const smlBox = makeDuo(new THREE.BoxGeometry(1.7, 1.7, 1.7), 5, -1.5, 1.5);
  const torus = makeDuo(new THREE.TorusGeometry(2.1, 0.07, 16, 90), -4.5, 1.5, -2);
  const ico = makeDuo(new THREE.IcosahedronGeometry(1.35, 0), 3.5, 3, -1);
  const oct = makeDuo(new THREE.OctahedronGeometry(1.15, 0), -4.5, -2.5, 1.5);
  const sphere = makeDuo(new THREE.SphereGeometry(0.7, 16, 16), 5.5, 2, -3);

  // Teal + copper particles
  const pGeo = new THREE.BufferGeometry();
  const N = 300;
  const pPos = new Float32Array(N * 3);
  const pCol = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 46;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 26;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    const isTeal = Math.random() > 0.4;
    pCol[i * 3] = isTeal ? 0.10 : 0.77;
    pCol[i * 3 + 1] = isTeal ? 0.54 : 0.48;
    pCol[i * 3 + 2] = isTeal ? 0.68 : 0.29;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.06, vertexColors: true, transparent: true, opacity: 0.5,
  })));

  // Mouse parallax
  let tRx = 0, tRy = 0, cRx = 0, cRy = 0;
  document.addEventListener('mousemove', e => {
    tRy = (e.clientX / window.innerWidth - 0.5) * 0.5;
    tRx = (e.clientY / window.innerHeight - 0.5) * -0.25;
  });

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }, { passive: true });

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    cRx += (tRx - cRx) * 0.04;
    cRy += (tRy - cRy) * 0.04;
    scene.rotation.x = cRx;
    scene.rotation.y = cRy;

    bigBox.rotation.x = t * 0.1;
    bigBox.rotation.y = t * 0.16;
    bigBox.position.y = 0.5 + Math.sin(t * 0.55) * 0.25;

    smlBox.rotation.x = -t * 0.19;
    smlBox.rotation.z = t * 0.13;

    torus.rotation.x = t * 0.27;
    torus.rotation.z = t * 0.09;

    ico.rotation.y = t * 0.21;
    ico.rotation.x = t * 0.09;

    oct.rotation.x = t * 0.14;
    oct.rotation.y = -t * 0.19;

    sphere.position.y = 2 + Math.sin(t * 0.9 + 1.2) * 0.6;

    tealLight.intensity = 3.5 + Math.sin(t * 1.1) * 0.6;
    copperLight.intensity = 2 + Math.cos(t * 0.8) * 0.5;

    renderer.render(scene, camera);
  })();
})();

// ── FORESHADOW CARD HOVER ───────────────────────
document.querySelectorAll('.fore-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.borderColor = 'rgba(196,122,74,0.45)';
    card.style.boxShadow = '0 0 48px rgba(196,122,74,0.12)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.borderColor = 'rgba(196,122,74,0.15)';
    card.style.boxShadow = 'none';
  });
});
