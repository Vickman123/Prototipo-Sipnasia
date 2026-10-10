export interface AssetAuditItem {
    path: string;
    relativePath: string;
    sizeBytes: number;
    sizeFormatted: string;
    type: 'glb' | 'gltf' | 'texture' | 'audio' | 'other';
    warnings: string[];
}
export interface QuestAuditReport {
    timestamp: string;
    projectRoot: string;
    totalFiles: number;
    totalSizeFormatted: string;
    totalSizeBytes: number;
    assets: AssetAuditItem[];
    warnings: string[];
    recommendations: string[];
    questBudgetScore: 'Optimal' | 'Acceptable' | 'NeedsOptimization';
    summary: {
        glbCount: number;
        glbTotalSizeFormatted: string;
        textureCount: number;
        textureTotalSizeFormatted: string;
        largeFilesCount: number;
    };
}
/**
 * QuestBuildOptimizer inspects and evaluates project assets against
 * Meta Quest (Snapdragon XR2 Gen 1/2) mobile GPU performance budgets.
 *
 * It operates strictly NON-DESTRUCTIVELY.
 */
export declare class QuestBuildOptimizer {
    private static readonly MAX_RECOMMENDED_GLB_BYTES;
    private static readonly MAX_RECOMMENDED_TEXTURE_BYTES;
    private static readonly MAX_RECOMMENDED_TOTAL_BYTES;
    static formatBytes(bytes: number): string;
    /**
     * Scans a directory recursively and evaluates asset budgets.
     */
    static analyzeDirectory(dirPath: string, rootDir?: string): QuestAuditReport;
    /**
     * Generates a recommended web manifest for Meta Quest Browser.
     */
    static generateQuestManifest(name?: string): object;
    /**
     * Generates an informative QUEST_DEPLOY.md guide placed inside the output build directory.
     */
    static generateQuestDeployGuide(projectName?: string): string;
}
