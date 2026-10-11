/**
 * SIPNASIA XR - Sistema de Armas, Melee y Drops para Zombie Classroom
 * Incluye:
 * - Arma cuerpo a cuerpo (Bate con clavos y alambre de púas)
 * - Pistola 9mm calibrada (11 en cargador, 42 en reserva inicial)
 * - Escopeta Recortada, Fusil PUMA-AR y Cañón de Plasma
 * - Drops dinámicos: Cajas de munición (+33 balas), Botiquines y Armas especiales
 * - Modelos procedurales 3D Three.js, físicas y animaciones de golpe melee y recarga
 */

import * as THREE from '../libs/three.module.js';

export const WEAPON_CONFIGS = {
  bat: {
    id: 'bat',
    name: 'Bate con Clavos "Puma Furioso"',
    shortName: 'BATE CON CLAVOS',
    category: 'Cuerpo a Cuerpo',
    unlocked: true,
    damage: 85,
    headshotMult: 2.5,
    fireRate: 360, // ms entre golpes
    isAutomatic: false,
    magSize: Infinity,
    currentMag: Infinity,
    reserveAmmo: Infinity,
    reloadTime: 0,
    spread: 0,
    pellets: 1,
    knockback: 3.5,
    range: 2.4, // Distancia efectiva del golpe
    colorHex: '#f59e0b',
    colorThree: 0xf59e0b,
    icon: '🏏',
    isProjectile: false,
    isMelee: true
  },
  pistol: {
    id: 'pistol',
    name: 'Pistola Táctica 9mm',
    shortName: 'PISTOLA 9mm',
    category: 'Secundaria',
    unlocked: true,
    damage: 36,
    headshotMult: 2.2,
    fireRate: 220, // ms
    isAutomatic: false,
    magSize: 11,
    currentMag: 11,
    reserveAmmo: 42,
    reloadTime: 1100, // ms
    spread: 0.012,
    pellets: 1,
    knockback: 0.8,
    colorHex: '#38bdf8',
    colorThree: 0x38bdf8,
    icon: '🔫',
    isProjectile: false,
    isMelee: false
  },
  shotgun: {
    id: 'shotgun',
    name: 'Escopeta Recortada "La Expulsión"',
    shortName: 'ESCOPETA CAL. 12',
    category: 'Especial / Cercana',
    unlocked: false,
    damage: 25, // x 8 pellets = 200 máx
    headshotMult: 1.8,
    fireRate: 750,
    isAutomatic: false,
    magSize: 6,
    currentMag: 6,
    reserveAmmo: 24,
    reloadTime: 1800,
    spread: 0.075,
    pellets: 8,
    knockback: 3.5,
    colorHex: '#f97316',
    colorThree: 0xf97316,
    icon: '💥',
    isProjectile: false,
    isMelee: false
  },
  rifle: {
    id: 'rifle',
    name: 'Fusil Táctico PUMA-AR',
    shortName: 'FUSIL PUMA-AR',
    category: 'Asalto Rápido',
    unlocked: false,
    damage: 42,
    headshotMult: 2.5,
    fireRate: 115,
    isAutomatic: true,
    magSize: 30,
    currentMag: 30,
    reserveAmmo: 90,
    reloadTime: 1350,
    spread: 0.025,
    pellets: 1,
    knockback: 1.2,
    colorHex: '#eab308',
    colorThree: 0xeab308,
    icon: '⚡',
    isProjectile: false,
    isMelee: false
  },
  plasma: {
    id: 'plasma',
    name: 'Lanzador Químico "Ácido Escolar"',
    shortName: 'CAÑÓN DE PLASMA',
    category: 'Pesada / Área',
    unlocked: false,
    damage: 175,
    aoeRadius: 4.2,
    headshotMult: 1.5,
    fireRate: 850,
    isAutomatic: false,
    magSize: 4,
    currentMag: 4,
    reserveAmmo: 12,
    reloadTime: 1900,
    spread: 0.005,
    pellets: 1,
    knockback: 4.0,
    colorHex: '#22c55e',
    colorThree: 0x22c55e,
    icon: '🧪',
    isProjectile: true,
    projectileSpeed: 26,
    isMelee: false
  }
};

