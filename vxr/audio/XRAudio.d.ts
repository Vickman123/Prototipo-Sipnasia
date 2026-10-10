/**
 * XRAudio provides procedural 3D/WebXR audio synthesis using the browser's native Web Audio API.
 * Requires 0 MB of external MP3/WAV downloads; all audio effects and ambient drones are
 * synthesized mathematically in real-time with zero latency and no copyright restrictions.
 */
export declare class XRAudio {
    private ctx;
    private masterGain;
    private ambientGain;
    private ambientOscs;
    private muted;
    private lastStepTime;
    constructor();
    /**
     * Initializes or resumes the AudioContext to adhere to browser autoplay policies.
     */
    resume(): void;
    /**
     * Toggles audio mute state.
     * @returns Whether audio is now muted.
     */
    toggleMute(): boolean;
    /**
     * Returns whether audio is currently muted.
     */
    get isMuted(): boolean;
    /**
     * Plays a subtle footstep sound when walking in the virtual environment.
     */
    playStep(): void;
    /**
     * Plays a crisp tactile UI click or laser pointer trigger sound.
     */
    playClick(): void;
    /**
     * Plays a celebratory harmonic chime when a task or objective is completed.
     */
    playSuccess(): void;
    /**
     * Plays an alert or warning tone for hazard simulation or system warnings.
     */
    playAlert(): void;
    /**
     * Plays a futuristic sci-fi warp sweep for teleportation or waypoint jumps.
     */
    playWarp(): void;
    /**
     * Starts a subtle synthesized ambient drone in the background.
     */
    startAmbient(preset?: 'laboratory' | 'space' | 'drone'): void;
    /**
     * Stops the active ambient background drone.
     */
    stopAmbient(): void;
    /**
     * Cleans up audio nodes and closes context.
     */
    dispose(): void;
}
//# sourceMappingURL=XRAudio.d.ts.map