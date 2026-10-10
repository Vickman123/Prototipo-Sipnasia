import type { BuildOptions, BuildResult, BuildTarget } from './BuildTarget.js';
/**
 * QuestPWATarget (Architectural Placeholder for Future WebAPK / Horizon Store packaging).
 *
 * Designed to integrate Bubblewrap / Meta Horizon Store PWA packaging in future VXR versions
 * without adding heavy Android SDK, NDK or Gradle dependencies today.
 */
export declare class QuestPWATarget implements BuildTarget {
    readonly name = "quest-pwa";
    readonly description = "Meta Horizon Store PWA package (Future target / Architectural placeholder)";
    build(_options: BuildOptions): Promise<BuildResult>;
}