export class WeaponManager {
  constructor(audio) {
    this.audio = audio;
    this.weapons = JSON.parse(JSON.stringify(WEAPON_CONFIGS));
    this.currentWeaponId = 'pistol'; // Iniciar con la pistola equipada
    this.lastShotTime = 0;
    this.isReloading = false;
    this.reloadingUntil = 0;
    this.recoilOffset = 0;
    this.isSwingingMelee = false;
    this.meleeSwingTime = 0;
    this.weaponGroup = new THREE.Group();
    this.weaponMeshes = {};
    this.muzzleFlashes = {};
    this.drops = []; // Drops activos en el suelo

    this.init3DWeaponModels();
  }

  getCurrentWeapon() {
    return this.weapons[this.currentWeaponId];
  }

  /* ----------------------------------------------------
     CONSTRUCCIÓN 3D DE ARMAS EN PRIMERA PERSONA / VR
     ---------------------------------------------------- */
  init3DWeaponModels() {
    // 0. BATE DE BÉISBOL CON CLAVOS Y ALAMBRE (MELEE)
    const batGroup = new THREE.Group();

    // Mango con cinta deportiva negra
    const handleGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.24, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, -0.15, 0);
    batGroup.add(handle);

    // Pomo inferior del bate
    const pommelGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.025, 12);
    const pommel = new THREE.Mesh(pommelGeo, handleMat);
    pommel.position.set(0, -0.27, 0);
    batGroup.add(pommel);

    // Cuerpo de madera de roble barnizada del bate
    const batBodyGeo = new THREE.CylinderGeometry(0.038, 0.019, 0.54, 16);
    const batWoodMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.4,
      metalness: 0.08
    });
    const batBody = new THREE.Mesh(batBodyGeo, batWoodMat);
    batBody.position.set(0, 0.22, 0);
    batGroup.add(batBody);

    // Alambre de púas enrollado alrededor de la cabeza del bate
    const wireMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.25, metalness: 0.9 });
    for (let c = 0; c < 4; c++) {
      const coilGeo = new THREE.TorusGeometry(0.041, 0.004, 6, 16);
      const coil = new THREE.Mesh(coilGeo, wireMat);
      coil.position.set(0, 0.18 + c * 0.07, 0);
      coil.rotation.x = Math.PI / 2 + 0.15;
      batGroup.add(coil);
    }

    // Clavos sobresalientes
    const nailMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.3 });
    const nailGeo = new THREE.ConeGeometry(0.007, 0.05, 6);
    const nailPositions = [
      [0.036, 0.32, 0, 0, 0, -Math.PI / 2],
      [-0.036, 0.28, 0, 0, 0, Math.PI / 2],
      [0, 0.36, 0.036, Math.PI / 2, 0, 0],
      [0, 0.24, -0.036, -Math.PI / 2, 0, 0],
      [0.025, 0.42, 0.025, Math.PI / 4, 0, -Math.PI / 4]
    ];
    nailPositions.forEach(np => {
      const nail = new THREE.Mesh(nailGeo, nailMat);
      nail.position.set(np[0], np[1], np[2]);
      nail.rotation.set(np[3], np[4], np[5]);
      batGroup.add(nail);
    });

    // Mancha de sangre
    const bloodGeo = new THREE.SphereGeometry(0.042, 8, 8);
    const bloodMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.2 });
    const bloodSplat = new THREE.Mesh(bloodGeo, bloodMat);
    bloodSplat.scale.set(0.9, 1.3, 0.9);
    bloodSplat.position.set(0, 0.35, 0);
    batGroup.add(bloodSplat);

    batGroup.position.set(0.24, -0.22, -0.42);
    batGroup.rotation.set(0.25, 0.2, -0.3);
    batGroup.visible = false;
    this.weaponMeshes['bat'] = batGroup;
    this.weaponGroup.add(batGroup);

    // 1. PISTOLA 9mm
    const pistolGroup = new THREE.Group();
    const slideGeo = new THREE.BoxGeometry(0.045, 0.055, 0.22);
    const darkGunMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.65 });
    const slideMesh = new THREE.Mesh(slideGeo, darkGunMat);
    slideMesh.position.set(0, 0.04, -0.04);
    pistolGroup.add(slideMesh);

    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.06, 12);
    const silverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.85 });
    const barrel = new THREE.Mesh(barrelGeo, silverMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.045, -0.16);
    pistolGroup.add(barrel);

    const gripGeo = new THREE.BoxGeometry(0.04, 0.12, 0.055);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.04, 0.02);
    grip.rotation.x = 0.25;
    pistolGroup.add(grip);

    // Detalle azul ciber PC PUMA
    const stripeGeo = new THREE.BoxGeometry(0.046, 0.008, 0.14);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.06, -0.04);
    pistolGroup.add(stripe);

    pistolGroup.position.set(0.18, -0.16, -0.38);
    this.weaponMeshes['pistol'] = pistolGroup;
    this.weaponGroup.add(pistolGroup);

    // 2. ESCOPETA RECORTADA
    const shotgunGroup = new THREE.Group();
    const sBarrelGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.42, 12);
    const sBarrel = new THREE.Mesh(sBarrelGeo, darkGunMat);
    sBarrel.rotation.x = Math.PI / 2;
    sBarrel.position.set(0, 0.03, -0.15);
    shotgunGroup.add(sBarrel);

    const sPumpGeo = new THREE.BoxGeometry(0.05, 0.05, 0.16);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const sPump = new THREE.Mesh(sPumpGeo, woodMat);
    sPump.position.set(0, 0.01, -0.16);
    shotgunGroup.add(sPump);

    const sStockGeo = new THREE.BoxGeometry(0.042, 0.09, 0.16);
    const sStock = new THREE.Mesh(sStockGeo, woodMat);
    sStock.position.set(0, -0.04, 0.08);
    sStock.rotation.x = 0.35;
    shotgunGroup.add(sStock);

    shotgunGroup.position.set(0.2, -0.18, -0.42);
    shotgunGroup.visible = false;
    this.weaponMeshes['shotgun'] = shotgunGroup;
    this.weaponGroup.add(shotgunGroup);

    // 3. FUSIL PUMA-AR
    const rifleGroup = new THREE.Group();
    const rBodyGeo = new THREE.BoxGeometry(0.05, 0.07, 0.48);
    const rBody = new THREE.Mesh(rBodyGeo, darkGunMat);
    rBody.position.set(0, 0.02, -0.12);
    rifleGroup.add(rBody);

    const rMagGeo = new THREE.BoxGeometry(0.035, 0.15, 0.06);
    const rMag = new THREE.Mesh(rMagGeo, silverMat);
    rMag.position.set(0, -0.09, -0.08);
    rMag.rotation.x = -0.25;
    rifleGroup.add(rMag);

    const rGrip = new THREE.Mesh(gripGeo, gripMat);
    rGrip.position.set(0, -0.06, 0.05);
    rGrip.rotation.x = 0.3;
    rifleGroup.add(rGrip);

    // Mirilla holográfica dorada UNAM
    const sightGeo = new THREE.TorusGeometry(0.018, 0.003, 8, 16);
    const sightMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const sight = new THREE.Mesh(sightGeo, sightMat);
    sight.position.set(0, 0.075, -0.05);
    rifleGroup.add(sight);

    rifleGroup.position.set(0.2, -0.18, -0.44);
    rifleGroup.visible = false;
    this.weaponMeshes['rifle'] = rifleGroup;
    this.weaponGroup.add(rifleGroup);

    // 4. LANZADOR QUÍMICO DE PLASMA
    const plasmaGroup = new THREE.Group();
    const pBodyGeo = new THREE.CylinderGeometry(0.04, 0.048, 0.45, 16);
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.3, metalness: 0.7 });
    const pBody = new THREE.Mesh(pBodyGeo, pBodyMat);
    pBody.rotation.x = Math.PI / 2;
    plasmaGroup.add(pBody);

    // Contenedor de ácido verde brillante
    const vialGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.22, 12);
    const vialMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const vial = new THREE.Mesh(vialGeo, vialMat);
    vial.rotation.x = Math.PI / 2;
    vial.position.set(0, 0.06, -0.02);
    plasmaGroup.add(vial);

    const pGrip = new THREE.Mesh(gripGeo, gripMat);
    pGrip.position.set(0, -0.07, 0.08);
    pGrip.rotation.x = 0.35;
    plasmaGroup.add(pGrip);

    plasmaGroup.position.set(0.2, -0.18, -0.42);
    plasmaGroup.visible = false;
    this.weaponMeshes['plasma'] = plasmaGroup;
    this.weaponGroup.add(plasmaGroup);

    // Fogonazos de disparo para cada arma de fuego
    ['pistol', 'shotgun', 'rifle', 'plasma'].forEach(id => {
      const flashGeo = new THREE.PlaneGeometry(0.25, 0.25);
      const flashMat = new THREE.MeshBasicMaterial({
        color: this.weapons[id].colorThree,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const flashMesh = new THREE.Mesh(flashGeo, flashMat);
      flashMesh.position.set(0, 0.04, -0.26);
      this.weaponMeshes[id].add(flashMesh);
      this.muzzleFlashes[id] = flashMesh;
    });
  }

  /* ----------------------------------------------------
     CONTROL DE ARMAS (CAMBIO Y CICLO)
     ---------------------------------------------------- */
  switchWeapon(weaponId) {
    if (!this.weapons[weaponId] || !this.weapons[weaponId].unlocked) return false;
    if (this.currentWeaponId === weaponId) return true;

    // Ocultar arma actual
    if (this.weaponMeshes[this.currentWeaponId]) {
      this.weaponMeshes[this.currentWeaponId].visible = false;
    }

    this.currentWeaponId = weaponId;
    this.isReloading = false;
    this.isSwingingMelee = false;

    // Mostrar nueva arma
    if (this.weaponMeshes[weaponId]) {
      this.weaponMeshes[weaponId].visible = true;
      if (weaponId === 'bat') {
        this.weaponMeshes[weaponId].rotation.set(0.25, 0.2, -0.3);
        this.weaponMeshes[weaponId].position.set(0.24, -0.22, -0.42);
      } else {
        this.weaponMeshes[weaponId].rotation.set(0, 0, 0);
        this.weaponMeshes[weaponId].position.set(0.18, -0.16, -0.38);
      }
    }

    if (this.audio) this.audio.playWeaponSwitch();
    return true;
  }

  cycleWeapon(direction = 1) {
    const unlockedIds = Object.keys(this.weapons).filter(id => this.weapons[id].unlocked);
    if (unlockedIds.length <= 1) return;

    let currentIndex = unlockedIds.indexOf(this.currentWeaponId);
    let nextIndex = (currentIndex + direction + unlockedIds.length) % unlockedIds.length;
    this.switchWeapon(unlockedIds[nextIndex]);
  }

  canShoot(now) {
    const w = this.getCurrentWeapon();
    if (w.isMelee) {
      if (now - this.lastShotTime < w.fireRate) return false;
      return true;
    }
    if (this.isReloading) return false;
    if (now - this.lastShotTime < w.fireRate) return false;
    if (w.currentMag <= 0) return false;
    return true;
  }

  shoot(now) {
    const w = this.getCurrentWeapon();

    // 1. Manejo exclusivo de arma Melee (Bate)
    if (w.isMelee) {
      if (now - this.lastShotTime < w.fireRate) return null;
      this.lastShotTime = now;
      this.meleeSwingTime = now;
      this.isSwingingMelee = true;
      if (this.audio) this.audio.playMeleeSwing();
      return w;
    }

    // 2. Manejo de armas de fuego
    if (!this.canShoot(now)) {
      if (w.currentMag <= 0 && !this.isReloading) {
        if (this.audio) this.audio.playDryFire();
        this.reload(now);
      }
      return null;
    }

    this.lastShotTime = now;
    w.currentMag--;
    this.recoilOffset = 0.08;

    // Reproducir audio según arma
    if (this.audio) {
      if (w.id === 'shotgun') this.audio.playShotgunShot();
      else if (w.id === 'rifle') this.audio.playRifleShot();
      else if (w.id === 'plasma') this.audio.playPlasmaShot();
      else this.audio.playPistolShot();
    }

    // Fogonazo visual
    const flash = this.muzzleFlashes[w.id];
    if (flash) {
      flash.material.opacity = 1.0;
      flash.rotation.z = Math.random() * Math.PI * 2;
      setTimeout(() => {
        if (flash.material) flash.material.opacity = 0;
      }, 45);
    }

    return w;
  }

  reload(now) {
    const w = this.getCurrentWeapon();
    if (w.isMelee) return false; // Melee no se recarga
    if (this.isReloading || w.currentMag >= w.magSize) return false;
    if (w.reserveAmmo !== Infinity && w.reserveAmmo <= 0) {
      if (this.audio) this.audio.playDryFire();
      return false;
    }

    this.isReloading = true;
    this.reloadingUntil = now + w.reloadTime;
    if (this.audio) this.audio.playReload();
    return true;
  }

  update(now, delta) {
    // 1. Animación del golpe Melee (Swinging Bat)
    if (this.isSwingingMelee) {
      const swingProg = (now - this.meleeSwingTime) / 240;
      const batMesh = this.weaponMeshes['bat'];
      if (batMesh && swingProg < 1.0) {
        batMesh.rotation.x = 0.25 + Math.sin(swingProg * Math.PI) * 1.5;
        batMesh.rotation.z = -0.3 - Math.sin(swingProg * Math.PI) * 1.3;
        batMesh.position.x = 0.24 - Math.sin(swingProg * Math.PI) * 0.22;
        batMesh.position.z = -0.42 - Math.sin(swingProg * Math.PI) * 0.16;
      } else {
        this.isSwingingMelee = false;
        if (batMesh) {
          batMesh.rotation.set(0.25, 0.2, -0.3);
          batMesh.position.set(0.24, -0.22, -0.42);
        }
      }
    }

    // 2. Manejo de finalización de recarga para armas de fuego
    if (this.isReloading && now >= this.reloadingUntil) {
      const w = this.getCurrentWeapon();
      const needed = w.magSize - w.currentMag;
      if (w.reserveAmmo === Infinity) {
        w.currentMag = w.magSize;
      } else {
        const added = Math.min(needed, w.reserveAmmo);
        w.currentMag += added;
        w.reserveAmmo -= added;
      }
      this.isReloading = false;
    }

    // 3. Suavizado del retroceso físico en armas de fuego
    if (this.recoilOffset > 0) {
      this.recoilOffset -= delta * 0.45;
      if (this.recoilOffset < 0) this.recoilOffset = 0;
    }
    const currentMesh = this.weaponMeshes[this.currentWeaponId];
    if (currentMesh && this.currentWeaponId !== 'bat') {
      if (this.isReloading) {
        currentMesh.position.z = -0.34;
        currentMesh.position.y = -0.27 + Math.sin(now * 0.015) * 0.025;
        currentMesh.rotation.x = 0.35 + Math.sin(now * 0.018) * 0.05;
        currentMesh.rotation.z = -0.16;
      } else {
        currentMesh.position.z = -0.38 + this.recoilOffset;
        currentMesh.position.y = -0.16;
        currentMesh.rotation.x = 0;
        currentMesh.rotation.z = 0;
      }
    }

    // 4. Actualización de drops en el suelo (rotación y flotación)
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.mesh.rotation.y += delta * 2.0;
      drop.mesh.position.y = drop.baseY + Math.sin(now * 0.003 + i) * 0.12;

      // Desvanecer después de 35 segundos si no se recoge
      if (now - drop.spawnTime > 35000) {
        drop.scene.remove(drop.mesh);
        this.drops.splice(i, 1);
      }
    }
  }

  /* ----------------------------------------------------
     SISTEMA DE DROPS GENERADOS POR ENEMIGOS ELIMINADOS
     ---------------------------------------------------- */
  spawnDrop(scene, position, forcedType = null) {
    let type = forcedType;
    if (!type) {
      const roll = Math.random();
      if (roll < 0.35) type = 'ammo';        // 35% Cajas de munición
      else if (roll < 0.60) type = 'health'; // 25% Botiquines
      else if (roll < 0.75) type = 'shotgun';// 15% Escopeta
      else if (roll < 0.90) type = 'rifle';  // 15% Fusil
      else type = 'plasma';                  // 10% Cañón de Plasma
    }

    const dropGroup = new THREE.Group();
    dropGroup.position.copy(position);
    dropGroup.position.y = 0.4;

    let color = 0xfacc15;
    let label = 'DROP';

    if (type === 'ammo') {
      color = 0xfacc15; // Dorado munición
      label = 'MUNICIÓN (+33 BALAS)';

      // Caja metálica militar verde olivo
      const crateGeo = new THREE.BoxGeometry(0.38, 0.24, 0.26);
      const crateMat = new THREE.MeshStandardMaterial({
        color: 0x14532d,
        emissive: 0x15803d,
        emissiveIntensity: 0.25,
        roughness: 0.4
      });
      const crate = new THREE.Mesh(crateGeo, crateMat);
      dropGroup.add(crate);

      // Tapa superior metálica dorada
      const lidGeo = new THREE.BoxGeometry(0.40, 0.06, 0.28);
      const lidMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.25 });
      const lid = new THREE.Mesh(lidGeo, lidMat);
      lid.position.y = 0.13;
      dropGroup.add(lid);

      // Iconos de proyectiles 3D dorados
      const bulletGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
      const bulletMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });
      const b1 = new THREE.Mesh(bulletGeo, bulletMat);
      b1.position.set(-0.06, 0.22, 0);
      const b2 = new THREE.Mesh(bulletGeo, bulletMat);
      b2.position.set(0.06, 0.22, 0);
      dropGroup.add(b1, b2);

    } else if (type === 'health') {
      color = 0xef4444;
      label = 'BOTIQUÍN (+50 HP)';

      const boxGeo = new THREE.BoxGeometry(0.35, 0.25, 0.35);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const box = new THREE.Mesh(boxGeo, boxMat);
      dropGroup.add(box);

      const crossGeo = new THREE.BoxGeometry(0.18, 0.06, 0.36);
      const crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const cross1 = new THREE.Mesh(crossGeo, crossMat);
      const cross2 = new THREE.Mesh(crossGeo, crossMat);
      cross2.rotation.y = Math.PI / 2;
      dropGroup.add(cross1, cross2);

    } else {
      const cfg = this.weapons[type];
      color = cfg.colorThree;
      label = `${cfg.shortName} (+MUNICIÓN)`;

      const crateGeo = new THREE.BoxGeometry(0.42, 0.28, 0.32);
      const crateMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.4
      });
      const crate = new THREE.Mesh(crateGeo, crateMat);
      dropGroup.add(crate);

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(crateGeo),
        new THREE.LineBasicMaterial({ color: color })
      );
      dropGroup.add(wire);
    }

    // Haz de luz vertical ascendente (Beacon)
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.2, 3.5, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 1.75;
    dropGroup.add(beam);

    // Luz de punto brillante
    const pointLight = new THREE.PointLight(color, 2.2, 4.5);
    pointLight.position.y = 0.5;
    dropGroup.add(pointLight);

    scene.add(dropGroup);

    const dropObj = {
      type: type,
      label: label,
      mesh: dropGroup,
      baseY: 0.4,
      spawnTime: performance.now(),
      scene: scene
    };

    this.drops.push(dropObj);
    return dropObj;
  }

  collectDrop(drop, playerStats) {
    if (drop.type === 'ammo') {
      // Recarga de munición en reserva
      this.weapons['pistol'].reserveAmmo += 33;
      if (this.weapons['shotgun'].unlocked) this.weapons['shotgun'].reserveAmmo += 8;
      if (this.weapons['rifle'].unlocked) this.weapons['rifle'].reserveAmmo += 30;
      if (this.weapons['plasma'].unlocked) this.weapons['plasma'].reserveAmmo += 3;

      if (this.audio) this.audio.playAmmoPickup();
      return { type: 'ammo', message: '¡MUNICIÓN RECOGIDA! +33 BALAS' };
    }

    if (drop.type === 'health') {
      playerStats.health = Math.min(100, playerStats.health + 50);
      if (this.audio) this.audio.playPickup();
      return { type: 'health', message: '¡BOTIQUÍN RECOGIDO! +50 SALUD' };
    }

    const w = this.weapons[drop.type];
    if (w) {
      const wasUnlocked = w.unlocked;
      w.unlocked = true;
      const extraAmmo = w.magSize * 2;
      w.reserveAmmo += extraAmmo;

      if (!wasUnlocked) {
        this.switchWeapon(drop.type);
      }

      if (this.audio) this.audio.playPickup();
      return {
        type: drop.type,
        message: wasUnlocked
          ? `¡MUNICIÓN RECOGIDA! +${extraAmmo} para ${w.name}`
          : `¡NUEVA ARMA! ${w.name.toUpperCase()} DESBLOQUEADA`
      };
    }

    return null;
  }
}
