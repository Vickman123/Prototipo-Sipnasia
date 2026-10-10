import fs from 'fs';
import path from 'path';
import { WebTarget } from './WebTarget.js';
import { QuestBuildOptimizer } from '../optimizer/QuestBuildOptimizer.js';
/**
 * QuestTarget produces a WebXR production build configured and tuned
 * specifically for the Meta Quest Browser (OculusBrowser / Quest 2/3/3S/Pro).
 */
export class QuestTarget {
    name = 'quest';
    description = 'WebXR production build tuned for Meta Quest Browser (PWA manifest, WebXR headers, perf audit)';
    async build(options) {
        // 1. Run standard web compilation first
        const webTarget = new WebTarget();
        const webResult = await webTarget.build(options);
        const outDir = webResult.outputDirectory;
        const warnings = [...webResult.warnings];
        const recommendations = [...webResult.recommendations];
        const generatedFiles = [...webResult.generatedFiles];
        console.info('[VXR CLI] Optimizing build for Meta Quest Browser...');
        // 2. Audit build assets against Quest hardware budgets
        const audit = QuestBuildOptimizer.analyzeDirectory(outDir);
        warnings.push(...audit.warnings);
        recommendations.push(...audit.recommendations);
        // 3. Write manifest.webmanifest for Quest PWA & fullscreen VR
        const manifest = QuestBuildOptimizer.generateQuestManifest('VXR Quest Experience');
        const manifestPath = path.join(outDir, 'manifest.webmanifest');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
        generatedFiles.push('manifest.webmanifest');
        // 4. Inject WebXR meta tags and manifest reference into dist/index.html
        const outIndexPath = path.join(outDir, 'index.html');
        if (fs.existsSync(outIndexPath)) {
            let html = fs.readFileSync(outIndexPath, 'utf-8');
            const metaTags = `
  <!-- VXR Meta Quest Browser Configuration -->
  <link rel="manifest" href="./manifest.webmanifest" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#0284c7" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
`;
            if (html.includes('</head>')) {
                html = html.replace('</head>', `${metaTags}</head>`);
                fs.writeFileSync(outIndexPath, html, 'utf-8');
            }
        }
        // 5. Generate QUEST_DEPLOY.md guide
        const deployGuide = QuestBuildOptimizer.generateQuestDeployGuide('VXR Experience');
        const deployGuidePath = path.join(outDir, 'QUEST_DEPLOY.md');
        fs.writeFileSync(deployGuidePath, deployGuide, 'utf-8');
        generatedFiles.push('QUEST_DEPLOY.md');
        // 6. Save audit report
        const reportPath = path.join(outDir, 'vxr-quest-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(audit, null, 2), 'utf-8');
        generatedFiles.push('vxr-quest-report.json');
        // 7. If --optimize flag is provided, generate performance preset configuration
        if (options.optimize) {
            console.info('[VXR CLI] Applying safe Quest performance presets (pixelRatioCap: 1.25, single shadow light, 90Hz target)...');
            const presetConfig = {
                target: 'quest',
                optimize: true,
                runtime: 'webxr',
                recommendedXRAppOptions: {
                    pixelRatioCap: 1.25,
                    enableShadows: true,
                    targetFrameRate: 90,
                    questOptimization: true,
                    fov: 60,
                },
            };
            const presetPath = path.join(outDir, 'vxr-quest-preset.json');
            fs.writeFileSync(presetPath, JSON.stringify(presetConfig, null, 2), 'utf-8');
            generatedFiles.push('vxr-quest-preset.json');
        }
        console.info(`[VXR CLI] Quest build completed successfully with score: [${audit.questBudgetScore}]`);
        return {
            success: true,
            target: 'quest',
            outputDirectory: outDir,
            generatedFiles,
            warnings,
            recommendations,
            stats: {
                totalFiles: generatedFiles.length,
                totalBytes: webResult.stats?.totalBytes || 0,
                glbCount: audit.summary.glbCount,
                textureCount: audit.summary.textureCount,
                buildDurationMs: webResult.stats?.buildDurationMs || 0,
            },
        };
    }
}
