import type { XRApp } from '../XRApp.js';
import type { XRRuntime } from './XRRuntime.js';
export interface WebXRRuntimeOptions {
    /** Target frame rate in Hz to request in Meta Quest Browser (default: 90) */
    targetFrameRate?: number;
    /** Whether to apply Quest-specific compositor optimizations like pixel ratio clamp */
    questOptimization?: boolean;
}
/**
 * WebXR runtime implementation for Meta Quest Browser and immersive VR headsets.
 * Manages 6DoF controllers, framerate negotiation, and adaptive rendering parameters.
 */
export declare class WebXRRuntime implements XRRuntime {
    readonly id: "webxr";
    isVRSupported: boolean;
    private app;
    private options;
    private cleanupSessionListener;
    private previousPixelRatio;
    constructor(options?: WebXRRuntimeOptions);
    init(app: XRApp): Promise<void>;
    private handleSessionTransition;
    update(_delta: number, _elapsed: number): void;
    dispose(): void;
}
//# sourceMappingURL=WebXRRuntime.d.ts.map