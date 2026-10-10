import fs from 'fs';
import path from 'path';
/**
 * QuestBuildOptimizer inspects and evaluates project assets against
 * Meta Quest (Snapdragon XR2 Gen 1/2) mobile GPU performance budgets.
 *
 * It operates strictly NON-DESTRUCTIVELY.
 */
export class QuestBuildOptimizer {
    // Recommended thresholds for smooth 72Hz/90Hz on Meta Quest Browser
    static MAX_RECOMMENDED_GLB_BYTES = 25 * 1024 * 1024; // 25 MB
    static MAX_RECOMMENDED_TEXTURE_BYTES = 4 * 1024 * 1024; // 4 MB
    static MAX_RECOMMENDED_TOTAL_BYTES = 100 * 1024 * 1024; // 100 MB
    static formatBytes(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    /**
     * Scans a directory recursively and evaluates asset budgets.
     */
    static analyzeDirectory(dirPath, rootDir = dirPath) {
        const assets = [];
        const warnings = [];
        const recommendations = [];
        let totalSizeBytes = 0;
        let glbTotalBytes = 0;
        let glbCount = 0;
        let textureTotalBytes = 0;
        let textureCount = 0;
        let largeFilesCount = 0;
        const scan = (current) => {
            if (!fs.existsSync(current))
                return;
            const entries = fs.readdirSync(current, { withFileTypes: true });
            for (const entry of entries) {
                // Skip node_modules, .git, and dist directories
                if (entry.isDirectory()) {
                    if (['node_modules', '.git', 'dist', '.tempmediaStorage', '.system_generated'].includes(entry.name)) {
                        continue;
                    }
                    scan(path.join(current, entry.name));
                }
                else if (entry.isFile()) {
                    const fullPath = path.join(current, entry.name);
                    const stat = fs.statSync(fullPath);
                    const size = stat.size;
                    totalSizeBytes += size;
                    const ext = path.extname(entry.name).toLowerCase();
                    const relPath = path.relative(rootDir, fullPath);
                    const itemWarnings = [];
                    let type = 'other';
                    if (['.glb', '.gltf'].includes(ext)) {
                        type = ext === '.glb' ? 'glb' : 'gltf';
                        glbCount++;
                        glbTotalBytes += size;
                        if (size > QuestBuildOptimizer.MAX_RECOMMENDED_GLB_BYTES) {
                            itemWarnings.push(`Modelo 3D pesado (${QuestBuildOptimizer.formatBytes(size)} > 25MB). Puede causar picos de memoria en Meta Quest Browser.`);
                            largeFilesCount++;
                        }
                    }
                    else if (['.png', '.jpg', '.jpeg', '.webp', '.hdr', '.ktx2'].includes(ext)) {
                        type = 'texture';
                        textureCount++;
                        textureTotalBytes += size;
                        if (size > QuestBuildOptimizer.MAX_RECOMMENDED_TEXTURE_BYTES) {
                            itemWarnings.push(`Textura pesada (${QuestBuildOptimizer.formatBytes(size)} > 4MB). Se recomienda limitar a 2048x2048 o comprimir a KTX2/WebP.`);
                            largeFilesCount++;
                        }
                    }
                    else if (['.mp3', '.ogg', '.wav'].includes(ext)) {
                        type = 'audio';
                    }
                    if (itemWarnings.length > 0) {
                        warnings.push(...itemWarnings.map((w) => `${relPath}: ${w}`));
                    }
                    assets.push({
                        path: fullPath,
                        relativePath: relPath,
                        sizeBytes: size,
                        sizeFormatted: QuestBuildOptimizer.formatBytes(size),
                        type,
                        warnings: itemWarnings,
                    });
                }
            }
        };
        scan(dirPath);
        // Global recommendations
        if (totalSizeBytes > QuestBuildOptimizer.MAX_RECOMMENDED_TOTAL_BYTES) {
            warnings.push(`El tamaño total del proyecto (${QuestBuildOptimizer.formatBytes(totalSizeBytes)}) excede los 100MB recomendados para carga rápida en Meta Quest Browser.`);
        }
        if (glbCount > 10) {
            recommendations.push(`Se detectaron ${glbCount} archivos GLB/GLTF. Para Quest, se recomienda combinar geometrías estáticas o utilizar carga diferida (lazy loading).`);
        }
        if (textureTotalBytes > 40 * 1024 * 1024) {
            recommendations.push(`El peso acumulado de texturas (${QuestBuildOptimizer.formatBytes(textureTotalBytes)}) es alto. Considera compresión KTX2 Basis Universal.`);
        }
        // Recommended render parameters for Quest
        recommendations.push('Configura pixelRatioCap <= 1.25 en XRAppOptions para asegurar 90 FPS estables sin sobrecalentamiento del visor.');
        recommendations.push('Limita mapas de sombras a máximo 1024x1024 y usa 1 sola luz direccional con castShadow activo.');
        let questBudgetScore = 'Optimal';
        if (warnings.length > 3 || totalSizeBytes > QuestBuildOptimizer.MAX_RECOMMENDED_TOTAL_BYTES) {
            questBudgetScore = 'NeedsOptimization';
        }
        else if (warnings.length > 0) {
            questBudgetScore = 'Acceptable';
        }
        return {
            timestamp: new Date().toISOString(),
            projectRoot: rootDir,
            totalFiles: assets.length,
            totalSizeBytes,
            totalSizeFormatted: QuestBuildOptimizer.formatBytes(totalSizeBytes),
            assets,
            warnings,
            recommendations,
            questBudgetScore,
            summary: {
                glbCount,
                glbTotalSizeFormatted: QuestBuildOptimizer.formatBytes(glbTotalBytes),
                textureCount,
                textureTotalSizeFormatted: QuestBuildOptimizer.formatBytes(textureTotalBytes),
                largeFilesCount,
            },
        };
    }
    /**
     * Generates a recommended web manifest for Meta Quest Browser.
     */
    static generateQuestManifest(name = 'VXR WebXR Experience') {
        return {
            name,
            short_name: name.slice(0, 16),
            description: 'Interactive 3D WebXR Experience optimized for Meta Quest Browser and desktop.',
            start_url: './index.html',
            display: 'fullscreen',
            orientation: 'landscape',
            background_color: '#070b14',
            theme_color: '#0284c7',
            categories: ['games', 'productivity', 'utilities'],
            icons: [
                {
                    src: './icon.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any maskable',
                },
            ],
            meta_quest: {
                mode: 'webxr',
                recommended_fps: 90,
                supported_controllers: ['oculus-touch-v3', 'meta-quest-touch-plus'],
            },
        };
    }
    /**
     * Generates an informative QUEST_DEPLOY.md guide placed inside the output build directory.
     */
    static generateQuestDeployGuide(projectName = 'VXR App') {
        return `# Guía de Despliegue y Acceso en Meta Quest Browser

> **Proyecto:** ${projectName}  
> **Target:** Meta Quest WebXR Build

Esta compilación web está especialmente optimizada para ejecutarse en **Meta Quest Browser** (Meta Quest 2, 3, 3S y Pro) mediante la **WebXR Device API**.

---

## 🔒 Requisito Crítico: HTTPS Obligatorio

En Meta Quest Browser, la API WebXR está estrictamente deshabilitada bajo conexiones HTTP no seguras. Para que el botón **"ENTER VR"** funcione en el visor físico, la experiencia debe servirse mediante **HTTPS** (o \`http://localhost\` en depuración conectada por cable ADB).

### Opciones Rápidas de Despliegue Seguro:

1. **GitHub Pages (Gratuito y Directo):**
   - Sube esta carpeta \`dist/\` a tu repositorio GitHub.
   - En Configuración -> Pages, activa GitHub Pages.
   - Tu URL \`https://<usuario>.github.io/<repo>/\` tendrá certificado SSL automático.

2. **Vercel o Netlify:**
   - Ejecuta \`npx vercel deploy --prod\` o arrastra la carpeta a Netlify Drop.
   - Ambas plataformas proveen HTTPS automático de inmediato.

3. **Prueba Local Inalámbrica con Túnel Seguro (ngrok o Cloudflare Tunnel):**
   - Si corres un servidor local en el puerto 5173:
     \`\`\`bash
     npx ngrok http 5173
     \`\`\`
   - Copia la URL \`https://xxxx.ngrok-free.app\` generada y ábrela en el navegador de tu visor Meta Quest.

---

## 🥽 Cómo abrir la experiencia en Meta Quest

1. Colócate tu visor **Meta Quest 2 / 3 / 3S / Pro**.
2. Abre la aplicación integrada **Meta Quest Browser**.
3. Ingresa la dirección URL HTTPS de tu experiencia.
4. Una vez cargada la escena 3D, pulsa el botón flotante **"🥽 ENTER VR"**.
5. ¡Listo! Estarás inmerso en la experiencia con seguimiento 6DoF y mandos Touch interactivos.
`;
    }
}
