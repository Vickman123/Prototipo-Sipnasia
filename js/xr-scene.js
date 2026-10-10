/**
 * SIPNASIA XR - Escena 3D & Motor WebXR Optimizado para Meta Quest 3S
 * - Estilo Galería Lujosa UNAM: Blanco arquitectónico luminoso, Negro obsidiana y Oro Puma (#D59B2D / #F6C15C).
 * - Iluminación de alta visibilidad: luz cenital brillante, luz clave dorada y halos en pedestales.
 * - Navegación directa: al ingresar a un portal, navega en la misma ventana sin abrir pestañas externas.
 * - Locomoción completa por Joystick (Thumbstick):
 *     * Mano Izquierda: Desplazamiento suave (adelante/atrás/strafe según vista)
 *     * Mano Derecha: Snap Turn 45° anti-mareo
 *     * Teclado en PC: WASD / Flechas
 * - Optimización para Meta Quest 3S:
 *     * Fixed Foveated Rendering (setFoveation 1.0)
 *     * Camera Rig (Dolly)
 *     * Throttling inteligente en modo 2D para que el navegador no se trabe
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
    this.dolly = null; // Rig de cámara para locomoción WebXR
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Estado WebXR & Interacción
    this.isVR = false;
    this.isInteractive3D = false;
    this.interactables = [];
    this.portals = [];
    this.underglowLights = [];
    this.centerBeacon = null;

    // Controladores WebXR
    this.controllers = [];
    this.controllerGrips = [];
    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();
    this.mouse = new THREE.Vector2(-999, -999);

    // Vectores reutilizables para evitar recolección de basura (GC) y trabas
    this.forwardVec = new THREE.Vector3();
    this.rightVec = new THREE.Vector3();
    this.moveVec = new THREE.Vector3();

    // Estado de locomoción
    this.snapTurnLocked = false;
    this.keys = { forward: false, backward: false, left: false, right: false };

    // Red de Sinapsis (Partículas)
    this.synapseParticles = null;
    this.idleFrameCount = 0;
  }

  async init() {
    if (!this.container) return;

    // 1. Escena luminosa arquitectónica (Blanco Platino + Niebla suave)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf6f8fc);
    this.scene.fog = new THREE.FogExp2(0xf6f8fc, 0.015);

    // 2. Cámara de perspectiva
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.6, 2.6);

    // 3. Dolly (Camera Rig) - Permite el movimiento por joystick en VR
    this.dolly = new THREE.Group();
    this.dolly.position.set(0, 0, 0);
    this.dolly.add(this.camera);
    this.scene.add(this.dolly);

    // 4. Renderer WebGL optimizado para Meta Quest 3S
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
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // 5. Controles de Escritorio (Orbit) para modo 2D/PC
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.4, -2.5);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 14;

    // 6. Iluminación Brillante de Alto Contraste (Blanco, Oro y Negro)
    this.setupLighting();

    // 7. Entorno: Plataforma Circular de Obsidiana y Anillos Dorados
    this.setupEnvironmentGrid();
    this.setupSynapseNetwork();

    // 8. Monolitos Holográficos Nítidos de Alto Contraste
    this.setupExperiencePortals();

    // 9. Controladores WebXR en Dolly con Punteros Láser
    this.setupWebXRControllers();

    // 10. Botón Oficial WebXR con Foveated Rendering
    this.setupVRButton();

    // 11. Eventos de Ratón, Redimensión y Teclado WASD
    this.setupEventListeners();
    this.setupKeyboardControls();

    // 12. Bucle de Animación WebXR
    this.renderer.setAnimationLoop((time, frame) => this.render(time, frame));

    console.log('[SipnasiaXR] Galería Blanco-Obsidiana-Oro Lista.');
  }

  /* ----------------------------------------------------
     Iluminación Brillante: Blanco, Negro y Oro
     ---------------------------------------------------- */
  setupLighting() {
    // 1. Luz Hemisférica: Blanco puro cenital + Reflejo Oro Puma cálido
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd59b2d, 1.9);
    hemiLight.position.set(0, 12, 0);
    this.scene.add(hemiLight);

    // 2. Luz Clave Principal (Blanca brillante directa, elimina sombras oscuras)
    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.7);
    mainKeyLight.position.set(4, 12, 6);
    this.scene.add(mainKeyLight);

    // 3. Luz de Relleno Oro Puma (Acento cálido dorado institucional)
    const goldFillLight = new THREE.DirectionalLight(0xd59b2d, 2.2);
    goldFillLight.position.set(-4, 9, -3);
    this.scene.add(goldFillLight);

    // 4. Luz de Núcleo Central (Beacon Dorado Pulsante)
    this.centerBeacon = new THREE.PointLight(0xd59b2d, 2.0, 9);
    this.centerBeacon.position.set(0, 0.35, 0);
    this.scene.add(this.centerBeacon);

    // 5. Luces de acento bajo cada pedestal
    const lightSimulador = new THREE.PointLight(0x00f0ff, 2.4, 5.5);
    lightSimulador.position.set(-2.6, 0.45, -3.2);
    this.scene.add(lightSimulador);
    this.underglowLights.push(lightSimulador);

    const lightShooter = new THREE.PointLight(0xff007f, 2.4, 5.5);
    lightShooter.position.set(0, 0.45, -3.8);
    this.scene.add(lightShooter);
    this.underglowLights.push(lightShooter);

    const lightVisor = new THREE.PointLight(0xd59b2d, 2.6, 5.5);
    lightVisor.position.set(2.6, 0.45, -3.2);
    this.scene.add(lightVisor);
    this.underglowLights.push(lightVisor);
  }

  setupEnvironmentGrid() {
    // 1. Rejilla dorada sobre el piso blanco exterior
    const grid = new THREE.GridHelper(36, 36, 0xd59b2d, 0xc8d1dc);
    grid.position.y = -0.015;
    grid.material.opacity = 0.55;
    grid.material.transparent = true;
    this.scene.add(grid);

    // 2. Plataforma circular central de obsidiana negra pulida
    const platformGeo = new THREE.CylinderGeometry(4.8, 4.8, 0.03, 64);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x090d16, // Negro obsidiana profundo
      roughness: 0.25,
      metalness: 0.8
    });
    const platformMesh = new THREE.Mesh(platformGeo, platformMat);
    platformMesh.position.y = -0.015;
    this.scene.add(platformMesh);

    // 3. Anillos concéntricos dorados sobre la plataforma de obsidiana
    const innerRingGeo = new THREE.RingGeometry(0.9, 0.95, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xd59b2d,
      side: THREE.FrontSide
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.005;
    this.scene.add(innerRing);

    const midRingGeo = new THREE.RingGeometry(2.35, 2.42, 64);
    const midRingMat = new THREE.MeshBasicMaterial({
      color: 0xf6c15c,
      side: THREE.FrontSide
    });
    const midRing = new THREE.Mesh(midRingGeo, midRingMat);
    midRing.rotation.x = -Math.PI / 2;
    midRing.position.y = 0.005;
    this.scene.add(midRing);

    const outerRingGeo = new THREE.RingGeometry(4.7, 4.78, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xd59b2d,
      side: THREE.FrontSide
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.005;
    this.scene.add(outerRing);
  }

  setupSynapseNetwork() {
    // Red de partículas doradas flotantes (oro sobre blanco y negro)
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 5.5 + 0.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMaterial = new THREE.PointsMaterial({
      color: 0xd59b2d, // Partículas de Oro Puma
      size: 0.08,
      transparent: true,
      opacity: 0.85
    });

    this.synapseParticles = new THREE.Points(geometry, pMaterial);
    this.scene.add(this.synapseParticles);
  }

  /* ----------------------------------------------------
     Monolitos Holográficos de Alto Contraste (Blanco/Negro/Oro)
     ---------------------------------------------------- */
  setupExperiencePortals() {
    const experiencesData = [
      {
        id: 'simulador',
        title: 'SIMULADOR DE OPERADOR PC PUMA',
        category: 'Capacitación Operativa',
        badge: 'QUEST 3S / PC',
        url: 'https://vickman123.github.io/Simulador-operador-pcpuma/',
        colorHex: '#00f0ff',
        colorThree: 0x00f0ff,
        icon: '💻',
        pos: new THREE.Vector3(-2.6, 1.5, -3.2),
        rotY: 0.38
      },
      {
        id: 'shooter',
        title: 'SHOOTER PC PUMA (VIRUS PURGE)',
        category: 'Ciberdefensa Arcade',
        badge: 'QUEST 6DOF / PC',
        url: 'https://vickman123.github.io/FPS-WEBXR-VIRUS-PURGE/',
        colorHex: '#ff007f',
        colorThree: 0xff007f,
        icon: '🛡️',
        pos: new THREE.Vector3(0, 1.55, -3.8),
        rotY: 0
      },
      {
        id: 'visor',
        title: 'VISOR ARQUITECTÓNICO PC PUMA',
        category: 'Visualización Espacial 3D',
        badge: 'QUEST 3S PASSTHROUGH',
        url: 'https://vickman123.github.io/visor-xr/',
        colorHex: '#d59b2d',
        colorThree: 0xd59b2d,
        icon: '🏛️',
        pos: new THREE.Vector3(2.6, 1.5, -3.2),
        rotY: -0.38
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

    // 1. Marco Exterior en Obsidiana Negra con Bordes Dorados
    const frameGeo = new THREE.BoxGeometry(1.5, 2.1, 0.07);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x070c14,
      roughness: 0.3,
      metalness: 0.8
    });
    const frameBack = new THREE.Mesh(frameGeo, frameMat);
    group.add(frameBack);

    // Bordes biselados en Oro Puma brillante
    const frameEdges = new THREE.EdgesGeometry(frameGeo);
    const frameLineMat = new THREE.LineBasicMaterial({
      color: 0xd59b2d,
      linewidth: 3
    });
    const frameMesh = new THREE.LineSegments(frameEdges, frameLineMat);
    group.add(frameMesh);

    // 2. Cristal Frontal con Textura de Alta Legibilidad (Negro, Oro y Blanco)
    const texture = this.createPortalTexture(exp);
    const planeGeo = new THREE.PlaneGeometry(1.42, 2.02);
    const planeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.96,
      side: THREE.FrontSide
    });
    const screenMesh = new THREE.Mesh(planeGeo, planeMat);
    screenMesh.position.z = 0.04;
    group.add(screenMesh);

    // 3. Pedestal Flotante en Obsidiana Negra con Anillo Dorado
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.65, 0.12, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x070c14,
      roughness: 0.3,
      metalness: 0.85
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.18;
    group.add(baseMesh);

    const baseRingGeo = new THREE.TorusGeometry(0.66, 0.03, 16, 32);
    const baseRingMat = new THREE.MeshBasicMaterial({ color: 0xd59b2d });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = -1.16;
    group.add(baseRing);

    // Guardar referencia interactiva
    screenMesh.userData = {
      isPortal: true,
      portalData: exp,
      parentGroup: group,
      baseY: exp.pos.y
    };

    this.registerInteractable(screenMesh);

    return group;
  }

  createPortalTexture(exp) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // Fondo: Negro Obsidiana Profundo de alto contraste
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 720);
    bgGrad.addColorStop(0, '#0d1527');
    bgGrad.addColorStop(0.5, '#060a14');
    bgGrad.addColorStop(1, '#020409');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 720);

    // Borde exterior grueso en Oro Puma
    ctx.strokeStyle = '#D59B2D';
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, 484, 692);

    // Borde interior de acento temático
    ctx.strokeStyle = exp.colorHex;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(22, 22, 468, 676);

    // Encabezado Oro Puma UNAM
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.fillStyle = '#D59B2D';
    ctx.textAlign = 'center';
    ctx.fillText('PC PUMA // UNAM', 256, 62);

    // Subtítulo Categoría en Oro Claro
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#F6C15C';
    ctx.fillText(exp.category.toUpperCase(), 256, 95);

    // Ícono Central
    ctx.font = '92px sans-serif';
    ctx.fillText(exp.icon, 256, 255);

    // Línea divisoria dorada
    ctx.strokeStyle = 'rgba(213, 155, 45, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 315);
    ctx.lineTo(462, 315);
    ctx.stroke();

    // Título Principal en Blanco Puro de Máximo Contraste
    ctx.font = 'bold 26px Orbitron, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    this.wrapText(ctx, exp.title, 256, 375, 420, 34);

    // Badge de compatibilidad en Oro con Texto Negro
    ctx.fillStyle = '#D59B2D';
    ctx.fillRect(110, 495, 292, 42);
    ctx.fillStyle = '#01050e';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(`[ ${exp.badge} ]`, 256, 523);

    // Botón de Llamado a la Acción en Oro Puma con Texto Negro
    ctx.fillStyle = '#F6C15C';
    ctx.fillRect(90, 595, 332, 54);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(90, 595, 332, 54);

    ctx.fillStyle = '#01050e';
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.fillText('LANZAR EXPERIENCIA ↗', 256, 630);

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
        opacity: 0.8
      });
      const laser = new THREE.Line(laserGeo, laserMat);
      laser.name = 'laser';
      controller.add(laser);

      // Retícula punto en el extremo
      const dotGeo = new THREE.SphereGeometry(0.016, 10, 10);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xf6c15c });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.z = -4.5;
      dot.name = 'reticleDot';
      controller.add(dot);

      // Modelo 3D del mando Meta Quest
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
            source.gamepad.hapticActuators[0].pulse(0.7, 80);
          }
        }
      }

      this.handleObjectClick(hit);
    }
  }

  onSelectEnd(event) {
    // Liberar estado de selección
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

          const dist = Math.hypot(this.dolly.position.x, this.dolly.position.z);
          if (dist > 14) {
            const angle = Math.atan2(this.dolly.position.z, this.dolly.position.x);
            this.dolly.position.x = Math.cos(angle) * 14;
            this.dolly.position.z = Math.sin(angle) * 14;
          }
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
    btn.style.letterSpacing = '1.5px';

    document.body.appendChild(btn);

    // Eventos de sesión WebXR
    this.renderer.xr.addEventListener('sessionstart', () => {
      this.isVR = true;
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
        window.SipnasiaXR.log('¡Sesión WebXR activa! Usa el joystick izquierdo para moverte y el derecho para girar.');
      }
    });

    this.renderer.xr.addEventListener('sessionend', () => {
      this.isVR = false;
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
     Interacciones y Apertura Directa en Misma Ventana
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
        window.SipnasiaXR.log(`Accediendo directamente a: ${data.title}...`);
      }

      // Salir limpiamente de WebXR si está en visor y navegar en la misma ventana (sin pestañas nuevas)
      const session = this.renderer.xr.getSession();
      if (session) {
        session.end().finally(() => {
          window.location.href = data.url;
        });
      } else {
        window.location.href = data.url;
      }
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

    // 1. Locomoción por Joystick en VR (Meta Quest)
    if (this.isVR) {
      this.handleXRLocomotion(delta);
    } else if (this.isInteractive3D) {
      this.handleDesktopLocomotion(delta);
      if (this.controls) this.controls.update();
    }

    // 2. Animación suave de Monolitos Flotantes
    this.portals.forEach((portalGroup, idx) => {
      const floatOffset = Math.sin(elapsedTime * 1.4 + idx * 1.1) * 0.06;
      portalGroup.position.y = 1.5 + floatOffset;
    });

    // 3. Respiración del Beacon Central Dorado
    if (this.centerBeacon) {
      this.centerBeacon.intensity = 1.8 + Math.sin(elapsedTime * 2.5) * 0.5;
    }

    // 4. Rotación de Partículas Doradas
    if (this.synapseParticles) {
      this.synapseParticles.rotation.y = elapsedTime * 0.018;
    }

    // 5. Actualizar Dinámica WebXR si está activa
    if (window.SipnasiaXR) {
      window.SipnasiaXR.updateFrame(delta, elapsedTime);
    }

    // 6. Renderizado final optimizado
    this.renderer.render(this.scene, this.camera);
  }
}

// Instancia global del Gestor de Escena
window.XRSceneManager = new XRSceneController();

// Inicializar cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  window.XRSceneManager.init();
});
