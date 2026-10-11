/**
 * SIPNASIA XR - Entorno 3D del Salón de Clases (School Classroom)
 * Diseñado con Three.js procedural para máximo rendimiento en Meta Quest y PC.
 * Incluye pizarrón con tiza, pupitres volcados, casilleros, escritorio del profesor,
 * ventanales con tormenta exterior, relámpagos y luces fluorescentes parpadeantes.
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

    this.buildClassroom();
  }

  buildClassroom() {
    const W = 16;  // Ancho (X: -8 a +8)
    const D = 13;  // Profundidad (Z: -6.5 a +6.5)
    const H = 4.2; // Altura (Y: 0 a 4.2)

    // 1. SUELO: Linóleo / Madera de Salón Escolar con textura procedural
    const floorTexture = this.createFloorTexture();
    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.65,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. TECHO: Paneles acústicos escolares
    const ceilingGeo = new THREE.PlaneGeometry(W, D);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = H;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // 3. PAREDES DE DOS TONOS (Crema arriba, Verde institucional abajo)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85
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

    // 6. PUPITRES Y SILLAS DE ESTUDIANTES (Algunos volcados para cobertura táctica)
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

  createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Tablones de madera desgastados
    ctx.fillStyle = '#3a2e22';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#241b12';
    ctx.lineWidth = 2;
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

    // Manchas oscuras y arañazos de horror
    ctx.fillStyle = 'rgba(70, 10, 10, 0.35)';
    ctx.beginPath();
    ctx.arc(140, 260, 45, 0, Math.PI * 2);
    ctx.arc(380, 120, 30, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 5);
    return texture;
  }

  /* ----------------------------------------------------
     PIZARRÓN ESCOLAR
     ---------------------------------------------------- */
  buildBlackboard(roomDepth) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Verde pizarra clásico
    ctx.fillStyle = '#1e382b';
    ctx.fillRect(0, 0, 1024, 512);

    // Tizas y fórmulas
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px "Rajdhani", sans-serif';
    ctx.fillText('FACULTAD // PC PUMA UNAM', 60, 70);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 52px "Orbitron", sans-serif';
    ctx.fillText('EXAMEN FINAL: SOBREVIVIR', 60, 150);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '28px "Share Tech Mono", monospace';
    ctx.fillText('• REGLA 1: Apunta a la cabeza para daño crítico (x2.5)', 60, 220);
    ctx.fillText('• REGLA 2: Recoge armas arrojadas por los zombis caídos', 60, 265);
    ctx.fillText('• REGLA 3: Mantén distancia de los Químicos y Titanes', 60, 310);
    ctx.fillText('• REGLA 4: Si escuchas un grito, prepárate para correr', 60, 355);

    // Fórmulas matemáticas en esquina
    ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.font = '24px monospace';
    ctx.fillText('E = mc²   |   ∇ × B = μ₀J   |   HP = 0 => GAME OVER', 60, 430);

    // Manchas de borrador de tiza
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect(Math.random() * 900, Math.random() * 450, 150, 40);
    }

    const boardTexture = new THREE.CanvasTexture(canvas);
    const boardGeo = new THREE.PlaneGeometry(7.2, 2.6);
    const boardMat = new THREE.MeshStandardMaterial({
      map: boardTexture,
      roughness: 0.85
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 2.1, -roomDepth / 2 + 0.03);
    this.scene.add(board);

    // Marco de madera del pizarrón
    const frameGeo = new THREE.BoxGeometry(7.4, 2.75, 0.06);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 2.1, -roomDepth / 2 + 0.01);
    this.scene.add(frame);

    // Repisa de tizas con borrador
    const trayGeo = new THREE.BoxGeometry(7.0, 0.04, 0.14);
    const tray = new THREE.Mesh(trayGeo, frameMat);
    tray.position.set(0, 0.72, -roomDepth / 2 + 0.08);
    this.scene.add(tray);
  }

  /* ----------------------------------------------------
     ESCRITORIO DEL PROFESOR
     ---------------------------------------------------- */
  buildTeacherDesk(roomDepth) {
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0, -roomDepth / 2 + 1.8);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.5 });
    const topGeo = new THREE.BoxGeometry(2.2, 0.08, 1.1);
    const top = new THREE.Mesh(topGeo, woodMat);
    top.position.y = 0.85;
    deskGroup.add(top);

    // Patas
    const legGeo = new THREE.BoxGeometry(0.08, 0.85, 0.08);
    const l1 = new THREE.Mesh(legGeo, woodMat); l1.position.set(-1.0, 0.425, -0.45);
    const l2 = new THREE.Mesh(legGeo, woodMat); l2.position.set(1.0, 0.425, -0.45);
    const l3 = new THREE.Mesh(legGeo, woodMat); l3.position.set(-1.0, 0.425, 0.45);
    const l4 = new THREE.Mesh(legGeo, woodMat); l4.position.set(1.0, 0.425, 0.45);
    deskGroup.add(l1, l2, l3, l4);

    // Laptop PC PUMA UNAM en el escritorio
    const laptopBaseGeo = new THREE.BoxGeometry(0.36, 0.015, 0.26);
    const laptopMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopMat);
    laptopBase.position.set(-0.35, 0.9, 0);
    deskGroup.add(laptopBase);

    const laptopScreenGeo = new THREE.BoxGeometry(0.36, 0.24, 0.015);
    const laptopScreenMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const laptopScreen = new THREE.Mesh(laptopScreenGeo, laptopScreenMat);
    laptopScreen.position.set(-0.35, 1.02, -0.12);
    laptopScreen.rotation.x = -0.2;
    deskGroup.add(laptopScreen);

    // Pila de libros / exámenes
    const bookGeo = new THREE.BoxGeometry(0.24, 0.1, 0.18);
    const bookMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
    const book = new THREE.Mesh(bookGeo, bookMat);
    book.position.set(0.5, 0.94, 0.1);
    book.rotation.y = 0.3;
    deskGroup.add(book);

    this.scene.add(deskGroup);
    this.obstacles.push(deskGroup);
  }

  /* ----------------------------------------------------
     PUPITRES Y SILLAS DE ESTUDIANTES
     ---------------------------------------------------- */
  buildStudentDesks() {
    const deskMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });

    // Matriz de pupitres (Filas y Columnas)
    const rows = 3;
    const cols = 4;
    const startX = -4.5;
    const startZ = -1.8;
    const spacingX = 3.0;
    const spacingZ = 2.4;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const deskGroup = new THREE.Group();
        const posX = startX + c * spacingX;
        const posZ = startZ + r * spacingZ;

        // Algunos pupitres volcados por el ataque zombie
        const isFlipped = (r === 1 && c === 1) || (r === 2 && c === 3);

        const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.65), deskMat);
        tableTop.position.y = 0.74;
        deskGroup.add(tableTop);

        // Patas metálicas
        const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.74, 8);
        const leg1 = new THREE.Mesh(legGeo, metalMat); leg1.position.set(-0.54, 0.37, -0.26);
        const leg2 = new THREE.Mesh(legGeo, metalMat); leg2.position.set(0.54, 0.37, -0.26);
        const leg3 = new THREE.Mesh(legGeo, metalMat); leg3.position.set(-0.54, 0.37, 0.26);
        const leg4 = new THREE.Mesh(legGeo, metalMat); leg4.position.set(0.54, 0.37, 0.26);
        deskGroup.add(leg1, leg2, leg3, leg4);

        // Silla adjunta
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 0.44), deskMat);
        seat.position.set(0, 0.45, 0.55);
        deskGroup.add(seat);

        const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.03), deskMat);
        backrest.position.set(0, 0.72, 0.75);
        deskGroup.add(backrest);

        if (isFlipped) {
          deskGroup.rotation.z = Math.PI / 2.2;
          deskGroup.rotation.y = 0.4;
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
     VENTANALES Y NOCHE CON TORMENTA
     ---------------------------------------------------- */
  buildWindows(roomWidth) {
    const winGroup = new THREE.Group();
    winGroup.position.set(-roomWidth / 2 + 0.04, 2.2, 0);
    winGroup.rotation.y = Math.PI / 2;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.22
    });

    // 3 Ventanales altos
    for (let i = -1; i <= 1; i++) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.2), glassMat);
      pane.position.set(i * 3.6, 0, 0);
      winGroup.add(pane);

      // Marco
      const frame = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(2.8, 2.2, 0.05)),
        new THREE.LineBasicMaterial({ color: 0x334155 })
      );
      frame.position.set(i * 3.6, 0, 0);
      winGroup.add(frame);
    }

    this.scene.add(winGroup);

    // Luz de relámpago exterior que ilumina a través de las ventanas
    this.lightningLight = new THREE.DirectionalLight(0x93c5fd, 0);
    this.lightningLight.position.set(-15, 6, 0);
    this.scene.add(this.lightningLight);
  }

  /* ----------------------------------------------------
     CASILLEROS ESCOLARES Y PUERTA BARRICADA
     ---------------------------------------------------- */
  buildLockersAndBackdoor(roomDepth) {
    const lockerMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.35
    });

    // Casilleros a la izquierda de la pared trasera
    const lockerGeo = new THREE.BoxGeometry(2.8, 2.4, 0.55);
    const lockers = new THREE.Mesh(lockerGeo, lockerMat);
    lockers.position.set(-4.5, 1.2, roomDepth / 2 - 0.3);
    this.scene.add(lockers);

    // Puerta de salida barricada con tablas de madera
    const doorGeo = new THREE.BoxGeometry(1.4, 2.6, 0.06);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.3, roomDepth / 2 - 0.04);
    this.scene.add(door);

    // Letrero de SALIDA DE EMERGENCIA BLOQUEADA
    const signGeo = new THREE.BoxGeometry(0.9, 0.28, 0.03);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.4, roomDepth / 2 - 0.02);
    this.scene.add(sign);

    // Tablas de madera cruzadas
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.04), plankMat);
    p1.position.set(0, 1.4, roomDepth / 2 - 0.01);
    p1.rotation.z = 0.35;
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.04), plankMat);
    p2.position.set(0, 1.2, roomDepth / 2 - 0.01);
    p2.rotation.z = -0.35;
    this.scene.add(p1, p2);
  }

  /* ----------------------------------------------------
     RELOJ DE PARED ESCOLAR
     ---------------------------------------------------- */
  buildWallClock(roomDepth) {
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 3.4, -roomDepth / 2 + 0.05);

    const faceGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 24);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.rotation.x = Math.PI / 2;
    clockGroup.add(face);

    // Borde negro
    const rimGeo = new THREE.TorusGeometry(0.35, 0.025, 8, 24);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    clockGroup.add(rim);

    // Segundero rojo
    const handGeo = new THREE.BoxGeometry(0.012, 0.22, 0.01);
    const handMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.clockHand = new THREE.Mesh(handGeo, handMat);
    this.clockHand.position.set(0, 0.08, 0.025);
    clockGroup.add(this.clockHand);

    this.scene.add(clockGroup);
  }

  /* ----------------------------------------------------
     ILUMINACIÓN FLUORESCENTE Y EFECTO DE PARPADEO (FLICKER)
     ---------------------------------------------------- */
  setupLighting(W, D, H) {
    // 1. Luz Ambiental baja y tenebrosa
    const ambient = new THREE.AmbientLight(0x1e293b, 1.2);
    this.scene.add(ambient);

    // 2. Luz de relleno azulina de medianoche
    const moonLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    moonLight.position.set(-8, 5, 2);
    this.scene.add(moonLight);

    // 3. Lámpara fluorescente central estable
    const mainTube = new THREE.PointLight(0xf1f5f9, 2.2, 14);
    mainTube.position.set(-2, H - 0.4, 0);
    this.scene.add(mainTube);

    // 4. Lámpara fluorescente parpadeante (Flickering)
    this.flickerLight = new THREE.PointLight(0xef4444, 2.5, 12);
    this.flickerLight.position.set(3, H - 0.4, -1);
    this.scene.add(this.flickerLight);
  }

  update(delta, now) {
    // Parpadeo ominoso de lámpara fluorescente
    if (this.flickerLight) {
      if (Math.random() < 0.12) {
        this.flickerLight.intensity = Math.random() < 0.3 ? 0.2 : (2.0 + Math.random() * 1.5);
      }
    }

    // Relámpagos periódicos en la tormenta exterior
    if (now >= this.lightningTimer) {
      if (Math.random() < 0.08) {
        this.lightningLight.intensity = 4.5;
        setTimeout(() => {
          if (this.lightningLight) this.lightningLight.intensity = 0.5;
          setTimeout(() => {
            if (this.lightningLight) this.lightningLight.intensity = 3.8;
            setTimeout(() => {
              if (this.lightningLight) this.lightningLight.intensity = 0;
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
