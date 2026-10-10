/**
 * Base interfaces for VXR Build Target system.
 */
export interface BuildOptions {
    /** Absolute or relative path to project root (default: process.cwd()) */
    projectRoot: string;
    /** Output directory for compiled build artifacts (default: dist) */
    outDir?: string;
    /** Whether to apply non-destructive performance optimizations */
    optimize?: boolean;
    /** Name of target platform */
    target: 'web' | 'quest' | 'quest-pwa';
    /** Print verbose build and audit logs */
    verbose?: boolean;
}
export interface BuildResult {
    success: boolean;
    target: string;
    outputDirectory: string;
    generatedFiles: string[];
    warnings: string[];
    recommendations: string[];
    stats?: {
        totalFiles: number;
        totalBytes: number;
        glbCount: number;
        textureCount: number;
        buildDurationMs: number;
    };
}
export interface BuildTarget {
    readonly name: string;
    readonly description: string;
    build(options: BuildOptions): Promise<BuildResult>;
}
