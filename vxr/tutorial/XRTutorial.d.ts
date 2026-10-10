import { XRTutorialOptions } from './types';
import { XRAudio } from '../audio/XRAudio';
export declare class XRTutorial {
    private tasks;
    private containerEl;
    private audio?;
    private options;
    private isCollapsed;
    constructor(options: XRTutorialOptions, audio?: XRAudio);
    setAudio(audio: XRAudio): void;
    completeTask(id: string): boolean;
    resetTask(id: string): void;
    isCompleted(id: string): boolean;
    getRemainingCount(): number;
    getProgress(): number;
    show(): void;
    hide(): void;
    toggleCollapse(): void;
    destroy(): void;
    private mountHUD;
    private render;
}
//# sourceMappingURL=XRTutorial.d.ts.map