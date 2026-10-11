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

    // 5. Controles de Escritorio (Orbit) para Modo 2D/PC
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.5, -2.5);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 16;

    // 6. Construcción del Laboratorio Futurista con XRRoom de Framework VXR
    this.setupFuturisticLab();

    // 7. Iluminación Brillante de Laboratorio (Blanco, Oro y Cyan)
    this.setupLaboratoryLighting();

    // 8. Núcleo Cuántico Central PC PUMA UNAM
    this.setupQuantumCore();

    // 9. Red de Partículas Sinápticas Flotantes
    this.setupSynapseNetwork();

    // 10. Las 4 Puertas / Portales de Experiencias (Incluyendo Próximamente)
    this.setupExperiencePortals();

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
     Locomoción con Teclado WASD para Modo 3D en PC
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
      this.camera.getWorldDirection(this.forwardVec);
      this.forwardVec.y = 0;
      this.forwardVec.normalize();
      this.rightVec.crossVectors(this.forwardVec, this.camera.up).normalize();

      this.moveVec.set(0, 0, 0);
      if (this.keys.forward) this.moveVec.add(this.forwardVec);
      if (this.keys.backward) this.moveVec.sub(this.forwardVec);
      if (this.keys.right) this.moveVec.add(this.rightVec);
      if (this.keys.left) this.moveVec.sub(this.rightVec);

      this.moveVec.normalize();
      const speed = 3.6;
      this.dolly.position.addScaledVector(this.moveVec, speed * delta);
      this.controls.target.addScaledVector(this.moveVec, speed * delta);

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
    } else if (object.userData.isDynamicNode) {
      if (window.SipnasiaXR) {
        window.SipnasiaXR.handleNodeHit(object);
      }
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

    let pointerDownPos = { x: 0, y: 0 };
    window.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.isInteractive3D && !this.isVR) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactables, false);
        if (intersects.length > 0 && intersects[0].object?.userData?.isPortal) {
          document.body.style.cursor = 'pointer';
        } else {
          document.body.style.cursor = 'default';
        }
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.isInteractive3D || this.isVR) return;

      // Ignorar si el usuario estaba arrastrando la cámara (movimiento mayor a 6px)
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return;

      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

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
      if (this.controls) this.controls.update();
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
