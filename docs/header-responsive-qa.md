# Encabezado: distribución y comprobación adaptable

Revisión: 5 de noviembre de 2026.

## Regla de distribución

`src/styles/journey.css` coloca masthead, introducción, destino, estado de cámara, controles, ruta y mensaje de carga en filas intrínsecas. El pie con los controles externos a React participa en el flujo flex del hero. El encabezado tiene altura mínima, sin altura máxima ni offsets independientes para el texto. Los fondos 3D, fotografía, viñeta y timeline conservan posición absoluta.

Las filas crecen con títulos de varias líneas, aviso del monasterio, texto de carga y fuentes. El título usa interlineado 1,1 y puede dividir una palabra que exceda su columna. La ruta pasa a desplazamiento horizontal bajo 1400px y mantiene su foco dentro del contenedor.

No reintroducir posiciones `top`/`bottom`, alturas fijas o recorte de líneas para colocar bloques de texto del hero. En pantallas bajas, el contenido debe poder hacer crecer el encabezado y desplazar la página.

## Matriz revisada en navegador

Se seleccionaron las nueve paradas en cada tamaño: **117 combinaciones**, sin colisiones ni recortes detectados.

| Grupo | Viewports en píxeles CSS |
| --- | --- |
| Móvil vertical | 320×568, 360×640, 390×844, 430×932 |
| Cambio de columnas | 700×700, 701×700 |
| Horizontal y tablet | 844×390, 1024×768 |
| Escritorio bajo | 1280×500 |
| Cambio de navegación | 1399×900, 1400×900 |
| Escritorio amplio | 1920×860, 1920×1080 |

Se midieron las cajas DOM del contenido renderizado: separación entre introducción y destino; estado de cámara en móvil; destino, controles, ruta y pie; límites de texto y desbordamiento horizontal; intersecciones entre etiquetas y controles. La navegación desplazable se midió dentro de su área visible y dentro de cada botón. Se inspeccionaron además capturas de escritorio y móvil, incluido el aviso completo del monasterio.

Esta matriz verifica las dimensiones indicadas; la protección ante otros tamaños procede del flujo intrínseco y del ajuste de líneas. Repetirla cuando cambien títulos, fuentes, tamaños o distribución del encabezado.

Validación adicional: `npm run check` y `npm run build` completados correctamente. El build conserva el aviso existente de bundles mayores de 500 kB.
