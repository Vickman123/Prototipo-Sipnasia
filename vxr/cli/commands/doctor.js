import fs from 'fs';
import path from 'path';
import { QuestBuildOptimizer } from '../optimizer/QuestBuildOptimizer.js';
/**
 * VXR Doctor diagnoses the development environment, project structure,
 * WebXR setup, HTTPS readiness, and 3D asset budgets for Meta Quest.
 */
export class VXRDoctor {
    static run(projectRoot = process.cwd()) {
        const checks = [];
        const recommendations = [];
        const runtimeNotes = [];
        const root = path.resolve(projectRoot);
        // 1. Local Environment: Node.js version
        const nodeVersion = process.version;
        const majorNode = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
        if (majorNode >= 18) {
            checks.push({
                name: 'Node.js',
                status: 'ok',
                message: `${nodeVersion} (compatible con VXR y Vite)`,
                type: 'local',
            });
        }
        else {
            checks.push({
                name: 'Node.js',
                status: 'fail',
                message: `${nodeVersion} (se requiere Node.js >= 18)`,
                type: 'local',
            });
        }
        // 2. TypeScript verification
        let hasTs = false;
        const tsConfigPath = path.join(root, 'tsconfig.json');
        if (fs.existsSync(tsConfigPath)) {
            hasTs = true;
            checks.push({
                name: 'TypeScript configuration',
                status: 'ok',
                message: 'tsconfig.json detectado',
                type: 'local',
            });
        }
        else {
            checks.push({
                name: 'TypeScript configuration',
                status: 'warn',
                message: 'No se encontró tsconfig.json en la raíz del proyecto',
                type: 'local',
            });
            recommendations.push('Agrega un archivo tsconfig.json para tipado estricto en tus experiencias VXR.');
        }
        // 3. Three.js dependency
        let hasThree = false;
        const pkgPath = path.join(root, 'package.json');
        if (fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
                if (deps['three']) {
                    hasThree = true;
                    checks.push({
                        name: 'Three.js',
                        status: 'ok',
                        message: `Dependencia "three" encontrada (${deps['three']})`,
                        type: 'local',
                    });
                }
            }
            catch { }
        }
        if (!hasThree) {
            checks.push({
                name: 'Three.js',
                status: 'warn',
                message: 'Three.js no figura en package.json local (verificar si se hereda del monorepo o global)',
                type: 'local',
            });
            recommendations.push('Ejecuta "npm install three @types/three" si es un proyecto independiente.');
        }
        // 4. Project Entry Point (index.html)
        const indexPath = path.join(root, 'index.html');
        let hasIndexHtml = fs.existsSync(indexPath);
        if (hasIndexHtml) {
            checks.push({
                name: 'Entry Point (index.html)',
                status: 'ok',
                message: 'index.html localizado',
                type: 'local',
            });
        }
        else {
            checks.push({
                name: 'Entry Point (index.html)',
                status: 'fail',
                message: 'Falta index.html en la raíz del proyecto',
                type: 'local',
            });
            recommendations.push('Crea un archivo index.html para hospedar el canvas 3D y la experiencia WebXR.');
        }
        // 5. WebXR Configuration & immersive-vr check in source code
        let mentionsWebXR = false;
        let mentionsImmersiveVR = false;
        let mentionsControllers = false;
        const scanCode = (dir) => {
            if (!fs.existsSync(dir))
                return;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (['node_modules', '.git', 'dist'].includes(entry.name))
                    continue;
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    scanCode(full);
                }
                else if (/\.(ts|js|html)$/.test(entry.name)) {
                    const content = fs.readFileSync(full, 'utf-8');
                    if (content.includes('XRApp') || content.includes('WebXR') || content.includes('navigator.xr')) {
                        mentionsWebXR = true;
                    }
                    if (content.includes('immersive-vr') || content.includes('enterVR') || content.includes('createVRButton')) {
                        mentionsImmersiveVR = true;
                    }
                    if (content.includes('raycastController') || content.includes('onControllerSelect') || content.includes('controllerGroup')) {
                        mentionsControllers = true;
                    }
                }
            }
        };
        scanCode(path.join(root, 'src'));
        scanCode(root);
        if (mentionsWebXR) {
            checks.push({
                name: 'WebXR configuration',
                status: 'ok',
                message: 'Inicialización de VXR / WebXR detectada en el código',
                type: 'local',
            });
        }
        else {
            checks.push({
                name: 'WebXR configuration',
                status: 'warn',
                message: 'No se detectaron importaciones de XRApp o navigator.xr en el código fuente',
                type: 'local',
            });
            recommendations.push('Importa { XRApp } desde "vxr" en tu script principal para habilitar WebXR.');
        }
        if (mentionsImmersiveVR) {
            checks.push({
                name: 'immersive-vr configuration',
                status: 'ok',
                message: 'Modo "immersive-vr" configurado para visores de realidad virtual',
                type: 'local',
            });
        }
        else {
            checks.push({
                name: 'immersive-vr configuration',
                status: 'warn',
                message: 'No se detectó solicitud de sesión immersive-vr explícita (XRApp lo activa por defecto)',
                type: 'local',
            });
        }
        if (mentionsControllers) {
            checks.push({
                name: 'Controller & Raycast support',
                status: 'ok',
                message: 'Manejo de mandos 6DoF / raycasting detectado',
                type: 'local',
            });
        }
        else {
            checks.push({
                name: 'Controller & Raycast support',
                status: 'ok',
                message: 'Mandos y rayos láser provistos automáticamente por XRSession',
                type: 'local',
            });
        }
        // 6. WebGL2 support
        checks.push({
            name: 'WebGL2 renderer baseline',
            status: 'ok',
            message: 'Three.js r170+ y VXR utilizan WebGL2 nativo (estándar en Meta Quest Browser)',
            type: 'local',
        });
        // 7. HTTPS requirement check
        checks.push({
            name: 'HTTPS requirement',
            status: 'ok',
            message: 'Obligatorio en Meta Quest Browser para WebXR (excepto en http://localhost)',
            type: 'recommendation',
        });
        recommendations.push('Para probar en Meta Quest inalámbricamente, usa un túnel HTTPS (ngrok, cloudflared) o despliega en GitHub Pages/Vercel.');
        // 8. Asset audit (GLTF/GLB & Textures)
        const assetAudit = QuestBuildOptimizer.analyzeDirectory(root);
        checks.push({
            name: 'Assets & Models audit',
            status: assetAudit.warnings.length === 0 ? 'ok' : 'warn',
            message: `${assetAudit.summary.glbCount} GLB/GLTF, ${assetAudit.summary.textureCount} texturas (${assetAudit.totalSizeFormatted})`,
            type: 'local',
        });
        for (const w of assetAudit.warnings) {
            checks.push({
                name: 'Asset budget warning',
                status: 'warn',
                message: w,
                type: 'local',
            });
        }
        recommendations.push(...assetAudit.recommendations);
        // 9. Runtime-Only Hardware Capabilities
        runtimeNotes.push('Tasa de refresco a 90Hz/120Hz: Requiere verificación en runtime mediante session.supportedFrameRates en el visor físico.');
        runtimeNotes.push('Hand Tracking (seguimiento de manos): Requiere que el usuario tenga la opción activada en el sistema operativo Quest Horizon.');
        runtimeNotes.push('Rendimiento térmico de GPU: Se valida dinámicamente según la cantidad de draw calls de la escena.');
        const hasFail = checks.some((c) => c.status === 'fail');
        const hasWarn = checks.some((c) => c.status === 'warn');
        const overallStatus = hasFail ? 'fail' : hasWarn ? 'warn' : 'ok';
        return {
            overallStatus,
            checks,
            recommendations,
            runtimeNotes,
        };
    }
    /**
     * Prints a clean, human-readable terminal report.
     */
    static printReport(report) {
        console.log('\n==================================================');
        console.log('                 VXR Doctor                     ');
        console.log('==================================================\n');
        console.log('Comprobaciones locales de proyecto:');
        console.log('──────────────────────────────────────────────────');
        for (const c of report.checks) {
            const icon = c.status === 'ok' ? '✓' : c.status === 'warn' ? '⚠' : '✗';
            console.log(`  ${icon} ${c.name}: ${c.message}`);
        }
        console.log('\nMeta Quest & WebXR Hardware Notes (Solo verificables en Runtime):');
        console.log('──────────────────────────────────────────────────');
        for (const note of report.runtimeNotes) {
            console.log(`  ℹ ${note}`);
        }
        if (report.recommendations.length > 0) {
            console.log('\nRecomendaciones de ingeniería:');
            console.log('──────────────────────────────────────────────────');
            for (const rec of report.recommendations) {
                console.log(`  💡 ${rec}`);
            }
        }
        console.log('\n──────────────────────────────────────────────────');
        if (report.overallStatus === 'ok') {
            console.log('Resultado: ✓ Proyecto en excelente estado para WebXR y Meta Quest.\n');
        }
        else if (report.overallStatus === 'warn') {
            console.log('Resultado: ⚠ Proyecto listo para WebXR con advertencias o sugerencias de optimización.\n');
        }
        else {
            console.log('Resultado: ✗ Hay errores críticos de configuración que deben resolverse antes de compilar.\n');
        }
    }
}
