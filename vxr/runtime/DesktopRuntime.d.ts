import type { XRApp } from '../XRApp.js';
import type { XRRuntime } from './XRRuntime.js';
/**
 * Desktop runtime implementation for standard PC, Mac, and mobile browser environments.
 * Drives mouse/touch pointer interactions and OrbitControls.
 */
export declare class DesktopRuntime implements XRRuntime {
    readonly id: "desktop";
    readonly isVRSupported = false;
    private app;
    init(app: XRApp): Promise<void>;
    update(_delta: number, _elapsed: number): void;
    dispose(): void;
}
//# sourceMappingURL=DesktopRuntime.d.ts.map