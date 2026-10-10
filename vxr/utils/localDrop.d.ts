import type { XRApp } from '../XRApp';
import type { LoadedModel } from '../types';
export interface LocalDropOptions {
    domElement?: HTMLElement;
    targetPosition?: [number, number, number];
    maxDimension?: number;
    autoGround?: boolean;
    showOverlay?: boolean;
    onModelLoaded?: (model: LoadedModel, file: File) => void;
    onError?: (error: Error) => void;
}
export declare function enableLocalFileDrop(app: XRApp, options?: LocalDropOptions): () => void;
//# sourceMappingURL=localDrop.d.ts.map