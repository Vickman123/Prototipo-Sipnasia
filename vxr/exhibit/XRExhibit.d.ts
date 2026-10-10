import * as THREE from 'three';
import type { XRExhibitOptions } from './types.js';
/**
 * XRExhibit generates an interactive 3D museum pod / showcase pedestal with an
 * automated information display screen, procedural canvas typography, and
 * inspectable 3D exhibit object.
 */
export declare class XRExhibit {
    readonly id: string;
    readonly title: string;
    readonly category: string;
    readonly description: string;
    readonly specs: string[];
    readonly themeColor: string;
    readonly nativeGroup: THREE.Group;
    get group(): THREE.Group;
    readonly screenMesh: THREE.Mesh;
    mountedObject: THREE.Object3D | null;
    onInspectCallback?: (exhibit: XRExhibit) => void;
    private materialsToDispose;
    private geometriesToDispose;
    private screenTexture;
    constructor(options: XRExhibitOptions);
    private buildPedestal;
    /**
     * Generates dynamic information screen texture on an HTML Canvas.
     */
    private createScreenTexture;
    /**
     * Default geometric artifact placeholder if no external model was provided.
     */
    private createDefaultArtifact;
    /**
     * Sets or updates the 3D model mounted on top of the pod.
     */
    setMountedObject(obj: THREE.Object3D, scale?: number): void;
    /**
     * Per-frame animation update for the mounted object.
     */
    update(delta: number): void;
    /**
     * Triggers the inspection action.
     */
    inspect(): void;
    /**
     * Cleans up textures and geometries from memory.
     */
    dispose(): void;
}
//# sourceMappingURL=XRExhibit.d.ts.map