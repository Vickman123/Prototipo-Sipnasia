import { negotiateFrameRate } from './questDetection.js';
/**
 * WebXR runtime implementation for Meta Quest Browser and immersive VR headsets.
 * Manages 6DoF controllers, framerate negotiation, and adaptive rendering parameters.
 */
export class WebXRRuntime {
    id = 'webxr';
    isVRSupported = false;
    app = null;
    options;
    cleanupSessionListener = null;
    previousPixelRatio = 1.0;
    constructor(options = {}) {
        this.options = {
            targetFrameRate: options.targetFrameRate ?? 90,
            questOptimization: options.questOptimization ?? true,
        };
    }
    async init(app) {
        this.app = app;
        this.isVRSupported = await app.session.checkVRSupport();
        // Hook session state changes to adaptively configure rendering & framerate
        this.cleanupSessionListener = app.session.onStateChange((active, session) => {
            this.handleSessionTransition(active, session);
        });
    }
    handleSessionTransition(active, session) {
        if (!this.app)
            return;
        if (active && session) {
            // 1. Disable OrbitControls during immersive presentation
            if (this.app.controls) {
                this.app.controls.enabled = false;
            }
            // 2. Store desktop pixel ratio and apply Quest-optimized ratio
            if (this.options.questOptimization) {
                this.previousPixelRatio = this.app.nativeRenderer.getPixelRatio();
                // Clamping pixel ratio between 1.0 and 1.25 prevents GPU thermal throttling on Quest 2/3
                this.app.nativeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1.0, 1.25));
            }
            // 3. Negotiate target frame rate safely (e.g. 90Hz)
            negotiateFrameRate(session, this.options.targetFrameRate).then((appliedRate) => {
                if (appliedRate) {
                    console.info(`[VXR WebXRRuntime] Target frame rate set to ${appliedRate}Hz`);
                }
            });
        }
        else {
            // Restore desktop controls and pixel ratio
            if (this.app.controls) {
                this.app.controls.enabled = true;
            }
            if (this.options.questOptimization) {
                this.app.nativeRenderer.setPixelRatio(this.previousPixelRatio);
            }
        }
    }
    update(_delta, _elapsed) {
        // Controller laser updates are driven via Three.js XR animation loop
        if (this.app?.controls && this.app.controls.enabled) {
            this.app.controls.update();
        }
    }
    dispose() {
        if (this.cleanupSessionListener) {
            this.cleanupSessionListener();
            this.cleanupSessionListener = null;
        }
        this.app = null;
    }
}
//# sourceMappingURL=WebXRRuntime.js.map