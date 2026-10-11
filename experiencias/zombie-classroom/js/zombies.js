/**
 * SIPNASIA XR - Sistema de Clases de Zombis y Desmembramiento
 * Aula Zombie - Escuela de Supervivencia PC PUMA
 * Incluye:
 * - 5 Clases de Zombis (Normal, Corredor, Titán, Químico, Chillón)
 * - Barras de Salud Flotantes (Billboard 3D con nombre, barra dinámica y números de HP)
 * - Sistema Completo de Desmembramiento (Pérdida de brazos, piernas y cabeza con físicas)
 * - Modo Rastrero (Crawler al perder piernas, arrastre en el suelo)
 * - Modo Mordedor Furioso (Biter al perder ambos brazos, ¡ataque saltando a mordidas!)
 * - Daño matemático seguro sin nulos ni NaN
 */

import * as THREE from '../libs/three.module.js';

export const ZOMBIE_TYPES = {
  normal: {
    id: 'normal',
    name: 'Estudiante Zombi',
    tag: 'NORMAL',
    hp: 100,
    speed: 2.1,
    damage: 15,
    attackRate: 1100,
    attackRange: 1.4,
    headshotMult: 2.2,
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
    headshotMult: 2.0,
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
    headshotMult: 2.5,
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
    rangedCooldown: 3400,
    headshotMult: 2.2,
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
    screamCooldown: 9000,
    headshotMult: 2.2,
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
    this.damageTexts = [];
    this.severedLimbs = []; // Extremidades desmembradas con física
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
      roughness: 0.75,
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
    torso.receiveShadow = true;
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

    // Mandíbula / Boca abierta animable
    const jawGeo = new THREE.BoxGeometry(0.2 * s, 0.08 * s, 0.12 * s);
    const jaw = new THREE.Mesh(jawGeo, darkMat);
    jaw.position.set(0, -0.12 * s, 0.13 * s);
    headGroup.add(jaw);

    // Accesorios específicos según tipo
    if (config.id === 'tank') {
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
      const goggleGeo = new THREE.BoxGeometry(0.26 * s, 0.08 * s, 0.04 * s);
      const goggle = new THREE.Mesh(goggleGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      goggle.position.set(0, 0.06 * s, 0.17 * s);
      headGroup.add(goggle);
    } else if (config.id === 'screamer') {
      const hornGeo = new THREE.ConeGeometry(0.12 * s, 0.32 * s, 12);
      const horn = new THREE.Mesh(hornGeo, new THREE.MeshStandardMaterial({ color: 0xa855f7 }));
      horn.rotation.z = Math.PI / 2;
      horn.position.set(0.35 * s, 1.28 * s, 0.1 * s);
      root.add(horn);
    }

    root.add(headGroup);

    // 3. Brazos articulados independientes (Desmembrables)
    const armGeo = new THREE.BoxGeometry(0.14 * s, 0.62 * s, 0.14 * s);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.32 * s, 1.32 * s, 0);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.y = -0.28 * s;
    leftArm.castShadow = true;
    leftArmPivot.add(leftArm);
    leftArmPivot.rotation.x = -Math.PI / 2.3;
    root.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.32 * s, 1.32 * s, 0);
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.y = -0.28 * s;
    rightArm.castShadow = true;
    rightArmPivot.add(rightArm);
    rightArmPivot.rotation.x = -Math.PI / 2.3;
    root.add(rightArmPivot);

    // 4. Piernas articuladas independientes (Desmembrables)
    const legGeo = new THREE.BoxGeometry(0.16 * s, 0.72 * s, 0.16 * s);

    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.14 * s, 0.72 * s, 0);
    const leftLeg = new THREE.Mesh(legGeo, darkMat);
    leftLeg.position.y = -0.36 * s;
    leftLeg.castShadow = true;
    leftLegPivot.add(leftLeg);
    root.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.14 * s, 0.72 * s, 0);
    const rightLeg = new THREE.Mesh(legGeo, darkMat);
    rightLeg.position.y = -0.36 * s;
    rightLeg.castShadow = true;
    rightLegPivot.add(rightLeg);
    root.add(rightLegPivot);

    // 5. Barra de salud flotante estilo BILLBOARD en HD
    const barCanvas = document.createElement('canvas');
    barCanvas.width = 256;
    barCanvas.height = 64;
    const barTexture = new THREE.CanvasTexture(barCanvas);
    barTexture.minFilter = THREE.LinearFilter;
    const barMaterial = new THREE.SpriteMaterial({
      map: barTexture,
      transparent: true,
      depthTest: false
    });
    const healthBarSprite = new THREE.Sprite(barMaterial);
    healthBarSprite.scale.set(1.4 * s, 0.35 * s, 1.0);
    healthBarSprite.position.set(0, 2.15 * s, 0);
    root.add(healthBarSprite);

    return {
      root,
      headGroup,
      head,
      torso,
      jaw,
      leftArmPivot,
      leftArm,
      rightArmPivot,
      rightArm,
      leftLegPivot,
      leftLeg,
      rightLegPivot,
      rightLeg,
      barCanvas,
      barTexture,
      healthBarSprite
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
      lastJumpAttackTime: 0,
      speedBuffEnd: 0,
      isDying: false,
      deathTimer: 0,
      groanTimer: performance.now() + Math.random() * 4000,
      walkPhase: Math.random() * Math.PI * 2,
      // Estado anatómico de desmembramiento
      limbsState: {
        hasHead: true,
        hasLeftArm: true,
        hasRightArm: true,
        hasLeftLeg: true,
        hasRightLeg: true,
        isCrawler: false,
        isBiter: false // Sin brazos -> ataque saltando a mordidas
      },
      // Ataque de salto a mordidas
      jumpAttack: {
        isJumping: false,
        jumpStartTime: 0,
        jumpDuration: 550,
        jumpOrigin: new THREE.Vector3(),
        jumpTarget: new THREE.Vector3()
      }
    };

    // Asignar referencias para detección individual de colisiones e impactos
    parts.head.userData = { isZombie: true, zombieObj, limb: 'head', isHeadshot: true };
    parts.torso.userData = { isZombie: true, zombieObj, limb: 'torso', isHeadshot: false };
    parts.leftArm.userData = { isZombie: true, zombieObj, limb: 'leftArm', isHeadshot: false };
    parts.rightArm.userData = { isZombie: true, zombieObj, limb: 'rightArm', isHeadshot: false };
    parts.leftLeg.userData = { isZombie: true, zombieObj, limb: 'leftLeg', isHeadshot: false };
    parts.rightLeg.userData = { isZombie: true, zombieObj, limb: 'rightLeg', isHeadshot: false };

    // Dibujar barra de salud inicial
    this.updateZombieHealthBar(zombieObj);

    this.zombies.push(zombieObj);
    return zombieObj;
  }

  /* ----------------------------------------------------
     ACTUALIZACIÓN VISUAL DE LA BARRA DE SALUD (BILLBOARD)
     ---------------------------------------------------- */
  updateZombieHealthBar(zombie) {
    if (!zombie.parts || !zombie.parts.barCanvas) return;
    const canvas = zombie.parts.barCanvas;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const hpRatio = Math.max(0, Math.min(1, zombie.hp / zombie.maxHp));
    const isCrawler = zombie.limbsState.isCrawler;
    const isBiter = zombie.limbsState.isBiter;

    // Fondo redondeado con borde
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = isBiter ? '#ef4444' : (isCrawler ? '#f97316' : '#38bdf8');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, 10);
    ctx.fill();
    ctx.stroke();

    // Texto de Clase / Estado
    ctx.font = 'bold 15px "Rajdhani", sans-serif';
    ctx.fillStyle = isBiter ? '#f87171' : (isCrawler ? '#fb923c' : '#38bdf8');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let tagText = `[${zombie.config.tag}] ${zombie.config.name}`;
    if (isBiter) tagText = '🦷 ¡MORDEDOR RABIOSO!';
    else if (isCrawler) tagText = '🕷️ ¡RASTRERO!';
    ctx.fillText(tagText, 14, 10);

    // Barra de Vida Track
    const barX = 14;
    const barY = 32;
    const barW = w - 28;
    const barH = 16;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    // Barra de Vida Fill
    if (hpRatio > 0) {
      let fillColor = '#22c55e'; // Verde
      if (hpRatio < 0.3) fillColor = '#ef4444'; // Rojo crítico
      else if (hpRatio < 0.6) fillColor = '#eab308'; // Amarillo alerta

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * hpRatio, barH, 4);
      ctx.fill();
    }

    // Texto numérico de salud: HP: X / Y
    ctx.font = 'bold 13px "Share Tech Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${Math.max(0, Math.round(zombie.hp))} / ${zombie.maxHp} HP`, w / 2, barY + barH / 2);
    ctx.shadowBlur = 0;

    zombie.parts.barTexture.needsUpdate = true;
  }

  /* ----------------------------------------------------
     SISTEMA DE DESMEMBRAMIENTO DINÁMICO
     ---------------------------------------------------- */
  dismemberLimb(zombie, limbName, hitPoint) {
    if (zombie.isDying) return;
    const s = zombie.config.scale;
    const spawnPos = hitPoint ? hitPoint.clone() : zombie.mesh.position.clone().add(new THREE.Vector3(0, 1.0 * s, 0));

    if (limbName === 'leftArm' && zombie.limbsState.hasLeftArm) {
      zombie.limbsState.hasLeftArm = false;
      zombie.parts.leftArm.visible = false;
      this.spawnSeveredLimb(spawnPos, 'arm', zombie.config);
      if (this.audio) this.audio.playLimbSever();
      if (!zombie.limbsState.hasRightArm) this.enterBiterMode(zombie);
    } else if (limbName === 'rightArm' && zombie.limbsState.hasRightArm) {
      zombie.limbsState.hasRightArm = false;
      zombie.parts.rightArm.visible = false;
      this.spawnSeveredLimb(spawnPos, 'arm', zombie.config);
      if (this.audio) this.audio.playLimbSever();
      if (!zombie.limbsState.hasLeftArm) this.enterBiterMode(zombie);
    } else if (limbName === 'leftLeg' && zombie.limbsState.hasLeftLeg) {
      zombie.limbsState.hasLeftLeg = false;
      zombie.parts.leftLeg.visible = false;
      this.spawnSeveredLimb(spawnPos, 'leg', zombie.config);
      if (this.audio) this.audio.playLimbSever();
      this.enterCrawlerMode(zombie);
    } else if (limbName === 'rightLeg' && zombie.limbsState.hasRightLeg) {
      zombie.limbsState.hasRightLeg = false;
      zombie.parts.rightLeg.visible = false;
      this.spawnSeveredLimb(spawnPos, 'leg', zombie.config);
      if (this.audio) this.audio.playLimbSever();
      this.enterCrawlerMode(zombie);
    }

    this.updateZombieHealthBar(zombie);
  }

  enterCrawlerMode(zombie) {
    if (zombie.limbsState.isCrawler) return;
    zombie.limbsState.isCrawler = true;
    const s = zombie.config.scale;

    // Reducir velocidad al 45% (se arrastra)
    zombie.speed = zombie.config.speed * 0.45;

    // Postura horizontal de arrastre en el suelo
    zombie.parts.torso.position.y = 0.28 * s;
    zombie.parts.torso.rotation.x = Math.PI / 2.3;

    // Cabeza erguida hacia arriba buscando morder
    zombie.parts.headGroup.position.set(0, 0.42 * s, 0.38 * s);
    zombie.parts.headGroup.rotation.x = -Math.PI / 2.6;

    // Bajar barra de salud para que quede encima del cuerpo que repta
    zombie.parts.healthBarSprite.position.set(0, 0.95 * s, 0.2 * s);
  }

  enterBiterMode(zombie) {
    if (zombie.limbsState.isBiter) return;
    zombie.limbsState.isBiter = true;
    const s = zombie.config.scale;

    // Aumento de velocidad de furia (+25%)
    zombie.speed = zombie.config.speed * 1.25;

    // Postura agresiva inclinada hacia adelante
    zombie.parts.torso.rotation.x = 0.38;
    zombie.parts.headGroup.position.z = 0.15 * s;
    zombie.parts.jaw.position.y = -0.16 * s; // Boca abierta mostrando colmillos
  }

  /* ----------------------------------------------------
     EXTREMIDADES AMPUTADAS VOLADORAS (FÍSICA DE REBOTE)
     ---------------------------------------------------- */
  spawnSeveredLimb(position, type, config) {
    const s = config.scale;
    const limbGroup = new THREE.Group();
    limbGroup.position.copy(position);

    // Malla de la extremidad amputada
    const mat = new THREE.MeshStandardMaterial({
      color: type === 'leg' ? 0x111827 : config.skinColor,
      roughness: 0.75
    });
    const geo = type === 'leg'
      ? new THREE.BoxGeometry(0.14 * s, 0.65 * s, 0.14 * s)
      : new THREE.BoxGeometry(0.12 * s, 0.55 * s, 0.12 * s);
    const limbMesh = new THREE.Mesh(geo, mat);
    limbMesh.castShadow = true;
    limbGroup.add(limbMesh);

    // Hueso y muñón sangriento
    const boneGeo = new THREE.CylinderGeometry(0.04 * s, 0.04 * s, 0.15 * s, 8);
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const bone = new THREE.Mesh(boneGeo, boneMat);
    bone.position.y = 0.32 * s;
    limbGroup.add(bone);

    const bloodGeo = new THREE.SphereGeometry(0.09 * s, 8, 8);
    const bloodMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.3 });
    const blood = new THREE.Mesh(bloodGeo, bloodMat);
    blood.position.y = 0.28 * s;
    limbGroup.add(blood);

    this.scene.add(limbGroup);

    // Impulso físico aleatorio
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 5.0,
      Math.random() * 4.0 + 2.0,
      (Math.random() - 0.5) * 5.0
    );
    const rotVel = new THREE.Vector3(
      (Math.random() - 0.5) * 12.0,
      (Math.random() - 0.5) * 12.0,
      (Math.random() - 0.5) * 12.0
    );

    this.severedLimbs.push({
      mesh: limbGroup,
      velocity: vel,
      rotVelocity: rotVel,
      spawnTime: performance.now()
    });
  }

  /* ----------------------------------------------------
     DAÑO RECIBIDO POR UN ZOMBI (SEGURO Y SIN NULOS)
     ---------------------------------------------------- */
  damageZombie(zombie, damage, isHeadshot = false, hitPoint = null, limbName = null, weapon = null) {
    if (zombie.isDying) return false;

    // Multiplicador de tiro a la cabeza blindado contra nulos
    const headshotMult = (weapon && weapon.headshotMult) || zombie.config.headshotMult || 2.2;
    const baseDamage = Number(damage) || 35;
    const actualDamage = isHeadshot ? Math.round(baseDamage * headshotMult) : Math.round(baseDamage);

    zombie.hp = Math.max(0, zombie.hp - actualDamage);

    // Desmembrar extremidad si impactó directamente en brazo o pierna
    if (limbName && ['leftArm', 'rightArm', 'leftLeg', 'rightLeg'].includes(limbName)) {
      this.dismemberLimb(zombie, limbName, hitPoint);
    }

    // Flash blanco de impacto
    if (zombie.parts.torso && zombie.parts.torso.material) {
      zombie.parts.torso.material.color.setHex(0xffffff);
      setTimeout(() => {
        if (zombie.parts && zombie.parts.torso && zombie.parts.torso.material) {
          zombie.parts.torso.material.color.setHex(zombie.config.clothColor);
        }
      }, 70);
    }

    // Actualizar barra de vida en billboard
    this.updateZombieHealthBar(zombie);

    // Texto flotante de daño numérico
    const damagePos = hitPoint ? hitPoint.clone() : zombie.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    this.spawnDamageNumber(damagePos, actualDamage, isHeadshot);

    // Partículas de sangre
    if (hitPoint) {
      this.spawnBloodParticles(hitPoint, isHeadshot);
    }

    // Comprobar muerte
    if (zombie.hp <= 0) {
      this.killZombie(zombie, isHeadshot);
      return { killed: true, score: zombie.config.score, isHeadshot };
    }

    return { killed: false, score: 20, isHeadshot };
  }

  killZombie(zombie, isHeadshot) {
    zombie.isDying = true;
    zombie.deathTimer = performance.now();

    // Si murió por headshot, decapitar o explotar cabeza
    if (isHeadshot && zombie.parts.headGroup) {
      zombie.parts.headGroup.visible = false;
      const headPos = zombie.mesh.position.clone().add(new THREE.Vector3(0, 1.55 * zombie.config.scale, 0));
      this.spawnBloodParticles(headPos, true);
      this.spawnSeveredLimb(headPos, 'arm', zombie.config);
    }

    // Ocultar barra de salud en la muerte
    if (zombie.parts.healthBarSprite) {
      zombie.parts.healthBarSprite.visible = false;
    }

    // Probabilidad de tirar drop de arma o botiquín
    if (Math.random() < zombie.config.dropRate) {
      const dropPos = zombie.mesh.position.clone();
      this.weaponManager.spawnDrop(this.scene, dropPos, zombie.config.id === 'tank' ? 'plasma' : null);
    }
  }

  /* ----------------------------------------------------
     PARTÍCULAS Y TEXTOS DE DAÑO
     ---------------------------------------------------- */
  spawnBloodParticles(position, isHeadshot) {
    const pCount = isHeadshot ? 24 : 14;
    const pGeo = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < pCount; i++) {
      positions.push(position.x, position.y, position.z);
      velocities.push(
        (Math.random() - 0.5) * 4.5,
        Math.random() * 3.5 + 1.2,
        (Math.random() - 0.5) * 4.5
      );
    }

    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x991b1b,
      size: isHeadshot ? 0.09 : 0.06,
      transparent: true,
      opacity: 0.95
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

  spawnDamageNumber(position, damage, isHeadshot) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = isHeadshot ? '#ef4444' : '#facc15';
    ctx.font = `bold ${isHeadshot ? '36px' : '28px'} "Orbitron", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 5;
    ctx.fillText(`${damage}${isHeadshot ? '!' : ''}`, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(isHeadshot ? 0.85 : 0.65, isHeadshot ? 0.45 : 0.35, 1);
    sprite.position.copy(position);
    sprite.position.y += 0.3;
    this.scene.add(sprite);

    this.damageTexts.push({
      sprite,
      spawnTime: performance.now()
    });
  }

  /* ----------------------------------------------------
     HABILIDADES ESPECIALES: SPITTER Y SCREAMER
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

  triggerScreamerWail(screamer) {
    if (this.audio) this.audio.playZombieGroan('screamer');

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

    const now = performance.now();
    this.zombies.forEach(z => {
      if (z.mesh.position.distanceTo(screamer.mesh.position) < 14) {
        z.speedBuffEnd = now + 6000;
      }
    });

    const spawnOffsets = [-2.5, 2.5];
    spawnOffsets.forEach(ox => {
      const sp = screamer.mesh.position.clone();
      sp.x += ox;
      sp.z += (Math.random() - 0.5) * 2;
      this.spawnZombie('runner', sp);
    });
  }

  /* ----------------------------------------------------
     BUCLE DE FÍSICA, ANIMACIÓN Y COMPORTAMIENTO
     ---------------------------------------------------- */
  update(now, delta, playerPos, playerStats, camera) {
    // 0. Textos flotantes de daño
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dt = this.damageTexts[i];
      const age = (now - dt.spawnTime) / 1000;
      if (age > 0.75) {
        this.scene.remove(dt.sprite);
        this.damageTexts.splice(i, 1);
        continue;
      }
      dt.sprite.position.y += delta * 1.3;
      dt.sprite.material.opacity = Math.max(0, 1 - (age / 0.75));
    }

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
        dp.velocities[j * 3 + 1] -= 9.8 * delta;
        pArr[j * 3 + 2] += dp.velocities[j * 3 + 2] * delta;
      }
      dp.pGeo.attributes.position.needsUpdate = true;
      dp.system.material.opacity = 1 - (age / 0.8);
    }

    // 2. Físicas de extremidades amputadas voladoras
    for (let i = this.severedLimbs.length - 1; i >= 0; i--) {
      const limb = this.severedLimbs[i];
      const age = (now - limb.spawnTime) / 1000;
      if (age > 25) {
        this.scene.remove(limb.mesh);
        this.severedLimbs.splice(i, 1);
        continue;
      }

      if (limb.mesh.position.y > 0.08) {
        limb.mesh.position.addScaledVector(limb.velocity, delta);
        limb.velocity.y -= 14.0 * delta; // Gravedad
        limb.mesh.rotation.x += limb.rotVelocity.x * delta;
        limb.mesh.rotation.y += limb.rotVelocity.y * delta;
        limb.mesh.rotation.z += limb.rotVelocity.z * delta;

        if (limb.mesh.position.y <= 0.08) {
          limb.mesh.position.y = 0.08;
          limb.velocity.y *= -0.3; // Rebote
          limb.velocity.x *= 0.5;
          limb.velocity.z *= 0.5;
          limb.rotVelocity.multiplyScalar(0.2);
        }
      }
    }

    // 3. Proyectiles ácidos
    for (let i = this.acidProjectiles.length - 1; i >= 0; i--) {
      const proj = this.acidProjectiles[i];
      proj.mesh.position.addScaledVector(proj.velocity, delta);

      if (proj.mesh.position.distanceTo(playerPos) < 1.3) {
        playerStats.health -= proj.damage;
        if (this.audio) this.audio.playPlayerHurt();
        this.scene.remove(proj.mesh);
        this.acidProjectiles.splice(i, 1);
        continue;
      }

      if (proj.mesh.position.y <= 0.1 || now - proj.spawnTime > 3000) {
        this.scene.remove(proj.mesh);
        this.acidProjectiles.splice(i, 1);
      }
    }

    // 4. IA, Desmembramiento, Rastreros y Ataques de Mordida Saltando
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

      // Sonido aleatorio de gruñido
      if (now >= z.groanTimer) {
        const distToPlayer = z.mesh.position.distanceTo(playerPos);
        if (distToPlayer < 16 && this.audio) {
          this.audio.playZombieGroan(z.type);
        }
        z.groanTimer = now + 4000 + Math.random() * 5000;
      }

      // Distancia horizontal al jugador
      const toPlayer = new THREE.Vector3().subVectors(playerPos, z.mesh.position);
      toPlayer.y = 0;
      const distance = toPlayer.length();

      // Orientación hacia el jugador (solo eje Y)
      z.mesh.lookAt(playerPos.x, z.mesh.position.y, playerPos.z);

      // Velocidad actual con buffs
      let currentSpeed = z.speed;
      if (now < z.speedBuffEnd) currentSpeed *= 1.38;

      // Animación continua de mandíbula para mordedor
      if (z.limbsState.isBiter && z.parts.jaw) {
        z.parts.jaw.position.y = -0.12 - Math.abs(Math.sin(now * 0.015)) * 0.08;
      }

      // ========================================================
      // MODO MORDEDOR FURÍSIMO: ¡ATAQUE SALTANDO A MORDIDAS!
      // ========================================================
      if (z.limbsState.isBiter) {
        // Si está a distancia de salto (entre 1.8m y 4.0m) y no está saltando
        if (distance <= 4.0 && !z.jumpAttack.isJumping && now - z.lastJumpAttackTime > 2200) {
          z.jumpAttack.isJumping = true;
          z.jumpAttack.jumpStartTime = now;
          z.jumpAttack.jumpOrigin.copy(z.mesh.position);
          z.jumpAttack.jumpTarget.copy(playerPos);
          z.lastJumpAttackTime = now;
          if (this.audio) this.audio.playBiteAttack();
        }

        // Si está en el aire ejecutando el salto con mordida
        if (z.jumpAttack.isJumping) {
          const jumpProgress = (now - z.jumpAttack.jumpStartTime) / z.jumpAttack.jumpDuration;

          if (jumpProgress < 1.0) {
            // Desplazamiento horizontal acelerado
            z.mesh.position.lerpVectors(z.jumpAttack.jumpOrigin, z.jumpAttack.jumpTarget, jumpProgress);
            // Arco parabólico vertical del salto (hasta 1.6m de alto)
            z.mesh.position.y = z.jumpAttack.jumpOrigin.y + Math.sin(jumpProgress * Math.PI) * 1.5;

            // Daño por mordida si impacta al jugador durante el salto
            if (z.mesh.position.distanceTo(playerPos) < 1.4 && now - z.lastAttackTime > 600) {
              z.lastAttackTime = now;
              playerStats.health -= z.damage * 1.3;
              if (this.audio) {
                this.audio.playBiteAttack();
                this.audio.playPlayerHurt();
              }
            }
            continue; // Durante el salto se maneja la física del arco
          } else {
            // Fin del salto
            z.jumpAttack.isJumping = false;
            z.mesh.position.y = 0;
          }
        }
      }

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

      // Ataque cuerpo a cuerpo a corta distancia
      if (distance <= z.config.attackRange) {
        if (now - z.lastAttackTime > z.config.attackRate) {
          z.lastAttackTime = now;
          playerStats.health -= z.damage;

          if (this.audio) {
            if (z.limbsState.isBiter) this.audio.playBiteAttack();
            this.audio.playPlayerHurt();
            if (z.type === 'tank') this.audio.playTankStomp();
          }

          // Animación de ataque (mordida si no hay brazos, zarpazo si los tiene)
          if (!z.limbsState.isBiter) {
            if (z.parts.leftArmPivot) z.parts.leftArmPivot.rotation.x = -Math.PI / 1.6;
            if (z.parts.rightArmPivot) z.parts.rightArmPivot.rotation.x = -Math.PI / 1.6;
            setTimeout(() => {
              if (z.parts && !z.isDying) {
                if (z.parts.leftArmPivot) z.parts.leftArmPivot.rotation.x = -Math.PI / 2.3;
                if (z.parts.rightArmPivot) z.parts.rightArmPivot.rotation.x = -Math.PI / 2.3;
              }
            }, 240);
          }
        }
      } else {
        // Desplazamiento hacia el jugador
        toPlayer.normalize();
        z.mesh.position.addScaledVector(toPlayer, currentSpeed * delta);

        z.walkPhase += delta * currentSpeed * 4.2;

        if (z.limbsState.isCrawler) {
          // ========================================================
          // MODO RASTRERO (CRAWLER): Animación de arrastre en el piso
          // ========================================================
          const crawlSwing = Math.sin(z.walkPhase * 1.3) * 0.4;
          if (z.limbsState.hasLeftArm && z.parts.leftArmPivot) {
            z.parts.leftArmPivot.rotation.x = -Math.PI / 3 + crawlSwing;
          }
          if (z.limbsState.hasRightArm && z.parts.rightArmPivot) {
            z.parts.rightArmPivot.rotation.x = -Math.PI / 3 - crawlSwing;
          }
          z.mesh.position.y = 0.05 + Math.abs(Math.sin(z.walkPhase)) * 0.06;
        } else {
          // Caminata estándar si tiene piernas
          const stride = Math.sin(z.walkPhase) * 0.45;
          if (z.limbsState.hasLeftLeg && z.parts.leftLegPivot) z.parts.leftLegPivot.rotation.x = stride;
          if (z.limbsState.hasRightLeg && z.parts.rightLegPivot) z.parts.rightLegPivot.rotation.x = -stride;
          if (z.limbsState.hasLeftArm && z.parts.leftArmPivot) z.parts.leftArmPivot.rotation.z = Math.cos(z.walkPhase) * 0.12;
          if (z.limbsState.hasRightArm && z.parts.rightArmPivot) z.parts.rightArmPivot.rotation.z = -Math.cos(z.walkPhase) * 0.12;
        }

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
    this.damageTexts.forEach(dt => this.scene.remove(dt.sprite));
    this.damageTexts = [];
    this.severedLimbs.forEach(l => this.scene.remove(l.mesh));
    this.severedLimbs = [];
  }
}
