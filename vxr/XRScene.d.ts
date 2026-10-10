import * as THREE from 'three';
/**
 * Options for configuring XRScene.
 */
export interface XRSceneOptions {
    /** Enable default ambient and directional lighting. Defaults to true. */
    defaultLighting?: boolean;
    /** Enable shadows on default directional light. Defaults to true. */
    enableShadows?: boolean;
    /** Add a ground reference grid. Defaults to true. */
    enableGrid?: boolean;
    /** Background color for the scene. Defaults to dark slate #0b0f19. */
    backgroundColor?: THREE.ColorRepresentation;
}
export type EnvironmentPreset = 'studio' | 'daylight' | 'dark';
/**
 * XRScene wraps and extends THREE.Scene with balanced lighting,
 * environment presets, ground referencing, and cleanup routines.
 */
export declare class XRScene {
    /** The underlying native Three.js Scene instance */
    readonly nativeScene: THREE.Scene;
    ambientLight: THREE.AmbientLight | null;
    directionalLight: THREE.DirectionalLight | null;
    hemiLight: THREE.HemisphereLight | null;
    private gridHelper;
    private groundPlane;
    constructor(options?: XRSceneOptions);
    /**
     * Configures balanced default lighting suitable for architectural and product inspection.
     * @param enableShadows Whether to enable shadow casting on the main light.
     */
    private setupDefaultLighting;
    /**
     * Adds a subtle ground plane and visual reference grid at Y = 0.
     */
    private setupGroundReference;
    /**
     * Applies pre-calibrated lighting and background environment presets.
     */
    setEnvironmentPreset(preset: EnvironmentPreset): void;
    /**
     * Appends one or more 3D objects to the scene graph.
     */
    add(...objects: THREE.Object3D[]): this;
    /**
     * Removes one or more 3D objects from the scene graph.
     */
    remove(...objects: THREE.Object3D[]): this;
    /**
     * Updates the background of the scene (color or environment texture).
     */
    setBackground(background: THREE.Color | THREE.Texture | string | number): void;
    /**
     * Configures exponential or linear distance fog.
     */
    setFog(color: THREE.ColorRepresentation, near?: number, far?: number): void;
    /**
     * Toggles the visibility of the ground reference grid.
     */
    setGridVisible(visible: boolean): void;
    /**
     * Cleans up scene geometries and materials created by VXR defaults.
     */
    dispose(): void;
}
//# sourceMappingURL=XRScene.d.ts.map