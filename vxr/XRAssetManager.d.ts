import * as THREE from 'three';
import type { LoadedModel, LoadModelOptions, ModelMetrics } from './types.js';
/**
 * XRAssetManager handles asynchronous loading of glTF/GLB models,
 * computes bounding box metrics, performs ground alignment, and manages GPU memory disposal.
 */
export declare class XRAssetManager {
    private gltfLoader;
    private dracoLoader;
    private loadedCache;
    constructor(defaultDracoPath?: string);
    /**
     * Loads a glTF or GLB 3D model from a URL or local File instance.
     * Automatically calculates metrics, enables shadows, and centers/grounds the model.
     *
     * @param source Remote URL string, local path string, or File object.
     * @param options Configuration for grounding, centering, and progress updates.
     */
    loadModel(source: string | File, options?: LoadModelOptions): Promise<LoadedModel>;
    /**
     * Evaluates volume, vertex count, and triangle count of an object hierarchy.
     */
    computeMetrics(object: THREE.Object3D): ModelMetrics;
    /**
     * Aggressively frees GPU memory by disposing geometries, materials, and textures.
     */
    disposeObject(root: THREE.Object3D): void;
    /**
     * Disposes the asset manager, clearing caches and loaders.
     */
    dispose(): void;
}
//# sourceMappingURL=XRAssetManager.d.ts.map