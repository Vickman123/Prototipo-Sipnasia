/**
 * SIPNASIA XR - Sistema de Clases de Zombis para Zombie Classroom
 * Incluye 5 tipos (Normales y Especiales), modelos humanoides 3D articulados,
 * animaciones de marcha, ataques cuerpo a cuerpo y proyectiles ácidos a distancia.
 */

import * as THREE from 'three';

export const ZOMBIE_TYPES = {
  normal: {
    id: 'normal',
    name: 'Estudiante Zombi',
    tag: 'NORMAL',
    hp: 100,
    speed: 2.1,
    damage: 15,
    attackRate: 1100, // ms
    attackRange: 1.4,
    score: 100,
    dropRate: 0.22,
    scale: 1.0,
    eyeColor: 0x22c55e,
    clothColor: 0x1e3a8a, // Uniforme escolar azul marino
    skinColor: 0x65a30d
  },
  runner: {
    id: 'runner',
    name: 'Atleta Infectado',
    tag: 'CORREDOR VELOZ',
    hp: 65,
    speed: 4.2,
    damage: 18,
    attackRate: 750,
    attackRange: 1.5,
    score: 160,
    dropRate: 0.28,
    scale: 0.95,
    eyeColor: 0xef4444, // Ojos rojos furia
    clothColor: 0xb91c1c, // Uniforme deportivo rojo
    skinColor: 0x84cc16
  },
  tank: {
    id: 'tank',
    name: 'Conserje Titán',
    tag: 'BRUTO PESADO',
    hp: 480,
    speed: 1.35,
    damage: 38,
    attackRate: 1600,
    attackRange: 2.0,
    score: 450,
    dropRate: 1.0, // Garantizado
    scale: 1.38,
    eyeColor: 0xfacc15, // Ojos amarillos tóxicos
    clothColor: 0x475569, // Overol gris oscuro
    skinColor: 0x4d7c0f
  },
  spitter: {
    id: 'spitter',
    name: 'Químico de Ciencias',
    tag: 'TÓXICO A DISTANCIA',
    hp: 120,
    speed: 1.85,
    damage: 12,
    rangedDamage: 25,
    attackRate: 1200,
    attackRange: 1.4,
    rangedRange: 12.0,
    rangedCooldown: 3400, // ms
    score: 250,
    dropRate: 0.35,
    scale: 1.02,
    eyeColor: 0x10b981,
    clothColor: 0xe2e8f0, // Bata blanca de laboratorio
    skinColor: 0x15803d
  },
  screamer: {
    id: 'screamer',
    name: 'Prefecto Chillón',
    tag: 'ALARMA MUTANTE',
    hp: 140,
    speed: 2.2,
    damage: 14,
    attackRate: 1100,
    attackRange: 1.4,
    screamCooldown: 9000, // ms
    score: 300,
    dropRate: 0.4,
    scale: 1.05,
    eyeColor: 0xa855f7, // Púrpura psíquico
    clothColor: 0x334155, // Traje con corbata rota
    skinColor: 0x3f6212
  }
};

export class ZombieManager {
  constructor(scene, audio, weaponManager) {
    this.scene = scene;
    this.audio = audio;
    this.weaponManager = weaponManager;
    this.zombies = [];
    this.acidProjectiles = [];
    this.deathParticles = [];
  }

