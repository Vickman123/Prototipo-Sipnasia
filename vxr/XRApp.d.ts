import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRScene } from './XRScene.js';
import { XRRenderer } from './XRRenderer.js';
import { XRSession, ControllerSelectCallback } from './XRSession.js';
import { XRAssetManager } from './XRAssetManager.js';
import { XRRoom } from './scenario/XRRoom.js';
import { XRScenario } from './scenario/XRScenario.js';
import type { XRRoomOptions, WallDirection, CorridorOptions, ScenarioJSON } from './scenario/types.js';
import type { LoadedModel, LoadModelOptions, UpdatableCallback, XRAppOptions } from './types.js';
import { XRAudio } from './audio/XRAudio.js';
import { XRExhibit } from './exhibit/XRExhibit.js';
import type { XRExhibitOptions } from './exhibit/types.js';
import { XRTutorial } from './tutorial/XRTutorial.js';
import type { XRTutorialOptions } from './tutorial/types.js';
import { type LocalDropOptions } from './utils/localDrop.js';
import { XRRuntime } from './runtime/XRRuntime.js';
/**
 * XRApp is the high-level entry point for VXR applications.
 *
 * It orchestrates scene setup, WebGL rendering, WebXR session negotiation,
 * desktop navigation controls, 3D asset loading, and unified pointer/controller raycasting.
 *
 * @example
 * ```typescript
 * const app = new XRApp();
 * await app.loadModel("./model.glb");
 * app.start();
 * ```
 */
export declare class XRApp {
    /** The encapsulated scene manager */
    readonly scene: XRScene;
    /** The encapsulated WebGL and WebXR renderer */
    readonly renderer: XRRenderer;
    /** The WebXR session and VR button manager */
    readonly session: XRSession;
    /** The 3D model asset loader and memory manager */
    readonly assets: XRAssetManager;
    /** Desktop orbit controls active when not in WebXR */
    readonly controls: OrbitControls | null;
    /** Active runtime strategy (DesktopRuntime or WebXRRuntime) */
    readonly runtime: XRRuntime;
    /** Initial camera position for reset */
    private initialCameraPosition;
    /** Initial look-at target for reset */
    private initialCameraTarget;
    /** Active model currently loaded via loadModel, if any */
    private currentModel;
    /** Active multi-room scenario, if any */
    private activeScenario;
    /** Procedural Web Audio synthesizer */
    private xrAudio;
    /** Active museum / showcase exhibits */
    readonly exhibits: XRExhibit[];
    /** Interactive tutorial / mission guide */
    tutorial: XRTutorial | null;
    /** Drop listener unregister callback */
    private dropCleanup;
    constructor(options?: XRAppOptions);
    /**
     * Convenience getter for the primary PerspectiveCamera.
     */
    get camera(): THREE.PerspectiveCamera;
    /**
     * Convenience getter for the underlying THREE.Scene.
     */
    get nativeScene(): THREE.Scene;
    /**
     * Convenience getter for the underlying THREE.WebGLRenderer.
     */
    get nativeRenderer(): THREE.WebGLRenderer;
    /**
     * Currently loaded 3D model, if any.
     */
    get model(): LoadedModel | null;
    /**
     * WebXR controller spaces (0: primary, 1: secondary).
     */
    get controllers(): THREE.XRTargetRaySpace[];
    /**
     * Procedural Web Audio synthesizer (zero external downloads).
     */
    get audio(): XRAudio;
    /**
     * Resets camera and orbit target to default coordinates or specific target.
     */
    resetCamera(targetPosition?: [number, number, number], targetLookAt?: [number, number, number]): void;
    /**
     * Casts a ray from screen coordinates (mouse or touch) and returns intersecting 3D objects.
     *
     * @param event MouseEvent or PointerEvent from DOM.
     * @param objects List of 3D objects to test (defaults to scene children).
     * @param recursive Test children recursively (default: true).
     */
    raycastPointer(event: MouseEvent | PointerEvent | {
        clientX: number;
        clientY: number;
    }, objects?: THREE.Object3D[], recursive?: boolean): THREE.Intersection[];
    /**
     * Casts a ray along the pointing orientation of a WebXR controller.
     *
     * @param controllerIndex 0 (primary/right) or 1 (secondary/left).
     * @param objects List of 3D objects to test (defaults to scene children).
     * @param recursive Test children recursively (default: true).
     */
    raycastController(controllerIndex: number, objects?: THREE.Object3D[], recursive?: boolean): THREE.Intersection[];
    /**
     * Subscribes to controller trigger click events in WebXR.
     * @returns Unsubscribe function.
     */
    onControllerSelect(callback: ControllerSelectCallback): () => void;
    /**
     * Asynchronously loads a glTF/GLB model, aligns it at ground level (Y = 0),
     * adds it to the scene, and adjusts camera framing.
     *
     * @param source URL string or File object.
     * @param options Configuration for grounding, centering, and progress.
     */
    loadModel(source: string | File, options?: LoadModelOptions): Promise<LoadedModel>;
    /**
     * Registers a callback executed on every frame before rendering.
     * @returns Unsubscribe function to remove the callback.
     */
    onUpdate(callback: UpdatableCallback): () => void;
    /**
     * Starts the animation loop and rendering.
     */
    start(): this;
    /**
     * Pauses the animation loop.
     */
    stop(): this;
    /**
     * Active multi-room scenario, if initialized.
     */
    get scenario(): XRScenario | null;
    /**
     * Creates or activates a multi-room scenario.
     */
    createScenario(name?: string): XRScenario;
    /**
     * Rapidly creates and attaches an XRRoom to the application.
     * If no scenario exists, automatically creates a default one.
     *
     * @example
     * ```typescript
     * const room = app.createRoom({
     *   name: 'Lobby',
     *   theme: 'gallery',
     *   dimensions: { width: 12, depth: 10 }
     * });
     * ```
     */
    createRoom(options?: XRRoomOptions): XRRoom;
    /**
     * Connects two existing rooms with an automatic covered corridor.
     */
    connectRooms(fromRoomId: string, fromWall: WallDirection, toRoomId: string, toWall: WallDirection, options?: CorridorOptions): void;
    /**
     * Loads a complete scenario from a declarative JSON configuration or URL.
     *
     * @example
     * ```typescript
     * await app.loadScenario("./escenario.json");
     * ```
     */
    loadScenario(configOrUrl: ScenarioJSON | string): Promise<XRScenario>;
    /**
     * Teleports camera and controls to the spawn point of a room.
     */
    teleportToRoom(roomId: string): void;
    /**
     * Constrains player / avatar movement to valid walkable room and corridor bounds.
     *
     * @param currentPos Current valid position
     * @param proposedPos Desired target position
     * @param radius Player collision radius in meters (default: 0.35)
     */
    constrainToScenario(currentPos: THREE.Vector3, proposedPos: THREE.Vector3, radius?: number): THREE.Vector3;
    /**
     * Adds an interactive 3D exhibit pedestal with info panel and model support.
     */
    addExhibit(options: XRExhibitOptions): XRExhibit;
    /**
     * Creates and mounts an interactive guided tutorial / mission HUD.
     */
    createTutorial(options: XRTutorialOptions): XRTutorial;
    /**
     * Enables zero-server client-side 3D model drag & drop with automatic metrics and grounding.
     */
    enableLocalFileDrop(options?: LocalDropOptions): () => void;
    /**
     * Disposes the application, closing sessions, clearing models, and releasing WebGL resources.
     */
    dispose(): void;
}
//# sourceMappingURL=XRApp.d.ts.map