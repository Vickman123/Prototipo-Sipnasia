import * as THREE from 'three';
import type { UpdatableCallback, XRAppOptions } from './types.js';
/**
 * XRRenderer encapsulates the WebGLRenderer, PerspectiveCamera,
 * automatic window resize handling, and WebXR-compatible animation loop.
 */
export declare class XRRenderer {
    /** The native Three.js WebGLRenderer */
    readonly nativeRenderer: THREE.WebGLRenderer;
    /** The primary PerspectiveCamera */
    readonly camera: THREE.PerspectiveCamera;
    /** The container DOM element hosting the canvas */
    readonly container: HTMLElement;
    /** High-precision clock for frame delta calculation */
    private clock;
    /** Set of update callbacks executed on every frame */
    private updatables;
    /** Bound resize handler for clean listener removal */
    private boundOnResize;
    /** Active animation loop status */
    private isRunning;
    constructor(options?: XRAppOptions);
    /**
     * Returns the underlying canvas DOM element.
     */
    get domElement(): HTMLCanvasElement;
    /**
     * Recalculates canvas size and camera aspect ratio from the container dimensions.
     */
    private updateSize;
    /**
     * Window resize handler.
     */
    handleResize(): void;
    /**
     * Adds an update callback executed on every frame before rendering.
     * @returns Unsubscribe function to remove the callback.
     */
    addUpdatable(callback: UpdatableCallback): () => void;
    /**
     * Starts the WebXR-compatible animation loop.
     * @param renderHook Callback responsible for rendering the active scene.
     */
    start(renderHook: (delta: number, elapsed: number) => void): void;
    /**
     * Stops the animation loop.
     */
    stop(): void;
    /**
     * Renders the given scene from the primary camera.
     */
    render(scene: THREE.Scene): void;
    /**
     * Cleans up listeners, stops the animation loop, and disposes the WebGL context.
     */
    dispose(): void;
}
//# sourceMappingURL=XRRenderer.d.ts.map