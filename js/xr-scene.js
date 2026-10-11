/**
 * SIPNASIA XR - Escena 3D & Motor WebXR Basado en Framework VXR
 * Integración con Framework VXR (XRRoom / Scenarios) de Vickman123
 *
 * Características Clave:
 * - Laboratorio Futurista Luminoso ("no tan obscuro"):
 *     * Construido con XRRoom procedural de VXR (suelo técnico, paredes modulares, luminarias integradas).
 *     * Iluminación de alta visibilidad: luz cenital blanca, reflejos Oro Puma y acentos ciber-cian.
 *     * Consola central cuántica PC PUMA con anillos giroscópicos y baliza de pulso.
 * - 4 Puertas / Portales de Experiencias:
 *     1. Simulador de Operador PC PUMA (Cyan #00f0ff)
 *     2. Shooter PC PUMA Virus Purge (Magenta #ff007f)
 *     3. Visor Arquitectónico PC PUMA (Oro Puma #d59b2d)
 *     4. PRÓXIMAMENTE // NUEVA EXPERIENCIA (Cyber Emerald #10b981) - Módulo de Innovación I+D
 * - Artefactos Holográficos 3D Rotatorios sobre cada portal inspirados en XRExhibit de VXR.
 * - Sistema de Navegación Dual:
 *     * En Meta Quest WebXR: Finaliza la sesión limpiamente y navega en la misma ventana
 *       (window.location.href) para no abrir ventanas flotantes indeseadas en el sistema operativo de Oculus.
 *     * En Escritorio / PC 2D: Abre en nueva pestaña (window.open(url, '_blank')) para no perder el portal.
 * - Locomoción Completa con Joystick y Límites de Sala VXR:
 *     * Mano Izquierda: Desplazamiento suave 6DoF relativo a la mirada del usuario.
 *     * Mano Derecha: Snap Turn 45° anti-mareo.
 *     * PC: Teclado WASD / Flechas.
 *     * Colisión: Delimitado por getWalkableBounds() de XRRoom para no atravesar muros.
 * - Optimización Meta Quest 3S: Fixed Foveated Rendering (setFoveation 1.0).
 */

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRRoom } from '../vxr/scenario/XRRoom.js';

class XRSceneController {
  constructor() {
    this.container = document.getElementById('webxr-canvas-container');
    this.scene = null;
    this.camera = null;
    this.dolly = null; // Rig de cámara para locomoción en WebXR
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // VXR Room & Elementos del Laboratorio
    this.labRoom = null;
    this.quantumCore = null;
    this.quantumRings = [];
    this.quantumBeacon = null;

    // Estado WebXR & Interacciones
    this.isVR = false;
    this.isInteractive3D = false;
    this.interactables = [];
    this.portals = [];
    this.portalArtifacts = [];
    this.underglowLights = [];

    // Controladores WebXR y Láser
    this.controllers = [];
    this.controllerGrips = [];
    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();
    this.mouse = new THREE.Vector2(-999, -999);

    // Reutilización de vectores para evitar Garbage Collection en Meta Quest
    this.forwardVec = new THREE.Vector3();
    this.rightVec = new THREE.Vector3();
    this.moveVec = new THREE.Vector3();

    // Locomoción por Joystick & Teclado
    this.snapTurnLocked = false;
    this.keys = { forward: false, backward: false, left: false, right: false };

    // Partículas de Red Sináptica
    this.synapseParticles = null;
    this.idleFrameCount = 0;

    // Cartel Holográfico en VR para "Próximamente"
    this.upcomingHoloPanel = null;
    this.upcomingPanelTimer = null;

    // Control de Primera Persona en PC (FPS Look & Pointer Lock)
    this.isPointerLocked = false;
    this.yaw = 0;
    this.pitch = 0;
    this.hoveredPortal = null;

    // Gran Pantalla Panorámica Rectangular con Carrusel del Taller
    this.galleryPanelGroup = null;
    this.galleryMesh = null;
    this.galleryTexture = null;
    this.galleryCurrentIndex = 0;
    this.galleryAutoTimer = null;
    this.galleryLoadedImages = {};
    this.galleryPhotos = [
      {
        id: 'foto-1',
        imageSrc: 'assets/hero_title_synapsia_xr.png',
        colorHex: '#00f0ff',
        colorThree: 0x00f0ff,
        icon: '📸'
      },
      {
        id: 'foto-2',
        imageSrc: 'assets/hero-synapsia.png',
        colorHex: '#d59b2d',
        colorThree: 0xd59b2d,
        icon: '📷'
      },
      {
        id: 'foto-3',
        imageSrc: 'assets/logos-synapsia-sheet.png',
        colorHex: '#ff007f',
        colorThree: 0xff007f,
        icon: '🖼️'
      },
      {
        id: 'foto-4',
        imageSrc: 'assets/logo_synapsia_brand.png',
        colorHex: '#22c55e',
        colorThree: 0x22c55e,
        icon: '🥽'
      },
      {
        id: 'foto-5',
        imageSrc: 'assets/powered_by_vxr_badge.png',
        colorHex: '#a855f7',
        colorThree: 0xa855f7,
        icon: '✨'
      }
    ];
  }

  async init() {
    if (!this.container) return;

    // 1. Escena de Laboratorio Futurista (Slate Tecnológico + Atmósfera Limpia)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x131d2e);
    this.scene.fog = new THREE.FogExp2(0x131d2e, 0.012);

    // 2. Cámara de Perspectiva
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    this.camera.position.set(0, 1.6, 2.8);

    // 3. Camera Rig (Dolly) para Locomoción en VR
    this.dolly = new THREE.Group();
    this.dolly.position.set(0, 0, 0);
    this.dolly.add(this.camera);
    this.scene.add(this.dolly);

    // 4. Renderer WebGL Optimizado para Meta Quest 3S
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // 5. Controles de Escritorio: Cámara en Primera Persona (FPS) con fallback Orbit
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.5, -2.5);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 16;
    this.controls.enabled = false; // Desactivado para dar prioridad a la cámara de primera persona fija y fluida

    // 6. Construcción del Laboratorio Futurista con XRRoom de Framework VXR
    this.setupFuturisticLab();

    // 7. Iluminación Brillante de Laboratorio (Blanco, Oro y Cyan)
    this.setupLaboratoryLighting();

    // 8. Núcleo Cuántico Central PC PUMA UNAM
    this.setupQuantumCore();

    // 9. Red de Partículas Sinápticas Flotantes
    this.setupSynapseNetwork();

    // 10. Las 4 Puertas / Portales de Experiencias (Frente)
    this.setupExperiencePortals();

    // 10.1 Galería del Taller y Festival Synapsia XR (Atrás)
    this.setupWorkshopGallery();

    // 11. Mandos WebXR con Rayos Láser y Retroalimentación Háptica
    this.setupWebXRControllers();

    // 12. Botón Oficial WebXR con Foveated Rendering
    this.setupVRButton();

    // 13. Eventos de Ratón, Redimensión y Teclado WASD
    this.setupEventListeners();
    this.setupKeyboardControls();

    // 14. Bucle de Animación Continuo
    this.renderer.setAnimationLoop((time, frame) => this.render(time, frame));

