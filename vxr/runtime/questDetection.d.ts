/**
 * Runtime capability detection utilities for WebXR and Meta Quest.
 *
 * NOTE: Hardware capabilities (e.g. 90Hz/120Hz, GPU performance, actual physical headset)
 * can ONLY be definitively verified in runtime, not statically.
 */
export interface QuestRuntimeCapabilities {
    isWebXRSupported: boolean;
    isQuestBrowser: boolean;
    supportsImmersiveVR: boolean;
    supportedFrameRates: number[];
    supportsTargetFrameRate: boolean;
    supportsHandTracking: boolean;
    webgl2Available: boolean;
}
/**
 * Evaluates WebXR and Quest-specific capabilities in the current browser environment.
 * Does NOT rely solely on user-agent; inspects navigator.xr and WebGL context where possible.
 */
export declare function detectQuestCapabilities(): Promise<QuestRuntimeCapabilities>;
/**
 * Negotiates an optimal target frame rate (e.g. 90Hz or 72Hz) on an active WebXR session.
 * Safely checks session.supportedFrameRates and session.updateTargetFrameRate.
 *
 * @param session Active XRSession
 * @param preferredRate Desired rate in Hz (default: 90)
 * @returns The actual applied rate, or null if negotiation is unsupported
 */
export declare function negotiateFrameRate(session: any, preferredRate?: number): Promise<number | null>;
//# sourceMappingURL=questDetection.d.ts.map