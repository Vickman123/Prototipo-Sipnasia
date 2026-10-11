/**
 * SIPNASIA XR - Sistema de Armas y Drops para Zombie Classroom
 * Incluye modelos procedurales 3D Three.js para FPS y VR,
 * lógica de recarga, retroceso, cadencia y drops flotantes.
 */

import * as THREE from 'three';

export const WEAPON_CONFIGS = {
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
    magSize: 12,
    currentMag: 12,
    reserveAmmo: Infinity,
    reloadTime: 1100, // ms
    spread: 0.012,
    pellets: 1,
    knockback: 0.8,
    colorHex: '#38bdf8',
    colorThree: 0x38bdf8,
    icon: '🔫',
    isProjectile: false
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
    isProjectile: false
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
    isProjectile: false
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
    projectileSpeed: 26
  }
};

export class WeaponManager {
  constructor(audio) {
    this.audio = audio;
    this.weapons = JSON.parse(JSON.stringify(WEAPON_CONFIGS));
    this.currentWeaponId = 'pistol';
    this.lastShotTime = 0;
    this.isReloading = false;
    this.reloadingUntil = 0;
    this.recoilOffset = 0;
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
    // 1. PISTOLA 9mm
    const pistolGroup = new THREE.Group();
    const slideGeo = new THREE.BoxGeometry(0.045, 0.055, 0.22);
    const darkGunMat = new THREE.MeshStandardMaterial({ color: 0x181e26, roughness: 0.35, metalness: 0.85 });
    const slideMesh = new THREE.Mesh(slideGeo, darkGunMat);
    slideMesh.position.set(0, 0.04, -0.04);
    pistolGroup.add(slideMesh);

    const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.06, 12);
    const silverMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.2, metalness: 0.9 });
    const barrel = new THREE.Mesh(barrelGeo, silverMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.045, -0.16);
    pistolGroup.add(barrel);

    const gripGeo = new THREE.BoxGeometry(0.04, 0.12, 0.055);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
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
    pBody.position.set(0, 0.02, -0.14);
    plasmaGroup.add(pBody);

    // Cilindro de contención tóxica verde brillante
    const vialGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.22, 12);
    const vialMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
    const vial = new THREE.Mesh(vialGeo, vialMat);
    vial.rotation.x = Math.PI / 2;
    vial.position.set(0, 0.07, -0.14);
    plasmaGroup.add(vial);

    const pGrip = new THREE.Mesh(gripGeo, gripMat);
    pGrip.position.set(0, -0.06, 0.06);
    pGrip.rotation.x = 0.3;
    plasmaGroup.add(pGrip);

    plasmaGroup.position.set(0.2, -0.18, -0.42);
    plasmaGroup.visible = false;
    this.weaponMeshes['plasma'] = plasmaGroup;
    this.weaponGroup.add(plasmaGroup);

    // Destellos de fogonazo (Muzzle flash)
    Object.keys(this.weaponMeshes).forEach(wKey => {
      const flashGeo = new THREE.OctahedronGeometry(0.06, 0);
      const flashMat = new THREE.MeshBasicMaterial({
        color: this.weapons[wKey].colorThree,
        transparent: true,
        opacity: 0
      });
      const flash = new THREE.Mesh(flashGeo, flashMat);
      flash.position.set(0, 0.04, -0.36);
      this.weaponMeshes[wKey].add(flash);
      this.muzzleFlashes[wKey] = flash;
    });
  }

  switchWeapon(weaponId) {
    if (!this.weapons[weaponId] || !this.weapons[weaponId].unlocked) return false;
    if (this.currentWeaponId === weaponId) return false;

    this.currentWeaponId = weaponId;
    this.isReloading = false;
    this.reloadingUntil = 0;

    Object.keys(this.weaponMeshes).forEach(key => {
      this.weaponMeshes[key].visible = (key === weaponId);
    });

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
    if (this.isReloading) return false;
    if (now - this.lastShotTime < w.fireRate) return false;
    if (w.currentMag <= 0) return false;
    return true;
  }

  shoot(now) {
    const w = this.getCurrentWeapon();
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
    // Manejo de finalización de recarga
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

    // Suavizado del retroceso físico en el arma 3D
    if (this.recoilOffset > 0) {
      this.recoilOffset -= delta * 0.45;
      if (this.recoilOffset < 0) this.recoilOffset = 0;
    }
    const currentMesh = this.weaponMeshes[this.currentWeaponId];
    if (currentMesh) {
      if (this.isReloading) {
        // Animación táctica de recarga 3D (bajar arma, vibración de cargador y retorno)
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

    // Actualización de drops en el suelo (rotación y flotación)
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
      if (roll < 0.28) type = 'health';
      else if (roll < 0.52) type = 'shotgun';
      else if (roll < 0.78) type = 'rifle';
      else type = 'plasma';
    }

    const dropGroup = new THREE.Group();
    dropGroup.position.copy(position);
    dropGroup.position.y = 0.4;

    let color = 0x22c55e;
    let label = 'DROP';

    if (type === 'health') {
      color = 0xef4444;
      label = 'BOTIQUÍN (+50 HP)';
      // Caja médica con cruz
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

      // Caja de munición militar holográfica
      const crateGeo = new THREE.BoxGeometry(0.42, 0.28, 0.32);
      const crateMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.4
      });
      const crate = new THREE.Mesh(crateGeo, crateMat);
      dropGroup.add(crate);

      // Marco brillante
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
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 1.75;
    dropGroup.add(beam);

    // Luz de punto brillante
    const pointLight = new THREE.PointLight(color, 2.0, 4.5);
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
          ? `¡MUNICIÓN EXTRA! +${extraAmmo} para ${w.shortName}`
          : `¡NUEVA ARMA DESBLOQUEADA! ${w.name}`
      };
    }
    return null;
  }
}
