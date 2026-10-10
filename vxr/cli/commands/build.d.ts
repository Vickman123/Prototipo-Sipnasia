import type { BuildOptions, BuildResult, BuildTarget } from '../targets/BuildTarget.js';
export declare class VXRBuildCommand {
    private targets;
    constructor();
    registerTarget(target: BuildTarget): void;
    execute(options: BuildOptions): Promise<BuildResult>;
}
