import * as THREE from 'three';
import { XRRoom } from './XRRoom.js';
import type { XRRoomOptions, WallDirection, CorridorOptions, ScenarioJSON } from './types.js';
/**
 * XRScenario orchestrates a multi-room virtual architectural layout,
 * managing inter-room corridors, JSON scenario loading, and continuous
 * collision boundaries with wall sliding.
 */
export declare class XRScenario {
    name: string;
    readonly nativeGroup: THREE.Group;
    readonly corridorsGroup: THREE.Group;
    private rooms;
    private corridors;
    private defaultSpawnRoomId;
    constructor(name?: string);
    /**
     * Adds a new procedural room to the scenario.
     */
    addRoom(options: XRRoomOptions): XRRoom;
    /**
     * Retrieves a room by its ID.
     */
    getRoom(id: string): XRRoom | undefined;
    /**
     * Returns an array of all rooms in the scenario.
     */
    getAllRooms(): XRRoom[];
    /**
     * Removes a room and disposes its 3D assets.
     */
    removeRoom(id: string): void;
    /**
     * Connects two rooms with an automatic covered corridor linking their respective doorways.
     *
     * @param fromRoomId ID of the starting room
     * @param fromWall Wall direction on starting room ('north', 'south', 'east', 'west')
     * @param toRoomId ID of the destination room
     * @param toWall Wall direction on destination room
     * @param options Corridor styling and dimensions
     */
    connectRooms(fromRoomId: string, fromWall: WallDirection, toRoomId: string, toWall: WallDirection, options?: CorridorOptions): void;
    /**
     * Checks whether a 2D position (X, Z) is inside any room or connecting corridor.
     */
    isWalkable(pos: THREE.Vector3, margin?: number): boolean;
    /**
     * Constrains player / camera movement inside walkable scenario boundaries.
     * If the proposed position hits a wall, automatically slides along valid axes.
     *
     * @param currentPos Current valid position
     * @param proposedPos Desired target position
     * @param radius Player collision radius in meters (default: 0.35)
     * @returns Clamped safe position
     */
    clampMovement(currentPos: THREE.Vector3, proposedPos: THREE.Vector3, radius?: number): THREE.Vector3;
    /**
     * Loads and builds an entire multi-room scenario from a declarative JSON configuration.
     */
    loadFromJSON(json: ScenarioJSON): void;
    /**
     * Loads a declarative scenario JSON file from a remote or local URL.
     */
    loadFromURL(url: string): Promise<void>;
    /**
     * Gets the spawn position for the default or specified room.
     */
    getSpawnPosition(roomId?: string): THREE.Vector3;
    /**
     * Clears all rooms, corridors, geometries, and materials.
     */
    clear(): void;
    /**
     * Completely disposes the scenario from memory.
     */
    dispose(): void;
}
//# sourceMappingURL=XRScenario.d.ts.map