/**
 * SIPNASIA XR - Escena 3D & Motor WebXR (Three.js)
 * Renderiza el entorno inmersivo de sinapsis, los monolitos holográficos de las 3 experiencias,
 * mandos 6DoF de Meta Quest con punteros láser y gestión de sesiones WebXR.
 */

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

class XRSceneController {
  constructor() {
    this.container = document.getElementById('webxr-canvas-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Estado WebXR & Interacción
    this.isVR = false;
    this.isInteractive3D = false;
    this.interactables = [];
    this.hoveredObject = null;
    this.portals = [];

    // Controladores WebXR
    this.controllers = [];
    this.controllerGrips = [];
    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();
    this.mouse = new THREE.Vector2(-999, -999);

    // Red de Sinapsis (Partículas)
    this.synapseParticles = null;
    this.synapseLines = null;
    this.nodePositions = [];
  }

  async init() {
    if (!this.container) return;

    // 1. Escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020912);
    this.scene.fog = new THREE.FogExp2(0x020912, 0.045);

    // 2. Cámara
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.6, 2.8);

    // 3. Renderer WebGL con soporte WebXR
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 4. Controles de Escritorio (Orbit)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.4, -2.5);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 12;

    // 5. Iluminación Futurista UNAM
    this.setupLighting();

    // 6. Entorno de Sinapsis y Plataforma
    this.setupSynapseNetwork();
    this.setupEnvironmentGrid();

    // 7. Monolitos Holográficos (Las 3 Experiencias)
    this.setupExperiencePortals();

    // 8. Controladores WebXR y Punteros Láser
    this.setupWebXRControllers();

    // 9. Integración con VRButton oficial
    this.setupVRButton();

    // 10. Eventos de ratón y ventana
    this.setupEventListeners();

    // 11. Bucle de Animación WebXR
    this.renderer.setAnimationLoop((time, frame) => this.render(time, frame));

