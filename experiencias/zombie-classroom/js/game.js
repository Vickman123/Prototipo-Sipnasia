/**
 * SIPNASIA XR - Zombie Classroom: Survival FPS Game Engine
 * Controlador principal: WebXR (Meta Quest 6DoF), PC (WASD + Mouse) y Móvil (Touch).
 * Orquestador de oleadas, HUD, combate, colisiones y drops.
 */

import * as THREE from '../libs/three.module.js';
import { VRButton } from '../libs/VRButton.js';
import { ZombieAudioEngine } from './audio.js';
import { WeaponManager } from './weapons.js';
import { ZombieManager, ZOMBIE_TYPES } from './zombies.js';
import { ClassroomEnvironment } from './classroom.js';

export class ZombieGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Módulos
    this.audio = new ZombieAudioEngine();
    this.weapons = null;
    this.zombies = null;
    this.classroom = null;

    // Estado del Jugador
    this.player = {
      health: 100,
      maxHealth: 100,
      armor: 50,
      maxArmor: 50,
      position: new THREE.Vector3(0, 1.7, 5.5),
      velocity: new THREE.Vector3(),
      isGrounded: true,
      score: 0,
      kills: 0,
      headshots: 0,
      combo: 1,
      lastKillTime: 0,
      isDead: false
    };

    // Estado de Oleadas
    this.wave = {
      current: 1,
      inProgress: false,
      isIntermission: false,
      intermissionTimer: 0,
      totalInWave: 0,
      remainingInWave: 0,
      spawnQueue: [],
      nextSpawnTime: 0
    };

    // Controles PC
    this.keys = {};
    this.pitch = 0;
    this.yaw = 0;
    this.isPointerLocked = false;
    this.isMouseDown = false;

    // Controles WebXR
    this.controllers = [];
    this.vrUserGroup = new THREE.Group();

    // Controles Touch Móvil
    this.touchJoystick = { x: 0, y: 0, active: false };
    this.touchLook = { lastX: 0, lastY: 0, active: false };

    // Tiempo
    this.clock = new THREE.Clock();
    this.isPaused = false;
    this.isGameStarted = false;

    try {
      this.init();
    } catch (err) {
      console.error('Error al inicializar ZombieGame:', err);
    }
  }

  init() {
    console.log('[Aula Zombie] Inicializando motor Three.js y recursos locales...');
    this.setupThree();
    this.weapons = new WeaponManager(this.audio);
    this.zombies = new ZombieManager(this.scene, this.audio, this.weapons);
    this.classroom = new ClassroomEnvironment(this.scene);

    // Adjuntar grupo de armas a la cámara (FPS)
    this.camera.add(this.weapons.weaponGroup);
    this.scene.add(this.camera);

    // Luz suave dedicada para iluminar el arma del jugador en primera persona
    this.gunFillLight = new THREE.PointLight(0xffffff, 1.4, 3.5);
    this.gunFillLight.position.set(0.2, 0.05, -0.2);
    this.camera.add(this.gunFillLight);

    // Luz de fogonazo dinámico en tiempo real (Raytraced Muzzle Bounce)
    this.muzzleLight = new THREE.PointLight(0xffaa33, 0, 20);
    this.muzzleLight.castShadow = true;
    this.muzzleLight.shadow.bias = -0.001;
    this.muzzleLight.position.set(0.18, -0.12, -0.4);
    this.camera.add(this.muzzleLight);

    this.setupWebXR();
    this.setupDesktopControls();
    this.setupMobileControls();
    this.setupUIEvents();

    // Comprobar modal de tutorial de inicio
    const tutorialModal = document.getElementById('tutorial-modal');
    const btnStart = document.getElementById('btn-start-game');

    // Inicializar HUD de inmediato con valores correctos
    this.updateHUD();

    if (tutorialModal && btnStart) {
      this.isGameStarted = false;
      const startAction = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        this.startGameFromTutorial();
      };
      btnStart.addEventListener('click', startAction);
      btnStart.addEventListener('touchend', startAction);
    } else {
      this.isGameStarted = true;
      this.startWave(1);
    }

    // Loop de render
    this.renderer.setAnimationLoop((time, frame) => this.renderLoop(time, frame));

    window.addEventListener('resize', () => this.onWindowResize());
    console.log('[Aula Zombie] Motor Three.js inicializado y renderloop activo.');
  }

  startGameFromTutorial() {
    const tutorialModal = document.getElementById('tutorial-modal');
    if (tutorialModal) tutorialModal.classList.add('hidden');
    this.isGameStarted = true;
    this.audio.ensureContext();

    if (this.renderer && !this.renderer.xr.isPresenting) {
      try {
        const lockPromise = this.renderer.domElement.requestPointerLock();
        if (lockPromise && typeof lockPromise.catch === 'function') {
          lockPromise.catch(() => {});
        }
      } catch (e) {
        console.warn('Pointer lock no disponible:', e);
      }
    }

    this.startWave(1);
    this.updateHUD();
  }

  /* ----------------------------------------------------
     INICIALIZACIÓN THREE.JS
     ---------------------------------------------------- */
  setupThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.Fog(0x0f172a, 22, 55);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.copy(this.player.position);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.xr.enabled = true;

    this.container.appendChild(this.renderer.domElement);

    // Botón oficial de Three.js VRButton
    try {
      const vrBtn = VRButton.createButton(this.renderer);
      if (vrBtn && vrBtn.style) {
        vrBtn.id = 'VRButton';
        vrBtn.classList.add('custom-vr-btn');
        document.body.appendChild(vrBtn);
      }
    } catch (e) {
      console.warn('VRButton no disponible:', e);
    }
  }

  /* ----------------------------------------------------
     SOPORTE WEBXR (META QUEST 2/3/3S/PRO)
     ---------------------------------------------------- */
  setupWebXR() {
    this.scene.add(this.vrUserGroup);

    // Conectar eventos WebXR para no desplazar la cámara en modo escritorio
    this.renderer.xr.addEventListener('sessionstart', () => {
      this.vrUserGroup.position.copy(this.player.position);
      this.vrUserGroup.add(this.camera);
      this.camera.position.set(0, 0, 0);
    });

    this.renderer.xr.addEventListener('sessionend', () => {
      this.scene.add(this.camera);
      this.camera.position.copy(this.player.position);
    });

    // Mandos 6DoF
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);

      controller.addEventListener('selectstart', () => {
        this.audio.ensureContext();
        this.performShoot(true, controller);
      });

      controller.addEventListener('squeezestart', () => {
        // Mando secundario recarga arma, mando primario cambia de arma
        if (i === 1) {
          this.weapons.reload(performance.now());
        } else {
          this.weapons.cycleWeapon(1);
        }
        this.updateHUD();
      });

      // Rayo láser guía del mando VR
      const rayGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -5)
      ]);
      const rayMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
      const ray = new THREE.Line(rayGeo, rayMat);
      controller.add(ray);

      this.vrUserGroup.add(controller);
      this.controllers.push(controller);
    }
  }

  /* ----------------------------------------------------
     CONTROLES PC (POINTER LOCK, WASD, RATÓN)
     ---------------------------------------------------- */
  setupDesktopControls() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', () => {
      this.audio.ensureContext();
      if (!this.renderer.xr.isPresenting && !this.isPointerLocked) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === canvas);
      const crosshair = document.getElementById('crosshair-container');
      if (crosshair) crosshair.style.opacity = this.isPointerLocked ? '1' : '0.7';
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked || this.renderer.xr.isPresenting) return;
      const sens = 0.0022;
      this.yaw -= e.movementX * sens;
      this.pitch -= e.movementY * sens;
      this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));

      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    });

    // Disparar en Mousedown (¡Sin requerir bloqueo previo!)
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        // Ignorar clics dentro de modales interactivos o barra superior
        if (e.target && e.target.closest && e.target.closest('.modal-overlay:not(.hidden), #sipnasia-mini-hub-bar, .floating-hub-btn, #btn-sound-toggle, #mobile-touch-controls')) {
          return;
        }
        if (!this.isGameStarted) return;

        this.audio.ensureContext();
        if (!this.isPointerLocked && !this.renderer.xr.isPresenting) {
          canvas.requestPointerLock();
        }
        this.isMouseDown = true;
        this.performShoot(false);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isMouseDown = false;
    });

    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyR') {
        this.weapons.reload(performance.now());
        this.updateHUD();
      } else if (e.code === 'Digit1') {
        this.weapons.switchWeapon('bat');
        this.updateHUD();
      } else if (e.code === 'Digit2') {
        this.weapons.switchWeapon('pistol');
        this.updateHUD();
      } else if (e.code === 'Digit3') {
        this.weapons.switchWeapon('shotgun');
        this.updateHUD();
      } else if (e.code === 'Digit4') {
        this.weapons.switchWeapon('rifle');
        this.updateHUD();
      } else if (e.code === 'Digit5') {
        this.weapons.switchWeapon('plasma');
        this.updateHUD();
      } else if (e.code === 'KeyV' || e.code === 'KeyF') {
        this.performQuickMelee();
      } else if (e.code === 'KeyQ') {
        this.weapons.cycleWeapon(-1);
        this.updateHUD();
      } else if (e.code === 'KeyE') {
        this.weapons.cycleWeapon(1);
        this.updateHUD();
      } else if (e.code === 'Space' && this.player.isGrounded) {
        this.player.velocity.y = 5.2;
        this.player.isGrounded = false;
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Rueda del ratón para cambio de armas
    window.addEventListener('wheel', (e) => {
      if (!this.isPointerLocked) return;
      this.weapons.cycleWeapon(e.deltaY > 0 ? 1 : -1);
      this.updateHUD();
    });
  }

  /* ----------------------------------------------------
     CONTROLES TÁCTILES MÓVIL
     ---------------------------------------------------- */
  setupMobileControls() {
    const joyZone = document.getElementById('touch-joystick-zone');
    const joyStick = document.getElementById('touch-joystick-stick');
    const touchLookZone = document.getElementById('touch-look-zone');
    const btnFire = document.getElementById('btn-touch-fire');
    const btnReload = document.getElementById('btn-touch-reload');
    const btnNext = document.getElementById('btn-touch-weapon');

    if (!joyZone) return;

    let joyTouchId = null;
    let lookTouchId = null;

    joyZone.addEventListener('touchstart', (e) => {
      const touch = e.changedTouches[0];
      joyTouchId = touch.identifier;
      const rect = joyZone.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.updateJoystick(touch.clientX - centerX, touch.clientY - centerY, joyStick);
    });

    joyZone.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joyTouchId) {
          const rect = joyZone.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          this.updateJoystick(touch.clientX - centerX, touch.clientY - centerY, joyStick);
          break;
        }
      }
    });

    const resetJoy = () => {
      this.touchJoystick.x = 0;
      this.touchJoystick.y = 0;
      if (joyStick) joyStick.style.transform = `translate(0px, 0px)`;
    };
    joyZone.addEventListener('touchend', resetJoy);
    joyZone.addEventListener('touchcancel', resetJoy);

    // Zona de apuntado táctil
    if (touchLookZone) {
      touchLookZone.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];
        lookTouchId = touch.identifier;
        this.touchLook.lastX = touch.clientX;
        this.touchLook.lastY = touch.clientY;
      });

      touchLookZone.addEventListener('touchmove', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === lookTouchId) {
            const dx = touch.clientX - this.touchLook.lastX;
            const dy = touch.clientY - this.touchLook.lastY;
            this.touchLook.lastX = touch.clientX;
            this.touchLook.lastY = touch.clientY;

            const sens = 0.004;
            this.yaw -= dx * sens;
            this.pitch -= dy * sens;
            this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;
            break;
          }
        }
      });
    }

    if (btnFire) {
      btnFire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.audio.ensureContext();
        this.isMouseDown = true;
        this.performShoot(false);
      });
      btnFire.addEventListener('touchend', () => { this.isMouseDown = false; });
    }

    if (btnReload) {
      btnReload.addEventListener('click', () => {
        this.weapons.reload(performance.now());
        this.updateHUD();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        this.weapons.cycleWeapon(1);
        this.updateHUD();
      });
    }

    const btnMelee = document.getElementById('btn-touch-melee');
    if (btnMelee) {
      btnMelee.addEventListener('click', () => {
        this.performQuickMelee();
      });
    }
  }

  updateJoystick(dx, dy, stickEl) {
    const maxDist = 45;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    const cx = Math.cos(angle) * clampedDist;
    const cy = Math.sin(angle) * clampedDist;

    this.touchJoystick.x = cx / maxDist;
    this.touchJoystick.y = cy / maxDist;

    if (stickEl) {
      stickEl.style.transform = `translate(${cx}px, ${cy}px)`;
    }
  }

  /* ----------------------------------------------------
     SISTEMA DE DISPARO Y DETECCIÓN DE IMPACTOS
     ---------------------------------------------------- */
  performShoot(isVR = false, vrController = null) {
    if (this.player.isDead) return;
    const now = performance.now();
    const weapon = this.weapons.shoot(now);
    if (!weapon) {
      this.updateHUD();
      return;
    }

    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();

    if (isVR && vrController) {
      vrController.getWorldPosition(origin);
      vrController.getWorldDirection(direction);
      direction.negate(); // Dirección hacia adelante en WebXR
    } else {
      origin.copy(this.camera.position);
      this.camera.getWorldDirection(direction);
    }

    // Efecto visual de retroceso / golpe en retícula
    const crosshair = document.getElementById('crosshair-container');
    if (crosshair) {
      crosshair.classList.add('kick');
      setTimeout(() => crosshair.classList.remove('kick'), 80);
    }

    // 1. Manejo de Ataque Cuerpo a Cuerpo (Bate con Clavos)
    if (weapon.isMelee) {
      this.performMeleeAttack(origin, direction, weapon);
    } else {
      // 2. Manejo de Armas de Fuego
      // Iluminación dinámica de fogonazo en tiempo real (Raytraced Room Bounce)
      if (this.muzzleLight) {
        this.muzzleLight.color.setHex(weapon.colorThree || 0xffaa33);
        this.muzzleLight.intensity = 5.5;
        setTimeout(() => {
          if (this.muzzleLight) this.muzzleLight.intensity = 0;
        }, 45);
      }

      // Disparo según arma: Proyectil Plasma o Raycast Perdigones/Balas
      if (weapon.isProjectile) {
        this.spawnPlasmaProjectile(origin, direction, weapon);
      } else {
        const pellets = weapon.pellets || 1;
        for (let p = 0; p < pellets; p++) {
          const spreadDir = direction.clone();
          if (weapon.spread > 0) {
            spreadDir.x += (Math.random() - 0.5) * weapon.spread;
            spreadDir.y += (Math.random() - 0.5) * weapon.spread;
            spreadDir.z += (Math.random() - 0.5) * weapon.spread;
            spreadDir.normalize();
          }
          this.castBulletRay(origin, spreadDir, weapon);
        }
      }
    }

    this.updateHUD();
  }

  performMeleeAttack(origin, direction, weapon) {
    const range = weapon.range || 2.4;
    let anyHit = false;

    this.zombies.zombies.forEach(z => {
      if (z.isDying) return;
      const toZombie = z.mesh.position.clone().sub(this.player.position);
      toZombie.y = 0;
      const dist = toZombie.length();

      if (dist <= range) {
        toZombie.normalize();
        const dot = direction.dot(toZombie);

        // Si está en el arco frontal del golpe (~70 grados) o muy pegado al jugador
        if (dot > 0.45 || dist < 1.3) {
          anyHit = true;
          // Si apunta ligeramente hacia arriba o zombi es rastrero -> headshot
          const isHeadshot = this.pitch < -0.12 || (z.limbsState && z.limbsState.isCrawler);
          const limb = isHeadshot ? 'head' : (Math.random() < 0.5 ? 'leftArm' : 'torso');
          const hitPoint = z.mesh.position.clone().add(new THREE.Vector3(0, isHeadshot ? 1.55 : 1.1, 0));

          const res = this.zombies.damageZombie(z, weapon.damage, isHeadshot, hitPoint, limb, weapon);
          this.triggerHitmarker(isHeadshot);

          // Empuje físico por impacto contundente (Knockback)
          z.mesh.position.addScaledVector(direction, weapon.knockback * 0.4);

          if (this.audio) this.audio.playMeleeHit();

          if (res && res.killed) {
            this.onZombieKilled(res.score, isHeadshot);
          }
        }
      }
    });

    if (anyHit) {
      const crosshair = document.getElementById('crosshair-container');
      if (crosshair) {
        crosshair.classList.add('kick');
        setTimeout(() => crosshair.classList.remove('kick'), 120);
      }
    }
  }

  performQuickMelee() {
    if (this.player.isDead) return;
    const now = performance.now();
    const batWeapon = this.weapons.weapons['bat'];
    if (!batWeapon) return;

    if (now - this.weapons.lastShotTime < batWeapon.fireRate) return;
    this.weapons.lastShotTime = now;
    this.weapons.meleeSwingTime = now;
    this.weapons.isSwingingMelee = true;

    if (this.audio) this.audio.playMeleeSwing();

    const origin = this.camera.position.clone();
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    this.performMeleeAttack(origin, direction, batWeapon);
  }

  castBulletRay(origin, direction, weapon) {
    const raycaster = new THREE.Raycaster(origin, direction, 0.1, 70);

    // Trazador visual del disparo
    this.spawnBulletTracer(origin, direction, weapon);

    // Objetos a comprobar: partes anatómicas de zombis con desmembramiento activo
    const targetObjects = [];
    this.zombies.zombies.forEach(z => {
      if (!z.isDying && z.parts) {
        if (z.limbsState.hasHead && z.parts.head) targetObjects.push(z.parts.head);
        if (z.parts.torso) targetObjects.push(z.parts.torso);
        if (z.limbsState.hasLeftArm && z.parts.leftArm) targetObjects.push(z.parts.leftArm);
        if (z.limbsState.hasRightArm && z.parts.rightArm) targetObjects.push(z.parts.rightArm);
        if (z.limbsState.hasLeftLeg && z.parts.leftLeg) targetObjects.push(z.parts.leftLeg);
        if (z.limbsState.hasRightLeg && z.parts.rightLeg) targetObjects.push(z.parts.rightLeg);
      }
    });

    const intersects = raycaster.intersectObjects(targetObjects, true);

    if (intersects.length > 0) {
      for (const hit of intersects) {
        let current = hit.object;
        let zombieObj = null;
        let isHeadshot = false;
        let limbName = 'torso';

        while (current) {
          if (current.userData && current.userData.zombieObj) {
            zombieObj = current.userData.zombieObj;
            limbName = current.userData.limb || 'torso';
            if (current.userData.isHeadshot || limbName === 'head') isHeadshot = true;
            break;
          }
          current = current.parent;
        }

        if (zombieObj && !zombieObj.isDying) {
          const s = zombieObj.config.scale;
          // Fallback de altura para disparo a la cabeza
          if (hit.point.y >= zombieObj.mesh.position.y + 1.38 * s) {
            isHeadshot = true;
            limbName = 'head';
          }

          const result = this.zombies.damageZombie(zombieObj, weapon.damage, isHeadshot, hit.point, limbName, weapon);
          this.triggerHitmarker(isHeadshot);

          if (result && result.killed) {
            this.onZombieKilled(result.score, isHeadshot);
          }
          break; // Impacto confirmado en zombie
        }
      }
    }

    // Comprobar si disparó a un drop de arma/botiquín para recogerlo a distancia
    if (this.weapons.drops.length > 0) {
      const dropMeshes = this.weapons.drops.map(d => d.mesh);
      const dropHits = raycaster.intersectObjects(dropMeshes, true);
      if (dropHits.length > 0) {
        for (const dh of dropHits) {
          let curr = dh.object;
          while (curr) {
            const idx = this.weapons.drops.findIndex(d => d.mesh === curr);
            if (idx !== -1) {
              const drop = this.weapons.drops[idx];
              const res = this.weapons.collectDrop(drop, this.player);
              if (res) {
                this.showToast(res.message);
                this.scene.remove(drop.mesh);
                this.weapons.drops.splice(idx, 1);
                this.updateHUD();
              }
              break;
            }
            curr = curr.parent;
          }
        }
      }
    }
  }

  spawnBulletTracer(origin, direction, weapon) {
    const endPoint = origin.clone().addScaledVector(direction, 35);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      origin.clone().addScaledVector(direction, 0.4),
      endPoint
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: weapon.colorThree || 0xffeb3b,
      transparent: true,
      opacity: 0.85
    });
    const tracer = new THREE.Line(lineGeo, lineMat);
    this.scene.add(tracer);

    setTimeout(() => {
      this.scene.remove(tracer);
      lineGeo.dispose();
      lineMat.dispose();
    }, 45);
  }

  spawnPlasmaProjectile(origin, direction, weapon) {
    const projGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const projMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const mesh = new THREE.Mesh(projGeo, projMat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    const speed = weapon.projectileSpeed || 24;
    const velocity = direction.multiplyScalar(speed);
    const spawnTime = performance.now();

    const updateInterval = setInterval(() => {
      mesh.position.addScaledVector(velocity, 0.016);

      // Comprobar colisión con zombis o entorno
      let exploded = false;
      for (const z of this.zombies.zombies) {
        if (!z.isDying && mesh.position.distanceTo(z.mesh.position) < 1.6) {
          exploded = true;
          break;
        }
      }

      if (mesh.position.y <= 0.2 || mesh.position.length() > 25 || performance.now() - spawnTime > 2500) {
        exploded = true;
      }

      if (exploded) {
        clearInterval(updateInterval);
        this.explodePlasma(mesh.position, weapon);
        this.scene.remove(mesh);
      }
    }, 16);
  }

  explodePlasma(center, weapon) {
    if (this.audio) this.audio.playAcidSplash();

    // Esfera expansiva visual de onda tóxica
    const blastGeo = new THREE.SphereGeometry(weapon.aoeRadius, 16, 16);
    const blastMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const blast = new THREE.Mesh(blastGeo, blastMat);
    blast.position.copy(center);
    this.scene.add(blast);

    let fade = 0.8;
    const fadeInterval = setInterval(() => {
      fade -= 0.1;
      blast.scale.multiplyScalar(1.08);
      blast.material.opacity = fade;
      if (fade <= 0) {
        clearInterval(fadeInterval);
        this.scene.remove(blast);
      }
    }, 40);

    // Daño en área a todos los zombis cercanos
    this.zombies.zombies.forEach(z => {
      if (!z.isDying) {
        const dist = z.mesh.position.distanceTo(center);
        if (dist <= weapon.aoeRadius) {
          const falloff = 1 - (dist / weapon.aoeRadius);
          const dmg = Math.round(weapon.damage * Math.max(0.3, falloff));
          const res = this.zombies.damageZombie(z, dmg, false, z.mesh.position);
          if (res && res.killed) {
            this.onZombieKilled(res.score, false);
          }
        }
      }
    });
  }

  triggerHitmarker(isHeadshot) {
    if (this.audio) this.audio.playHitmarker(isHeadshot);

    const hm = document.getElementById('hitmarker');
    if (hm) {
      hm.className = isHeadshot ? 'hitmarker show headshot' : 'hitmarker show';
      setTimeout(() => {
        hm.className = 'hitmarker';
      }, 110);
    }
  }

  onZombieKilled(baseScore, isHeadshot) {
    const now = performance.now();
    if (now - this.player.lastKillTime < 3500) {
      this.player.combo = Math.min(5, this.player.combo + 0.5);
    } else {
      this.player.combo = 1;
    }
    this.player.lastKillTime = now;

    const gained = Math.round(baseScore * this.player.combo);
    this.player.score += gained;
    this.player.kills++;
    if (isHeadshot) this.player.headshots++;

    this.wave.remainingInWave--;
    if (this.wave.remainingInWave <= 0 && this.wave.spawnQueue.length === 0) {
      this.onWaveCompleted();
    }

    this.updateHUD();
  }

  /* ----------------------------------------------------
     DIRECTOR DE OLEADAS DE ZOMBIES
     ---------------------------------------------------- */
  startWave(waveNum) {
    this.wave.current = waveNum;
    this.wave.inProgress = true;
    this.wave.isIntermission = false;

    // Composición de zombis según la oleada
    const queue = [];
    const baseCount = 6 + (waveNum - 1) * 4;

    for (let i = 0; i < baseCount; i++) {
      if (waveNum === 1) {
        queue.push('normal');
      } else if (waveNum === 2) {
        queue.push(Math.random() < 0.35 ? 'runner' : 'normal');
      } else if (waveNum === 3) {
        const r = Math.random();
        if (r < 0.35) queue.push('runner');
        else if (r < 0.6) queue.push('spitter');
        else queue.push('normal');
      } else if (waveNum === 4) {
        if (i === 0) queue.push('tank'); // Jefe Conserje Titán
        else {
          const r = Math.random();
          if (r < 0.25) queue.push('screamer');
          else if (r < 0.5) queue.push('spitter');
          else if (r < 0.75) queue.push('runner');
          else queue.push('normal');
        }
      } else {
        // Oleada 5+: Caos completo
        const r = Math.random();
        if (r < 0.15 && i < 2) queue.push('tank');
        else if (r < 0.35) queue.push('screamer');
        else if (r < 0.6) queue.push('spitter');
        else if (r < 0.8) queue.push('runner');
        else queue.push('normal');
      }
    }

    this.wave.totalInWave = queue.length;
    this.wave.remainingInWave = queue.length;
    this.wave.spawnQueue = queue;

    if (waveNum === 1) {
      // En la oleada 1, hacer aparecer el primer zombi de inmediato en el pasillo frontal
      this.wave.nextSpawnTime = performance.now() + 1800;
      const firstZombieType = this.wave.spawnQueue.shift();
      if (firstZombieType) {
        this.zombies.spawnZombie(firstZombieType, new THREE.Vector3(0, 0, -5.5));
      }
    } else {
      this.wave.nextSpawnTime = performance.now() + 1000;
    }

    if (this.audio) this.audio.playWaveStart();
    this.showBanner(`¡OLEADA ${waveNum} COMIENZA!`, 'Sobrevive al salón de clases');
    this.updateHUD();
  }

  onWaveCompleted() {
    this.wave.inProgress = false;
    this.wave.isIntermission = true;
    this.wave.intermissionTimer = performance.now() + 6000;

    if (this.audio) this.audio.playWaveComplete();
    this.showBanner('¡OLEADA SUPERADA!', 'Preparando la siguiente oleada...');

    // Bonificación de salud y armadura entre oleadas
    this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
    this.player.armor = Math.min(this.player.maxArmor, this.player.armor + 15);
    this.updateHUD();
  }

  spawnNextZombieFromQueue() {
    if (this.wave.spawnQueue.length === 0) return;
    const typeKey = this.wave.spawnQueue.shift();

    // Puntos de aparición en las esquinas, puerta trasera y ventanales del aula ampliada
    const spawnPoints = [
      new THREE.Vector3(-11.5, 0, -10.5),
      new THREE.Vector3(11.5, 0, -10.5),
      new THREE.Vector3(-11.5, 0, 10.0),
      new THREE.Vector3(11.5, 0, 10.0),
      new THREE.Vector3(0, 0, 11.2) // Puerta trasera barricada
    ];
    const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)].clone();
    sp.x += (Math.random() - 0.5) * 2.0;
    sp.z += (Math.random() - 0.5) * 2.0;

    this.zombies.spawnZombie(typeKey, sp);
  }

  /* ----------------------------------------------------
     BUCLE PRINCIPAL (RENDER LOOP & FÍSICA)
     ---------------------------------------------------- */
  renderLoop(time, frame) {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = performance.now();

    if (!this.isGameStarted) {
      this.classroom.update(delta, now);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (!this.player.isDead) {
      this.updatePlayerMovement(delta);
      this.checkDropPickups();
      this.weapons.update(now, delta);

      // Disparo automático continuo para el rifle PUMA-AR
      if (this.isMouseDown && this.weapons.getCurrentWeapon().isAutomatic) {
        this.performShoot(false);
      }

      // Spawner de oleada
      if (this.wave.inProgress && this.wave.spawnQueue.length > 0 && now >= this.wave.nextSpawnTime) {
        this.spawnNextZombieFromQueue();
        this.wave.nextSpawnTime = now + 1200 + Math.random() * 800;
      }

      // Fin de intermedio de oleada
      if (this.wave.isIntermission && now >= this.wave.intermissionTimer) {
        this.startWave(this.wave.current + 1);
      }

      // Comprobar muerte del jugador
      if (this.player.health <= 0) {
        this.onPlayerDeath();
      }

      this.audio.updateHeartbeat(this.player.health / this.player.maxHealth);
    }

    // Actualizar IA de zombis y entorno de aula
    this.zombies.update(now, delta, this.player.position, this.player, this.camera);
    this.classroom.update(delta, now);

    this.renderer.render(this.scene, this.camera);
  }

  updatePlayerMovement(delta) {
    if (this.renderer.xr.isPresenting) {
      // Movimiento con joystick VR en WebXR
      const session = this.renderer.xr.getSession();
      if (session) {
        for (const source of session.inputSources) {
          if (source.gamepad && source.gamepad.axes) {
            const [ax, ay] = [source.gamepad.axes[2] || 0, source.gamepad.axes[3] || 0];
            if (source.handedness === 'left') {
              // Locomoción suave
              const moveDir = new THREE.Vector3(ax, 0, ay);
              moveDir.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
              this.player.position.addScaledVector(moveDir, 4.0 * delta);
            } else if (source.handedness === 'right' && Math.abs(ax) > 0.6) {
              // Giro instantáneo
              this.vrUserGroup.rotation.y -= Math.sign(ax) * 0.04;
            }
          }
        }
      }
      // Limitar jugador también en VR
      this.player.position.x = Math.max(-12.2, Math.min(12.2, this.player.position.x));
      this.player.position.z = Math.max(-11.2, Math.min(11.2, this.player.position.z));
      this.vrUserGroup.position.copy(this.player.position);
    } else {
      // Movimiento de teclado PC o Joystick táctil
      const move = new THREE.Vector3();
      const speed = this.keys['ShiftLeft'] ? 6.5 : 4.2;

      if (this.keys['KeyW']) move.z -= 1;
      if (this.keys['KeyS']) move.z += 1;
      if (this.keys['KeyA']) move.x -= 1;
      if (this.keys['KeyD']) move.x += 1;

      // Joystick táctil
      if (this.touchJoystick.active || this.touchJoystick.x !== 0 || this.touchJoystick.y !== 0) {
        move.x += this.touchJoystick.x;
        move.z += this.touchJoystick.y;
      }

      if (move.lengthSq() > 0) {
        move.normalize();
        move.applyEuler(new THREE.Euler(0, this.yaw, 0));
        this.player.position.addScaledVector(move, speed * delta);
      }

      // Gravedad simple
      this.player.velocity.y -= 14.0 * delta;
      this.player.position.y += this.player.velocity.y * delta;

      if (this.player.position.y <= 1.7) {
        this.player.position.y = 1.7;
        this.player.velocity.y = 0;
        this.player.isGrounded = true;
      }

      // Límites del salón de clases (Evitar salir por las paredes del aula ampliada 26x24m)
      this.player.position.x = Math.max(-12.2, Math.min(12.2, this.player.position.x));
      this.player.position.z = Math.max(-11.2, Math.min(11.2, this.player.position.z));

      this.camera.position.copy(this.player.position);
    }
  }

  checkDropPickups() {
    for (let i = this.weapons.drops.length - 1; i >= 0; i--) {
      const drop = this.weapons.drops[i];
      const dist = this.player.position.distanceTo(drop.mesh.position);
      if (dist < 1.7) {
        const res = this.weapons.collectDrop(drop, this.player);
        if (res) {
          this.showToast(res.message);
          this.scene.remove(drop.mesh);
          this.weapons.drops.splice(i, 1);
          this.updateHUD();
        }
      }
    }
  }

  onPlayerDeath() {
    this.player.isDead = true;
    this.player.health = 0;

    if (this.isPointerLocked) {
      document.exitPointerLock();
    }

    const modal = document.getElementById('game-over-modal');
    if (modal) {
      document.getElementById('final-score').textContent = this.player.score;
      document.getElementById('final-wave').textContent = this.wave.current;
      document.getElementById('final-kills').textContent = this.player.kills;
      document.getElementById('final-headshots').textContent = this.player.headshots;
      modal.classList.remove('hidden');
    }
  }

  restart() {
    this.player.health = 100;
    this.player.armor = 50;
    this.player.score = 0;
    this.player.kills = 0;
    this.player.headshots = 0;
    this.player.combo = 1;
    this.player.isDead = false;
    this.player.position.set(0, 1.7, 5.5);

    // Reiniciar armas
    this.weapons.weapons = JSON.parse(JSON.stringify(this.weapons.weapons));
    this.weapons.switchWeapon('pistol');

    this.zombies.clearAll();

    const modal = document.getElementById('game-over-modal');
    if (modal) modal.classList.add('hidden');

    this.startWave(1);
    this.updateHUD();
  }

  /* ----------------------------------------------------
     INTERFAZ Y HUD
     ---------------------------------------------------- */
  updateHUD() {
    const hpFill = document.getElementById('hud-hp-fill');
    const hpText = document.getElementById('hud-hp-val');
    const armFill = document.getElementById('hud-armor-fill');
    const armText = document.getElementById('hud-armor-val');
    const waveEl = document.getElementById('hud-wave');
    const zombiesEl = document.getElementById('hud-zombies-left');
    const scoreEl = document.getElementById('hud-score');
    const comboEl = document.getElementById('hud-combo');
    const weaponNameEl = document.getElementById('hud-weapon-name');
    const ammoMagEl = document.getElementById('hud-ammo-mag');
    const ammoResEl = document.getElementById('hud-ammo-reserve');

    if (hpFill) hpFill.style.width = `${Math.max(0, this.player.health)}%`;
    if (hpText) hpText.textContent = `${Math.max(0, Math.round(this.player.health))}`;
    if (armFill) armFill.style.width = `${Math.max(0, (this.player.armor / this.player.maxArmor) * 100)}%`;
    if (armText) armText.textContent = `${Math.max(0, Math.round(this.player.armor))}`;

    if (waveEl) waveEl.textContent = `OLEADA ${this.wave.current}`;
    if (zombiesEl) zombiesEl.textContent = `ZOMBIES: ${this.wave.remainingInWave}`;
    if (scoreEl) scoreEl.textContent = `${this.player.score.toString().padStart(5, '0')}`;
    if (comboEl) comboEl.textContent = `x${this.player.combo.toFixed(1)}`;

    const currentW = this.weapons.getCurrentWeapon();
    if (weaponNameEl) weaponNameEl.textContent = currentW.name;

    const reloadBanner = document.getElementById('reload-banner');
    const lowAmmoWarning = document.getElementById('low-ammo-warning');

    if (currentW.isMelee) {
      if (ammoMagEl) {
        ammoMagEl.textContent = '∞';
        ammoMagEl.classList.remove('reloading');
      }
      if (ammoResEl) ammoResEl.textContent = 'MELEE';
      if (reloadBanner) reloadBanner.classList.add('hidden');
      if (lowAmmoWarning) lowAmmoWarning.classList.add('hidden');
    } else {
      if (this.weapons.isReloading) {
        if (ammoMagEl) {
          ammoMagEl.textContent = '...';
          ammoMagEl.classList.add('reloading');
        }
        if (reloadBanner) reloadBanner.classList.remove('hidden');
        if (lowAmmoWarning) lowAmmoWarning.classList.add('hidden');
      } else {
        if (ammoMagEl) {
          ammoMagEl.textContent = `${currentW.currentMag}`;
          ammoMagEl.classList.remove('reloading');
        }
        if (reloadBanner) reloadBanner.classList.add('hidden');

        if (currentW.currentMag === 0) {
          if (lowAmmoWarning) lowAmmoWarning.classList.remove('hidden');
        } else {
          if (lowAmmoWarning) lowAmmoWarning.classList.add('hidden');
        }
      }

      if (ammoResEl) ammoResEl.textContent = currentW.reserveAmmo === Infinity ? '∞' : `${currentW.reserveAmmo}`;
    }

    // Actualizar slots de armas desbloqueadas (1-5)
    const wKeys = ['bat', 'pistol', 'shotgun', 'rifle', 'plasma'];
    wKeys.forEach((key, idx) => {
      const slotEl = document.getElementById(`w-slot-${idx + 1}`);
      if (slotEl) {
        const wCfg = this.weapons.weapons[key];
        if (wCfg && wCfg.unlocked) slotEl.classList.remove('locked');
        else slotEl.classList.add('locked');

        if (this.weapons.currentWeaponId === key) slotEl.classList.add('active');
        else slotEl.classList.remove('active');
      }
    });
  }

  showBanner(title, subtitle) {
    const banner = document.getElementById('wave-banner');
    if (!banner) return;
    document.getElementById('wave-banner-title').textContent = title;
    document.getElementById('wave-banner-subtitle').textContent = subtitle;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 3500);
  }

  showToast(message) {
    const toast = document.getElementById('drop-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  setupUIEvents() {
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) btnRestart.addEventListener('click', () => this.restart());

    const btnAudio = document.getElementById('btn-sound-toggle');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const muted = this.audio.toggleMute();
        btnAudio.textContent = muted ? '🔇 AUDIO OFF' : '🔊 AUDIO ON';
      });
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Inicialización automática robusta
function bootZombieGame() {
  try {
    if (!window.zombieGame) {
      window.zombieGame = new ZombieGame();
      console.log('✅ [Aula Zombie] Instancia de juego iniciada con éxito en window.zombieGame');
    }
  } catch (err) {
    console.error('❌ [Aula Zombie] Error fatal instanciando ZombieGame:', err);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootZombieGame);
} else {
  bootZombieGame();
}
