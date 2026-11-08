# Revisión independiente del recorrido de Villa Serrana

Revisor: `stewart_vargas_quality`. Fecha: 8 de noviembre de 2026.

**Aprobado el mínimo presentable de la integración actual:** primero una visita completa al Ventorrillo de la Buena Vista, después una visita completa a la represa Stewart Vargas, con seis peces saltando en el embalse, pausa compartida, accesos entre tomas y luces específicas de cada motivo.

El [registro del runtime](../assets/stewart-vargas/runtime-review.json) fija el alcance, los hashes de las fuentes evaluadas, los once screenshots reales de navegador y las observaciones DOM/consola. Esta aprobación corresponde a esa integración y a los formatos visualmente revisados; no promete fotogrametría, precisión de levantamiento o validación de todos los dispositivos y páginas del sitio.

## Relación con la revisión nativa

La [revisión nativa V4](stewart-vargas-quality-review.md) y su [registro histórico](../assets/stewart-vargas/quality-review.json) permanecen intactos. Allí el criterio 9 estaba bloqueado porque no se había podido comprobar la aplicación real. Para esta iteración el agente principal recuperó el acceso al navegador y aportó evidencia WebGL real; el presente informe independiente cierra ese criterio para el alcance actual sin reescribir el estado histórico.

Los hashes de Blender, GLB y geometría empaquetada siguen coincidiendo con los aceptados en V4. La comparación fotográfica y sus límites están en aquel informe; los peces y la secuencia de cámara son ampliaciones del runtime.

## Evidencia examinada

El revisor abrió y observó las cuatro combinaciones escritorio/día, escritorio/noche, móvil/día y móvil/noche para ambos motivos: ocho capturas base. También examinó una captura real con un pez en el aire y las dos capturas del cambio automático nocturno. Son once imágenes WebGL reales recogidas por el agente principal en el navegador integrado, con viewports solicitados de 1440 × 900 y 390 × 844.

La imagen móvil nocturna de la represa fue devuelta inicialmente porque todavía recortaba el masthead. Se sustituyó, se volvió a abrir y se comprobó visualmente su encabezado completo. Su hash final es `07e009ad14bddb6ab364a82fdf8c7c92f615cafdaae06602e55e0d8f3f2bc914`. Las dos antiguas capturas móviles intermedias con scroll quedaron expresamente excluidas del dictamen.

El revisor no controló la interfaz durante esta revisión: realizó una inspección independiente de las capturas, leyó las fuentes y ejecutó las pruebas específicas. Las observaciones de navegador fueron recogidas por el agente principal y están identificadas por hash en el registro. Ningún render de Blender cuenta aquí como evidencia del navegador.

## Hallazgos

| Aspecto | Resultado |
|---|---|
| Orden y duración | Las nueve paradas públicas se conservan. Villa Serrana incluye dos visitas internas de 22 s cada una: Ventorrillo primero y represa después. |
| Cámara y progreso | El sampler conserva continuidad de posición, mirada y FOV entre fases y visitas; la barra representa el tramo completo de 44 s. |
| Lectura de cada motivo | Las etiquetas y los botones con `aria-pressed` identifican el edificio o la represa que aparece en cada toma. Ambos motivos tienen su propio acercamiento y panorámica. |
| Peces y agua | Se ve un pez sobre el embalse en la captura diurna. El código y las pruebas verifican seis trayectorias escalonadas dentro del lago real, salto, caída, gotas y pausa común con el agua. |
| Noche | Los focos iluminan el motivo seleccionado. Las tomas reales muestran el volumen del edificio y los paños/canales de la represa sin oscurecer toda la interfaz. |
| Escritorio y móvil | Las ocho capturas base finales incluyen el encabezado completo. En móvil, arquitectura y dique quedan por encima de las filas de texto. Los rectángulos DOM registrados están separados y no se registra overflow horizontal. |
| Consola | El registro aportado por el agente principal contiene `consoleErrors: []`. |

En el cambio nocturno real se registró primero Ventorrillo con progreso 0,4234886515 y después Represa con progreso 0,5079545606, ambos con scroll cero. Los dos reflectores se trasladan de forma instantánea al nuevo tramo; el Ventorrillo queda entonces con luz ambiental mientras la cámara vuela hacia la represa. Las imágenes conservan cielo e interfaz visibles, sin negro global. Ese cambio directo, heredado del resto del recorrido, se acepta como límite no bloqueante; no se afirma que exista un fundido entre equipos de luz.

## Pruebas y límites

El revisor ejecutó `check:stewart-vargas` y `check:journey-atmosphere`: ambas pasaron. La primera comprobó 279 contactos agua/hormigón, separación máxima de 0,0420 m, 96 muestras agua/terreno, 117206 triángulos incluyendo peces/contexto, secuencia de visitas, continuidad, seis peces, chapoteo y pausa. La segunda mantuvo el presupuesto de dos reflectores, colocación por motivo, día/noche, luna y liberación de recursos.

El agente principal informó además que la versión exacta final pasó `check` con 73 archivos y cero errores, avisos o sugerencias; `check:stewart-vargas`; y `build` en 16,87 s. El build conserva el aviso previo sobre bundles superiores a 500 kB. Esos resultados finales se identifican como reportados por el agente principal y no como nuevas ejecuciones del revisor.

La aceptación visual se limita al estilo escénico de esta reconstrucción y a los dos formatos examinados. Las capturas son fotogramas concretos: la confianza en orden, movimiento y pausa combina esas imágenes con el sampler, las pruebas y la observación registrada del cambio automático; no equivale a una certificación de vídeo completo o de simulación hidráulica. El resto del sitio no recibe una aprobación general por este informe.

No quedan bloqueantes detectados dentro del alcance revisado. El revisor creó únicamente este informe y su registro; no modificó modelos, fuentes del runtime ni dictámenes históricos de otros destinos.
