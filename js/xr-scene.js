/**
 * SIPNASIA XR - Escena 3D & Motor WebXR Optimizado para Meta Quest 3S
 * - Iluminación futurista mejorada con halo de acento por experiencia y núcleo sináptico
 * - Locomoción completa por Joystick (Thumbstick):
 *     * Mano Izquierda: Desplazamiento suave (Adelante/Atrás/Lateral en relación a la vista)
 *     * Mano Derecha: Giro rápido por pasos (Snap Turn 45°) anti-mareo
 *     * Teclado en PC: Movimiento WASD / Flechas
 * - Optimización para Meta Quest 3S:
 *     * Camera Rig (Dolly) para movimiento sincronizado de cabeza y mandos
 *     * Foveated Rendering al 100% (setFoveation 1.0)
 *     * Desactivación de shadow maps pesados (0 caídas de FPS)
 *     * Throttling inteligente en modo página 2D para que la web no se trabe
 *     * Shaders ligeros y texturas de alta nitidez sin sobrecarga de GPU
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

    // Vectores reutilizables para evitar recolección de basura (GC) y trabas de frames
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

    // 1. Escena con niebla ambiental profunda UNAM
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010812);
    this.scene.fog = new THREE.FogExp2(0x010812, 0.038);

    // 2. Cámara de perspectiva
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.6, 2.5);

    // 3. Dolly (Camera Rig) - Esencial para que el joystick mueva al usuario en VR
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
    // Limitar pixel ratio a 1.75 en móviles/Quest evita sobrecarga de fillrate
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    // Desactivar shadow maps dinámicos (evita el cuello de botella que traba el Quest)
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 5. Controles de Escritorio (Orbit) para modo 2D/PC
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.4, -2.5);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 14;

    // 6. Iluminación Futurista Mejorada (UNAM Cyberpunk)
    this.setupLighting();

    // 7. Entorno de Sinapsis y Plataforma
    this.setupSynapseNetwork();
    this.setupEnvironmentGrid();

    // 8. Monolitos Holográficos Optimizados (Las 3 Apps)
    this.setupExperiencePortals();

    // 9. Controladores WebXR, Punteros Láser y Repositorio en Dolly
    this.setupWebXRControllers();

    // 10. Botón Oficial WebXR con Foveated Rendering
    this.setupVRButton();

    // 11. Eventos de Ratón, Redimensión y Teclado WASD
    this.setupEventListeners();
    this.setupKeyboardControls();

    // 12. Bucle de Animación WebXR
    this.renderer.setAnimationLoop((time, frame) => this.render(time, frame));

    console.log('[SipnasiaXR] Motor WebXR Optimizado para Meta Quest 3S Inicializado.');
  }

  /* ----------------------------------------------------
     Iluminación Futurista UNAM Mejorada
     ---------------------------------------------------- */
  setupLighting() {
    // 1. Luz Hemisférica suave: Cielo Cian Neón y Suelo Azul Profundo UNAM
    const hemiLight = new THREE.HemisphereLight(0x00f0ff, 0x00172d, 1.4);
    hemiLight.position.set(0, 10, 0);
    this.scene.add(hemiLight);

    // 2. Luz Clave Oro Puma (Direccional Frontal Superior)
    const goldKeyLight = new THREE.DirectionalLight(0xd59b2d, 2.2);
    goldKeyLight.position.set(4, 9, 3);
    this.scene.add(goldKeyLight);

    // 3. Luz de Borde / Silueta Cian (Direccional Trasera)
    const cyanRimLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    cyanRimLight.position.set(-4, 7, -4);
    this.scene.add(cyanRimLight);

    // 4. Luz de Núcleo Central (Beacon sináptico pulsante)
    this.centerBeacon = new THREE.PointLight(0x00f0ff, 1.4, 8);
    this.centerBeacon.position.set(0, 0.25, 0);
    this.scene.add(this.centerBeacon);

    // 5. Luces de acento bajo cada monolito (efecto resplandor temático en el suelo)
    const lightSimulador = new THREE.PointLight(0x00f0ff, 2.2, 4.5);
    lightSimulador.position.set(-2.6, 0.35, -3.2);
    this.scene.add(lightSimulador);
    this.underglowLights.push(lightSimulador);

    const lightShooter = new THREE.PointLight(0xff007f, 2.4, 4.5);
    lightShooter.position.set(0, 0.35, -3.8);
    this.scene.add(lightShooter);
    this.underglowLights.push(lightShooter);

    const lightVisor = new THREE.PointLight(0xd59b2d, 2.2, 4.5);
    lightVisor.position.set(2.6, 0.35, -3.2);
    this.scene.add(lightVisor);
    this.underglowLights.push(lightVisor);
  }

  setupEnvironmentGrid() {
    // Rejilla cibernética en el piso
    const grid = new THREE.GridHelper(32, 32, 0xd59b2d, 0x002b49);
    grid.position.y = -0.01;
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    this.scene.add(grid);

    // Círculos concéntricos de pedestal central de telemetría
    const ringGeo = new THREE.RingGeometry(0.85, 0.89, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 0.65
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.01;
    this.scene.add(ringMesh);

    const outerRingGeo = new THREE.RingGeometry(2.35, 2.4, 48);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xd59b2d,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 0.55
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.01;
    this.scene.add(outerRing);
  }

  setupSynapseNetwork() {
    // Red neuronal de partículas optimizada (120 partículas estables)
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 5.5 + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMaterial = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.synapseParticles = new THREE.Points(geometry, pMaterial);
    this.scene.add(this.synapseParticles);
  }

  /* ----------------------------------------------------
     Monolitos Holográficos Optimizados
     ---------------------------------------------------- */
  setupExperiencePortals() {
    const experiencesData = [
      {
        id: 'simulador',
        title: 'SIMULADOR DE OPERADOR PC PUMA',
        category: 'Simulación Operativa',
        badge: 'WEBXR / PC',
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
        category: 'Ciberseguridad Arcade',
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
        category: 'Visualización 3D XR',
        badge: 'QUEST 3S / WEBXR',
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

    // 1. Marco Holográfico Exterior
    const frameGeo = new THREE.BoxGeometry(1.5, 2.1, 0.06);
    const frameEdges = new THREE.EdgesGeometry(frameGeo);
    const frameLineMat = new THREE.LineBasicMaterial({
      color: exp.colorThree,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const frameMesh = new THREE.LineSegments(frameEdges, frameLineMat);
    group.add(frameMesh);

    // 2. Cristal Holográfico Central (con textura Canvas nítida y material ligero)
    const texture = this.createPortalTexture(exp);
    const planeGeo = new THREE.PlaneGeometry(1.42, 2.02);
    // MeshBasicMaterial rinde al máximo en Quest 3S eliminando cálculos pesados de PBR
    const planeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.94,
      side: THREE.FrontSide
    });
    const screenMesh = new THREE.Mesh(planeGeo, planeMat);
    screenMesh.position.z = 0.01;
    group.add(screenMesh);

    // 3. Pedestal Flotante con Base de Luz
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.65, 0.12, 24);
    const baseMat = new THREE.MeshLambertMaterial({
      color: 0x00172d,
      emissive: 0x000c18
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -1.18;
    group.add(baseMesh);

    const baseRingGeo = new THREE.TorusGeometry(0.66, 0.025, 12, 24);
    const baseRingMat = new THREE.MeshBasicMaterial({ color: exp.colorThree });
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

    // Fondo degradado futurista
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 720);
    bgGrad.addColorStop(0, '#021326');
    bgGrad.addColorStop(0.5, '#010a14');
    bgGrad.addColorStop(1, '#001b33');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 720);

    // Borde de neón interior
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

    // Ícono Central
    ctx.font = '90px sans-serif';
    ctx.fillText(exp.icon, 256, 255);

    // Línea divisora
    ctx.strokeStyle = 'rgba(213, 155, 45, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 315);
    ctx.lineTo(452, 315);
    ctx.stroke();

    // Título Principal
    ctx.font = 'bold 26px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    this.wrapText(ctx, exp.title, 256, 375, 420, 34);

    // Badge de compatibilidad
    ctx.fillStyle = exp.colorHex;
    ctx.fillRect(130, 495, 252, 42);
    ctx.fillStyle = '#010912';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`[ ${exp.badge} ]`, 256, 523);

    // Botón de llamado a la acción
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(95, 595, 322, 54);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Orbitron, sans-serif';
    ctx.fillText('LANZAR EXPERIENCIA', 256, 630);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false; // Ahorra memoria y tiempo de renderizado en GPU Quest
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
      // IMPORTANTE: Los mandos se agregan al DOLLY para desplazarse con el usuario
      this.dolly.add(controller);
      this.controllers.push(controller);

      // Línea Láser del puntero
      const laserGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -4.5)
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
      const dotGeo = new THREE.SphereGeometry(0.015, 10, 10);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xd59b2d });
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

      // Respuesta háptica en los mandos de Meta Quest al disparar
      const session = this.renderer.xr.getSession();
      if (session && session.inputSources) {
        for (const source of session.inputSources) {
          if (source.gamepad && source.gamepad.hapticActuators && source.gamepad.hapticActuators[0]) {
            source.gamepad.hapticActuators[0].pulse(0.65, 75);
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
     Locomoción con Joystick en Meta Quest (WebXR Gamepad)
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

      // Mapeo estándar XR o de 2 ejes
      if (axes.length >= 4) {
        stickX = axes[2];
        stickY = axes[3];
        // Respaldo si los ejes 0 y 1 están activos
        if (Math.abs(stickX) < 0.08 && Math.abs(stickY) < 0.08 && (Math.abs(axes[0]) > 0.08 || Math.abs(axes[1]) > 0.08)) {
          stickX = axes[0];
          stickY = axes[1];
        }
      } else if (axes.length >= 2) {
        stickX = axes[0];
        stickY = axes[1];
      }

      // Mano Izquierda: Desplazamiento Suave (Adelante/Atrás/Lados)
      if (source.handedness === 'left') {
        if (Math.abs(stickX) > 0.12 || Math.abs(stickY) > 0.12) {
          // Dirección frontal de la cámara proyectada al plano horizontal XZ
          this.camera.getWorldDirection(this.forwardVec);
          this.forwardVec.y = 0;
          this.forwardVec.normalize();

          // Vector lateral derecho
          this.rightVec.crossVectors(this.forwardVec, this.camera.up).normalize();

          // Cálculo del vector de movimiento (stickY < 0 es empujar hacia adelante)
          this.moveVec.set(0, 0, 0);
          this.moveVec.addScaledVector(this.forwardVec, -stickY);
          this.moveVec.addScaledVector(this.rightVec, stickX);

          const moveSpeed = 2.8; // m/s confortable para VR
          this.dolly.position.addScaledVector(this.moveVec, moveSpeed * delta);

          // Límite de radio para no perderse en el espacio infinito
          const dist = Math.hypot(this.dolly.position.x, this.dolly.position.z);
          if (dist > 14) {
            const angle = Math.atan2(this.dolly.position.z, this.dolly.position.x);
            this.dolly.position.x = Math.cos(angle) * 14;
            this.dolly.position.z = Math.sin(angle) * 14;
          }
        }
      }

      // Mano Derecha: Snap Turn 45° (Giro por pasos cómodo y anti-mareo)
      else if (source.handedness === 'right') {
        if (stickX > 0.65) {
          if (!this.snapTurnLocked) {
            this.dolly.rotation.y -= Math.PI / 4; // Giro 45° a la derecha
            this.snapTurnLocked = true;
            if (window.xrAudio) window.xrAudio.playHover();
          }
        } else if (stickX < -0.65) {
          if (!this.snapTurnLocked) {
            this.dolly.rotation.y += Math.PI / 4; // Giro 45° a la izquierda
            this.snapTurnLocked = true;
            if (window.xrAudio) window.xrAudio.playHover();
          }
        } else if (Math.abs(stickX) < 0.25) {
          // Liberar seguro cuando el stick vuelve a la posición neutral
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
     Configuración del Botón VR y Optimizaciones de Sesión
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
    btn.style.background = 'rgba(2, 22, 44, 0.94)';
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

      // Optimización exclusiva para Meta Quest 3S: Foveated Rendering al máximo
      if (this.renderer.xr.setFoveation) {
        this.renderer.xr.setFoveation(1.0);
      }

      // Reiniciar posición del dolly al origen del hub
      this.dolly.position.set(0, 0, 0);
      this.dolly.rotation.set(0, 0, 0);

      if (window.xrAudio) window.xrAudio.playWarp();
      if (window.SipnasiaXR) {
        window.SipnasiaXR.log('¡Sesión WebXR iniciada en Meta Quest! Usa el joystick izquierdo para moverte y el derecho para girar.');
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

    // Optimización: Throttling en modo página web plana para no ralentizar el navegador del Quest 3S
    if (!this.isVR && !this.isInteractive3D) {
      this.idleFrameCount = (this.idleFrameCount || 0) + 1;
      // Salta frames alternados en segundo plano para dejar la CPU/GPU al 100% libre para el scroll web
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

    // 3. Respiración de la Luz Central Beacon
    if (this.centerBeacon) {
      this.centerBeacon.intensity = 1.2 + Math.sin(elapsedTime * 2.5) * 0.4;
    }

    // 4. Rotación de la Red de Partículas
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
