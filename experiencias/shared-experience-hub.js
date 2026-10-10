/**
 * SIPNASIA XR - Controlador de Entrada en VR y Mini-Hub en Experiencias
 * Proporciona detección automática de Meta Quest 3S, lanzamiento 1-click de WebXR
 * y navegación fluida sin cambio de pestaña.
 */
(function () {
  function initQuestOverlay() {
    const isQuestUA = /Quest|OculusBrowser/i.test(navigator.userAgent);
    const hasQuestParam = window.location.search.includes('quest=1');
    const overlay = document.getElementById('quest-vr-overlay');
    const enterVrBtn = document.getElementById('btn-quest-direct-vr');
    const continueWebBtn = document.getElementById('btn-quest-continue-web');

    if (!overlay) return;

    function showOverlay() {
      overlay.classList.remove('hidden');
    }

    if (isQuestUA || hasQuestParam) {
      showOverlay();
    } else if (navigator.xr && typeof navigator.xr.isSessionSupported === 'function') {
      navigator.xr.isSessionSupported('immersive-vr')
        .then(function (supported) {
          if (supported) {
            showOverlay();
          }
        })
        .catch(function () {});
    }

    if (continueWebBtn) {
      continueWebBtn.addEventListener('click', function () {
        overlay.classList.add('hidden');
      });
    }

    if (enterVrBtn) {
      enterVrBtn.addEventListener('click', async function () {
        overlay.classList.add('hidden');

        // Estrategia 1: Visor Arquitectónico (React Three XR store - Modo AR Passthrough exclusivo)
        if (window.xrStore && typeof window.xrStore.enterAR === 'function') {
          try {
            await window.xrStore.enterAR();
            return;
          } catch (err) {
            console.warn('Error launching xrStore.enterAR:', err);
          }
        }

        // Estrategia 2: Three.js VRButton estándar
        const vrButton = document.getElementById('VRButton') || document.querySelector('[data-vr-button]');
        if (vrButton) {
          vrButton.click();
          return;
        }

        // Estrategia 3: Botón de inicio del simulador
        const startBtn = document.getElementById('btn-start');
        if (startBtn) {
          startBtn.click();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuestOverlay);
  } else {
    initQuestOverlay();
  }
})();
