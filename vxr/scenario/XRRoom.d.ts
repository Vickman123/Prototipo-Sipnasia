import * as THREE from 'three';
import type { XRRoomOptions, XRRoomDimensions, RoomTheme, DoorConfig, WalkableAABB, DoorAperture } from './types.js';
/**
 * XRRoom builds and encapsulates a fully realized 3D room with procedural
 * geometry, automated wall and doorway cutouts, ceiling lamps, and collision bounds.
 */
export declare class XRRoom {
    readonly id: string;
    readonly name: string;
    readonly dimensions: XRRoomDimensions;
    readonly center: THREE.Vector3;
    readonly theme: RoomTheme;
    /** Root Three.js group containing all room meshes and lighting */
    readonly nativeGroup: THREE.Group;
    /** Wall thickness in meters */
    readonly wallThickness: number;
    /** Door apertures registered in this room */
    readonly doorApertures: DoorAperture[];
    /** Door configurations attached to this room */
    readonly doors: DoorConfig[];
    /** Meshes added to the room */
    readonly meshes: THREE.Mesh[];
    /** Point light or spotlight illuminating the room */
    ceilingLight: THREE.PointLight | null;
    /** Internal materials */
    private materialsToDispose;
    private geometriesToDispose;
    /** Internal spawn point */
    private readonly spawnOffset;
    constructor(options?: XRRoomOptions);
    /**
     * Constructs floor, walls with doorway cutouts, ceiling, and lighting.
     */
    private build;
    /**
     * Generates a single wall, automatically creating left/right/header segments if a door exists.
     */
    private buildWall;
    /**
     * Returns the primary walkable AABB boundary inside the room.
     */
    getWalkableBounds(margin?: number): WalkableAABB;
    /**
     * Checks whether a 2D world coordinate (X, Z) is within this room's walkable area
     * or inside one of its doorway exit apertures.
     */
    containsPoint(x: number, z: number, margin?: number): boolean;
    /**
     * Calculates the global 3D world coordinates for the player spawn position.
     */
    getSpawnPosition(): THREE.Vector3;
    /**
     * Adds an arbitrary 3D model, prop, or furniture to the room relative to its center.
     */
    addDecoration(object: THREE.Object3D, relativePosition?: [number, number, number]): void;
    /**
     * Disposes geometries and materials to avoid memory leaks.
     */
    dispose(): void;
}
//# sourceMappingURL=XRRoom.d.ts.map