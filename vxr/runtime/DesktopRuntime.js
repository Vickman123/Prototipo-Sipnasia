/**
 * Desktop runtime implementation for standard PC, Mac, and mobile browser environments.
 * Drives mouse/touch pointer interactions and OrbitControls.
 */
export class DesktopRuntime {
    id = 'desktop';
    isVRSupported = false;
    app = null;
    async init(app) {
        this.app = app;
        // Desktop runtime leaves controls active by default
        if (this.app.controls) {
            this.app.controls.enabled = true;
        }
    }
    update(_delta, _elapsed) {
        if (this.app?.controls && this.app.controls.enabled) {
            this.app.controls.update();
        }
    }
    dispose() {
        this.app = null;
    }
}
//# sourceMappingURL=DesktopRuntime.js.map