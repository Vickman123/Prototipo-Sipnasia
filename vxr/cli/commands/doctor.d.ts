export interface DoctorCheckItem {
    name: string;
    status: 'ok' | 'warn' | 'fail' | 'runtime-only';
    message: string;
    type: 'local' | 'recommendation' | 'runtime';
}
export interface DoctorReport {
    overallStatus: 'ok' | 'warn' | 'fail';
    checks: DoctorCheckItem[];
    recommendations: string[];
    runtimeNotes: string[];
}
/**
 * VXR Doctor diagnoses the development environment, project structure,
 * WebXR setup, HTTPS readiness, and 3D asset budgets for Meta Quest.
 */
export declare class VXRDoctor {
    static run(projectRoot?: string): DoctorReport;
    /**
     * Prints a clean, human-readable terminal report.
     */
    static printReport(report: DoctorReport): void;
}
