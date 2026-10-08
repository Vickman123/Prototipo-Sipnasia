/**
 * SIPNASIA XR - Controlador de Interfaz de Usuario y Lógica 2D
 * Conecta los modales, detector de hardware WebXR, generador de códigos QR,
 * controles de sonido y disparadores de la dinámica interactiva.
 */

document.addEventListener('DOMContentLoaded', () => {
  initWebXRDetection();
  initSoundControls();
  initModals();
  init3DModeToggle();
  initDynamicUI();
  initHoverEffects();
});

/* ----------------------------------------------------
   1. Detección de Dispositivo y Compatibilidad WebXR
   ---------------------------------------------------- */
async function initWebXRDetection() {
  const xrStatusEl = document.getElementById('xr-status-pill');
  const xrDotEl = document.getElementById('xr-status-dot');
  const xrTextEl = document.getElementById('xr-status-text');

  if (!navigator.xr) {
    if (xrTextEl) xrTextEl.textContent = 'WebXR no soportado en este navegador (Modo 3D activo)';
    if (xrDotEl) xrDotEl.className = 'pulse-dot warning';
    return;
  }

  try {
    const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
    if (isSupported) {
      const isQuest = /Quest|OculusBrowser/i.test(navigator.userAgent);
      const deviceLabel = isQuest ? 'Meta Quest Detectado // VR 6DoF Listo' : 'Visor VR Compatible // WebXR Listo';
      
      if (xrTextEl) xrTextEl.textContent = deviceLabel;
      if (xrDotEl) xrDotEl.className = 'pulse-dot';
      console.log(`[SipnasiaXR] ${deviceLabel}`);
    } else {
      if (xrTextEl) xrTextEl.textContent = 'Modo 3D Interactivo Activo (Sin visor VR conectado)';
      if (xrDotEl) xrDotEl.className = 'pulse-dot warning';
    }
  } catch (err) {
    console.warn('[SipnasiaXR] Error al checar WebXR:', err);
    if (xrTextEl) xrTextEl.textContent = 'Modo Web 3D Activo';
  }
}

/* ----------------------------------------------------
   2. Control de Audio Procedural FX
   ---------------------------------------------------- */
function initSoundControls() {
  const soundBtn = document.getElementById('btn-sound-toggle');
  const soundText = document.getElementById('sound-status-text');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      if (!window.xrAudio) return;
      const isMuted = window.xrAudio.toggleMute();
      if (soundText) {
        soundText.textContent = isMuted ? 'MUTE' : 'AUDIO ON';
      }
      soundBtn.style.opacity = isMuted ? '0.6' : '1';
      if (!isMuted) window.xrAudio.playSelect();
    });
  }
}

/* ----------------------------------------------------
   3. Modales (Vista Previa Iframe & Código QR)
   ---------------------------------------------------- */
