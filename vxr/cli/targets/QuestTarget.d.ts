import type { BuildOptions, BuildResult, BuildTarget } from './BuildTarget.js';
/**
 * QuestTarget produces a WebXR production build configured and tuned
 * specifically for the Meta Quest Browser (OculusBrowser / Quest 2/3/3S/Pro).
 */
export declare class QuestTarget implements BuildTarget {
    readonly name = "quest";
    readonly description = "WebXR production build tuned for Meta Quest Browser (PWA manifest, WebXR headers, perf audit)";
    build(options: BuildOptions): Promise<BuildResult>;
}
