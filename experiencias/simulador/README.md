# Guía de Assets y Personalización Visual - Simulador PC PUMA

Bienvenido a la carpeta de assets del simulador. Aquí puedes colocar tus propias imágenes, texturas y sonidos para reemplazar los elementos visuales generados por código.

---

## 📁 Estructura de Carpetas

```
public/
├── pc_puma_logo.png           # Logo principal del menú de inicio
├── images/                    # Banners de pared, carteles, pósters informativos
│   ├── wall_banner.png        # Letrero panorámico de pared trasera (2048 x 512 px)
│   └── poster_rules.png       # Cartel de reglamento PC PUMA en pared (768 x 1024 px)
├── textures/                  # Texturas para objetos 3D interactivos
│   ├── credential_front.png   # Frente de credencial de alumno (1024 x 640 px)
│   ├── credential_back.png    # Reverso de credencial con código de barras (1024 x 640 px)
│   ├── laptop_wallpaper.png   # Fondo de pantalla de laptop encendida (1024 x 640 px)
│   ├── laptop_lid_logo.png    # Sticker / logo exterior de la tapa de laptop (512 x 512 px)
│   ├── nfc_pad.png            # Diana circular de lectura del sensor NFC (512 x 512 px)
│   ├── tray_label.png         # Rotulación de la bandeja de entrega (512 x 256 px)
│   └── floor_tiles.png        # Textura de piso institucional (1024 x 1024 px repetible)
├── audio/                     # Efectos de audio opcionales (.mp3 / .wav)
│   ├── nfc_beep.mp3           # Bip de lectura NFC
│   ├── laptop_snap.mp3        # Clic mecánico de acople de laptop
│   └── success.mp3            # Chime de trámite exitoso
└── models/                    # Modelos 3D (.glb / .gltf) futuros
```

---

## 🎨 Especificaciones Técnicas Recomendadas

| Elemento | Archivo | Dimensiones Recomendadas | Proporción | Formato | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Logo de Menú** | `pc_puma_logo.png` | 1000 x 500 px | 2:1 | PNG transparente | Ya activo en la cabecera del menú |
| **Credencial Frente** | `textures/credential_front.png` | 1024 x 640 px | 1.6:1 (CR80) | PNG | Foto del alumno, escudo UNAM, nombre y matrícula |
| **Credencial Reverso** | `textures/credential_back.png` | 1024 x 640 px | 1.6:1 | PNG | Código de barras, banda magnética, términos |
| **Pantalla Laptop** | `textures/laptop_wallpaper.png` | 1024 x 640 px | 16:10 | PNG / JPG | Escritorio institucional con accesos directos |
| **Logo Tapa Laptop** | `textures/laptop_lid_logo.png` | 512 x 512 px | 1:1 | PNG transparente | Logo PC PUMA centrado en la carcasa |
| **Diana Lector NFC** | `textures/nfc_pad.png` | 512 x 512 px | 1:1 | PNG | Símbolo circular de ondas contactless |
| **Letrero Pared** | `images/wall_banner.png` | 2048 x 512 px | 4:1 panorámico | PNG / JPG | UNAM • PC PUMA detrás del operador |
| **Póster Reglamento** | `images/poster_rules.png` | 768 x 1024 px | 3:4 vertical | PNG / JPG | Infografía de normas de préstamo |
| **Piso de Sala** | `textures/floor_tiles.png` | 1024 x 1024 px | 1:1 seamless | PNG / JPG | Loseta vinílica o granito pulido |

---

## 🚀 ¿Cómo sustituir un elemento?

1. Diseña tu imagen en Canva, Photoshop, Figma o Illustrator usando las dimensiones de la tabla.
2. Guarda el archivo con el **nombre exacto** indicado.
3. Cópialo dentro de su carpeta en `public/`.
4. Ejecuta `npm run build` (o inicia `npm run dev`) y el simulador cargará automáticamente tu nuevo diseño.