    console.log('[SipnasiaXR] Escena WebXR Inicializada con Éxito.');
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x002b49, 1.8);
    this.scene.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xd59b2d, 2.2);
    goldKeyLight.position.set(4, 8, 4);
    this.scene.add(goldKeyLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    cyanRimLight.position.set(-4, 6, -3);
    this.scene.add(cyanRimLight);

    const centerGlow = new THREE.PointLight(0x00f0ff, 1.5, 10);
    centerGlow.position.set(0, 1.6, -2);
    this.scene.add(centerGlow);
  }

  setupEnvironmentGrid() {
    // Rejilla cibernética en el piso
    const grid = new THREE.GridHelper(30, 30, 0xd59b2d, 0x002b49);
    grid.position.y = -0.01;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    this.scene.add(grid);

    // Círculos concéntricos de pedestal central
    const ringGeo = new THREE.RingGeometry(0.8, 0.84, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.01;
    this.scene.add(ringMesh);

    const outerRingGeo = new THREE.RingGeometry(2.4, 2.45, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xd59b2d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.01;
    this.scene.add(outerRing);
  }

  setupSynapseNetwork() {
    // Generación de red neuronal de partículas conectadas
    const particleCount = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.nodePositions = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = Math.random() * 6 + 0.2;
      const z = (Math.random() - 0.5) * 16 - 2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.nodePositions.push(new THREE.Vector3(x, y, z));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMaterial = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.synapseParticles = new THREE.Points(geometry, pMaterial);
    this.scene.add(this.synapseParticles);
  }

  /* ----------------------------------------------------
     Creación de Monolitos Portales Holográficos (Las 3 Apps)
     ---------------------------------------------------- */
  setupExperiencePortals() {
    const experiencesData = [
      {
        id: 'simulador',
        title: 'SIMULADOR DE OPERADOR PC PUMA',
        category: 'Simulación & Capacitación 3D',
        badge: 'WEBXR / PC',
        url: 'https://vickman123.github.io/Simulador-operador-pcpuma/',
        colorHex: '#00f0ff',
        colorThree: 0x00f0ff,
        icon: '💻',
        pos: new THREE.Vector3(-2.6, 1.5, -3.2),
        rotY: 0.42
      },
      {
        id: 'shooter',
        title: 'SHOOTER PC PUMA (VIRUS PURGE)',
        category: 'Cyber Defense Arcade FPS',
        badge: 'QUEST 6DOF / PC',
        url: 'https://vickman123.github.io/FPS-WEBXR-VIRUS-PURGE/',
        colorHex: '#ff007f',
        colorThree: 0xff007f,
        icon: '🛡️',
        pos: new THREE.Vector3(0, 1.6, -3.8),
        rotY: 0
      },
      {
        id: 'visor',
        title: 'VISOR ARQUITECTÓNICO PC PUMA',
        category: 'Visualización Espacial XR',
        badge: 'QUEST 3S / WEBXR',
        url: 'https://vickman123.github.io/visor-xr/',
        colorHex: '#d59b2d',
        colorThree: 0xd59b2d,
        icon: '🏛️',
        pos: new THREE.Vector3(2.6, 1.5, -3.2),
        rotY: -0.42
      }
    ];

    experiencesData.forEach(exp => {
      const portalGroup = this.createPortalMonolith(exp);
      this.scene.add(portalGroup);
      this.portals.push(portalGroup);
    });
  }

  createPortalMonolith(exp) {
    const group = new THREE.Group();
    group.position.copy(exp.pos);
    group.rotation.y = exp.rotY;

    // 1. Marco Holográfico Exterior
    const frameGeo = new THREE.BoxGeometry(1.6, 2.2, 0.08);
    const frameEdges = new THREE.EdgesGeometry(frameGeo);
    const frameLineMat = new THREE.LineBasicMaterial({
      color: exp.colorThree,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    const frameMesh = new THREE.LineSegments(frameEdges, frameLineMat);
    group.add(frameMesh);

    // 2. Cristal Holográfico Central (con textura dinámica en Canvas)
    const texture = this.createPortalTexture(exp);
    const planeGeo = new THREE.PlaneGeometry(1.5, 2.1);
    const planeMat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity: 0.92,
      roughness: 0.2,
      metalness: 0.6,
      side: THREE.DoubleSide
    });
    const screenMesh = new THREE.Mesh(planeGeo, planeMat);
    screenMesh.position.z = 0.01;
    group.add(screenMesh);

    // 3. Pedestal Flotante con Base de Luz
    const baseGeo = new THREE.CylinderGeometry(0.55, 0.7, 0.12, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x00172d,
      roughness: 0.3,
      metalness: 0.8
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.2;
    group.add(baseMesh);

    const baseRingGeo = new THREE.TorusGeometry(0.72, 0.03, 16, 32);
    const baseRingMat = new THREE.MeshBasicMaterial({ color: exp.colorThree });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = -1.18;
    group.add(baseRing);

    // Guardar referencia interactiva
    screenMesh.userData = {
      isPortal: true,
      portalData: exp,
      parentGroup: group,
      baseY: exp.pos.y,
      baseScale: 1
    };

    this.registerInteractable(screenMesh);

    return group;
  }

  createPortalTexture(exp) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // Fondo degradado futurista
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 720);
    bgGrad.addColorStop(0, '#021326');
    bgGrad.addColorStop(0.5, '#010a14');
    bgGrad.addColorStop(1, '#001b33');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 720);

    // Borde interior
    ctx.strokeStyle = exp.colorHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 480, 688);

    // Encabezado UNAM PC PUMA
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.fillStyle = '#D59B2D';
    ctx.textAlign = 'center';
    ctx.fillText('PC PUMA // UNAM', 256, 60);

    // Categoría
    ctx.font = '18px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(exp.category.toUpperCase(), 256, 95);

    // Ícono Central Grande
    ctx.font = '100px sans-serif';
    ctx.fillText(exp.icon, 256, 260);

    // Línea divisora
    ctx.strokeStyle = 'rgba(213, 155, 45, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 320);
    ctx.lineTo(452, 320);
    ctx.stroke();

    // Título Principal (multi-línea)
    ctx.font = 'bold 28px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    this.wrapText(ctx, exp.title, 256, 380, 420, 36);

    // Badge de compatibilidad
    ctx.fillStyle = exp.colorHex;
    ctx.fillRect(130, 500, 252, 44);
    ctx.fillStyle = '#010912';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`[ ${exp.badge} ]`, 256, 528);

    // Botón de llamado a la acción
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(100, 600, 312, 54);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.fillText('LANZAR EXPERIENCIA', 256, 635);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  /* ----------------------------------------------------
     Configuración de Mandos WebXR (Meta Quest) & Láseres
     ---------------------------------------------------- */
  setupWebXRControllers() {
    const controllerModelFactory = new XRControllerModelFactory();

    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', (e) => this.onSelectStart(e));
      controller.addEventListener('selectend', (e) => this.onSelectEnd(e));
      this.scene.add(controller);
      this.controllers.push(controller);

      // Línea Láser del puntero
      const laserGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -4)
      ]);
      const laserMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.75
      });
      const laser = new THREE.Line(laserGeo, laserMat);
      laser.name = 'laser';
      controller.add(laser);

      // Retícula punto en el extremo
      const dotGeo = new THREE.SphereGeometry(0.015, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xd59b2d });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.z = -4;
      dot.name = 'reticleDot';
      controller.add(dot);

      // Modelo 3D del mando Meta Quest / XR
      const grip = this.renderer.xr.getControllerGrip(i);
      grip.add(controllerModelFactory.createControllerModel(grip));
      this.scene.add(grip);
      this.controllerGrips.push(grip);
    }
  }

  onSelectStart(event) {
    const controller = event.target;
    this.tempMatrix.identity().extractRotation(controller.matrixWorld);

    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);

    const intersects = this.raycaster.intersectObjects(this.interactables, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      this.handleObjectClick(hit);
    }
  }

  onSelectEnd(event) {
    // Liberar estado de selección
  }

  setupVRButton() {
    const btn = VRButton.createButton(this.renderer);
    btn.id = 'official-vr-button';
    btn.style.position = 'fixed';
    btn.style.bottom = '24px';
    btn.style.left = '50%';
    btn.style.transform = 'translateX(-50%)';
    btn.style.zIndex = '999';
    btn.style.fontFamily = 'Orbitron, sans-serif';
    btn.style.fontSize = '14px';
    btn.style.fontWeight = '700';
    btn.style.padding = '12px 28px';
    btn.style.border = '2px solid #D59B2D';
    btn.style.background = 'rgba(2, 22, 44, 0.92)';
    btn.style.color = '#F6C15C';
    btn.style.borderRadius = '30px';
    btn.style.boxShadow = '0 0 20px rgba(213, 155, 45, 0.5)';
    btn.style.cursor = 'pointer';
    btn.style.letterSpacing = '1.5px';

    document.body.appendChild(btn);

    // Eventos de sesión WebXR
    this.renderer.xr.addEventListener('sessionstart', () => {
      this.isVR = true;
      document.getElementById('ui-root')?.classList.add('hidden-for-xr');
      document.getElementById('xr-scene-hud')?.classList.add('visible');
      if (window.xrAudio) window.xrAudio.playWarp();
      if (window.SipnasiaXR) {
        window.SipnasiaXR.log('¡Sesión WebXR Immersiva iniciada con éxito!');
      }
    });

    this.renderer.xr.addEventListener('sessionend', () => {
      this.isVR = false;
      document.getElementById('ui-root')?.classList.remove('hidden-for-xr');
      document.getElementById('xr-scene-hud')?.classList.remove('visible');
      if (window.SipnasiaXR) {
        window.SipnasiaXR.log('Sesión WebXR finalizada.');
      }
    });
  }

  /* ----------------------------------------------------
     Interacciones y Registro de Objetos
     ---------------------------------------------------- */
  registerInteractable(object) {
    if (!this.interactables.includes(object)) {
      this.interactables.push(object);
    }
  }

  unregisterInteractable(object) {
    this.interactables = this.interactables.filter(item => item !== object);
  }

  handleObjectClick(object) {
    if (!object || !object.userData) return;

    if (object.userData.isPortal) {
      const data = object.userData.portalData;
      if (window.xrAudio) window.xrAudio.playSelect();
      if (window.SipnasiaXR) {
        window.SipnasiaXR.log(`Accediendo a: ${data.title}...`);
      }
      // Abrir en ventana nueva o navegar
      window.open(data.url, '_blank');
    } else if (object.userData.isDynamicNode) {
      if (window.SipnasiaXR) {
        window.SipnasiaXR.handleNodeHit(object);
      }
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Raycast para ratón / pantalla táctil en modo 3D
    window.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('click', () => {
      if (!this.isInteractive3D || this.isVR) return;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactables, false);

      if (intersects.length > 0) {
        this.handleObjectClick(intersects[0].object);
      }
    });
  }

  toggleInteractive3D(enable) {
    this.isInteractive3D = enable;
    if (enable) {
      this.container.classList.add('interactive-mode');
      document.getElementById('ui-root')?.classList.add('hidden-for-xr');
      document.getElementById('xr-scene-hud')?.classList.add('visible');
      this.controls.enabled = true;
    } else {
      this.container.classList.remove('interactive-mode');
      document.getElementById('ui-root')?.classList.remove('hidden-for-xr');
      document.getElementById('xr-scene-hud')?.classList.remove('visible');
    }
  }

  /* ----------------------------------------------------
     Bucle de Renderizado Continuo
     ---------------------------------------------------- */
  render(time, frame) {
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Actualizar Controles de Escritorio si no está en VR
    if (!this.isVR && this.controls) {
      this.controls.update();
    }

    // 2. Animación de Monolitos Flotantes
    this.portals.forEach((portalGroup, idx) => {
      const floatOffset = Math.sin(elapsedTime * 1.5 + idx * 1.2) * 0.08;
      portalGroup.position.y = 1.5 + floatOffset;
    });

    // 3. Rotación de la Red de Partículas Sinápticas
    if (this.synapseParticles) {
      this.synapseParticles.rotation.y = elapsedTime * 0.02;
    }

    // 4. Actualizar Dinámica WebXR Activa
    if (window.SipnasiaXR) {
      window.SipnasiaXR.updateFrame(delta, elapsedTime);
    }

    // 5. Renderizado final
    this.renderer.render(this.scene, this.camera);
  }
}

// Instancia global del Gestor de Escena
window.XRSceneManager = new XRSceneController();

// Inicializar cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  window.XRSceneManager.init();
});