    console.log('[SipnasiaXR] Laboratorio Futurista VXR Inicializado con Éxito.');
  }

  /* ----------------------------------------------------
     Construcción de Sala de Laboratorio con Framework VXR
     ---------------------------------------------------- */
  setupFuturisticLab() {
    // Instanciar XRRoom del Framework VXR con diseño de Laboratorio de Alta Visibilidad
    this.labRoom = new XRRoom({
      id: 'laboratorio-sipnasia-pcpuma',
      name: 'Laboratorio de Innovación XR PC PUMA',
      dimensions: {
        width: 22,
        depth: 24,
        height: 5.4
      },
      theme: 'scifi',
      floor: {
        color: 0x182436,     // Slate técnico con acabado reflectante suave
        roughness: 0.32,
        metalness: 0.6,
        grid: true           // Cuadrícula VXR de alta precisión
      },
      walls: {
        color: 0x24354a,     // Paneles modulares de laboratorio futurista claros y nítidos
        roughness: 0.45,
        trimColor: 0x00f0ff, // Marcos y jambas cian emissivo
        thickness: 0.3
      },
      ceiling: {
        enabled: true,
        color: 0x162130,
        lamps: true          // Luminarias cenitales integradas de VXR
      },
      lighting: {
        enabled: true,
        color: 0xf0f9ff,     // Luz blanca-cian brillante de laboratorio
        intensity: 2.6,
        distance: 38
      },
      doors: [
        { wall: 'north', width: 4.2, height: 3.6, offset: 0 },
        { wall: 'south', width: 4.2, height: 3.6, offset: 0 },
        { wall: 'east', width: 3.2, height: 3.4, offset: 0 },
        { wall: 'west', width: 3.2, height: 3.4, offset: 0 }
      ],
      spawnPoint: [0, 1.6, 2.8]
    });

    this.scene.add(this.labRoom.nativeGroup);

    // Decoraciones de Laboratorio adicionales: Barras de Luz Lineal en el Techo
    const lightStripGeo = new THREE.BoxGeometry(18, 0.08, 0.22);
    const lightStripMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });

    const ceilingStrip1 = new THREE.Mesh(lightStripGeo, lightStripMat);
    ceilingStrip1.position.set(0, 5.3, -4.5);
    this.scene.add(ceilingStrip1);

    const ceilingStrip2 = new THREE.Mesh(lightStripGeo, lightStripMat);
    ceilingStrip2.position.set(0, 5.3, 4.5);
    this.scene.add(ceilingStrip2);

    // Plataforma Circular Central en Obsidiana y Oro Puma
    const labPlatformGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.03, 64);
    const labPlatformMat = new THREE.MeshStandardMaterial({
      color: 0x0c1322,
      roughness: 0.25,
      metalness: 0.75
    });
    const labPlatform = new THREE.Mesh(labPlatformGeo, labPlatformMat);
    labPlatform.position.y = 0.005;
    this.scene.add(labPlatform);

    // Anillos concéntricos dorados y cian en el suelo
    const goldRingGeo = new THREE.RingGeometry(5.05, 5.15, 64);
    const goldRingMat = new THREE.MeshBasicMaterial({ color: 0xd59b2d, side: THREE.DoubleSide });
    const goldRing = new THREE.Mesh(goldRingGeo, goldRingMat);
    goldRing.rotation.x = -Math.PI / 2;
    goldRing.position.y = 0.022;
    this.scene.add(goldRing);

    const cyanRingGeo = new THREE.RingGeometry(2.6, 2.68, 64);
    const cyanRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const cyanRing = new THREE.Mesh(cyanRingGeo, cyanRingMat);
    cyanRing.rotation.x = -Math.PI / 2;
    cyanRing.position.y = 0.022;
    this.scene.add(cyanRing);
  }

  /* ----------------------------------------------------
     Iluminación Brillante de Laboratorio Futurista
     ---------------------------------------------------- */
  setupLaboratoryLighting() {
    // 1. Luz Hemisférica: Blanco puro arriba + Acento Oro Puma cálido abajo
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd59b2d, 1.9);
    hemiLight.position.set(0, 10, 0);
    this.scene.add(hemiLight);

    // 2. Luz Clave Principal (Blanca brillante directa, elimina rincones oscuros)
    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainKeyLight.position.set(4, 11, 5);
    this.scene.add(mainKeyLight);

    // 3. Luz de Relleno Ciber-Cian de Laboratorio
    const cyanFillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    cyanFillLight.position.set(-5, 9, -4);
    this.scene.add(cyanFillLight);

    // 4. Luces de acento bajo cada bahía de portal
    const underglowSimulador = new THREE.PointLight(0x00f0ff, 2.5, 6);
    underglowSimulador.position.set(-5.5, 0.4, -5.0);
    this.scene.add(underglowSimulador);
    this.underglowLights.push(underglowSimulador);

    const underglowShooter = new THREE.PointLight(0xff007f, 2.5, 6);
    underglowShooter.position.set(-1.8, 0.4, -6.2);
    this.scene.add(underglowShooter);
    this.underglowLights.push(underglowShooter);

    const underglowVisor = new THREE.PointLight(0xd59b2d, 2.7, 6);
    underglowVisor.position.set(1.8, 0.4, -6.2);
    this.scene.add(underglowVisor);
    this.underglowLights.push(underglowVisor);

    const underglowUpcoming = new THREE.PointLight(0x10b981, 2.5, 6);
    underglowUpcoming.position.set(5.5, 0.4, -5.0);
    this.scene.add(underglowUpcoming);
    this.underglowLights.push(underglowUpcoming);
  }

  /* ----------------------------------------------------
     Núcleo Cuántico Central PC PUMA UNAM
     ---------------------------------------------------- */
  setupQuantumCore() {
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 0, 0);

    // Pedestal cilíndrico de alta tecnología
    const basePillarGeo = new THREE.CylinderGeometry(0.8, 0.95, 0.7, 32);
    const basePillarMat = new THREE.MeshStandardMaterial({
      color: 0x08101e,
      roughness: 0.3,
      metalness: 0.8
    });
    const basePillar = new THREE.Mesh(basePillarGeo, basePillarMat);
    basePillar.position.y = 0.35;
    coreGroup.add(basePillar);

    // Anillo LED dorado en la base del pedestal
    const baseRingGeo = new THREE.TorusGeometry(0.85, 0.03, 16, 48);
    const baseRingMat = new THREE.MeshBasicMaterial({ color: 0xd59b2d });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.68;
    coreGroup.add(baseRing);

    // Anillo giroscópico exterior (Cian)
    const ring1Geo = new THREE.TorusGeometry(0.55, 0.02, 16, 48);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.position.y = 1.05;
    coreGroup.add(ring1);
    this.quantumRings.push(ring1);

    // Anillo giroscópico interior (Oro Puma)
    const ring2Geo = new THREE.TorusGeometry(0.42, 0.02, 16, 48);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xf6c15c,
      emissive: 0xd59b2d,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.position.y = 1.05;
    ring2.rotation.x = Math.PI / 4;
    coreGroup.add(ring2);
    this.quantumRings.push(ring2);

    // Cristal octaédrico central de energía
    const crystalGeo = new THREE.OctahedronGeometry(0.24, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0xd59b2d,
      emissiveIntensity: 0.9
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 1.05;
    coreGroup.add(crystal);
    this.quantumRings.push(crystal);

    // Luz de Núcleo Central Pulsante
    this.quantumBeacon = new THREE.PointLight(0xd59b2d, 2.2, 8);
    this.quantumBeacon.position.set(0, 1.05, 0);
    coreGroup.add(this.quantumBeacon);

    this.scene.add(coreGroup);
    this.quantumCore = coreGroup;
  }

  /* ----------------------------------------------------
     Red de Partículas Sinápticas
     ---------------------------------------------------- */
  setupSynapseNetwork() {
    const particleCount = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = Math.random() * 4.8 + 0.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMaterial = new THREE.PointsMaterial({
      color: 0xd59b2d,
      size: 0.085,
      transparent: true,
      opacity: 0.85
    });

    this.synapseParticles = new THREE.Points(geometry, pMaterial);
    this.scene.add(this.synapseParticles);
  }

  /* ----------------------------------------------------
     Las 4 Puertas / Portales de Experiencias XR
     ---------------------------------------------------- */
  setupExperiencePortals() {
    const experiencesData = [
      {
        id: 'simulador',
        title: 'SIMULADOR DE OPERADOR PC PUMA',
        category: 'Capacitación Operativa',
        badge: 'QUEST 3S / PC',
        url: './experiencias/simulador/',
        colorHex: '#00f0ff',
        colorThree: 0x00f0ff,
        icon: '💻',
        pos: new THREE.Vector3(-5.5, 1.6, -5.0),
        rotY: 0.38,
        isUpcoming: false
      },
      {
        id: 'shooter',
        title: 'SHOOTER PC PUMA (VIRUS PURGE)',
        category: 'Ciberdefensa Arcade',
        badge: 'QUEST 6DOF / PC',
        url: './experiencias/shooter/',
        colorHex: '#ff007f',
        colorThree: 0xff007f,
        icon: '🛡️',
        pos: new THREE.Vector3(-1.8, 1.6, -6.2),
        rotY: 0.12,
        isUpcoming: false
      },
      {
        id: 'visor',
        title: 'VISOR ARQUITECTÓNICO PC PUMA',
        category: 'Visualización Espacial 3D',
        badge: 'QUEST 3S PASSTHROUGH',
        url: './experiencias/visor/',
        colorHex: '#d59b2d',
        colorThree: 0xd59b2d,
        icon: '🏛️',
        pos: new THREE.Vector3(1.8, 1.6, -6.2),
        rotY: -0.12,
        isUpcoming: false
      },
      {
        id: 'zombie-classroom',
        title: 'AULA ZOMBIE // SUPERVIVENCIA',
        category: 'Survival FPS Escolar',
        badge: 'QUEST 6DOF / PC',
        url: './experiencias/zombie-classroom/',
        colorHex: '#22c55e',
        colorThree: 0x22c55e,
        icon: '🧟',
        pos: new THREE.Vector3(5.5, 1.6, -5.0),
        rotY: -0.38,
        isUpcoming: false
      }
    ];

    experiencesData.forEach(exp => {
      const portalGroup = this.createPortalMonolith(exp);
      this.scene.add(portalGroup);
      this.portals.push(portalGroup);
    });
  }

  /* ----------------------------------------------------
     Gran Panel Rectangular Panorámico con Carrusel del Taller (Zona Trasera Z = 6.2)
     ---------------------------------------------------- */
  setupWorkshopGallery() {
    const group = new THREE.Group();
    // Posicionada en la zona posterior opuesta a los portales (Z = 6.0), orientada hacia el jugador (rotY = Math.PI)
    group.position.set(0, 2.1, 6.0);
    group.rotation.y = Math.PI;

    // 1. Bastidor Arquitectónico Rectangular Largo Panorámico (Ancho: 8.4m, Alto: 3.2m, Prof: 0.12m)
    const frameGeo = new THREE.BoxGeometry(8.4, 3.2, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x08111d,
      roughness: 0.28,
      metalness: 0.85
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    group.add(frameMesh);

    // Bisel Luminoso Exterior Dorado
    const frameEdges = new THREE.EdgesGeometry(frameGeo);
    const frameLineMat = new THREE.LineBasicMaterial({
      color: 0xd59b2d,
      linewidth: 3
    });
    const frameLine = new THREE.LineSegments(frameEdges, frameLineMat);
    group.add(frameLine);

    // 2. Pantalla Central Panorámica de Alta Definición (16:9 Cinema)
    const screenGeo = new THREE.PlaneGeometry(8.15, 2.95);
    const texture = this.createPanoramicCarouselTexture();
    this.galleryTexture = texture;

    const screenMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.98,
      side: THREE.FrontSide
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.065;
    group.add(screenMesh);
    this.galleryMesh = screenMesh;

    // 3. Pedestal Arquitectónico Largo en el Suelo
    const baseGeo = new THREE.BoxGeometry(8.5, 0.28, 0.8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0c1626,
      roughness: 0.35,
      metalness: 0.75
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -1.65, 0.1);
    group.add(baseMesh);

    // Tira Neón Cian en la Base
    const neonStripeGeo = new THREE.BoxGeometry(8.52, 0.04, 0.05);
    const neonStripeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonStripe = new THREE.Mesh(neonStripeGeo, neonStripeMat);
    neonStripe.position.set(0, -1.52, 0.52);
    group.add(neonStripe);

    // 4. Luces de Acento Cenitales sobre el Panel Panorámico
    const spotLight1 = new THREE.PointLight(0x00f0ff, 2.0, 8);
    spotLight1.position.set(-2.8, 1.2, 1.2);
    group.add(spotLight1);

    const spotLight2 = new THREE.PointLight(0xd59b2d, 2.0, 8);
    spotLight2.position.set(2.8, 1.2, 1.2);
    group.add(spotLight2);

    // 5. Botones Interactivos Holográficos 3D para Navegar el Carrusel [ ◀ ANTERIOR ] y [ SIGUIENTE ▶ ]
    const btnGeo = new THREE.BoxGeometry(0.85, 0.32, 0.08);

    // Botón Izquierdo (Anterior)
    const prevBtnMat = new THREE.MeshStandardMaterial({
      color: 0x031830,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.45,
      roughness: 0.2
    });
    const prevBtn = new THREE.Mesh(btnGeo, prevBtnMat);
    prevBtn.position.set(-3.4, -1.25, 0.14);
    group.add(prevBtn);

    // Botón Derecho (Siguiente)
    const nextBtnMat = new THREE.MeshStandardMaterial({
      color: 0x031830,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.45,
      roughness: 0.2
    });
    const nextBtn = new THREE.Mesh(btnGeo, nextBtnMat);
    nextBtn.position.set(3.4, -1.25, 0.14);
    group.add(nextBtn);

    // Botón Central (Abrir Visor / Detalle)
    const viewBtnGeo = new THREE.BoxGeometry(1.4, 0.32, 0.08);
    const viewBtnMat = new THREE.MeshStandardMaterial({
      color: 0x1f1602,
      emissive: 0xd59b2d,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const viewBtn = new THREE.Mesh(viewBtnGeo, viewBtnMat);
    viewBtn.position.set(0, -1.25, 0.14);
    group.add(viewBtn);

    // Metadata interactiva para Raycaster de WebXR y Retícula FPS
    const screenUserData = {
      isGallery: true,
      action: 'view',
      parentGroup: group
    };
    screenMesh.userData = screenUserData;
    viewBtn.userData = screenUserData;

    prevBtn.userData = {
      isGallery: true,
      action: 'prev',
      parentGroup: group
    };

    nextBtn.userData = {
      isGallery: true,
      action: 'next',
      parentGroup: group
    };

    this.registerInteractable(screenMesh);
    this.registerInteractable(viewBtn);
    this.registerInteractable(prevBtn);
    this.registerInteractable(nextBtn);

    this.scene.add(group);
    this.galleryPanelGroup = group;

    // Transición automática suave del carrusel cada 7 segundos si nadie está interactuando
    this.startCarouselAutoCycle();
  }

  startCarouselAutoCycle() {
    if (this.galleryAutoTimer) clearInterval(this.galleryAutoTimer);
    this.galleryAutoTimer = setInterval(() => {
      // Rotar al siguiente slide automáticamente
      this.cycleGalleryPhoto(1, false);
    }, 7000);
  }

  cycleGalleryPhoto(direction = 1, userTriggered = true) {
    if (!this.galleryPhotos || this.galleryPhotos.length === 0) return;

    this.galleryCurrentIndex = (this.galleryCurrentIndex + direction + this.galleryPhotos.length) % this.galleryPhotos.length;
    this.updatePanoramicCarouselTexture();

    // Actualizar modal si está abierto actualmente
    this.updateGalleryModalContent();

    if (userTriggered && window.xrAudio) {
      window.xrAudio.playHover();
      // Reiniciar temporizador automático para dar tiempo al usuario
      this.startCarouselAutoCycle();
    }
  }

  createPanoramicCarouselTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 576;
    this.galleryCanvas = canvas;
    this.galleryCtx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    this.drawPanoramicCarouselCanvas();
    texture.needsUpdate = true;
    return texture;
  }

  updatePanoramicCarouselTexture() {
    if (!this.galleryCanvas || !this.galleryCtx || !this.galleryTexture) return;
    this.drawPanoramicCarouselCanvas();
    this.galleryTexture.needsUpdate = true;
  }

  drawPanoramicCarouselCanvas() {
    const ctx = this.galleryCtx;
    const current = this.galleryPhotos[this.galleryCurrentIndex] || this.galleryPhotos[0];
    const total = this.galleryPhotos.length;

    // 1. Fondo estilizado Azul Noche Tecnológico (1536 x 576)
    const bgGrad = ctx.createLinearGradient(0, 0, 1536, 576);
    bgGrad.addColorStop(0, '#030a16');
    bgGrad.addColorStop(0.5, '#07152b');
    bgGrad.addColorStop(1, '#020712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1536, 576);

    // Borde exterior Oro Puma
    ctx.strokeStyle = '#D59B2D';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 1512, 552);

    // Borde Neón Sutil
    ctx.strokeStyle = current.colorHex || '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 1496, 536);

    // 2. ENCABEZADO SUPERIOR LIMPIO Y ÚNICO PARA TODAS LAS FOTOS
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('// GALERÍA DE FOTOS DEL TALLER // FESTIVAL SYNAPSIA XR', 48, 56);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`FOTO ${this.galleryCurrentIndex + 1} DE ${total}`, 1488, 56);

    // Línea separadora superior sutil
    ctx.strokeStyle = 'rgba(213, 155, 45, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(48, 72);
    ctx.lineTo(1488, 72);
    ctx.stroke();

    // 3. ÁREA CENTRAL DE FOTO / VISUAL PRINCIPAL (1440 x 420)
    const photoBoxX = 48;
    const photoBoxY = 86;
    const photoBoxW = 1440;
    const photoBoxH = 415;

    // Fondo del visor fotográfico
    const photoGrad = ctx.createLinearGradient(photoBoxX, photoBoxY, photoBoxX, photoBoxY + photoBoxH);
    photoGrad.addColorStop(0, '#04162e');
    photoGrad.addColorStop(1, '#010c1c');
    ctx.fillStyle = photoGrad;
    ctx.fillRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH);

    // Si la imagen está precargada, dibujarla ocupando limpiamente el recuadro (manteniendo aspect ratio)
    let img = this.galleryLoadedImages[current.imageSrc];
    if (!img) {
      img = new Image();
      img.src = current.imageSrc;
      img.onload = () => {
        this.galleryLoadedImages[current.imageSrc] = img;
        this.updatePanoramicCarouselTexture();
      };
      this.galleryLoadedImages[current.imageSrc] = img;
    }

    if (img && img.complete && img.naturalWidth > 0) {
      // Dibujar imagen centrada con aspect-ratio contenido (contain / fit)
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const boxAspect = photoBoxW / photoBoxH;
      let drawW, drawH, drawX, drawY;

      if (imgAspect > boxAspect) {
        drawW = photoBoxW - 40;
        drawH = drawW / imgAspect;
        drawX = photoBoxX + 20;
        drawY = photoBoxY + (photoBoxH - drawH) / 2;
      } else {
        drawH = photoBoxH - 30;
        drawW = drawH * imgAspect;
        drawX = photoBoxX + (photoBoxW - drawW) / 2;
        drawY = photoBoxY + 15;
      }

      ctx.save();
      // Leve brillo / filtro
      ctx.shadowColor = current.colorHex || '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      // Fallback mientras carga la imagen: Gran Emblema Fotográfico
      ctx.font = '140px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(current.icon || '📸', photoBoxX + photoBoxW / 2, photoBoxY + 240);
    }

    // Marco del visor de foto
    ctx.strokeStyle = current.colorHex || '#00f0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH);

    // 4. FLECHAS DIRECTAS VISIBLES EN LOS EXTREMOS DEL PANEL
    // Flecha izquierda [ ◀ ANTERIOR ]
    ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.fillRect(photoBoxX + 16, photoBoxY + 155, 84, 105);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoBoxX + 16, photoBoxY + 155, 84, 105);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◀', photoBoxX + 58, photoBoxY + 225);

    // Flecha derecha [ SIGUIENTE ▶ ]
    ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.fillRect(photoBoxX + photoBoxW - 100, photoBoxY + 155, 84, 105);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoBoxX + photoBoxW - 100, photoBoxY + 155, 84, 105);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▶', photoBoxX + photoBoxW - 58, photoBoxY + 225);

    // 5. BARRA INFERIOR SIMPLE DE CONTROLES E INDICADORES (DOTS)
    const dotSpacing = 36;
    const dotsStartX = (1536 - (total - 1) * dotSpacing) / 2;
    for (let i = 0; i < total; i++) {
      const dotX = dotsStartX + i * dotSpacing;
      const isCur = (i === this.galleryCurrentIndex);
      ctx.beginPath();
      ctx.arc(dotX, 532, isCur ? 10 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isCur ? '#00f0ff' : 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
      if (isCur) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Indicación de clic directa
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('◄ BOTÓN [ ◀ ] ANTERIOR', 52, 536);

    ctx.textAlign = 'right';
    ctx.fillText('SIGUIENTE [ ▶ ] ►', 1484, 536);
  }

  createPortalMonolith(exp) {
    const group = new THREE.Group();
    group.position.copy(exp.pos);
    group.rotation.y = exp.rotY;

    // 1. Marco Exterior en Obsidiana y Acero Pulido
    const frameGeo = new THREE.BoxGeometry(1.56, 2.15, 0.08);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x08101d,
      roughness: 0.28,
      metalness: 0.8
    });
    const frameBack = new THREE.Mesh(frameGeo, frameMat);
    group.add(frameBack);

    // Bordes biselados con el color temático de la bahía
    const frameEdges = new THREE.EdgesGeometry(frameGeo);
    const frameLineMat = new THREE.LineBasicMaterial({
      color: exp.colorThree,
      linewidth: 3
    });
    const frameMesh = new THREE.LineSegments(frameEdges, frameLineMat);
    group.add(frameMesh);

    // 2. Cristal Frontal con Textura de Alta Legibilidad y Contraste
    const texture = this.createPortalTexture(exp);
    const planeGeo = new THREE.PlaneGeometry(1.48, 2.06);
    const planeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.97,
      side: THREE.FrontSide
    });
    const screenMesh = new THREE.Mesh(planeGeo, planeMat);
    screenMesh.position.z = 0.045;
    group.add(screenMesh);

    // 3. Pedestal Arquitectónico Estilo VXR XRExhibit
    const pedestalGeo = new THREE.BoxGeometry(0.9, 0.35, 0.65);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0a1424,
      roughness: 0.35,
      metalness: 0.75
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, -1.18, 0);
    group.add(pedestal);

    // Línea luminosa en la base del pedestal
    const ledStripeGeo = new THREE.BoxGeometry(0.92, 0.03, 0.04);
    const ledStripeMat = new THREE.MeshBasicMaterial({ color: exp.colorThree });
    const ledStripe = new THREE.Mesh(ledStripeGeo, ledStripeMat);
    ledStripe.position.set(0, -1.02, 0.33);
    group.add(ledStripe);

    // 4. Artefacto Tridimensional Holográfico Flotante Superior (Inspirado en XRExhibit)
    const artifact = this.createPortalArtifact(exp);
    artifact.position.set(0, 1.45, 0.05);
    group.add(artifact);
    this.portalArtifacts.push(artifact);

    // Guardar referencia interactiva para el Raycaster de WebXR
    const portalUserData = {
      isPortal: true,
      portalData: exp,
      parentGroup: group,
      baseY: exp.pos.y
    };
    screenMesh.userData = portalUserData;
    frameBack.userData = portalUserData;
    pedestal.userData = portalUserData;

    this.registerInteractable(screenMesh);
    this.registerInteractable(frameBack);
    this.registerInteractable(pedestal);

    return group;
  }

  /* ----------------------------------------------------
     Artefactos 3D Holográficos sobre los Portales (Estilo VXR)
     ---------------------------------------------------- */
  createPortalArtifact(exp) {
    const group = new THREE.Group();

    if (exp.id === 'simulador') {
      // Laptop Holográfica & Tarjeta NFC
      const laptopBaseGeo = new THREE.BoxGeometry(0.36, 0.02, 0.26);
      const laptopMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.6,
        roughness: 0.2
      });
      const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopMat);
      group.add(laptopBase);

      const laptopScreenGeo = new THREE.BoxGeometry(0.36, 0.24, 0.015);
      const laptopScreen = new THREE.Mesh(laptopScreenGeo, laptopMat);
      laptopScreen.position.set(0, 0.12, -0.12);
      laptopScreen.rotation.x = -0.2;
      group.add(laptopScreen);
    } else if (exp.id === 'shooter') {
      // Retícula de Disparo & Escudo Anti-Virus
      const reticleGeo = new THREE.TorusGeometry(0.24, 0.015, 16, 32);
      const reticleMat = new THREE.MeshStandardMaterial({
        color: 0xff007f,
        emissive: 0xff007f,
        emissiveIntensity: 0.8,
        roughness: 0.2
      });
      const reticle = new THREE.Mesh(reticleGeo, reticleMat);
      group.add(reticle);

      const coreGeo = new THREE.IcosahedronGeometry(0.12, 0);
      const core = new THREE.Mesh(coreGeo, reticleMat);
      group.add(core);
    } else if (exp.id === 'visor') {
      // Maqueta Arquitectónica de Pabellón Alámbrico
      const archGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.28, 6);
      const archMat = new THREE.MeshStandardMaterial({
        color: 0xd59b2d,
        emissive: 0xd59b2d,
        emissiveIntensity: 0.7,
        wireframe: true
      });
      const arch = new THREE.Mesh(archGeo, archMat);
      group.add(arch);
    } else if (exp.id === 'zombie-classroom') {
      // Artefacto Biológico / Cráneo Zombi Mutante Holográfico
      const skullGeo = new THREE.DodecahedronGeometry(0.18, 0);
      const skullMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 0.85,
        wireframe: true
      });
      const skull = new THREE.Mesh(skullGeo, skullMat);
      group.add(skull);

      const ringGeo = new THREE.TorusGeometry(0.28, 0.015, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      group.add(ring);
    } else {
      // Bloque genérico
      const cubeGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.8,
        wireframe: true
      });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      group.add(cube);
    }

    return group;
  }

  /* ----------------------------------------------------
     Generador de Textura Canvas 2D para Pantallas de Portal
     ---------------------------------------------------- */
  createPortalTexture(exp) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // Fondo: Negro Obsidiana Profundo con degradado nítido
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 720);
    bgGrad.addColorStop(0, '#0e172a');
    bgGrad.addColorStop(0.5, '#070d18');
    bgGrad.addColorStop(1, '#02050a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 720);

    // Marco exterior en Oro Puma
    ctx.strokeStyle = '#D59B2D';
    ctx.lineWidth = 7;
    ctx.strokeRect(14, 14, 484, 692);

    // Borde temático interior
    ctx.strokeStyle = exp.colorHex;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(22, 22, 468, 676);

    // Encabezado Institucional UNAM
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.fillStyle = '#D59B2D';
    ctx.textAlign = 'center';
    ctx.fillText('PC PUMA // UNAM', 256, 62);

    // Subtítulo de Categoría
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = exp.isUpcoming ? '#34d399' : '#F6C15C';
    ctx.fillText(exp.category.toUpperCase(), 256, 95);

    // Ícono Central
    ctx.font = '88px sans-serif';
    ctx.fillText(exp.icon, 256, 250);

    // Línea divisoria
    ctx.strokeStyle = 'rgba(213, 155, 45, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 305);
    ctx.lineTo(462, 305);
    ctx.stroke();

    // Título Principal de la Experiencia
    ctx.font = 'bold 25px Orbitron, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    this.wrapText(ctx, exp.title, 256, 365, 420, 34);

    // Badge de Estado / Compatibilidad
    ctx.fillStyle = exp.isUpcoming ? '#059669' : '#D59B2D';
    ctx.fillRect(110, 485, 292, 42);
    ctx.fillStyle = '#01050e';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(`[ ${exp.badge} ]`, 256, 512);

    // Botón de Llamado a la Acción (CTA)
    if (exp.isUpcoming) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(90, 585, 332, 54);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.strokeRect(90, 585, 332, 54);

      ctx.fillStyle = '#01150e';
      ctx.font = 'bold 20px Orbitron, sans-serif';
      ctx.fillText('EN DESARROLLO 🔒', 256, 620);
    } else {
      ctx.fillStyle = '#F6C15C';
      ctx.fillRect(90, 585, 332, 54);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(90, 585, 332, 54);

      ctx.fillStyle = '#01050e';
      ctx.font = 'bold 21px Orbitron, sans-serif';
      ctx.fillText('LANZAR EXPERIENCIA ↗', 256, 620);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
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
     Mandos WebXR (Meta Quest) & Integración con Dolly
     ---------------------------------------------------- */
  setupWebXRControllers() {
    const controllerModelFactory = new XRControllerModelFactory();

    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', (e) => this.onSelectStart(e));
      controller.addEventListener('selectend', (e) => this.onSelectEnd(e));
      this.dolly.add(controller);
      this.controllers.push(controller);

      // Línea Láser del puntero en Oro Puma
      const laserGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -4.5)
      ]);
      const laserMat = new THREE.LineBasicMaterial({
        color: 0xd59b2d,
        transparent: true,
        opacity: 0.85
      });
      const laser = new THREE.Line(laserGeo, laserMat);
      laser.name = 'laser';
      controller.add(laser);

      // Retícula en la punta
      const dotGeo = new THREE.SphereGeometry(0.018, 10, 10);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xf6c15c });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.z = -4.5;
      dot.name = 'reticleDot';
      controller.add(dot);

      // Modelo 3D del mando Meta Quest Touch
      const grip = this.renderer.xr.getControllerGrip(i);
      grip.add(controllerModelFactory.createControllerModel(grip));
      this.dolly.add(grip);
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

      // Respuesta háptica en los mandos de Meta Quest
      const session = this.renderer.xr.getSession();
      if (session && session.inputSources) {
        for (const source of session.inputSources) {
          if (source.gamepad && source.gamepad.hapticActuators && source.gamepad.hapticActuators[0]) {
            source.gamepad.hapticActuators[0].pulse(0.7, 85);
          }
        }
      }

      this.handleObjectClick(hit);
    }
  }

  onSelectEnd(event) {
    // Fin de selección
  }

  /* ----------------------------------------------------
     Locomoción con Joystick en Meta Quest
     ---------------------------------------------------- */
  handleXRLocomotion(delta) {
    if (!this.isVR) return;

    const session = this.renderer.xr.getSession();
    if (!session || !session.inputSources) return;

    for (const source of session.inputSources) {
      if (!source.gamepad || !source.gamepad.axes) continue;

      const axes = source.gamepad.axes;
      let stickX = 0;
      let stickY = 0;

      if (axes.length >= 4) {
        stickX = axes[2];
        stickY = axes[3];
        if (Math.abs(stickX) < 0.08 && Math.abs(stickY) < 0.08 && (Math.abs(axes[0]) > 0.08 || Math.abs(axes[1]) > 0.08)) {
          stickX = axes[0];
          stickY = axes[1];
        }
      } else if (axes.length >= 2) {
        stickX = axes[0];
        stickY = axes[1];
      }

      // Mano Izquierda: Desplazamiento Suave
      if (source.handedness === 'left') {
        if (Math.abs(stickX) > 0.12 || Math.abs(stickY) > 0.12) {
          this.camera.getWorldDirection(this.forwardVec);
          this.forwardVec.y = 0;
          this.forwardVec.normalize();

          this.rightVec.crossVectors(this.forwardVec, this.camera.up).normalize();

          this.moveVec.set(0, 0, 0);
          this.moveVec.addScaledVector(this.forwardVec, -stickY);
          this.moveVec.addScaledVector(this.rightVec, stickX);

          const moveSpeed = 2.8;
          this.dolly.position.addScaledVector(this.moveVec, moveSpeed * delta);

          // Restringir al límite caminable del Laboratorio VXR
          this.constrainPlayerToRoom();
        }
      }

      // Mano Derecha: Snap Turn 45°
      else if (source.handedness === 'right') {
        if (stickX > 0.65) {
          if (!this.snapTurnLocked) {
            this.dolly.rotation.y -= Math.PI / 4;
            this.snapTurnLocked = true;
            if (window.xrAudio) window.xrAudio.playHover();
          }
        } else if (stickX < -0.65) {
          if (!this.snapTurnLocked) {
            this.dolly.rotation.y += Math.PI / 4;
            this.snapTurnLocked = true;
            if (window.xrAudio) window.xrAudio.playHover();
          }
        } else if (Math.abs(stickX) < 0.25) {
          this.snapTurnLocked = false;
        }
      }
    }
  }

  /* ----------------------------------------------------
     Locomoción con Teclado WASD para Modo 3D en PC (FPS)
     ---------------------------------------------------- */
  setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
    });
  }

  handleDesktopLocomotion(delta) {
    if (this.isVR || !this.isInteractive3D) return;

    if (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right) {
      // Dirección frontal proyectada en el plano XZ a partir de la rotación yaw del jugador
      this.forwardVec.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
      this.rightVec.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

      this.moveVec.set(0, 0, 0);
      if (this.keys.forward) this.moveVec.add(this.forwardVec);
      if (this.keys.backward) this.moveVec.sub(this.forwardVec);
      if (this.keys.right) this.moveVec.add(this.rightVec);
      if (this.keys.left) this.moveVec.sub(this.rightVec);

      this.moveVec.normalize();
      const speed = 4.2;
      this.dolly.position.addScaledVector(this.moveVec, speed * delta);

      this.constrainPlayerToRoom();
    }
  }

  constrainPlayerToRoom() {
    if (this.labRoom) {
      const bounds = this.labRoom.getWalkableBounds(0.7);
      this.dolly.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.dolly.position.x));
      this.dolly.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.dolly.position.z));
    }
  }

  /* ----------------------------------------------------
     Configuración del Botón VR y Optimizaciones
     ---------------------------------------------------- */
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
    btn.style.background = 'rgba(2, 8, 18, 0.95)';
    btn.style.color = '#F6C15C';
    btn.style.borderRadius = '30px';
    btn.style.boxShadow = '0 0 20px rgba(213, 155, 45, 0.5)';
    btn.style.cursor = 'pointer';
    btn.style.display = 'none';
    btn.style.visibility = 'hidden';

    document.body.appendChild(btn);

    // Eventos de sesión WebXR
    this.renderer.xr.addEventListener('sessionstart', () => {
      this.isVR = true;
      this.container.classList.add('interactive-mode');
      document.getElementById('ui-root')?.classList.add('hidden-for-xr');
      document.getElementById('xr-scene-hud')?.classList.add('visible');
      document.getElementById('quest-vr-overlay')?.classList.add('hidden');

      // Optimización para Meta Quest 3S: Foveated Rendering al 100%
      if (this.renderer.xr.setFoveation) {
        this.renderer.xr.setFoveation(1.0);
      }

      this.dolly.position.set(0, 0, 0);
      this.dolly.rotation.set(0, 0, 0);

      if (window.xrAudio) window.xrAudio.playWarp();
      if (window.SipnasiaXR) {
        window.SipnasiaXR.log('¡Sesión WebXR activa en Laboratorio VXR! Stick Izq: Mover | Stick Der: Girar.');
      }
    });

    this.renderer.xr.addEventListener('sessionend', () => {
      this.isVR = false;
      this.container.classList.remove('interactive-mode');
      document.getElementById('ui-root')?.classList.remove('hidden-for-xr');
      document.getElementById('xr-scene-hud')?.classList.remove('visible');

      this.dolly.position.set(0, 0, 0);
      this.dolly.rotation.set(0, 0, 0);

      if (window.SipnasiaXR) {
        window.SipnasiaXR.log('Sesión WebXR finalizada.');
      }
    });
  }

  /* ----------------------------------------------------
     Interacciones, Manejo de Portales y Navegación Dual
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

      // CASO 1: Portal PRÓXIMAMENTE (En desarrollo)
      if (data.isUpcoming || data.id === 'proximamente') {
        if (window.xrAudio) window.xrAudio.playHover();
        this.showUpcomingNotification(data);
        if (window.SipnasiaXR) {
          window.SipnasiaXR.log('🔒 Módulo en desarrollo: Próxima Experiencia XR de Innovación PC PUMA UNAM.');
        }
        return;
      }

      // CASO 2: Portales Activos (Simulador, Shooter, Visor)
      if (window.xrAudio) window.xrAudio.playWarp();
      if (window.SipnasiaXR) {
        window.SipnasiaXR.log(`Accediendo de inmediato a: ${data.title}...`);
      }

      // Navegar DIRECTAMENTE a la experiencia sin bloqueos ni ventanas extra
      this.navigateDirectly(data.url);
    } else if (object.userData.isGallery) {
      const action = object.userData.action || 'view';
      if (action === 'prev') {
        this.cycleGalleryPhoto(-1, true);
      } else if (action === 'next') {
        this.cycleGalleryPhoto(1, true);
      } else if (action === 'view') {
        // Al hacer clic en la pantalla central, verificar el punto de impacto local si está disponible
        if (this.lastGalleryHitU !== undefined) {
          if (this.lastGalleryHitU < 0.28) {
            this.cycleGalleryPhoto(-1, true);
            return;
          } else if (this.lastGalleryHitU > 0.72) {
            this.cycleGalleryPhoto(1, true);
            return;
          }
        }
        // Centro o clic directo: abrir visor limpio
        if (window.xrAudio) window.xrAudio.playSelect();
        this.openGalleryModal();
      }
    } else if (object.userData.isDynamicNode) {
      if (window.SipnasiaXR) {
        window.SipnasiaXR.handleNodeHit(object);
      }
    }
  }

  /* ----------------------------------------------------
     Modal Detallado de la Galería del Taller con Carrusel
     ---------------------------------------------------- */
  openGalleryModal() {
    const modal = document.getElementById('workshop-gallery-modal');
    if (!modal) return;

    // Conectar botones de navegación prev / next del modal
    const prevBtn = document.getElementById('btn-gallery-prev');
    const nextBtn = document.getElementById('btn-gallery-next');
    const closeBtn = document.getElementById('btn-close-gallery-modal');

    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        this.cycleGalleryPhoto(-1, true);
      };
    }

    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        this.cycleGalleryPhoto(1, true);
      };
    }

    // Liberar pointer lock temporalmente para interactuar con el modal
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    this.updateGalleryModalContent();
    modal.classList.remove('hidden');

    const closeModal = () => {
      if (window.xrAudio) window.xrAudio.playHover();
      modal.classList.add('hidden');
      if (this.isInteractive3D && !this.isVR) {
        try {
          this.renderer.domElement.requestPointerLock();
        } catch (e) {}
      }
    };

    if (closeBtn) {
      closeBtn.onclick = closeModal;
    }
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }

  updateGalleryModalContent() {
    const modal = document.getElementById('workshop-gallery-modal');
    if (!modal) return;

    const current = this.galleryPhotos[this.galleryCurrentIndex] || this.galleryPhotos[0];
    const total = this.galleryPhotos.length;

    const phaseEl = document.getElementById('gallery-modal-phase');
    const counterEl = document.getElementById('gallery-counter-badge');
    const dotsRow = document.getElementById('gallery-dots-row');

    if (phaseEl) phaseEl.textContent = 'FOTOS DEL TALLER // SYNAPSIA XR';
    if (counterEl) counterEl.textContent = `${this.galleryCurrentIndex + 1} / ${total}`;

    // Renderizar imagen directa en el canvas del modal (960 x 540)
    const modalCanvas = document.getElementById('gallery-modal-canvas');
    if (modalCanvas) {
      const mctx = modalCanvas.getContext('2d');
      mctx.clearRect(0, 0, modalCanvas.width, modalCanvas.height);

      // Fondo azul noche
      const mgrad = mctx.createLinearGradient(0, 0, modalCanvas.width, modalCanvas.height);
      mgrad.addColorStop(0, '#02182e');
      mgrad.addColorStop(0.5, '#052b4f');
      mgrad.addColorStop(1, '#010e1d');
      mctx.fillStyle = mgrad;
      mctx.fillRect(0, 0, modalCanvas.width, modalCanvas.height);

      // Dibujar imagen si está cargada
      let img = this.galleryLoadedImages[current.imageSrc];
      if (!img) {
        img = new Image();
        img.src = current.imageSrc;
        img.onload = () => {
          this.galleryLoadedImages[current.imageSrc] = img;
          this.updateGalleryModalContent();
        };
        this.galleryLoadedImages[current.imageSrc] = img;
      }

      if (img && img.complete && img.naturalWidth > 0) {
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = modalCanvas.width / modalCanvas.height;
        let dw, dh, dx, dy;

        if (imgAspect > canvasAspect) {
          dw = modalCanvas.width - 24;
          dh = dw / imgAspect;
          dx = 12;
          dy = (modalCanvas.height - dh) / 2;
        } else {
          dh = modalCanvas.height - 24;
          dw = dh * imgAspect;
          dx = (modalCanvas.width - dw) / 2;
          dy = 12;
        }

        mctx.save();
        mctx.shadowColor = current.colorHex || '#00f0ff';
        mctx.shadowBlur = 18;
        mctx.drawImage(img, dx, dy, dw, dh);
        mctx.restore();
      } else {
        // Fallback
        mctx.font = '110px sans-serif';
        mctx.textAlign = 'center';
        mctx.fillText(current.icon || '📸', modalCanvas.width / 2, modalCanvas.height / 2 + 35);
      }

      // Marco del visor con acento de color
      mctx.strokeStyle = current.colorHex || '#00f0ff';
      mctx.lineWidth = 4;
      mctx.strokeRect(6, 6, modalCanvas.width - 12, modalCanvas.height - 12);
    }

    // Indicadores Dots
    if (dotsRow) {
      dotsRow.innerHTML = this.galleryPhotos.map((_, i) =>
        `<span class="gallery-dot ${i === this.galleryCurrentIndex ? 'active' : ''}" data-idx="${i}"></span>`
      ).join('');

      dotsRow.querySelectorAll('.gallery-dot').forEach(dot => {
        dot.onclick = (e) => {
          e.stopPropagation();
          const targetIdx = parseInt(dot.getAttribute('data-idx'), 10);
          this.galleryCurrentIndex = targetIdx;
          this.updatePanoramicCarouselTexture();
          this.updateGalleryModalContent();
          if (window.xrAudio) window.xrAudio.playHover();
        };
      });
    }
  }

  /* ----------------------------------------------------
     Mini-Hub Holográfico de Portales (Modal de Vista Previa)
     ---------------------------------------------------- */
  openPortalMiniHub(data) {
    const modal = document.getElementById('portal-mini-hub-modal');
    if (!modal) {
      this.navigateDirectly(data.url);
      return;
    }

    const titleEl = document.getElementById('mini-hub-title');
    const catEl = document.getElementById('mini-hub-category');
    const descEl = document.getElementById('mini-hub-desc');
    const iconEl = document.getElementById('mini-hub-icon');
    const featuresEl = document.getElementById('mini-hub-features');
    const enterBtn = document.getElementById('btn-mini-hub-enter');
    const cancelBtn = document.getElementById('btn-mini-hub-cancel');

    if (titleEl) titleEl.textContent = data.title;
    if (catEl) catEl.textContent = (data.category || 'EXPERIENCIA XR') + ' // MODO INMERSIVO';
    if (descEl) descEl.textContent = data.desc;

    let icon = '🌐';
    let features = ['Realidad Virtual 6DoF', 'Audio 3D Espacial', 'Optimizado Meta Quest 3S'];

    if (data.id === 'simulador' || (data.url && data.url.includes('simulador'))) {
      icon = '💻';
      features = [
        '📦 Préstamo y Recepción de Laptops',
        '💳 Validación Credencial y NFC',
        '🔋 Carritos de Carga Eléctrica',
        '📊 Modo Evaluación Oficial'
      ];
    } else if (data.id === 'shooter' || (data.url && data.url.includes('shooter'))) {
      icon = '🛡️';
      features = [
        '👾 Oleadas de Malware y Virus',
        '🔫 3 Armas Antivirus Desbloqueables',
        '🛒 Cyber Store y Mejoras en VR',
        '☣️ Batalla Final vs Ransomware'
      ];
    } else if (data.id === 'visor' || (data.url && data.url.includes('visor'))) {
      icon = '🏛️';
      features = [
        '🏢 6 Recintos Universitarios UNAM',
        '📐 Escala 1:1 Inmersiva',
        '🥽 Passthrough AR para Meta Quest',
        '🔍 Inspección de Mobiliario Modular'
      ];
    } else if (data.id === 'zombie-classroom' || (data.url && data.url.includes('zombie-classroom'))) {
      icon = '🧟';
      features = [
        '🏫 Salón de Clases Detallado 3D',
        '🧟 5 Clases de Zombis (Titanes, Químicos, Corredores)',
        '🔫 4 Armas Especiales y Drops Enemigos',
        '🌊 Oleadas Progresivas de Supervivencia'
      ];
    }

    if (iconEl) iconEl.textContent = icon;
    if (featuresEl) {
      featuresEl.innerHTML = features
        .map(f => `<span class="mini-hub-feature-pill">${f}</span>`)
        .join('');
    }

    if (enterBtn) {
      enterBtn.onclick = () => {
        if (window.xrAudio) window.xrAudio.playWarp();
        modal.classList.add('hidden');
        this.navigateDirectly(data.url);
      };
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        if (window.xrAudio) window.xrAudio.playHover();
        modal.classList.add('hidden');
      };
    }

    modal.classList.remove('hidden');
  }

  navigateDirectly(url) {
    const targetUrl = new URL(url, window.location.href).href;

    if (window.xrAudio) window.xrAudio.playWarp();
    if (window.SipnasiaXR) {
      window.SipnasiaXR.log(`Cargando experiencia: ${targetUrl}...`);
    }

    if (this.isVR) {
      const session = this.renderer.xr.getSession();
      if (session) {
        let finished = false;
        const doGo = () => {
          if (!finished) {
            finished = true;
            window.location.href = targetUrl;
          }
        };

        // Redirección inmediata con fallback seguro de 120ms
        setTimeout(doGo, 120);

        try {
          session.end().then(doGo).catch(doGo);
        } catch (e) {
          doGo();
        }
        return;
      }
    }

    window.location.href = targetUrl;
  }

  /* ----------------------------------------------------
     Cartel Holográfico en 3D para Módulo "Próximamente"
     ---------------------------------------------------- */
  showUpcomingNotification(data) {
    // Si ya existe un panel previo, removerlo
    if (this.upcomingHoloPanel) {
      this.scene.remove(this.upcomingHoloPanel);
      this.upcomingHoloPanel = null;
      if (this.upcomingPanelTimer) clearTimeout(this.upcomingPanelTimer);
    }

    const panelGroup = new THREE.Group();

    // Crear textura del cartel
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Fondo
    ctx.fillStyle = 'rgba(2, 18, 12, 0.95)';
    ctx.fillRect(0, 0, 640, 320);

    // Borde esmeralda
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 624, 304);

    // Encabezado
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔒 EN DESARROLLO DURANTE EL TALLER', 320, 58);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px -apple-system, sans-serif';
    ctx.fillText('Actividad en Vivo // Taller de Desarrollo XR', 320, 110);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '17px -apple-system, sans-serif';
    ctx.fillText('En desarrollo durante la actividad del taller de XR.', 320, 158);
    ctx.fillText('Esta 4ta experiencia se creará e implementará', 320, 192);
    ctx.fillText('en tiempo real junto con los participantes.', 320, 224);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('ESTADO: ACTIVIDAD DEL TALLER EN VIVO', 320, 275);

    const texture = new THREE.CanvasTexture(canvas);
    const planeGeo = new THREE.PlaneGeometry(2.4, 1.2);
    const planeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide
    });
    const panelMesh = new THREE.Mesh(planeGeo, planeMat);
    panelGroup.add(panelMesh);

    // Posicionar frente a la bahía de Próximamente
    panelGroup.position.set(4.2, 1.6, -3.8);
    panelGroup.rotation.y = -0.38;

    this.scene.add(panelGroup);
    this.upcomingHoloPanel = panelGroup;

    // Desvanecer después de 4.5 segundos
    this.upcomingPanelTimer = setTimeout(() => {
      if (this.upcomingHoloPanel) {
        this.scene.remove(this.upcomingHoloPanel);
        this.upcomingHoloPanel = null;
      }
    }, 4500);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const canvas = this.renderer.domElement;
    const crosshair = document.getElementById('hub-crosshair');
    const promptEl = document.getElementById('hub-portal-prompt');
    const promptText = document.getElementById('portal-prompt-text');

    // 1. Detección de Bloqueo de Puntero (Pointer Lock) para Modo FPS
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === canvas);
      if (crosshair) crosshair.classList.toggle('visible', this.isPointerLocked && this.isInteractive3D);
      const hudInfo = document.getElementById('hud-controls-text');
      if (hudInfo) {
        if (this.isPointerLocked) {
          hudInfo.textContent = 'MODO PRIMERA PERSONA FIJADO // [WASD]: CAMINAR | [RATÓN]: MIRAR | [CLIC]: ENTRAR A PORTAL | [ESC]: LIBERAR';
        } else {
          hudInfo.textContent = 'MODO PRIMERA PERSONA // HAZ CLIC EN LA PANTALLA PARA FIJAR LA CÁMARA | [WASD]: CAMINAR';
        }
      }
      if (!this.isPointerLocked && promptEl) {
        promptEl.classList.remove('visible');
      }
    });

    // 2. Movimiento de Ratón (Rotación de Cabeza en Primera Persona)
    window.addEventListener('mousemove', (e) => {
      if (!this.isInteractive3D || this.isVR) return;

      if (this.isPointerLocked) {
        // Modo FPS fijado: Sensibilidad óptima idéntica a juegos WebXR
        const sensitivity = 0.0022;
        this.yaw -= e.movementX * sensitivity;
        this.pitch -= e.movementY * sensitivity;
        this.pitch = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, this.pitch));

        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

        // Comprobar portal o mampara de galería bajo la retícula central (0, 0)
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactables, false);

        if (intersects.length > 0 && intersects[0].object?.userData?.isPortal) {
          const portalObj = intersects[0].object;
          this.hoveredPortal = portalObj;
          if (crosshair) crosshair.classList.add('hovering');
          if (promptEl) {
            promptEl.classList.add('visible');
            if (promptText) {
              const data = portalObj.userData.portalData;
              promptText.textContent = `ENTRAR A ${data.title}`;
            }
          }
        } else if (intersects.length > 0 && intersects[0].object?.userData?.isGallery) {
          const galleryObj = intersects[0].object;
          this.hoveredPortal = galleryObj;
          if (intersects[0].uv) {
            this.lastGalleryHitU = intersects[0].uv.x;
          }
          if (crosshair) crosshair.classList.add('hovering');
          if (promptEl) {
            promptEl.classList.add('visible');
            if (promptText) {
              const action = galleryObj.userData.action;
              if (action === 'prev' || (galleryObj === this.galleryMesh && this.lastGalleryHitU < 0.28)) {
                promptText.textContent = '◀ FOTO ANTERIOR';
              } else if (action === 'next' || (galleryObj === this.galleryMesh && this.lastGalleryHitU > 0.72)) {
                promptText.textContent = 'SIGUIENTE FOTO ▶';
              } else {
                promptText.textContent = 'VER FOTO EN PANTALLA COMPLETA 🔍';
              }
            }
          }
        } else {
          this.hoveredPortal = null;
          this.lastGalleryHitU = undefined;
          if (crosshair) crosshair.classList.remove('hovering');
          if (promptEl) promptEl.classList.remove('visible');
        }
      } else {
        // Si aún no está bloqueado, actualizar coordenadas de cursor para raycasting visual
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactables, false);
        if (intersects.length > 0 && (intersects[0].object?.userData?.isPortal || intersects[0].object?.userData?.isGallery)) {
          if (intersects[0].uv) {
            this.lastGalleryHitU = intersects[0].uv.x;
          }
          document.body.style.cursor = 'pointer';
        } else {
          this.lastGalleryHitU = undefined;
          document.body.style.cursor = 'default';
        }
      }
    });

    // 3. Clic para Fijar la Cámara y/o Entrar a los Portales
    canvas.addEventListener('click', (e) => {
      if (!this.isInteractive3D || this.isVR) return;

      if (!this.isPointerLocked) {
        // Al dar clic en pantalla, fijar el cursor en primera persona de inmediato
        try {
          const promise = canvas.requestPointerLock();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(() => {});
          }
        } catch (err) {
          console.warn('[SipnasiaXR] Pointer lock error:', err);
        }
      } else {
        // En modo fijado, disparar raycast al centro
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactables, false);
        if (intersects.length > 0) {
          if (intersects[0].uv) {
            this.lastGalleryHitU = intersects[0].uv.x;
          }
          this.handleObjectClick(intersects[0].object);
        }
      }
    });
  }

  toggleInteractive3D(enable) {
    this.isInteractive3D = enable;
    const canvas = this.renderer.domElement;
    const crosshair = document.getElementById('hub-crosshair');
    const promptEl = document.getElementById('hub-portal-prompt');

    if (enable) {
      this.container.classList.add('interactive-mode');
      document.getElementById('ui-root')?.classList.add('hidden-for-xr');
      document.getElementById('xr-scene-hud')?.classList.add('visible');

      // Colocar al jugador a nivel de ojos humanos en el Hub
      this.camera.position.set(0, 1.6, 0);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.set(0, 0, 0);
      this.yaw = 0;
      this.pitch = 0;

      // Solicitar fijación de cámara automática al entrar
      setTimeout(() => {
        try {
          const promise = canvas.requestPointerLock();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(() => {});
          }
        } catch (e) {}
      }, 100);
    } else {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      this.isPointerLocked = false;
      this.container.classList.remove('interactive-mode');
      document.getElementById('ui-root')?.classList.remove('hidden-for-xr');
      document.getElementById('xr-scene-hud')?.classList.remove('visible');
      if (crosshair) crosshair.classList.remove('visible');
      if (promptEl) promptEl.classList.remove('visible');
      document.body.style.cursor = 'default';
    }
  }

  /* ----------------------------------------------------
     Bucle de Renderizado Continuo de Alto Rendimiento
     ---------------------------------------------------- */
  render(time, frame) {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // Throttling en modo página plana para no sobrecargar el visor
    if (!this.isVR && !this.isInteractive3D) {
      this.idleFrameCount = (this.idleFrameCount || 0) + 1;
      if (this.idleFrameCount % 2 !== 0) {
        return;
      }
    }

    // 1. Locomoción por Joystick en VR (Meta Quest) o Teclado en PC
    if (this.isVR) {
      this.handleXRLocomotion(delta);
    } else if (this.isInteractive3D) {
      this.handleDesktopLocomotion(delta);
    }

    // 2. Animación de Monolitos Flotantes
    this.portals.forEach((portalGroup, idx) => {
      const baseY = portalGroup.children[1]?.userData?.baseY ?? 1.6;
      const floatOffset = Math.sin(elapsedTime * 1.4 + idx * 1.1) * 0.05;
      portalGroup.position.y = baseY + floatOffset;
    });

    // 3. Rotación de Artefactos Holográficos sobre los Portales
    this.portalArtifacts.forEach((artifact, idx) => {
      artifact.rotation.y += delta * 0.8;
      artifact.rotation.x = Math.sin(elapsedTime * 1.2 + idx) * 0.12;
    });

    // 4. Animación del Núcleo Cuántico Central
    if (this.quantumRings.length >= 3) {
      this.quantumRings[0].rotation.z += delta * 0.6;
      this.quantumRings[1].rotation.x += delta * 0.9;
      this.quantumRings[2].rotation.y += delta * 0.7;
    }

    // 5. Respiración de la Baliza Central
    if (this.quantumBeacon) {
      this.quantumBeacon.intensity = 2.0 + Math.sin(elapsedTime * 2.5) * 0.6;
    }

    // 6. Rotación de la Red Sináptica
    if (this.synapseParticles) {
      this.synapseParticles.rotation.y = elapsedTime * 0.018;
    }

    // 7. Actualizar Dinámica WebXR si está activa
    if (window.SipnasiaXR) {
      window.SipnasiaXR.updateFrame(delta, elapsedTime);
    }

    // 8. Renderizado final optimizado
    this.renderer.render(this.scene, this.camera);
  }
}

// Instancia global del Gestor de Escena
window.XRSceneManager = new XRSceneController();

// Inicializar cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  window.XRSceneManager.init();
});
