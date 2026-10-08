/**
 * SIPNASIA XR - Motor de Dinámicas WebXR
 * Arquitectura modular y extensible para dinámicas inmersivas, actividades interactivas,
 * calibración 6DoF y talleres educativos de PC PUMA UNAM.
 */

class SipnasiaDynamicsEngine {
  constructor() {
    this.state = {
      isRunning: false,
      currentDynamic: 'synapse-sync',
      score: 0,
      streak: 1,
      nodesCleared: 0,
      activeNodes: [],
      maxActiveNodes: 6,
      timer: 0,
      duration: 60
    };

    this.experiences = [
      {
        id: 'simulador',
        title: 'SIMULADOR DE OPERADOR PC PUMA',
        url: 'https://vickman123.github.io/Simulador-operador-pcpuma/',
        category: 'Simulación Operativa',
        color: 0x00f0ff,
        hex: '#00f0ff'
      },
      {
        id: 'shooter',
        title: 'SHOOTER PC PUMA (VIRUS PURGE)',
        url: 'https://vickman123.github.io/FPS-WEBXR-VIRUS-PURGE/',
        category: 'Cyber Defense Arcade',
        color: 0xff007f,
        hex: '#ff007f'
      },
      {
        id: 'visor',
        title: 'VISOR ARQUITECTÓNICO DE PC PUMA',
        url: 'https://vickman123.github.io/visor-xr/',
        category: 'Visualización Espacial',
        color: 0xd59b2d,
        hex: '#d59b2d'
      }
    ];

    this.dynamicRegistry = new Map();
    this.eventListeners = new Map();
    this.intervalId = null;

    this.registerDefaultDynamics();
  }

  /* ----------------------------------------------------
     Registro de Dinámicas y Eventos
     ---------------------------------------------------- */
  registerDynamic(id, dynamicDef) {
    this.dynamicRegistry.set(id, {
      id,
      name: dynamicDef.name || id,
      description: dynamicDef.description || '',
      onStart: dynamicDef.onStart || (() => {}),
      onTick: dynamicDef.onTick || (() => {}),
      onNodeHit: dynamicDef.onNodeHit || (() => {}),
      onEnd: dynamicDef.onEnd || (() => {})
    });
    this.log(`Dinámica registrada: [${id}] - ${dynamicDef.name}`);
  }

  registerDefaultDynamics() {
    // 1. Sincronización Sináptica (Modo Calibración y Reflejos XR)
    this.registerDynamic('synapse-sync', {
      name: 'Sincronización de Nodos Sinápticos',
      description: 'Interactúa con los orbes de energía en el espacio 3D para sincronizar los protocolos de red PC PUMA.',
      onStart: () => {
        this.log('Iniciando sincronización de red sináptica...');
        this.spawnBatchNodes(3);
      },
      onTick: (delta) => {
        if (this.state.activeNodes.length < 4 && Math.random() < 0.04) {
          this.spawnRandomNode();
        }
      },
      onNodeHit: (node) => {
        const points = 100 * this.state.streak;
        this.state.score += points;
        this.state.streak = Math.min(this.state.streak + 1, 5);
        this.state.nodesCleared++;
        this.log(`¡Nodo calibrado! +${points} pts (Racha x${this.state.streak})`);
        
        if (window.xrAudio) window.xrAudio.playNodeHit();
        this.emit('scoreUpdate', { score: this.state.score, streak: this.state.streak });
      },
      onEnd: () => {
        this.log(`Dinámica completada. Puntuación final: ${this.state.score} pts. Nodos: ${this.state.nodesCleared}`);
      }
    });

    // 2. Desafío de Enrutamiento a Experiencias
    this.registerDynamic('portal-scout', {
      name: 'Rastreo y Acceso a Portales XR',
      description: 'Apunta con tus mandos VR o cursor hacia los monolitos de cada experiencia para fijar el salto dimensional.',
      onStart: () => {
        this.log('Modo Rastreador de Portales activado. Selecciona un monolito.');
      },
      onNodeHit: (target) => {
        this.log(`Portal seleccionado: ${target.userData?.title || 'Experiencia'}`);
      }
    });
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(cb => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    }

    // Despacho global DOM para integraciones externas
    window.dispatchEvent(new CustomEvent(`sipnasia:${event}`, { detail: data }));
  }

