import { VXRDoctor } from './commands/doctor.js';
import { VXRBuildCommand } from './commands/build.js';
export async function runCLI(argv = process.argv.slice(2)) {
    const args = [...argv];
    const command = args[0] || 'help';
    // Flag helpers
    const getFlagValue = (flag) => {
        const idx = args.indexOf(flag);
        if (idx !== -1 && idx + 1 < args.length) {
            return args[idx + 1];
        }
        const prefix = `${flag}=`;
        const match = args.find((a) => a.startsWith(prefix));
        if (match) {
            return match.slice(prefix.length);
        }
        return null;
    };
    const hasFlag = (...flags) => {
        return flags.some((f) => args.includes(f));
    };
    if (hasFlag('--version', '-v')) {
        console.log('VXR Framework CLI v0.1.0');
        return;
    }
    if (command === 'help' || hasFlag('--help', '-h') || args.length === 0) {
        console.log(`
VXR Framework CLI — Herramienta de compilación y diagnóstico WebXR

USO:
  vxr <comando> [opciones]

COMANDOS:
  doctor                     Diagnostica el entorno, WebXR, HTTPS y presupuesto de assets
  build                      Compila la experiencia para producción (por defecto: --target web)
  help                       Muestra esta ayuda

OPCIONES DE BUILD:
  --target <web|quest|quest-pwa>  Selecciona la plataforma de compilación objetivo:
                                    web:       Build web estándar para navegadores 2D/3D (por defecto)
                                    quest:     Build optimizada para Meta Quest Browser (WebXR + PWA)
                                    quest-pwa: Placeholder para futuro empaquetado Horizon Store
  --optimize                 Aplica presets de rendimiento seguros para Meta Quest (pixelRatio, sombras)
  --outDir <directorio>      Especifica el directorio de salida (por defecto: dist)
  --root <directorio>        Especifica la carpeta raíz del proyecto (por defecto: directorio actual)
  --verbose                  Muestra registros detallados durante la compilación

EJEMPLOS:
  vxr doctor
  vxr build
  vxr build --target web
  vxr build --target quest
  vxr build --target quest --optimize
`);
        return;
    }
    if (command === 'doctor') {
        const projectRoot = getFlagValue('--root') || process.cwd();
        const report = VXRDoctor.run(projectRoot);
        VXRDoctor.printReport(report);
        if (report.overallStatus === 'fail') {
            process.exitCode = 1;
        }
        return;
    }
    if (command === 'build') {
        const target = (getFlagValue('--target') || 'web');
        const outDir = getFlagValue('--outDir') || undefined;
        const projectRoot = getFlagValue('--root') || process.cwd();
        const optimize = hasFlag('--optimize');
        const verbose = hasFlag('--verbose');
        const builder = new VXRBuildCommand();
        try {
            const result = await builder.execute({
                projectRoot,
                outDir,
                target,
                optimize,
                verbose,
            });
            if (!result.success) {
                process.exitCode = 1;
            }
        }
        catch (error) {
            console.error(`\n[VXR CLI Error]: ${error.message || error}\n`);
            process.exitCode = 1;
        }
        return;
    }
    console.error(`[VXR CLI] Comando desconocido: "${command}". Ejecuta "vxr --help" para ver los comandos disponibles.`);
    process.exitCode = 1;
}
