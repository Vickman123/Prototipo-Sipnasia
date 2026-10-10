# SIPNASIA XR // Portal de Experiencias PC PUMA UNAM

Portal interactivo inmersivo desarrollado en **HTML5, CSS3, JavaScript y WebXR (Three.js)** para centralizar el acceso y ejecución de las experiencias virtuales del ecosistema **PC PUMA (DGTIC - UNAM)**.


https://vickman123.github.io/Prototipo-Sipnasia/
---

## 🚀 Experiencias Integradas

1. **SIMULADOR DE OPERADOR PC PUMA**
   - **Enlace Directo:** [https://vickman123.github.io/Simulador-operador-pcpuma/](https://vickman123.github.io/Simulador-operador-pcpuma/)
   - **Descripción:** Simulador 3D para la capacitación en la operación de préstamo de laptops, validación de credenciales, carritos de carga y registro de inventario.
   - **Compatibilidad:** Meta Quest 2/3/Pro, PC (WASD + Mouse) y Móvil.

2. **SHOOTER PC PUMA (VIRUS PURGE)**
   - **Enlace Directo:** [https://vickman123.github.io/FPS-WEBXR-VIRUS-PURGE/](https://vickman123.github.io/FPS-WEBXR-VIRUS-PURGE/)
   - **Descripción:** Videojuego arcade FPS de ciberseguridad en WebXR. Purga amenazas en memoria, elimina troyanos y derrota al jefe final Ransomware Lockbit.
   - **Compatibilidad:** Meta Quest (Mandos 6DoF con respuesta háptica) y PC.

3. **VISOR ARQUITECTÓNICO DE PC PUMA**
   - **Enlace Directo:** [https://vickman123.github.io/visor-xr/](https://vickman123.github.io/visor-xr/)
   - **Descripción:** Recorrido inmersivo y visualización espacial 3D arquitectónica para la inspección de infraestructura y módulos PC PUMA.
   - **Compatibilidad:** Meta Quest 3/3S Passthrough y navegadores de escritorio.

---

## 🥽 Características del Portal

- **Hub 3D Inmersivo WebXR:** Monolitos holográficos interactivos flotantes dentro de una red de sinapsis tridimensional.
- **Locomoción Completa con Joystick (Meta Quest 3S / 3 / 2):**
  - **Mano Izquierda:** Desplazamiento suave (adelante, atrás y strafe lateral según la orientación de la vista).
  - **Mano Derecha:** Giro rápido por pasos (*Snap Turn* de 45°) calibrado para máximo confort y evitar mareos.
  - **Teclado en PC:** Soporte nativo para teclas WASD o flechas de dirección en modo 3D.
- **Optimización de Alto Rendimiento para Meta Quest 3S:**
  - *Fixed Foveated Rendering* (FFR al 100%) en WebXR para máxima fluidez sin caídas de cuadros.
  - *Dolly Rig* sincronizado para que la cámara y los mandos 6DoF se muevan juntos en el espacio virtual.
  - *Throttling inteligente* en modo web 2D para que el navegador del visor no se trabe ni sobrecaliente.
  - Eliminación de pases de sombras dinámicas pesadas en favor de luces optimizadas por distancia.
- **Iluminación UNAM Cyberpunk Perfeccionada:**
  - Luz hemisférica suave bicolor (Cian Neón / Azul Marino Profundo UNAM).
  - Luz clave Oro Puma institucional y luz de borde para siluetas nítidas.
  - Luces de acento bajo cada monolito con el color temático de cada experiencia (Cian para Simulador, Magenta para Shooter, Oro para Visor).
  - Núcleo sináptico central con resplandor pulsante.
- **Soporte Nativo de Mandos 6DoF:** Punteros láser, retículas, gatillos calibrados y respuesta háptica por vibración al apuntar/disparar.
- **Acceso Rápido y Códigos QR:** Modal con generador de códigos QR para que los usuarios con visores Meta Quest o dispositivos móviles abran cualquier experiencia al instante sin teclear URLs.
- **Vista Previa Integrada:** Modal con reproductor embebido para probar las aplicaciones antes de abrirlas a pantalla completa.
- **Audio Procedural Web Audio API:** Efectos de sonido futuristas y sintéticos sin necesidad de cargar archivos de audio externos.
- **Estética UNAM Cyberpunk:** Paleta institucional con Azul Marino UNAM (`#002B49`), Oro Puma (`#D59B2D`), acentos cian neón y diseño glassmorphism responsivo.

---

## ⚡ Dinámica WebXR Preparada (`SipnasiaXR`)

El portal cuenta con un motor modular de dinámicas interactivas listo para talleres, dinámicas grupales o evaluaciones en tiempo real.

### Estructura de la API (`window.SipnasiaXR`)

```javascript
// Iniciar la dinámica preconfigurada de sincronización de nodos
window.SipnasiaXR.startDynamic('synapse-sync');

// Detener la dinámica
window.SipnasiaXR.stopDynamic();

// Registrar una nueva dinámica personalizada
window.SipnasiaXR.registerDynamic('mi-reto-personalizado', {
  name: 'Taller de Préstamo Express',
  description: 'Comprueba el conocimiento del flujo operativo en 60 segundos.',
  onStart: () => {
    console.log('Iniciando taller...');
  },
  onTick: (delta) => {
    // Lógica por cuadro
  },
  onNodeHit: (nodeMesh) => {
    // Interacción al apuntar o disparar al nodo
  },
  onEnd: () => {
    console.log('Fin de la dinámica.');
  }
});
```

### Eventos DOM emitidos:
- `sipnasia:dynamicStart`
- `sipnasia:dynamicEnd`
- `sipnasia:scoreUpdate`
- `sipnasia:node-activated`

---

## 🛠️ Cómo Publicar en GitHub Pages

1. Sube los cambios al repositorio remoto:
   ```bash
   git add .
   git commit -m "feat: Portal Sipnasia XR con enlaces PC PUMA y dinámica WebXR"
   git push -u origin main
   ```
2. En GitHub, ingresa a tu repositorio: **Settings** > **Pages**.
3. En **Branch**, selecciona `main` y la carpeta `/ (root)`.
4. Haz clic en **Save**. En un par de minutos estará disponible en:
   `https://vickman123.github.io/Prototipo-Sipnasia/`

---

## 🖥️ Prueba Local

Para ejecutarlo localmente y probar funciones WebXR con servidor local optimizado (con CORS, tipos MIME y soporte para visor Meta Quest en red local):

```bash
# Servidor local optimizado para WebXR:
python3 server.py

# O con servidor básico:
python3 -m http.server 8080

# Luego abre en tu navegador:
# http://localhost:8080
# O desde tu visor Meta Quest en la misma red Wi-Fi:
# http://<tu-ip-local>:8080
```
