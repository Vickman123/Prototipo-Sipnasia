/**
 * SIPNASIA XR - Entorno 3D Ampliado del Salón de Clases (School Classroom)
 * Diseñado con Three.js procedural con gran amplitud, espacio para combate,
 * pasillos anchos, pizarrón panorámico, pupitres, casilleros y ventanales con tormenta.
 */

import * as THREE from 'three';

export class ClassroomEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.flickerLight = null;
    this.flickerTimer = 0;
    this.lightningLight = null;
    this.lightningTimer = 0;
    this.clockHand = null;
    this.obstacles = []; // Objetos con colisión táctica
    this.lightShafts = []; // Haces de luz volumétricos (God Rays)

    this.buildClassroom();
  }

  buildClassroom() {
    // Dimensiones ampliadas tipo Aula Magna / Salón de Conferencias Universitario
    const W = 26;  // Ancho (X: -13 a +13)
    const D = 24;  // Profundidad (Z: -12 a +12)
    const H = 5.2; // Altura (Y: 0 a 5.2)

    // 1. SUELO: Linóleo / Madera de Salón Escolar con acabado pulido reflectivo
    const floorTexture = this.createFloorTexture();
    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.12
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. TECHO: Paneles acústicos escolares claros
    const ceilingGeo = new THREE.PlaneGeometry(W, D);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = H;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // 3. PAREDES DE DOS TONOS (Crema marfil arriba, moldura de madera, zócalo azul UNAM abajo)
    const wallTexture = this.createWallTexture();
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.6,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Pared Frontal (Z = -D/2)
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    frontWall.position.set(0, H / 2, -D / 2);
    this.scene.add(frontWall);

    // Pared Trasera (Z = +D/2)
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    backWall.position.set(0, H / 2, D / 2);
    backWall.rotation.y = Math.PI;
    this.scene.add(backWall);

    // Pared Izquierda (X = -W/2 - Con Ventanales)
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    leftWall.position.set(-W / 2, H / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.scene.add(leftWall);

    // Pared Derecha (X = +W/2 - Puerta del Pasillo)
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    rightWall.position.set(W / 2, H / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.scene.add(rightWall);

    // 4. GRAN PIZARRÓN ESCOLAR VERDE (Frente)
    this.buildBlackboard(D);

    // 5. ESCRITORIO DEL PROFESOR Y COMPUTADORA PC PUMA
    this.buildTeacherDesk(D);

    // 6. PUPITRES Y SILLAS DE ESTUDIANTES (Distribuidos con pasillos amplios)
    this.buildStudentDesks();

    // 7. VENTANALES Y NOCHE CON TORMENTA (Pared Izquierda)
    this.buildWindows(W);

    // 8. CASILLEROS ESCOLARES Y PUERTA BARRICADA (Pared Trasera)
    this.buildLockersAndBackdoor(D);

    // 9. RELOJ DE PARED ESCOLAR CON SEGUNDERO
    this.buildWallClock(D);

    // 10. ILUMINACIÓN FLUORESCENTE ATMOSFÉRICA
    this.setupLighting(W, D, H);
  }

  createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Parte superior: Pared marfil / crema institucional luminosa
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 512, 340);

    // Moldura de madera divisoria de guardapolvo
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 334, 512, 12);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 336, 512, 4);

    // Parte inferior: Zócalo institucional azul pizarra UNAM
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 346, 512, 166);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(5, 1);
    return texture;
  }

  createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Tablones de madera de roble barnizada en tono cálido luminoso
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    for (let y = 0; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    for (let x = 0; x < 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Veteado de madera realista
    ctx.fillStyle = 'rgba(146, 64, 14, 0.4)';
    for (let i = 0; i < 16; i++) {
      ctx.fillRect(0, i * 32 + 6, 512, 8);
    }

    // Manchas oscuras sutiles de tensión
    ctx.fillStyle = 'rgba(70, 10, 10, 0.45)';
    ctx.beginPath();
    ctx.arc(140, 260, 45, 0, Math.PI * 2);
    ctx.arc(380, 120, 30, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 11);
    return texture;
  }

  /* ----------------------------------------------------
     PIZARRÓN ESCOLAR PANORÁMICO
     ---------------------------------------------------- */
  buildBlackboard(roomDepth) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Verde pizarra clásico
    ctx.fillStyle = '#1e382b';
    ctx.fillRect(0, 0, 1280, 512);

    // Tizas y fórmulas
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 40px "Rajdhani", sans-serif';
    ctx.fillText('FACULTAD // PC PUMA UNAM // AULA MAGNA', 80, 75);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 56px "Orbitron", sans-serif';
    ctx.fillText('EXAMEN FINAL: SOBREVIVIR AL BROTE', 80, 155);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '28px "Share Tech Mono", monospace';
    ctx.fillText('• REGLA 1: Apunta a la cabeza para tiros críticos (x2.5 daño)', 80, 230);
    ctx.fillText('• REGLA 2: Recoge armas arrojadas por los zombis caídos (Drops con haz de luz)', 80, 280);
    ctx.fillText('• REGLA 3: Mantén distancia de los Químicos y Titanes pesados', 80, 330);
    ctx.fillText('• REGLA 4: Si escuchas un grito, prepárate para correr y esquivar', 80, 380);

    // Fórmulas matemáticas en esquina
    ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.font = '24px monospace';
    ctx.fillText('E = mc²   |   ∇ × B = μ₀J   |   SOBREVIVENCIA = 100%', 80, 455);

    // Manchas de borrador de tiza
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 25; i++) {
      ctx.fillRect(Math.random() * 1100, Math.random() * 450, 160, 45);
    }

    const boardTexture = new THREE.CanvasTexture(canvas);
    const boardGeo = new THREE.PlaneGeometry(10.5, 3.2);
    const boardMat = new THREE.MeshStandardMaterial({
      map: boardTexture,
      roughness: 0.85
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 2.6, -roomDepth / 2 + 0.03);
    this.scene.add(board);

    // Marco de madera del pizarrón
    const frameGeo = new THREE.BoxGeometry(10.7, 3.35, 0.06);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 2.6, -roomDepth / 2 + 0.01);
    this.scene.add(frame);

    // Repisa de tizas con borrador
    const trayGeo = new THREE.BoxGeometry(10.2, 0.04, 0.16);
    const tray = new THREE.Mesh(trayGeo, frameMat);
    tray.position.set(0, 0.95, -roomDepth / 2 + 0.08);
    this.scene.add(tray);
  }

  /* ----------------------------------------------------
     ESCRITORIO DEL PROFESOR
     ---------------------------------------------------- */
  buildTeacherDesk(roomDepth) {
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0, -roomDepth / 2 + 2.8);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.5 });
    const topGeo = new THREE.BoxGeometry(2.6, 0.08, 1.2);
    const top = new THREE.Mesh(topGeo, woodMat);
    top.position.y = 0.85;
    deskGroup.add(top);

    // Patas
    const legGeo = new THREE.BoxGeometry(0.08, 0.85, 0.08);
    const l1 = new THREE.Mesh(legGeo, woodMat); l1.position.set(-1.2, 0.425, -0.5);
    const l2 = new THREE.Mesh(legGeo, woodMat); l2.position.set(1.2, 0.425, -0.5);
    const l3 = new THREE.Mesh(legGeo, woodMat); l3.position.set(-1.2, 0.425, 0.5);
    const l4 = new THREE.Mesh(legGeo, woodMat); l4.position.set(1.2, 0.425, 0.5);
    deskGroup.add(l1, l2, l3, l4);

    // Laptop PC PUMA UNAM en el escritorio
    const laptopBaseGeo = new THREE.BoxGeometry(0.38, 0.015, 0.28);
    const laptopMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopMat);
    laptopBase.position.set(-0.4, 0.9, 0);
    deskGroup.add(laptopBase);

    const laptopScreenGeo = new THREE.BoxGeometry(0.38, 0.26, 0.015);
    const laptopScreenMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const laptopScreen = new THREE.Mesh(laptopScreenGeo, laptopScreenMat);
    laptopScreen.position.set(-0.4, 1.04, -0.13);
    laptopScreen.rotation.x = -0.2;
    deskGroup.add(laptopScreen);

    // Pila de libros / exámenes
    const bookGeo = new THREE.BoxGeometry(0.26, 0.12, 0.2);
    const bookMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
    const book = new THREE.Mesh(bookGeo, bookMat);
    book.position.set(0.6, 0.94, 0.1);
    book.rotation.y = 0.3;
    deskGroup.add(book);

    this.scene.add(deskGroup);
    this.obstacles.push(deskGroup);
  }

  /* ----------------------------------------------------
     PUPITRES Y SILLAS DE ESTUDIANTES (CON PASILLO CENTRAL AMPLIO)
     ---------------------------------------------------- */
  buildStudentDesks() {
    const deskMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });

    const rows = 4;
    const cols = 4;
    const spacingX = 4.2;
    const spacingZ = 2.6;
    const startX = -6.8;
    const startZ = -5.0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const deskGroup = new THREE.Group();
        // Abrir un pasillo central de 3.2m entre c=1 y c=2
        let posX = startX + c * spacingX;
        if (c >= 2) posX += 1.4;
        const posZ = startZ + r * spacingZ;

        // Algunos pupitres volcados por el caos
        const isFlipped = (r === 1 && c === 1) || (r === 2 && c === 3);

        const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.7), deskMat);
        tableTop.position.y = 0.74;
        deskGroup.add(tableTop);

        // Patas metálicas
        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.74, 8);
        const leg1 = new THREE.Mesh(legGeo, metalMat); leg1.position.set(-0.58, 0.37, -0.28);
        const leg2 = new THREE.Mesh(legGeo, metalMat); leg2.position.set(0.58, 0.37, -0.28);
        const leg3 = new THREE.Mesh(legGeo, metalMat); leg3.position.set(-0.58, 0.37, 0.28);
        const leg4 = new THREE.Mesh(legGeo, metalMat); leg4.position.set(0.58, 0.37, 0.28);
        deskGroup.add(leg1, leg2, leg3, leg4);

        // Silla adjunta
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.46), deskMat);
        seat.position.set(0, 0.45, 0.6);
        deskGroup.add(seat);

        const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.03), deskMat);
        backrest.position.set(0, 0.72, 0.82);
        deskGroup.add(backrest);

        if (isFlipped) {
          deskGroup.rotation.z = Math.PI / 2.2;
          deskGroup.rotation.y = 0.35;
          deskGroup.position.set(posX, 0.15, posZ);
        } else {
          deskGroup.position.set(posX, 0, posZ);
        }

        this.scene.add(deskGroup);
        this.obstacles.push(deskGroup);
      }
    }
  }

  /* ----------------------------------------------------
     VENTANALES Y NOCHE CON TORMENTA (PARED IZQUIERDA)
     ---------------------------------------------------- */
  buildWindows(roomWidth) {
    const winGroup = new THREE.Group();
    winGroup.position.set(-roomWidth / 2 + 0.04, 2.6, 0);
    winGroup.rotation.y = Math.PI / 2;

    const glassMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.24
    });

    // 5 Ventanales altos a lo largo de la pared
    const windowOffsets = [-8, -4, 0, 4, 8];
    windowOffsets.forEach(posZ => {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.6), glassMat);
      pane.position.set(posZ, 0, 0);
      winGroup.add(pane);

      // Marco
      const frame = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(3.0, 2.6, 0.05)),
        new THREE.LineBasicMaterial({ color: 0x334155 })
      );
      frame.position.set(posZ, 0, 0);
      winGroup.add(frame);

      // Haz de luz volumétrica (God Ray / Raytraced Shaft) entrando por la ventana
      const shaftGeo = new THREE.CylinderGeometry(0.8, 3.2, 11, 12, 1, true);
      const shaftMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(-roomWidth / 2 + 3.8, 2.1, posZ);
      shaft.rotation.z = Math.PI / 3.4;
      this.scene.add(shaft);
      this.lightShafts.push(shaft);
    });

    this.scene.add(winGroup);

    // Luz de relámpago exterior
    this.lightningLight = new THREE.DirectionalLight(0x93c5fd, 0);
    this.lightningLight.position.set(-20, 8, 0);
    this.scene.add(this.lightningLight);
  }

  /* ----------------------------------------------------
     CASILLEROS ESCOLARES Y PUERTA BARRICADA (PARED TRASERA)
     ---------------------------------------------------- */
  buildLockersAndBackdoor(roomDepth) {
    const lockerMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.35
    });

    // Casilleros a la izquierda y derecha de la pared trasera
    const lockerGeo = new THREE.BoxGeometry(3.6, 2.6, 0.6);
    const lockersLeft = new THREE.Mesh(lockerGeo, lockerMat);
    lockersLeft.position.set(-7.5, 1.3, roomDepth / 2 - 0.35);
    this.scene.add(lockersLeft);

    const lockersRight = new THREE.Mesh(lockerGeo, lockerMat);
    lockersRight.position.set(7.5, 1.3, roomDepth / 2 - 0.35);
    this.scene.add(lockersRight);

    // Puerta de salida barricada al fondo de la pared trasera
    const doorGeo = new THREE.BoxGeometry(1.6, 2.8, 0.06);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.4, roomDepth / 2 - 0.04);
    this.scene.add(door);

    // Letrero de SALIDA DE EMERGENCIA BLOQUEADA
    const signGeo = new THREE.BoxGeometry(1.1, 0.32, 0.03);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.7, roomDepth / 2 - 0.02);
    this.scene.add(sign);

    // Tablas de madera cruzadas sobre la puerta
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 0.04), plankMat);
    p1.position.set(0, 1.5, roomDepth / 2 - 0.01);
    p1.rotation.z = 0.35;
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 0.04), plankMat);
    p2.position.set(0, 1.25, roomDepth / 2 - 0.01);
    p2.rotation.z = -0.35;
    this.scene.add(p1, p2);
  }

  /* ----------------------------------------------------
     RELOJ DE PARED ESCOLAR
     ---------------------------------------------------- */
  buildWallClock(roomDepth) {
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 4.4, -roomDepth / 2 + 0.05);

    const faceGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.04, 24);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.rotation.x = Math.PI / 2;
    clockGroup.add(face);

    // Borde negro
    const rimGeo = new THREE.TorusGeometry(0.42, 0.03, 8, 24);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    clockGroup.add(rim);

    // Segundero rojo
    const handGeo = new THREE.BoxGeometry(0.014, 0.26, 0.01);
    const handMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.clockHand = new THREE.Mesh(handGeo, handMat);
    this.clockHand.position.set(0, 0.1, 0.025);
    clockGroup.add(this.clockHand);

    this.scene.add(clockGroup);
  }

  /* ----------------------------------------------------
     ILUMINACIÓN FLUORESCENTE Y SOMBRAS SUAVES
     ---------------------------------------------------- */
  setupLighting(W, D, H) {
    // 1. Luz Hemisférica para relleno natural cielo/suelo realista
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 1.8);
    this.scene.add(hemiLight);

    // 2. Luz Ambiental clara
    const ambient = new THREE.AmbientLight(0xf8fafc, 1.3);
    this.scene.add(ambient);

    // 3. Luz directiva desde los ventanales con tono azul luna tenue
    const windowDirLight = new THREE.DirectionalLight(0x7dd3fc, 1.6);
    windowDirLight.position.set(-11, 4.2, 0);
    windowDirLight.target.position.set(0, 1.2, 0);
    this.scene.add(windowDirLight);
    this.scene.add(windowDirLight.target);

    // 4. Lámparas fluorescentes físicas 3D en el techo con PointLight potente
    const lampPositions = [
      [-6, H - 0.25, -6],
      [6, H - 0.25, -6],
      [-6, H - 0.25, 0],
      [6, H - 0.25, 0],
      [-6, H - 0.25, 6],
      [6, H - 0.25, 6]
    ];

    const fixtureBodyGeo = new THREE.BoxGeometry(2.4, 0.08, 0.6);
    const fixtureBodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const tubePanelGeo = new THREE.PlaneGeometry(2.2, 0.45);
    const tubePanelMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf1f5f9,
      emissiveIntensity: 2.5,
      roughness: 0.1
    });

    lampPositions.forEach((pos, idx) => {
      // Estructura 3D visible de la lámpara en el techo
      const lampMesh = new THREE.Group();
      lampMesh.position.set(pos[0], pos[1], pos[2]);

      const casing = new THREE.Mesh(fixtureBodyGeo, fixtureBodyMat);
      lampMesh.add(casing);

      const panel = new THREE.Mesh(tubePanelGeo, tubePanelMat);
      panel.rotation.x = Math.PI / 2;
      panel.position.y = -0.042;
      lampMesh.add(panel);

      this.scene.add(lampMesh);

      // Fuente de luz fluorescente
      const tubeLight = new THREE.PointLight(0xf8fafc, 9.0, 24, 1.1);
      tubeLight.position.set(pos[0], pos[1] - 0.2, pos[2]);
      if (idx === 2 || idx === 3) {
        tubeLight.castShadow = true;
        tubeLight.shadow.bias = -0.001;
      }
      this.scene.add(tubeLight);

      // Una de las lámparas parpadea ligeramente
      if (idx === 3) {
        this.flickerLight = tubeLight;
      }
    });
  }

  update(delta, now) {
    // Parpadeo ominoso de lámpara fluorescente
    if (this.flickerLight) {
      if (Math.random() < 0.12) {
        this.flickerLight.intensity = Math.random() < 0.3 ? 0.3 : (1.8 + Math.random() * 1.2);
      }
    }

    // Relámpagos periódicos en la tormenta exterior y pulso de God Rays
    if (now >= this.lightningTimer) {
      if (Math.random() < 0.08) {
        this.lightningLight.intensity = 5.5;
        this.lightShafts.forEach(s => { s.material.opacity = 0.38; });

        setTimeout(() => {
          if (this.lightningLight) this.lightningLight.intensity = 0.8;
          setTimeout(() => {
            if (this.lightningLight) this.lightningLight.intensity = 4.5;
            this.lightShafts.forEach(s => { s.material.opacity = 0.45; });

            setTimeout(() => {
              if (this.lightningLight) this.lightningLight.intensity = 0;
              this.lightShafts.forEach(s => { s.material.opacity = 0.08; });
            }, 60);
          }, 80);
        }, 50);
        this.lightningTimer = now + 12000 + Math.random() * 14000;
      }
    }

    // Segundero del reloj escolar
    if (this.clockHand) {
      this.clockHand.rotation.z = -now * 0.003;
    }
  }
}
