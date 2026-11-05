# Turismo Lavalleja

Sitio estático construido con Astro, React, Tailwind CSS y DaisyUI. Requiere Node.js 22.23.4 o superior; se recomienda Node.js 24.

```sh
npm ci
npm run dev
```

El servidor de desarrollo muestra su URL en la consola. Para comprobar y compilar la versión de producción:

```sh
npm run check
npm run build
npm run preview
```

La salida estática se genera en `dist/`. Las fotografías, fuentes y licencias proceden del HTML de referencia y se sirven localmente. Los créditos fotográficos y geográficos están disponibles en el pie del sitio.

## Despliegue con Coolify

Crear un recurso desde el repositorio, seleccionar el `Dockerfile` incluido y exponer el puerto 80. La imagen compila el sitio con Node.js y sirve `dist/` con nginx. No requiere variables de entorno ni un backend. También se puede servir `dist/` desde cualquier servidor de archivos estáticos.

## Estado de la migración

El material disponible para esta migración fue el HTML autocontenido en `base-project/`; no se incluyó el ZIP con los módulos fuente. Las secciones editoriales están separadas en componentes Astro y la navegación móvil es una isla React. La escena, el libro, el catálogo, el planificador y Gianna conservan el bundle JavaScript original, que incluye Three.js r170. Su división en módulos TypeScript y otras islas React requiere los fuentes originales o una reimplementación cuidadosa. Gianna funciona como demostración local y no está conectada a un backend.
