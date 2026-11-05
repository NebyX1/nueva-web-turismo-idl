# Arequita — refinamiento del modelo del encabezado

Consulta y desarrollo: 5 de noviembre de 2026. Módulo nuevo: `src/three/landmarks/arequita.ts`. Exporta `createArequita(): LandmarkModel`, con la misma interfaz de grupo, objetivo, límites, suelo y dirección de cámara.

La reconstrucción es una interpretación procedural de fotografías. No procede de un levantamiento topográfico, medición geodésica, escaneo ni fotogrametría. Las unidades y proporciones se eligieron para representar el aspecto del cerro y encuadrarlo en el recorrido; no constituyen medidas reales del sitio.

## Fotografías efectivamente observadas

Se inspeccionaron las imágenes mediante `view_image`, además de abrir sus páginas de procedencia. Las descargas de estudio permanecen fuera del repositorio, en `C:/Users/Nebyx/AppData/Local/Temp/lavalleja-nature-references/`. Ninguna fotografía se incorpora como textura ni se publica en `public/`.

1. **Ministerio de Ambiente, vista oblicua desde el agua.** [Página oficial del parque](https://www.gub.uy/ministerio-ambiente/politicas-y-gestion/parque-nacional-arequita), [fotografía](https://www.gub.uy/ministerio-ambiente/sites/ministerio-ambiente/files/inline-images/WhatsApp%20Image%202024-11-20%20at%2011.30.53%20AM.jpeg). Archivo temporal `arequita-official-ambiente.jpeg`. Se observa un escarpe largo, contrafuertes desiguales, fisuras profundas, hombro descendente y monte continuo hasta el borde rocoso. El agua ayuda a leer la relación de alturas, pero no se agrega un cauce hipotético al modelo.
2. **Intendencia de Lavalleja, fotografía del frente incluida en el afiche de ascenso.** [Página oficial](https://www.gub.uy/intendencia-lavalleja/comunicacion/calendario-actividades/subida-cerro-arequita), [imagen original del afiche](https://www.gub.uy/intendencia-lavalleja/sites/intendencia-lavalleja/files/styles/documento/public/2025-04/WhatsApp%20Image%202025-04-10%20at%2009.07.25%20%281%29.jpeg?itok=afn-SxRj). Archivo temporal `arequita-official-idl.jpeg`. Permite contrastar la silueta desde el campo: coronación baja e irregular, extremo de pared prominente y falda cubierta de vegetación. El texto del afiche no se utiliza como instrucciones ni como textura.
3. **Gigoma, vista frontal cercana.** [Ficha y autoría en Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Arequita_01.JPG), [fotografía original](https://upload.wikimedia.org/wikipedia/commons/8/89/Arequita_01.JPG). Archivo temporal `arequita-commons-gigoma.jpg`. La pared exhibe superficies extensas de piedra gris, grietas verticales no equidistantes, bloques de tamaños diferentes, juntas transversales interrumpidas y arbustos alojados en oquedades pequeñas. La corona tiene desniveles suaves y afloramientos, no una tapa plana.
4. **Bienflorencia, frente amplio desde el río.** [Ficha y autoría en Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Cerro_arequita.jpg), [fotografía original](https://upload.wikimedia.org/wikipedia/commons/4/47/Cerro_arequita.jpg). Archivo temporal `arequita-commons-bienflorencia.jpg`. Es la toma de la que también deriva la fotografía local `public/media/c809a84c8bead525.webp`; se cuenta como una misma vista, no como dos ángulos independientes. Expone la gran relación entre longitud de pared y altura visible, la prominencia central, el extremo más bajo y el monte que oculta la base.

También se volvieron a mirar las dos referencias temporales previamente registradas en `docs/research-nature-monuments.md`: `arequita-front.jpg` y `arequita-cliff.jpg`. La primera aporta detalle de la pared clara y las juntas; la segunda muestra el extremo oblicuo y la integración entre roca y talud. Los enlaces originales de Pinterest y Saatchi no respondieron satisfactoriamente en la nueva consulta, por lo que no se presentan como verificaciones web nuevas. Las cuatro fuentes numeradas anteriores sí se descargaron o verificaron en esta sesión.

## Fuente geológica primaria

El [Proyecto de selección y delimitación del área Arequita, Ministerio de Ambiente, mayo de 2023](https://www.gub.uy/ministerio-ambiente/sites/ministerio-ambiente/files/documentos/publicaciones/Proyecto%20de%20selecci%C3%B3n%20y%20delimitaci%C3%B3n%20Arequita.pdf), páginas impresas 15–16, identifica las riolitas de la Formación Arequita y su resistencia a la meteorización. Esto fundamenta la interpretación de roca volcánica fracturada; no se emplea una apariencia de caliza sedimentaria. La distribución exacta de fisuras, bloques y especies vegetales del modelo continúa siendo una aproximación visual.

## Cambios de geometría y materiales

- Huella definida mediante un contorno asimétrico de 17 puntos: frente largo, entrantes, hombros y extremos diferentes. El volumen se construye con una pared continua de 448 segmentos por 44 niveles, no mediante un cilindro o una multiplicación de cubos.
- Perfil amplio de aproximadamente 303 unidades en el afloramiento y unos 90 en la altura máxima del conjunto. La falda asciende hasta la pared; la franja de piedra expuesta queda mucho más baja en proporción al ancho.
- Treinta y una juntas principales con separaciones, profundidad, anchura y deriva propias. Los contrafuertes, escalones menores, rebajes y biseles de corona modifican la geometría y sus sombras. Cincuenta y tres lajas irregulares se unen en una sola malla, con sus bases embebidas en el escarpe.
- Corona triangulada sobre el contorno cóncavo real y subdividida tres veces. Se evita el abanico radial que podía plegarse sobre las grietas e invertir normales. Sus alturas varían; no es un disco plano ni una cubierta uniforme de pasto.
- Talud de altura continua, monte serrano denso, arbustos pequeños en la corona y vegetación dispersa en las grietas. Las raíces del monte usan la misma función de altura del suelo. Los arbustos superiores se apoyan en la altura interpolada del triángulo concreto mediante un índice espacial; no flotan sobre una cota fija.
- Tres mapas procedurales originales de 512 × 512: albedo, relieve y rugosidad. Aportan grano, manchas de meteorización, matices ocres, líquenes y juntas pequeñas. No se cargan imágenes fotográficas ni se generan nuevos assets raster. El campo de ruido de la textura se precalcula para reducir el costo de inicio.
- La vegetación y los bloques parcialmente enterrados utilizan instancias. El grupo tiene siete mallas y cinco materiales compartidos; no hay un material por árbol, roca o grieta.

## Cámara e integración

| Propiedad | Valor |
| --- | --- |
| `target` | `(14, 43, 6)` |
| `bounds.radius` | `205` |
| `bounds.height` | `98` |
| `groundY` | `0` |
| `cameraDirection` | `normalize(0.07, 0.12, 1)` |

La dirección muestra el frente largo desde unos tres cuartos leves: conserva la anchura aparente y permite leer el relieve de las fisuras. El radio se refiere al conjunto protagonista de roca y monte. El faldón de terreno que se funde con el suelo se extiende más: caja completa aproximadamente `x=[-214,214]`, `z=[-174,174]`, `y=[0,90]`.

La cámara del recorrido usa foco 130, revelado 92, barrido 0.18, altura inicial 52 y una elevación adicional de 44 durante la panorámica. Se revisó el encuadre integrado para mostrar el frente alto a la izquierda, la ladera descendente a la derecha y el verde superior. Estos parámetros describen la cámara virtual, no coordenadas del lugar real; las otras ocho paradas conservan sus cámaras.

## Comprobaciones realizadas

- TypeScript aislado, sin emitir archivos: `tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck src/three/landmarks/arequita.ts`, sin errores.
- Construcción real de `createArequita()` con Three.js en Node y un contexto canvas temporal: todas las posiciones, normales, UV, colores y matrices son finitas; los índices están dentro de rango. Ninguna normal de la corona apunta hacia abajo.
- Conteo: siete llamadas de dibujo para el modelo antes de pasadas de sombras, cinco materiales, tres texturas, 575 528 triángulos contando instancias, con 281 plantas por encima de la cota 70 del modelo. La cifra puede aumentar al contar las pasadas de sombra del renderizador.
- Construcción medida en Node en el mismo contexto de ejecución: aproximadamente 630 ms con canvas simulado. El tiempo real del navegador y la calidad del encuadre deben comprobarse en la escena integrada; no se afirma un rendimiento de GPU a partir de este ensayo.

Solo se modificaron este documento y el nuevo módulo `arequita.ts`. El cableado de imports/exports y la revisión visual del encabezado corresponden a la integración general.


## Ladera lateral y cobertura superior — ajuste a la fotografía del usuario

Se inspeccionó la referencia aportada en `C:/Users/Nebyx/AppData/Local/Temp/codex-clipboard-dd9dc28e-6387-42af-8512-c8bee6c94616.png`. La imagen se utiliza para interpretar la forma; no se incorpora a la web ni como textura. Muestra una coronación alta hacia la izquierda y una bajada prolongada hacia la derecha, con vegetación baja sobre roca expuesta.

El perfil longitudinal se interpola con segmentos Hermite monótonos, con cotas de composición `x/y: -132/82, -90/88, -45/85, 0/78, 45/66, 85/51, 120/34, 173/18`. Desde la mitad derecha, la base se abre gradualmente hasta 27 unidades adicionales y la corona se funde con el talud. Las juntas y las lajas pierden profundidad hacia ese extremo para que no quede una pared baja con fragmentos suspendidos.

La cima combina parches verdes procedurales, claros rocosos y una distribución estratificada de 497 arbustos. Cada raíz usa la altura interpolada del triángulo definitivo, tanto arriba como sobre la ladera descendente. Se conservan siete mallas mediante instancias, con materiales compartidos. La altura de encuadre incluye las copas más altas, que alcanzan aproximadamente 96.3 unidades.

La regresión de `npm run check:journey-models` comprueba directamente que la malla superior descienda hacia la derecha y que aumente la vegetación de la parte alta, además de los buffers, normales, índices y matrices de los cuatro modelos principales. La comparación media de alturas de las dos zonas en esta versión es 87.6 frente a 23.8 unidades de escena; no son mediciones del cerro real.