function initModals() {
  // Modal de Vista Previa
  const previewModal = document.getElementById('preview-modal');
  const previewIframe = document.getElementById('preview-iframe');
  const previewTitle = document.getElementById('preview-modal-title');
  const previewLaunchBtn = document.getElementById('preview-launch-external');
  const closePreviewBtn = document.getElementById('btn-close-preview');

  // Modal de Código QR
  const qrModal = document.getElementById('qr-modal');
  const qrTitle = document.getElementById('qr-modal-title');
  const qrImage = document.getElementById('qr-code-img');
  const qrUrlText = document.getElementById('qr-target-url-text');
  const qrCopyBtn = document.getElementById('btn-copy-url');
  const closeQrBtn = document.getElementById('btn-close-qr');

  let currentTargetUrl = '';

  // Abrir Vista Previa
  document.querySelectorAll('.btn-preview').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.getAttribute('data-url');
      const title = btn.getAttribute('data-title');
      currentTargetUrl = url;

      if (window.xrAudio) window.xrAudio.playSelect();
      if (previewTitle) previewTitle.textContent = title;
      if (previewIframe) previewIframe.src = url;
      if (previewLaunchBtn) previewLaunchBtn.href = url;
      if (previewModal) previewModal.classList.add('active');
    });
  });

  // Cerrar Vista Previa
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', () => {
      if (previewModal) previewModal.classList.remove('active');
      if (previewIframe) previewIframe.src = 'about:blank';
      if (window.xrAudio) window.xrAudio.playHover();
    });
  }

  // Abrir Modal QR
  document.querySelectorAll('.btn-qr').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.getAttribute('data-url');
      const title = btn.getAttribute('data-title');
      currentTargetUrl = url;

      if (window.xrAudio) window.xrAudio.playSelect();
      if (qrTitle) qrTitle.textContent = `Código QR // ${title}`;
      if (qrUrlText) qrUrlText.textContent = url;

      // Generar URL para código QR vía API de alta resolución y respaldo
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(url)}`;
      if (qrImage) {
        qrImage.src = qrApiUrl;
      }

      if (qrModal) qrModal.classList.add('active');
    });
  });

  // Cerrar Modal QR
  if (closeQrBtn) {
    closeQrBtn.addEventListener('click', () => {
      if (qrModal) qrModal.classList.remove('active');
      if (window.xrAudio) window.xrAudio.playHover();
    });
  }

  // Copiar Enlace
  if (qrCopyBtn) {
    qrCopyBtn.addEventListener('click', () => {
      if (!currentTargetUrl) return;
      navigator.clipboard.writeText(currentTargetUrl).then(() => {
        qrCopyBtn.textContent = '¡ENLACE COPIADO!';
        if (window.xrAudio) window.xrAudio.playSelect();
        setTimeout(() => {
          qrCopyBtn.textContent = 'COPIAR ENLACE';
        }, 2200);
      });
    });
  }

  // Cerrar al hacer click en el fondo
  [previewModal, qrModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          if (previewIframe) previewIframe.src = 'about:blank';
        }
      });
    }
  });
}

/* ----------------------------------------------------
   4. Modo 3D Pantalla Completa & HUD
   ---------------------------------------------------- */
function init3DModeToggle() {
  const enter3DBtn = document.getElementById('btn-view-3d');
  const exit3DBtn = document.getElementById('btn-exit-3d');

  if (enter3DBtn) {
    enter3DBtn.addEventListener('click', () => {
      if (window.xrAudio) window.xrAudio.playWarp();
      if (window.XRSceneManager) {
        window.XRSceneManager.toggleInteractive3D(true);
      }
    });
  }

  if (exit3DBtn) {
    exit3DBtn.addEventListener('click', () => {
      if (window.xrAudio) window.xrAudio.playHover();
      if (window.XRSceneManager) {
        window.XRSceneManager.toggleInteractive3D(false);
      }
    });
  }
}

/* ----------------------------------------------------
   5. Controles de la Dinámica WebXR
   ---------------------------------------------------- */
function initDynamicUI() {
  const startDynamicBtn = document.getElementById('btn-start-dynamic');
  const stopDynamicBtn = document.getElementById('btn-stop-dynamic');
  const resetStatsBtn = document.getElementById('btn-reset-stats');

  if (startDynamicBtn) {
    startDynamicBtn.addEventListener('click', () => {
      if (window.SipnasiaXR) {
        window.SipnasiaXR.startDynamic('synapse-sync');
        startDynamicBtn.classList.add('active');
        startDynamicBtn.textContent = '🔄 DINÁMICA EN CURSO...';
      }
    });
  }

  if (stopDynamicBtn) {
    stopDynamicBtn.addEventListener('click', () => {
      if (window.SipnasiaXR) {
        window.SipnasiaXR.stopDynamic();
        if (startDynamicBtn) {
          startDynamicBtn.classList.remove('active');
          startDynamicBtn.textContent = '▶ INICIAR DINÁMICA SINÁPTICA';
        }
      }
    });
  }

  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => {
      if (window.SipnasiaXR) {
        window.SipnasiaXR.stopDynamic();
        window.SipnasiaXR.state.score = 0;
        window.SipnasiaXR.state.nodesCleared = 0;
        window.SipnasiaXR.updateStatsUI();
        window.SipnasiaXR.log('Métricas de la dinámica reiniciadas.');
      }
    });
  }

  // Escuchar cuando la dinámica termina automáticamente por tiempo
  window.addEventListener('sipnasia:dynamicEnd', () => {
    if (startDynamicBtn) {
      startDynamicBtn.classList.remove('active');
      startDynamicBtn.textContent = '▶ INICIAR DINÁMICA SINÁPTICA';
    }
  });
}

/* ----------------------------------------------------
   6. Efectos de Sonido al pasar el ratón (Hover FX)
   ---------------------------------------------------- */
function initHoverEffects() {
  const interactiveElements = document.querySelectorAll(
    'button, .experience-card, .btn-card-launch, .btn-card-tool, .btn-primary, .btn-secondary'
  );

  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (window.xrAudio) window.xrAudio.playHover();
    });
  });
}
