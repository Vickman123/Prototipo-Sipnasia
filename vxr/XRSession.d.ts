import * as THREE from 'three';
export type SessionStateCallback = (active: boolean, session: globalThis.XRSession | null) => void;
export type ControllerSelectCallback = (controllerIndex: number, controller: THREE.XRTargetRaySpace) => void;
/**
 * XRSession manages WebXR device availability, session requests,
 * reference spaces, controller laser pointers, and floating VR action buttons.
 */
export declare class XRSession {
    private renderer;
    private activeSession;
    private sessionListeners;
    private selectListeners;
    private buttonElement;
    /** WebXR target ray controllers (0: primary, 1: secondary) */
    readonly controllers: THREE.XRTargetRaySpace[];
    /** WebXR grip spaces for physical controller visualization */
    readonly grips: THREE.XRGripSpace[];
    /** Container group holding controller ray and grip instances */
    readonly controllerGroup: THREE.Group;
    constructor(renderer: THREE.WebGLRenderer);
    /**
     * Initializes WebXR controllers with visual laser pointers.
     */
    private setupControllers;
    /**
     * Internal listeners for Three.js XR lifecycle events.
     */
    private setupRendererEvents;
    /**
     * Checks whether the current browser and hardware support immersive VR.
     */
    checkVRSupport(): Promise<boolean>;
    /**
     * Requests and enters an immersive WebXR VR session.
     */
    enterVR(sessionInit?: XRSessionInit): Promise<globalThis.XRSession>;
    /**
     * Gracefully exits an active immersive WebXR session.
     */
    exitVR(): Promise<void>;
    /**
     * Toggles VR mode on or off.
     */
    toggleVR(): Promise<void>;
    /**
     * Whether an immersive VR session is currently presenting.
     */
    get isPresenting(): boolean;
    /**
     * The current raw WebXR session instance, if active.
     */
    get currentSession(): globalThis.XRSession | null;
    /**
     * Subscribes to WebXR session start and end events.
     * @returns Unsubscribe function.
     */
    onStateChange(callback: SessionStateCallback): () => void;
    /**
     * Subscribes to controller trigger select events in VR.
     * @returns Unsubscribe function.
     */
    onSelect(callback: ControllerSelectCallback): () => void;
    private notifyListeners;
    private notifySelectListeners;
    /**
     * Casts a ray in 3D world space along the pointing direction of a given WebXR controller.
     *
     * @param controllerIndex 0 (primary/right) or 1 (secondary/left).
     * @param objects List of 3D objects to test intersections against.
     * @param recursive Test children recursively (default: true).
     */
    raycastController(controllerIndex: number, objects: THREE.Object3D[], recursive?: boolean): THREE.Intersection[];
    /**
     * Creates a modern, styled floating action button to enter/exit VR.
     * @param container Target container for the button (defaults to document.body).
     */
    createVRButton(container?: HTMLElement): HTMLElement;
    /**
     * Updates button label and styling depending on session state.
     */
    private updateButtonUI;
    /**
     * Disposes the session manager and removes UI elements.
     */
    dispose(): void;
}
//# sourceMappingURL=XRSession.d.ts.map