import path from 'path';
import { WebTarget } from '../targets/WebTarget.js';
import { QuestTarget } from '../targets/QuestTarget.js';
import { QuestPWATarget } from '../targets/QuestPWATarget.js';
export class VXRBuildCommand {
    targets = new Map();
    constructor() {
        this.registerTarget(new WebTarget());
        this.registerTarget(new QuestTarget());
        this.registerTarget(new QuestPWATarget());
    }
    registerTarget(target) {
        this.targets.set(target.name.toLowerCase(), target);
    }
    async execute(options) {
        const targetName = (options.target || 'web').toLowerCase();
        const target = this.targets.get(targetName);
        if (!target) {
            const validTargets = Array.from(this.targets.keys()).join(', ');
            throw new Error(`[VXR CLI] Target desconocido: "${targetName}". Targets soportados: [${validTargets}]`);
        }
        console.log('\n==================================================');
        console.log(`        VXR Build — Target: [${target.name.toUpperCase()}]`);
        console.log('==================================================');
        console.log(`Descripción: ${target.description}`);
        console.log(`Raíz del proyecto: ${path.resolve(options.projectRoot)}`);
        if (options.optimize) {
            console.log('Modo de optimización: ACTIVO (--optimize)');
        }
        console.log('──────────────────────────────────────────────────\n');
        const result = await target.build(options);
        console.log('\n──────────────────────────────────────────────────');
        console.log(`Build completada para target: ${result.target}`);
        console.log(`Directorio de salida: ${result.outputDirectory}`);
        console.log(`Archivos generados: ${result.generatedFiles.length}`);
        if (result.stats) {
            console.log(`Modelos 3D procesados: ${result.stats.glbCount}`);
            console.log(`Texturas procesadas: ${result.stats.textureCount}`);
            console.log(`Tiempo de compilación: ${(result.stats.buildDurationMs / 1000).toFixed(2)}s`);
        }
        if (result.warnings.length > 0) {
            console.log('\nAdvertencias:');
            for (const w of result.warnings) {
                console.log(`  ⚠ ${w}`);
            }
        }
        if (result.recommendations.length > 0) {
            console.log('\nRecomendaciones de rendimiento:');
            for (const r of result.recommendations) {
                console.log(`  💡 ${r}`);
            }
        }
        console.log('==================================================\n');
        return result;
    }
}
