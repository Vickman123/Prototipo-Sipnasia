import type { BuildOptions, BuildResult, BuildTarget } from './BuildTarget.js';
/**
 * WebTarget produces a clean, standard Web production build.
 */
export declare class WebTarget implements BuildTarget {
    readonly name = "web";
    readonly description = "Standard production web build (HTML5 + WebGL + Three.js)";
    build(options: BuildOptions): Promise<BuildResult>;
}
