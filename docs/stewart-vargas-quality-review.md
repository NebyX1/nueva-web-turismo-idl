# Control independiente de Stewart Vargas

Revisor: `stewart_vargas_quality`. Fecha: 8 de noviembre de 2026. Versión: nativa V4.

**El activo nativo alcanza el mínimo presentable como reconstrucción escénica estilizada. La entrega final de la aplicación NO está aprobada.** El criterio 9, correspondiente a Three.js real e interfaz de escritorio/móvil, permanece `blocked-not-executed`.

El [registro verificable](../assets/stewart-vargas/quality-review.json) fija `nativeAssetApproved: true`, `approvedForFinalDelivery: false` y `browserWebGLReviewed: false`. Identifica por SHA-256 el archivo de Blender, el GLB y la geometría empaquetada efectivamente evaluados. El GLB revisado tiene SHA-256 `eb97158a95a284f92f56a7dcd3f0dd926b9426dc8c4ac3c518cd1c48bd88f2df`.

## Referencias examinadas

Se abrieron y observaron las siete fotografías originales enumeradas en el registro, más la lámina de las fotos 19-21 de la Intendencia. Se contrastaron una [vista aérea completa de Marcelo Campi](https://commons.wikimedia.org/wiki/File:Villa_Serrana_(218241731).jpeg), [la oblicua aguas abajo de Wikiloc](https://es.wikiloc.com/rutas-senderismo/sierra-del-guazuvira-29351749), [el reverso desde el embalse](https://es.wikiloc.com/rutas-senderismo/villa-serrana-represa-stewart-vargas-21623441), detalles de la pasarela moderna y dos vistas anteriores a su construcción. Estas últimas sólo sirven para estudiar el hormigón y el coronamiento; sus postes y cables históricos no se usaron como baranda actual.

La [Memoria de Información de la Intendencia de Lavalleja](https://www.gub.uy/intendencia-lavalleja/sites/intendencia-lavalleja/files/documentos/publicaciones/1%20Memoria%20de%20Informaci%C3%B3n.pdf), páginas PDF 77 y 123, respalda el largo de 120 m y la altura máxima de 13 m. La lámina de la página PDF 99 distingue expresamente Stewart Vargas de la foto 22 del Baño de la India. No se cuenta una imagen republicada como un ángulo nuevo y no se atribuyen medidas exactas a los detalles no documentados.

## Revisión del activo

Se inspeccionaron los ocho renders diurnos V4: frontal, oblicua izquierda, oblicua derecha, aguas arriba, perfil, aérea, pasarela y cresta. También se inspeccionaron frontal y oblicua izquierda nocturnas. Son imágenes producidas en Blender con materiales y luces de revisión offline, **no capturas de Three.js**. Sus rutas originales y hashes están en el registro.

| Criterio | Dictamen nativo | Observación |
|---|---|---|
|1. Identidad y silueta|Cumple|Dique largo y bajo con ritmo de hormigón y pasarela estrecha; no sustituido por una megarepresa curva o un puente genérico.|
|2. Coronamiento y caras|Cumple|Paños macizos, canales hundidos y dientes aguas arriba con agua. Perfil y cresta permiten distinguir el volumen real.|
|3. Proporción y altura|Cumple|Altura expuesta mayor junto a la depresión arbolada y menor hacia la pradera. Los 18 módulos son una aproximación visual declarada.|
|4. Pasarela actual|Cumple|Tablones rojizos, pasamanos, puntales inclinados, malla y apoyos visibles en la vista cercana.|
|5. Agua y contacto|Cumple en geometría estática|Embalse horizontal, seis canales activos angostos y colector inferior continuo. Se corrigieron las franjas sueltas de V1. El aspecto de la animación WebGL sigue pendiente.|
|6. Terreno y orillas|Cumple como entorno estilizado|Estribo rocoso/arbolado y margen de pradera diferenciados, embalse amplio con ribera irregular y salida baja. Plantación y casas son contexto simplificado.|
|7. Materiales|Cumple con límites|Hormigón cálido gris pardo, madera rojiza, malla y agua diferenciados en el render nativo. El detalle de desgaste es estilizado y no certifica los shaders de la web.|
|8. Integridad|Cumple en activo nativo|No se aprecian deformaciones graves, piezas sueltas ni agua suspendida en los diez renders; las vistas nocturnas conservan la lectura estructural.|
|9. Aplicación y móvil|Bloqueado, no ejecutado|Sin capturas reales de WebGL, interfaz, consola, transición de cámara ni móvil. No aprobado.|

El revisor ejecutó `npm run check:stewart-vargas`: pasó con 279 muestras de agua/hormigón y separación máxima de 0,0420 m, 96 muestras de agua/terreno, normales e índices válidos, 112604 triángulos, pausa del reloj y ambos extremos de la pasarela dentro de cinco formatos por tres posiciones de cámara. Esa comprobación de proyección es matemática y no prueba que la interfaz del navegador quede libre ni que sus shaders compilen y se vean correctamente.

## Alcance y trabajo pendiente

El resultado aceptado aquí es una reconstrucción visual proporcionada; no es un levantamiento métrico, una simulación hidráulica ni una reproducción fotogramétrica. Los materiales nativos y las luces de revisión no equivalen a la ejecución del programa GLSL, la iluminación o el agua animada del encabezado. El Ventorrillo distante del wrapper web tampoco fue inspeccionado visualmente en el recorrido real.

El agente principal informó que el control del equipo quedó interrumpido al no poder verificar con confianza la URL activa; también quedó indisponible la alternativa de navegador. Este revisor no intentó sortear esa restricción ni ejecutó controles de interfaz por otra vía.

Antes de aprobar la entrega completa se necesita una sesión de navegador autorizada que muestre el activo revisado dentro del recorrido: día y noche, acercamiento/panorámica/alejamiento, agua y espuma animadas, encuadres de escritorio y móvil, interfaz legible y consola sin errores. Esa evidencia debe volver a control independiente para cerrar el criterio 9. Hasta entonces, este informe no autoriza describir el producto completo como terminado o aprobado.

Esta revisión sólo creó su propio registro y este informe. No modificó el modelo ni las aprobaciones de otros destinos.
