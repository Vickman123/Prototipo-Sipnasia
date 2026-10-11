/**
 * SIPNASIA XR - Controlador de Interfaz de Usuario y Lógica 2D
 * Conecta los modales, detector de hardware WebXR, generador de códigos QR,
 * controles de sonido y disparadores de la dinámica interactiva.
 */

document.addEventListener('DOMContentLoaded', () => {
  initWebXRDetection();
  initQuestOverlay();
  initGsapHeroAnimations();
  initHeroInteractions();
  initSideDrawer();
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
   1.1 Pantalla Exclusiva de Entrada en VR para Meta Quest
   ---------------------------------------------------- */
function initQuestOverlay() {
  const questOverlay = document.getElementById('quest-vr-overlay');
  const directVrBtn = document.getElementById('btn-quest-direct-vr');
  const continueWebBtn = document.getElementById('btn-quest-continue-web');

  // Detectar si el usuario está en Meta Quest Browser o probando con ?quest=1
  const isQuest = /Quest|OculusBrowser/i.test(navigator.userAgent) || window.location.search.includes('quest=1');

  if (isQuest && questOverlay) {
    questOverlay.classList.remove('hidden');

    if (directVrBtn) {
      directVrBtn.addEventListener('click', () => {
        if (window.xrAudio) window.xrAudio.playWarp();
        questOverlay.classList.add('hidden');
        // Lanzar inmediatamente sesión WebXR
        const officialVrBtn = document.getElementById('official-vr-button');
        if (officialVrBtn) {
          officialVrBtn.click();
        } else {
          document.getElementById('btn-view-3d')?.click();
        }
      });
    }

    if (continueWebBtn) {
      continueWebBtn.addEventListener('click', () => {
        if (window.xrAudio) window.xrAudio.playHover();
        questOverlay.classList.add('hidden');
      });
    }
  }
}

/* ----------------------------------------------------
   1.2 Animaciones de GSAP para Hero y Nodos de Fondo
   ---------------------------------------------------- */
function initGsapHeroAnimations() {
  if (typeof gsap === 'undefined') {
    console.warn('[SipnasiaXR] GSAP no disponible, usando animación estática.');
    return;
  }

  // Registrar ScrollToPlugin si está disponible
  if (typeof ScrollToPlugin !== 'undefined') {
    gsap.registerPlugin(ScrollToPlugin);
  }

  // Línea de tiempo de entrada con GSAP
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('#main-header', {
    y: -40,
    opacity: 0,
    duration: 1.0,
    delay: 0.2
  })
  .from('.hero-label-festival', {
    opacity: 0,
    y: 20,
    duration: 0.8
  }, '-=0.6')
  .from('.hero-brand-logo-wrap', {
    opacity: 0,
    scale: 0.88,
    filter: 'blur(8px)',
    duration: 1.2,
    ease: 'power2.out'
  }, '-=0.5')
  .from('.hero-subtitle-puma', {
    opacity: 0,
    y: 15,
    duration: 0.8
  }, '-=0.8')
  .from('.hero-metadata-disciplines span', {
    opacity: 0,
    y: 10,
    stagger: 0.1,
    duration: 0.6
  }, '-=0.6')
  .from('.hero-year-badge', {
    opacity: 0,
    scale: 0.8,
    duration: 0.8
  }, '-=0.5')
  .from('.hero-cta-wrapper', {
    opacity: 0,
    y: 30,
    scale: 0.95,
    duration: 1.0,
    ease: 'back.out(1.4)'
  }, '-=0.6')
  .from('.hero-scroll-cue', {
    opacity: 0,
    y: -15,
    duration: 0.8
  }, '-=0.4')
  .from('.hero-bottom-bar', {
    opacity: 0,
    y: 25,
    duration: 0.8
  }, '-=0.6');

  // Animación infinita suave para los nodos flotantes de fondo
  document.querySelectorAll('.floating-node').forEach((node, idx) => {
    const randomDuration = 3.5 + (idx % 4) * 0.8;
    const randomY = -20 - (idx % 3) * 10;
    const randomX = (idx % 2 === 0 ? 15 : -15);

    gsap.to(node, {
      y: `+=${randomY}`,
      x: `+=${randomX}`,
      rotation: 180,
      duration: randomDuration,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: idx * 0.35
    });
  });

  // Parallax suave interactivo con el cursor del ratón
  const heroViewport = document.getElementById('hero-viewport');
  const backdrop = document.getElementById('hero-backdrop');
  const overlay = document.querySelector('.hero-info-overlay');

  if (heroViewport && backdrop && overlay) {
    heroViewport.addEventListener('mousemove', (e) => {
      const rect = heroViewport.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      gsap.to(backdrop, {
        x: x * 18,
        y: y * 12,
        rotationY: x * 6,
        rotationX: -y * 6,
        duration: 1.2,
        ease: 'power2.out',
        transformPerspective: 900
      });

      gsap.to(overlay, {
        x: x * 6,
        y: y * 4,
        duration: 1.2,
        ease: 'power2.out'
      });
    });

    heroViewport.addEventListener('mouseleave', () => {
      gsap.to(backdrop, {
        x: 0,
        y: 0,
        rotationY: 0,
        rotationX: 0,
        duration: 1.5,
        ease: 'power2.out'
      });
      gsap.to(overlay, {
        x: 0,
        y: 0,
        duration: 1.5,
        ease: 'power2.out'
      });
    });
  }
}

/* ----------------------------------------------------
   1.3 Interacciones del Hero, Botón CTA y Meta Quest
   ---------------------------------------------------- */
function initHeroInteractions() {
  const ctaBtn = document.getElementById('btn-hero-cta');
  const ctaIcon = document.getElementById('cta-icon');
  const ctaText = document.getElementById('cta-button-text');
  const ctaSub = document.getElementById('cta-button-sub');
  const navExperiencesBtn = document.getElementById('btn-nav-experiences');
  const scrollCue = document.getElementById('hero-scroll-cue');

  // Detección de Meta Quest
  const isQuest = /Quest|OculusBrowser/i.test(navigator.userAgent) || window.location.search.includes('quest=1');

  if (isQuest && ctaBtn) {
    ctaBtn.classList.add('quest-mode');
    if (ctaIcon) ctaIcon.textContent = '🥽';
    if (ctaText) ctaText.textContent = 'ENTRAR EN VR (META QUEST)';
    if (ctaSub) ctaSub.textContent = '// PORTAL HUB // 6DOF';
  }

  // Función de scroll suave a experiencias
  const scrollToExperiences = (e) => {
    if (e) e.preventDefault();
    if (window.xrAudio) window.xrAudio.playSelect();

    const target = document.getElementById('experiencias-section');
    if (!target) return;

    if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
      gsap.to(window, {
        duration: 1.2,
        scrollTo: { y: target, offsetY: 40 },
        ease: 'power3.inOut'
      });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Manejador del botón CTA
  if (ctaBtn) {
    ctaBtn.addEventListener('click', (e) => {
      if (isQuest) {
        if (window.xrAudio) window.xrAudio.playWarp();
        // En Quest, lanzar WebXR directamente
        const officialVrBtn = document.getElementById('official-vr-button');
        if (officialVrBtn) {
          officialVrBtn.click();
        } else {
          const view3dBtn = document.getElementById('btn-view-3d');
          if (view3dBtn) view3dBtn.click();
          else scrollToExperiences(e);
        }
      } else {
        // En desktop/móvil, llevar al Hub de experiencias
        scrollToExperiences(e);
      }
    });
  }

  if (navExperiencesBtn) {
    navExperiencesBtn.addEventListener('click', scrollToExperiences);
  }

  if (scrollCue) {
    scrollCue.addEventListener('click', scrollToExperiences);
  }
}

/* ----------------------------------------------------
   1.4 Menú Lateral Desplegable (Side Drawer)
   ---------------------------------------------------- */
function initSideDrawer() {
  const drawer = document.getElementById('side-drawer-menu');
  const openBtn = document.getElementById('btn-hamburger-menu');
  const closeBtn = document.getElementById('btn-close-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const expLink = document.getElementById('drawer-link-experiences');
  const dynLink = document.getElementById('drawer-link-dynamic');

  if (!drawer) return;

  const openDrawer = () => {
    drawer.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.xrAudio) window.xrAudio.playHover();
  };

  const closeDrawer = () => {
    drawer.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (window.xrAudio) window.xrAudio.playHover();
  };

  if (openBtn) openBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  if (expLink) {
    expLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      setTimeout(() => {
        const target = document.getElementById('experiencias-section');
        if (target) {
          if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
            gsap.to(window, { duration: 1.0, scrollTo: { y: target, offsetY: 40 }, ease: 'power3.inOut' });
          } else {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 300);
    });
  }

  if (dynLink) {
    dynLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      setTimeout(() => {
        const dynBtn = document.getElementById('btn-hero-dynamic') || document.getElementById('btn-toggle-dynamic');
        if (dynBtn) dynBtn.click();
        const target = document.getElementById('modulo-dinamica');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    });
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

  // Abrir Vista Previa / Mini-Hub de la Experiencia
  document.querySelectorAll('.btn-preview').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.getAttribute('data-url');
      const title = btn.getAttribute('data-title');
      currentTargetUrl = url;

      if (window.xrAudio) window.xrAudio.playSelect();

      if (window.XRSceneManager && typeof window.XRSceneManager.openPortalMiniHub === 'function') {
        const id = url.includes('simulador') ? 'simulador' : url.includes('shooter') ? 'shooter' : 'visor';
        const cardBody = btn.closest('.card-body');
        const desc = cardBody?.querySelector('.card-description')?.textContent?.trim() || '';
        const expCard = btn.closest('.experience-card');
        const cat = expCard?.querySelector('.card-category-badge')?.textContent?.trim() || 'EXPERIENCIA XR';

        window.XRSceneManager.openPortalMiniHub({
          id,
          title,
          url,
          category: cat,
          desc
        });
        return;
      }

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
      const rawUrl = btn.getAttribute('data-url');
      const absoluteUrl = new URL(rawUrl, window.location.href).href;
      const title = btn.getAttribute('data-title');
      currentTargetUrl = absoluteUrl;

      if (window.xrAudio) window.xrAudio.playSelect();
      if (qrTitle) qrTitle.textContent = `Código QR // ${title}`;
      if (qrUrlText) qrUrlText.textContent = absoluteUrl;

      // Generar URL para código QR vía API de alta resolución y respaldo
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(absoluteUrl)}`;
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

  // Manejo de Interacción para la Tarjeta de la 4ta Puerta (En Desarrollo Durante el Taller de XR)
  const upcomingCardBtn = document.getElementById('btn-card-upcoming');
  const upcomingInfoBtn = document.getElementById('btn-upcoming-info');
  [upcomingCardBtn, upcomingInfoBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.xrAudio) window.xrAudio.playHover();
        alert('🔒 EN DESARROLLO DURANTE LA ACTIVIDAD DEL TALLER DE XR\n\nLaboratorio de Innovación XR PC PUMA UNAM:\nEsta 4ta experiencia se desarrollará en tiempo real durante la actividad del taller de XR.');
        if (window.SipnasiaXR) {
          window.SipnasiaXR.log('🔒 4ta Puerta: En desarrollo durante la actividad del taller de XR.');
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
   5. Controles de la Dinámica WebXR y Panel Plegable
   ---------------------------------------------------- */
function initDynamicUI() {
  const dynamicPanel = document.getElementById('modulo-dinamica');
  const toggleDynamicBtn = document.getElementById('btn-toggle-dynamic');
  const dynamicPanelHeader = document.getElementById('dynamic-panel-header');
  const dynamicToggleText = document.getElementById('dynamic-toggle-text');
  const heroDynamicBtn = document.getElementById('btn-hero-dynamic');

  const startDynamicBtn = document.getElementById('btn-start-dynamic');
  const stopDynamicBtn = document.getElementById('btn-stop-dynamic');
  const resetStatsBtn = document.getElementById('btn-reset-stats');

  // Función para alternar el panel
  function toggleDynamicPanel(forceOpen) {
    if (!dynamicPanel) return;
    const shouldOpen = forceOpen !== undefined ? forceOpen : dynamicPanel.classList.contains('collapsed');
    if (shouldOpen) {
      dynamicPanel.classList.remove('collapsed');
      if (toggleDynamicBtn) toggleDynamicBtn.setAttribute('aria-expanded', 'true');
      if (dynamicToggleText) dynamicToggleText.textContent = 'CERRAR PANEL';
    } else {
      dynamicPanel.classList.add('collapsed');
      if (toggleDynamicBtn) toggleDynamicBtn.setAttribute('aria-expanded', 'false');
      if (dynamicToggleText) dynamicToggleText.textContent = 'ABRIR PANEL';
    }
    if (window.xrAudio) window.xrAudio.playHover();
  }

  if (toggleDynamicBtn) {
    toggleDynamicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDynamicPanel();
    });
  }

  if (dynamicPanelHeader) {
    dynamicPanelHeader.addEventListener('click', () => {
      toggleDynamicPanel();
    });
  }

  if (heroDynamicBtn) {
    heroDynamicBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleDynamicPanel(true);
      dynamicPanel.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (startDynamicBtn) {
    startDynamicBtn.addEventListener('click', () => {
      if (window.SipnasiaXR) {
        window.SipnasiaXR.startDynamic('synapse-sync');
        startDynamicBtn.classList.add('active');
        startDynamicBtn.innerHTML = '<span>🔄 DINÁMICA EN CURSO...</span>';
      }
    });
  }

  if (stopDynamicBtn) {
    stopDynamicBtn.addEventListener('click', () => {
      if (window.SipnasiaXR) {
        window.SipnasiaXR.stopDynamic();
        if (startDynamicBtn) {
          startDynamicBtn.classList.remove('active');
          startDynamicBtn.innerHTML = '<span>▶ INICIAR DINÁMICA</span><span>[ 3D / VR ]</span>';
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
        if (startDynamicBtn) {
          startDynamicBtn.classList.remove('active');
          startDynamicBtn.innerHTML = '<span>▶ INICIAR DINÁMICA</span><span>[ 3D / VR ]</span>';
        }
      }
    });
  }

  // Escuchar cuando la dinámica termina automáticamente por tiempo
  window.addEventListener('sipnasia:dynamicEnd', () => {
    if (startDynamicBtn) {
      startDynamicBtn.classList.remove('active');
      startDynamicBtn.innerHTML = '<span>▶ INICIAR DINÁMICA</span><span>[ 3D / VR ]</span>';
    }
  });
}

/* ----------------------------------------------------
   6. Efectos de Sonido al pasar el ratón (Hover FX)
   ---------------------------------------------------- */
function initHoverEffects() {
  const interactiveElements = document.querySelectorAll(
    'button, .experience-card, .btn-card-launch, .btn-card-tool, .btn-primary, .btn-secondary, .btn-toggle-dynamic, .btn-dynamic-sub'
  );

  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (window.xrAudio) window.xrAudio.playHover();
    });
  });
}