  /* ----------------------------------------------------
     CREACIÓN DE MODELO HUMANOIDE ARTICULADO 3D
     ---------------------------------------------------- */
  createZombieMesh(config) {
    const root = new THREE.Group();
    const s = config.scale;

    // Materiales
    const skinMat = new THREE.MeshStandardMaterial({
      color: config.skinColor,
      roughness: 0.8,
      metalness: 0.1
    });
    const clothMat = new THREE.MeshStandardMaterial({
      color: config.clothColor,
      roughness: 0.7,
      metalness: 0.2
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9
    });
    const eyeMat = new THREE.MeshBasicMaterial({
      color: config.eyeColor
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.48 * s, 0.65 * s, 0.28 * s);
    const torso = new THREE.Mesh(torsoGeo, clothMat);
    torso.position.y = 1.05 * s;
    torso.castShadow = true;
    root.add(torso);

    // 2. Cabeza
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.55 * s, 0);

    const headGeo = new THREE.BoxGeometry(0.32 * s, 0.35 * s, 0.32 * s);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Ojos amenazantes
    const eyeGeo = new THREE.BoxGeometry(0.06 * s, 0.05 * s, 0.02 * s);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08 * s, 0.05 * s, 0.165 * s);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08 * s, 0.05 * s, 0.165 * s);
    headGroup.add(leftEye, rightEye);

    // Mandíbula / Boca abierta
    const jawGeo = new THREE.BoxGeometry(0.18 * s, 0.06 * s, 0.06 * s);
    const jaw = new THREE.Mesh(jawGeo, darkMat);
    jaw.position.set(0, -0.1 * s, 0.15 * s);
    headGroup.add(jaw);

    // Accesorios específicos según tipo
    if (config.id === 'tank') {
      // Casco / Máscara de conserje y hombreras
      const helmetGeo = new THREE.BoxGeometry(0.36 * s, 0.12 * s, 0.36 * s);
      const helmet = new THREE.Mesh(helmetGeo, darkMat);
      helmet.position.set(0, 0.16 * s, 0);
      headGroup.add(helmet);

      const shoulderGeo = new THREE.BoxGeometry(0.22 * s, 0.15 * s, 0.22 * s);
      const leftShoulder = new THREE.Mesh(shoulderGeo, darkMat);
      leftShoulder.position.set(-0.35 * s, 1.25 * s, 0);
      const rightShoulder = new THREE.Mesh(shoulderGeo, darkMat);
      rightShoulder.position.set(0.35 * s, 1.25 * s, 0);
      root.add(leftShoulder, rightShoulder);
    } else if (config.id === 'spitter') {
      // Gafas de laboratorio y aura verde
      const goggleGeo = new THREE.BoxGeometry(0.26 * s, 0.08 * s, 0.04 * s);
      const goggle = new THREE.Mesh(goggleGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      goggle.position.set(0, 0.06 * s, 0.17 * s);
      headGroup.add(goggle);
    } else if (config.id === 'screamer') {
      // Megáfono montado al hombro
      const hornGeo = new THREE.ConeGeometry(0.12 * s, 0.32 * s, 12);
      const horn = new THREE.Mesh(hornGeo, new THREE.MeshStandardMaterial({ color: 0xa855f7 }));
      horn.rotation.z = Math.PI / 2;
      horn.position.set(0.35 * s, 1.28 * s, 0.1 * s);
      root.add(horn);
    }

    root.add(headGroup);

    // 3. Brazos articulados (postura clásica zombie hacia adelante)
    const armGeo = new THREE.BoxGeometry(0.14 * s, 0.62 * s, 0.14 * s);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.32 * s, 1.32 * s, 0);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.y = -0.28 * s;
    leftArmPivot.add(leftArm);
    leftArmPivot.rotation.x = -Math.PI / 2.3; // Apuntando al frente
    root.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.32 * s, 1.32 * s, 0);
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.y = -0.28 * s;
    rightArmPivot.add(rightArm);
    rightArmPivot.rotation.x = -Math.PI / 2.3;
    root.add(rightArmPivot);

    // 4. Piernas articuladas
    const legGeo = new THREE.BoxGeometry(0.16 * s, 0.72 * s, 0.16 * s);

    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.14 * s, 0.72 * s, 0);
    const leftLeg = new THREE.Mesh(legGeo, darkMat);
    leftLeg.position.y = -0.36 * s;
    leftLegPivot.add(leftLeg);
    root.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.14 * s, 0.72 * s, 0);
    const rightLeg = new THREE.Mesh(legGeo, darkMat);
    rightLeg.position.y = -0.36 * s;
    rightLegPivot.add(rightLeg);
    root.add(rightLegPivot);

    // 5. Barra de vida flotante sobre la cabeza
    const barWidth = 0.8 * s;
    const barBgGeo = new THREE.PlaneGeometry(barWidth, 0.08);
    const barBgMat = new THREE.MeshBasicMaterial({ color: 0x1f2937, side: THREE.DoubleSide });
    const barBg = new THREE.Mesh(barBgGeo, barBgMat);
    barBg.position.set(0, 1.95 * s, 0);

    const barFillGeo = new THREE.PlaneGeometry(barWidth, 0.08);
    const barFillMat = new THREE.MeshBasicMaterial({ color: config.eyeColor, side: THREE.DoubleSide });
    const barFill = new THREE.Mesh(barFillGeo, barFillMat);
    barFill.position.set(0, 1.95 * s, 0.005);
    root.add(barBg, barFill);

    return {
      root,
      headGroup,
      head,
      torso,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
      barFill,
      barBg,
      barWidth
    };
  }

  /* ----------------------------------------------------
     APARICIÓN DE ZOMBI (SPAWN)
     ---------------------------------------------------- */
  spawnZombie(typeKey, spawnPosition) {
    const config = ZOMBIE_TYPES[typeKey] || ZOMBIE_TYPES.normal;
    const parts = this.createZombieMesh(config);
    parts.root.position.copy(spawnPosition);
    this.scene.add(parts.root);

    const zombieObj = {
      id: Math.random().toString(36).substr(2, 9),
      type: typeKey,
      config: config,
      parts: parts,
      mesh: parts.root,
      maxHp: config.hp,
      hp: config.hp,
      speed: config.speed,
      damage: config.damage,
      lastAttackTime: 0,
      lastRangedTime: 0,
      lastScreamTime: performance.now(),
      speedBuffEnd: 0,
      isDying: false,
      deathTimer: 0,
      groanTimer: performance.now() + Math.random() * 4000,
      walkPhase: Math.random() * Math.PI * 2
    };

    // Referencias para detección de disparos (Hitboxes)
    parts.head.userData = { isZombie: true, zombieObj, isHeadshot: true };
    parts.torso.userData = { isZombie: true, zombieObj, isHeadshot: false };
    parts.root.userData = { isZombie: true, zombieObj, isHeadshot: false };

    this.zombies.push(zombieObj);
    return zombieObj;
  }

  /* ----------------------------------------------------
     DAÑO RECIBIDO POR UN ZOMBI
     ---------------------------------------------------- */
  damageZombie(zombie, damage, isHeadshot = false, hitPoint = null) {
    if (zombie.isDying) return false;

    const actualDamage = isHeadshot ? Math.round(damage * zombie.config.headshotMult) : damage;
    zombie.hp -= actualDamage;

    // Actualizar barra de vida visual
    const hpRatio = Math.max(0, zombie.hp / zombie.maxHp);
    zombie.parts.barFill.scale.x = hpRatio;
    zombie.parts.barFill.position.x = -(zombie.parts.barWidth * (1 - hpRatio)) / 2;

    // Flash rojo de daño en el cuerpo
    zombie.parts.torso.material.color.setHex(0xffffff);
    setTimeout(() => {
      if (zombie.parts && zombie.parts.torso) {
        zombie.parts.torso.material.color.setHex(zombie.config.clothColor);
      }
    }, 70);

    // Efecto de retroceso leve por disparo
    if (hitPoint) {
      this.spawnBloodParticles(hitPoint, isHeadshot);
    }

    if (zombie.hp <= 0) {
      this.killZombie(zombie, isHeadshot);
      return { killed: true, score: zombie.config.score, isHeadshot };
    }

    return { killed: false, score: 20, isHeadshot };
  }

  killZombie(zombie, isHeadshot) {
    zombie.isDying = true;
    zombie.deathTimer = performance.now();

    // Probabilidad de tirar drop de arma o botiquín
    if (Math.random() < zombie.config.dropRate) {
      const dropPos = zombie.mesh.position.clone();
      this.weaponManager.spawnDrop(this.scene, dropPos, zombie.config.id === 'tank' ? 'plasma' : null);
    }

    if (this.audio) {
      this.audio.playZombieHit();
    }
  }

  spawnBloodParticles(position, isHeadshot) {
    const pCount = isHeadshot ? 18 : 10;
    const pGeo = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < pCount; i++) {
      positions.push(position.x, position.y, position.z);
      velocities.push(
        (Math.random() - 0.5) * 4.0,
        Math.random() * 3.5 + 1.0,
        (Math.random() - 0.5) * 4.0
      );
    }

    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x991b1b,
      size: isHeadshot ? 0.08 : 0.05,
      transparent: true,
      opacity: 0.9
    });

    const pSystem = new THREE.Points(pGeo, pMat);
    this.scene.add(pSystem);

    this.deathParticles.push({
      system: pSystem,
      velocities,
      positions,
      pGeo,
      spawnTime: performance.now()
    });
  }

  /* ----------------------------------------------------
     HABILIDAD ESPECIAL: ESCUPITAJO ÁCIDO (SPITTER)
     ---------------------------------------------------- */
  shootAcidProjectile(spitter, targetPos) {
    const origin = spitter.mesh.position.clone();
    origin.y += 1.4;

    const dir = new THREE.Vector3().subVectors(targetPos, origin).normalize();

    const projGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const projMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const mesh = new THREE.Mesh(projGeo, projMat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    if (this.audio) this.audio.playAcidSplash();

    this.acidProjectiles.push({
      mesh,
      velocity: dir.multiplyScalar(13),
      damage: spitter.config.rangedDamage,
      spawnTime: performance.now()
    });
  }

  /* ----------------------------------------------------
     HABILIDAD ESPECIAL: GRITO DE ALARMA (SCREAMER)
     ---------------------------------------------------- */
  triggerScreamerWail(screamer) {
    if (this.audio) this.audio.playZombieGroan('screamer');

    // Anillo de onda sónica expansiva visual
    const ringGeo = new THREE.RingGeometry(0.4, 0.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(screamer.mesh.position);
    ring.position.y = 1.2;
    this.scene.add(ring);

    let ringScale = 1.0;
    const ringInterval = setInterval(() => {
      ringScale += 0.6;
      ring.scale.set(ringScale, ringScale, 1);
      ring.material.opacity -= 0.08;
      if (ring.material.opacity <= 0) {
        clearInterval(ringInterval);
        this.scene.remove(ring);
      }
    }, 45);

    // Buff de velocidad para todos los zombis cercanos
    const now = performance.now();
    this.zombies.forEach(z => {
      if (z.mesh.position.distanceTo(screamer.mesh.position) < 14) {
        z.speedBuffEnd = now + 6000;
      }
    });

    // Convocar 2 corredores adicionales
    const spawnOffsets = [-2.5, 2.5];
    spawnOffsets.forEach(ox => {
      const sp = screamer.mesh.position.clone();
      sp.x += ox;
      sp.z += (Math.random() - 0.5) * 2;
      this.spawnZombie('runner', sp);
    });
  }

  /* ----------------------------------------------------
     ACTUALIZACIÓN DE COMPORTAMIENTO, ANIMACIÓN Y FÍSICA
     ---------------------------------------------------- */
  update(now, delta, playerPos, playerStats, camera) {
    // 1. Partículas de sangre
    for (let i = this.deathParticles.length - 1; i >= 0; i--) {
      const dp = this.deathParticles[i];
      const age = (now - dp.spawnTime) / 1000;
      if (age > 0.8) {
        this.scene.remove(dp.system);
        this.deathParticles.splice(i, 1);
        continue;
      }

      const pArr = dp.positions;
      for (let j = 0; j < pArr.length / 3; j++) {
        pArr[j * 3] += dp.velocities[j * 3] * delta;
        pArr[j * 3 + 1] += dp.velocities[j * 3 + 1] * delta;
        dp.velocities[j * 3 + 1] -= 9.8 * delta; // Gravedad
        pArr[j * 3 + 2] += dp.velocities[j * 3 + 2] * delta;
      }
      dp.pGeo.attributes.position.needsUpdate = true;
      dp.system.material.opacity = 1 - (age / 0.8);
    }

    // 2. Proyectiles ácidos
    for (let i = this.acidProjectiles.length - 1; i >= 0; i--) {
      const proj = this.acidProjectiles[i];
      proj.mesh.position.addScaledVector(proj.velocity, delta);

      // Impacto con el jugador
      if (proj.mesh.position.distanceTo(playerPos) < 1.3) {
        playerStats.health -= proj.damage;
        if (this.audio) this.audio.playPlayerHurt();
        this.scene.remove(proj.mesh);
        this.acidProjectiles.splice(i, 1);
        continue;
      }

      // Caída al suelo o timeout
      if (proj.mesh.position.y <= 0.1 || now - proj.spawnTime > 3000) {
        this.scene.remove(proj.mesh);
        this.acidProjectiles.splice(i, 1);
      }
    }

    // 3. IA y animación de zombis
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];

      // Animación de muerte
      if (z.isDying) {
        const fallProgress = (now - z.deathTimer) / 700;
        z.mesh.rotation.x = Math.min(Math.PI / 2, fallProgress * (Math.PI / 2));
        z.mesh.position.y = Math.max(0.1, 0.4 * (1 - fallProgress));
        if (fallProgress >= 1.0) {
          this.scene.remove(z.mesh);
          this.zombies.splice(i, 1);
        }
        continue;
      }

      // Orientar barra de vida hacia la cámara
      z.parts.barBg.quaternion.copy(camera.quaternion);
      z.parts.barFill.quaternion.copy(camera.quaternion);

      // Sonido de gruñido aleatorio
      if (now >= z.groanTimer) {
        const distToPlayer = z.mesh.position.distanceTo(playerPos);
        if (distToPlayer < 16 && this.audio) {
          this.audio.playZombieGroan(z.type);
        }
        z.groanTimer = now + 4000 + Math.random() * 5000;
      }

      // Distancia al jugador
      const toPlayer = new THREE.Vector3().subVectors(playerPos, z.mesh.position);
      toPlayer.y = 0;
      const distance = toPlayer.length();

      // Mirar hacia el jugador
      z.mesh.lookAt(playerPos.x, z.mesh.position.y, playerPos.z);

      // Velocidad actual con posibles buffs de Screamer
      let currentSpeed = z.speed;
      if (now < z.speedBuffEnd) currentSpeed *= 1.38;

      // Habilidad Ranged (Spitter)
      if (z.type === 'spitter' && distance <= z.config.rangedRange && distance > 3.0) {
        if (now - z.lastRangedTime > z.config.rangedCooldown) {
          z.lastRangedTime = now;
          this.shootAcidProjectile(z, playerPos);
        }
      }

      // Habilidad Grito (Screamer)
      if (z.type === 'screamer' && distance <= 14) {
        if (now - z.lastScreamTime > z.config.screamCooldown) {
          z.lastScreamTime = now;
          this.triggerScreamerWail(z);
        }
      }

      // Ataque cuerpo a cuerpo
      if (distance <= z.config.attackRange) {
        if (now - z.lastAttackTime > z.config.attackRate) {
          z.lastAttackTime = now;
          playerStats.health -= z.damage;
          if (this.audio) {
            this.audio.playPlayerHurt();
            if (z.type === 'tank') this.audio.playTankStomp();
          }

          // Animación de zarpazo
          z.parts.leftArmPivot.rotation.x = -Math.PI / 1.6;
          z.parts.rightArmPivot.rotation.x = -Math.PI / 1.6;
          setTimeout(() => {
            if (z.parts && !z.isDying) {
              z.parts.leftArmPivot.rotation.x = -Math.PI / 2.3;
              z.parts.rightArmPivot.rotation.x = -Math.PI / 2.3;
            }
          }, 240);
        }
      } else {
        // Moverse hacia el jugador
        toPlayer.normalize();
        z.mesh.position.addScaledVector(toPlayer, currentSpeed * delta);

        // Ciclo de animación de caminata
        z.walkPhase += delta * currentSpeed * 4.2;
        const stride = Math.sin(z.walkPhase) * 0.45;
        z.parts.leftLegPivot.rotation.x = stride;
        z.parts.rightLegPivot.rotation.x = -stride;
        z.parts.leftArmPivot.rotation.z = Math.cos(z.walkPhase) * 0.12;
        z.parts.rightArmPivot.rotation.z = -Math.cos(z.walkPhase) * 0.12;

        // Sonido de pisadas pesadas para el Tank
        if (z.type === 'tank' && Math.sin(z.walkPhase) > 0.95 && Math.random() < 0.15) {
          if (distance < 15 && this.audio) this.audio.playTankStomp();
        }
      }
    }
  }

  clearAll() {
    this.zombies.forEach(z => this.scene.remove(z.mesh));
    this.zombies = [];
    this.acidProjectiles.forEach(p => this.scene.remove(p.mesh));
    this.acidProjectiles = [];
    this.deathParticles.forEach(dp => this.scene.remove(dp.system));
    this.deathParticles = [];
  }
}