  /* ----------------------------------------------------
     Control de la Dinámica
     ---------------------------------------------------- */
  startDynamic(dynamicId = 'synapse-sync') {
    if (this.state.isRunning) {
      this.stopDynamic();
    }

    const dyn = this.dynamicRegistry.get(dynamicId);
    if (!dyn) {
      this.log(`Error: Dinámica [${dynamicId}] no encontrada.`);
      return;
    }

    this.state.isRunning = true;
    this.state.currentDynamic = dynamicId;
    this.state.score = 0;
    this.state.streak = 1;
    this.state.nodesCleared = 0;
    this.state.timer = this.state.duration;

    this.clearAllNodes();
    dyn.onStart();

    // Actualizar UI
    this.emit('dynamicStart', { dynamicId, name: dyn.name });
    this.updateStatsUI();

    // Intervalo de temporizador
    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (!this.state.isRunning) return;
      this.state.timer--;
      this.updateStatsUI();

      if (this.state.timer <= 0) {
        this.stopDynamic();
      }
    }, 1000);

    if (window.xrAudio) window.xrAudio.playWarp();
  }

  stopDynamic() {
    if (!this.state.isRunning) return;
    this.state.isRunning = false;
    clearInterval(this.intervalId);

    const dyn = this.dynamicRegistry.get(this.state.currentDynamic);
    if (dyn) dyn.onEnd();

    this.clearAllNodes();
    this.emit('dynamicEnd', { 
      score: this.state.score, 
      nodesCleared: this.state.nodesCleared 
    });
    this.updateStatsUI();
  }

  /* ----------------------------------------------------
     Generación de Nodos Interactivos 3D en el Espacio
     ---------------------------------------------------- */
  spawnBatchNodes(count = 3) {
    for (let i = 0; i < count; i++) {
      this.spawnRandomNode();
    }
  }

  spawnRandomNode() {
    if (!window.XRSceneManager || !window.XRSceneManager.scene) return;
    if (this.state.activeNodes.length >= this.state.maxActiveNodes) return;

    const scene = window.XRSceneManager.scene;
    const exp = this.experiences[Math.floor(Math.random() * this.experiences.length)];

    // Crear Orbe 3D interactivo
    const geometry = new THREE.SphereGeometry(0.22, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color: exp.color,
      emissive: exp.color,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: Math.random() > 0.5
    });

    const nodeMesh = new THREE.Mesh(geometry, material);

    // Posicionamiento en arco frente al usuario (radio 2m a 4m)
    const angle = (Math.random() - 0.5) * Math.PI * 0.85; // ~150 grados al frente
    const distance = 2.2 + Math.random() * 2.0;
    const height = 0.9 + Math.random() * 1.5;

    nodeMesh.position.set(
      Math.sin(angle) * distance,
      height,
      -Math.cos(angle) * distance
    );

    // Anillo exterior decorativo
    const ringGeo = new THREE.TorusGeometry(0.32, 0.02, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    nodeMesh.add(ring);

    // Metadatos
    nodeMesh.userData = {
      isDynamicNode: true,
      targetExperience: exp,
      createdAt: Date.now(),
      baseY: height,
      rotSpeed: (Math.random() * 0.04) + 0.02,
      pulseOffset: Math.random() * Math.PI * 2
    };

    scene.add(nodeMesh);
    this.state.activeNodes.push(nodeMesh);
    window.XRSceneManager.registerInteractable(nodeMesh);
  }

  handleNodeHit(nodeMesh) {
    if (!nodeMesh || !nodeMesh.userData || !nodeMesh.userData.isDynamicNode) return;

    const dyn = this.dynamicRegistry.get(this.state.currentDynamic);
    if (dyn) {
      dyn.onNodeHit(nodeMesh);
    }

    // Efecto de desintegración / implosión
    this.animateNodeClear(nodeMesh);
  }

  animateNodeClear(nodeMesh) {
    if (!nodeMesh) return;
    const scene = window.XRSceneManager?.scene;

    // Remover de interactables
    if (window.XRSceneManager) {
      window.XRSceneManager.unregisterInteractable(nodeMesh);
    }
    this.state.activeNodes = this.state.activeNodes.filter(n => n !== nodeMesh);

    // Animación simple de escala a cero
    let scale = 1;
    const shrink = () => {
      scale -= 0.15;
      if (scale <= 0.05) {
        if (scene) scene.remove(nodeMesh);
        if (nodeMesh.geometry) nodeMesh.geometry.dispose();
        if (nodeMesh.material) nodeMesh.material.dispose();
      } else {
        nodeMesh.scale.set(scale, scale, scale);
        requestAnimationFrame(shrink);
      }
    };
    shrink();
  }

  clearAllNodes() {
    if (!window.XRSceneManager || !window.XRSceneManager.scene) return;
    const scene = window.XRSceneManager.scene;

    this.state.activeNodes.forEach(node => {
      if (window.XRSceneManager) {
        window.XRSceneManager.unregisterInteractable(node);
      }
      scene.remove(node);
      if (node.geometry) node.geometry.dispose();
      if (node.material) node.material.dispose();
    });

    this.state.activeNodes = [];
  }

  updateFrame(delta, time) {
    if (!this.state.isRunning) return;

    // Ejecutar lógica por frame de la dinámica activa
    const dyn = this.dynamicRegistry.get(this.state.currentDynamic);
    if (dyn) dyn.onTick(delta);

    // Animación de flotación y rotación de los nodos activos
    this.state.activeNodes.forEach(node => {
      const data = node.userData;
      node.rotation.y += data.rotSpeed || 0.02;
      node.rotation.x += (data.rotSpeed || 0.02) * 0.5;
      node.position.y = data.baseY + Math.sin(time * 2 + data.pulseOffset) * 0.15;
    });
  }

  /* ----------------------------------------------------
     Sincronización con Interfaz 2D / DOM
     ---------------------------------------------------- */
  updateStatsUI() {
    const scoreEl = document.getElementById('dyn-score');
    const nodesEl = document.getElementById('dyn-nodes');
    const timerEl = document.getElementById('dyn-timer');

    if (scoreEl) scoreEl.textContent = this.state.score.toLocaleString();
    if (nodesEl) nodesEl.textContent = this.state.nodesCleared;
    if (timerEl) timerEl.textContent = `${this.state.timer}s`;
  }

  log(message) {
    const logBox = document.getElementById('dynamic-log');
    const timeStr = new Date().toLocaleTimeString();
    const entry = `[${timeStr}] ${message}`;

    console.log(`[SipnasiaXR] ${entry}`);
    if (logBox) {
      const line = document.createElement('div');
      line.textContent = entry;
      logBox.appendChild(line);
      logBox.scrollTop = logBox.scrollHeight;
    }
  }
}

// Instancia global
window.SipnasiaXR = new SipnasiaDynamicsEngine();
