# Revisión independiente — Salto del Penitente, Lavalleja

Fecha: 2026-11-06. Revisor: agente `penitente_quality`.

**Estado actual: integrado por aceptación explícita del usuario el 6 de noviembre de 2026.** El usuario aceptó la forma final y ordenó cerrar e integrar. El cierre del dictamen independiente quedó interrumpido; no se declara una aprobación independiente final. La identidad aceptada está en `assets/penitente/user-acceptance.json`. Los rechazos de candidatos anteriores que siguen abajo son históricos.

## Alcance y método

Se estudia exclusivamente el Salto del Penitente sobre el arroyo Penitente, Lavalleja, Uruguay. Se contrastaron fotografías de distintos autores, años, caudales, alturas de cámara y márgenes. Las observaciones de forma que siguen son una interpretación visual de esas fotografías, no un levantamiento topográfico ni una reconstrucción fotogramétrica calibrada.

Para evitar ambigüedad, **izquierda y derecha se refieren a una persona situada aguas abajo, mirando hacia la cascada y aguas arriba**. No designan márgenes hidráulicas ni ejes de Three.js.

No se usó un navegador local. La evaluación prevista utiliza datos exportados y renders offline en Blender CPU. Eso permite revisar geometría, continuidad, composición y una aproximación de materiales/agua; no demuestra el aspecto del shader, las transparencias, la animación ni el rendimiento WebGL del sitio.

Las referencias locales de estudio están fuera del repositorio:

`C:/Users/black/.codex/visualizations/2026/11/05/01a1aa96-24e3-7f02-8d33-b969869ac95f/penitente-rebuild/`

Los manifiestos `references.json`, `extra-references.json` y `acal-references.json` conservan enlaces y archivos. Las fotografías se usan como evidencia de estudio; este documento no autoriza incorporarlas a los recursos públicos del sitio.

## Referencias visuales inspeccionadas

Los identificadores corresponden a los archivos locales. Hay vistas repetidas del mismo motivo; varias imágenes parecidas no se cuentan como nuevos ángulos.

| ID | Fuente y autor | Vista útil y evidencia |
| --- | --- | --- |
| R10 | [Salto del Penitente, Lavalleja, Uruguay — Chrono-strife, 2013](https://commons.wikimedia.org/wiki/File:Salto_del_Penitente,_Lavalleja,_Uruguay.jpg) | Frente bajo desde el cauce/poza. Forma de la canaleta, cambios de ancho del agua, peldaños irregulares, pared izquierda y rampa derecha. Referencia principal de detalle. |
| R11 | [Salto del Penitente — Fenris uy, 2014](https://commons.wikimedia.org/wiki/File:Salto_del_Penitente.jpg) | Frente algo más cercano. Desembocadura en la poza, roca rosada/gris, borde lateral quebrado y agua apoyada en la pendiente. |
| R03 | [Febrero 2014 minas 100 — Wilson Daniel Alonzo](https://commons.wikimedia.org/wiki/File:Febrero_2014_minas_100.JPG) | Oblicuo frontal más alto. La cascada es un surco entre dos masas, con inclinación y varios cambios de dirección. |
| R08 | [Salto del Penitente-2 — Jimmy Baikovicius, 2014](https://commons.wikimedia.org/wiki/File:Salto_del_Penitente-2.jpg) | Vista lateral/oblicua cerrada de la corriente. Confirma un tobogán de roca en contacto con el agua, no una lámina vertical libre. |
| R04 | [Penitente 00 — Fedaro, subida en 2006](https://commons.wikimedia.org/wiki/File:Penitente_00.jpg) | Vista elevada abierta desde el sector del parador. Escala del farallón, lomo contrario, monolito partido y posición del curso respecto al paisaje. Distorsión de gran angular: no extraer medidas absolutas. |
| R05 | [Penitente 02 — Fedaro, subida en 2006](https://commons.wikimedia.org/wiki/File:Penitente_02.jpg) | Vista desde el interior del parador. Comprueba relación del conjunto con el mirador, pero el encuadre y la óptica no sirven para medir alturas. |
| R06 | [Roca del Salto del Penitente — Jimmy Baikovicius, 2014](https://commons.wikimedia.org/wiki/File:Roca_del_Salto_del_Penitente.jpg) | Detalle del gran bloque superior partido en dos piezas verticales, con grieta central y base integrada en la ladera. |
| R02 | [Febrero 2014 minas 073 — Wilson Daniel Alonzo](https://commons.wikimedia.org/wiki/File:Febrero_2014_minas_073.JPG) | Talud y losas del entorno. Material, vegetación en grietas y afloramientos de varios tamaños. No identifica por sí sola el trayecto del agua. |
| R01 | [Cascada del Penitente - Minas — Dornaleche y Reyes, 1907](https://commons.wikimedia.org/wiki/File:Cascada_del_Penitente_-_Minas.tif) | Foto histórica frontal. Corrobora el encajonamiento y la asimetría de grandes masas; no usar para color, vegetación actual ni anchura de caudal. |
| B01, B10 | [Es Parte del Viaje — serie del Salto del Penitente](https://espartedelviaje.com/que-hacer-en-villa-serrana/) · [aérea del salto y escalera](https://espartedelviaje.com/wp-content/uploads/2026/10/salto-del-penitente-dron.jpg) · [vista abierta del farallón](https://espartedelviaje.com/wp-content/uploads/2026/10/tirolesa-salto-del-penitente.jpg) | Dos vistas aéreas/altas abiertas. Perfil de la gran ladera izquierda con monolito doble, pared cortada debajo y faja oscura casi horizontal junto a la poza. El agua y la entrada superior quedan parcialmente ocultas. |
| B02, B09 | [Serie anterior](https://espartedelviaje.com/que-hacer-en-villa-serrana/) · [cañón](https://espartedelviaje.com/wp-content/uploads/2026/10/canon-salto-del-penitente.jpg) · [rocas y agua](https://espartedelviaje.com/wp-content/uploads/2026/10/rocas-salto-del-penitente.jpg) | Oblicuos desde el lomo derecho, aguas abajo. Diferencia entre pared izquierda alta y rampa derecha; poza larga en el fondo de la hendidura a caudal bajo. |
| B07, B08 | [Serie anterior](https://espartedelviaje.com/que-hacer-en-villa-serrana/) · [persona al pie](https://espartedelviaje.com/wp-content/uploads/2026/10/cascada-salto-del-penitente.jpg) · [frente desde el agua](https://espartedelviaje.com/wp-content/uploads/2026/10/cascada-penitente-lavalleja.jpg) | Pie de cascada con escala humana y vista baja frontal. Caudal escaso: permite ver la roca bajo la corriente. |
| B03 | [Pozo al pie — misma serie](https://espartedelviaje.com/wp-content/uploads/2026/10/pozo-salto-del-penitente.jpg) | Mirada aguas abajo hacia una poza más abierta, de contorno irregular y cerramiento de bloques/monte. Evita confundirla con la poza estrecha inmediata del salto. |
| A22 | [ACAL — relato y galería, junio de 2011](https://www.clubacal.org.uy/canotaje_travesia/relatos/arroyo-penitente_julio2011/index.php) · [foto 22](https://www.clubacal.org.uy/wp-content/uploads/legacy/canotaje_travesia/relatos/arroyo-penitente_julio2011/img/vsp11_22.jpg) | Ángulo opuesto alto desde roca junto al coronamiento, hacia escalera y poza. Control del encajonamiento y los niveles; no muestra completo el perfil del agua. |
| A23, A24 | [ACAL — misma galería](https://www.clubacal.org.uy/canotaje_travesia/relatos/arroyo-penitente_julio2011/index.php) · [cauce superior](https://www.clubacal.org.uy/wp-content/uploads/legacy/canotaje_travesia/relatos/arroyo-penitente_julio2011/img/vsp11_23.jpg) · [entrada en la canaleta](https://www.clubacal.org.uy/wp-content/uploads/legacy/canotaje_travesia/relatos/arroyo-penitente_julio2011/img/vsp11_24.jpg) | El arroyo atraviesa una superficie rocosa baja con canales someros y rápidos cortos, y se estrecha entre masas de roca antes del descenso principal. A24 ofrece el oblicuo superior contrario al de la rampa aguas abajo. Personas en la coronación sirven como escala relativa. |
| A30 | [ACAL — salto crecido, foto 30](https://www.clubacal.org.uy/wp-content/uploads/legacy/canotaje_travesia/relatos/arroyo-penitente_julio2011/img/vsp11_30.jpg) | Caudal alto después de lluvia. El agua ensancha sobre la misma roca. No usar este estado excepcional para inventar una cascada ancha permanente. |
| F01 | [Desembocadura Salto del Penitente — Jimmy Baikovicius, 2014](https://www.flickr.com/photos/jikatu/16060501095/) | Continuación aguas abajo entre bloques y monte. El sistema no termina en un estanque aislado. |
| O01 | [Sitio oficial del parque](https://saltodelpenitente.com/es/) · [foto del salto](https://saltodelpenitente.com/es/wp-content/uploads/2019/08/home-salto.jpg) | Corroboración frontal del mismo lugar; fotografía de tamaño menor y motivo muy similar a R11. |

También se revisaron fotos auxiliares del mirador y del valle. No se usan como prueba del cauce las imágenes de otras paradas de los artículos/recorridos (por ejemplo Baño de la India), interiores, comidas ni resultados de búsqueda de otros saltos. Los archivos Commons que devolvieron HTTP 429 no forman parte de la evidencia inspeccionada.

### Fuentes de escala y material

- El [sitio oficial del parque](https://saltodelpenitente.com/es/) describe más de **60 metros de longitud**. Ese dato no justifica modelar 60 metros de desnivel vertical. No hay en este estudio una medición calibrada del desnivel.
- La [investigación geológica de Udelar sobre el área](https://www.colibri.udelar.edu.uy/jspui/bitstream/20.500.12008/17115/1/uy24-18192.pdf), apartado 3.5, identifica granito-gneis en el bloque Penitente. Para el aspecto visible mandan las fotos: superficies grises a rosadas/marrones, fracturas y líquenes claros, con oscurecimiento localizado por humedad.
- Las personas en A23/A24 y B07 permiten detectar escala fantástica, pero no son una regla métrica exacta por la perspectiva. No se usan las coordenadas EXIF de R10 para registrar cámaras: sus signos/localización publicados son inconsistentes con Uruguay.

## Rasgos que deben sobrevivir al estilo gráfico

1. **Dos masas desiguales.** A izquierda hay un farallón alto, de grandes caras de roca, que asciende hasta una ladera cubierta de monte. A derecha domina un lomo más bajo y ancho de losas inclinadas. No hay dos paredes gemelas ni un embudo radial simétrico.
2. **El monolito partido pertenece al conjunto.** Las vistas abiertas muestran dos piezas altas, próximas y separadas por una grieta en la parte alta del farallón. Su apoyo, inclinación y escala deben sentirse como roca del relieve, no como dos columnas sueltas decorativas.
3. **Una hendidura inclinada, angosta y quebrada.** El agua ocupa una fracción del frente rocoso. El tramo visible baja sobre roca, cambia de dirección/ancho y se abre al pie. La lectura principal no es una caída libre desde una cornisa uniforme.
4. **Peldaños desiguales y continuidad.** Hay cambios locales de pendiente y rebordes, pero no una escalera de terrazas regulares. El centro de la corriente no debe atravesar un bulto de roca, saltar entre parches desconectados o subir entre estaciones.
5. **Coronación conectada.** Arriba hay arroyo, rápidos someros, lajas y una constricción antes de la canaleta. El agua entra desde terreno existente. La cabecera no es un cilindro aislado, un borde de pared artificial o una poza circular elevada.
6. **Poza inmediata alargada y encajada.** Sigue la base de la pared y está limitada de forma desigual por roca alta y losas bajas. Aguas abajo el cauce continúa hacia pozas más abiertas. No es un disco perfecto ni una piscina pegada bajo una pared.
7. **Grandes planos primero; detalle después.** Se reconocen lajas, caras mayores y fracturas orientadas. Bordes parcialmente redondeados por meteorización conviven con cortes angulosos. No equivale a un montón de cantos esféricos, bloques idénticos o ruido triangular uniforme.
8. **Agua estrecha con espuma localizada.** A caudal bajo/medio se ve roca oscura junto al flujo; la espuma se concentra en resaltes y en la entrada a la poza. La poza se lee más oscura, con reflejos y transparencia variable, no como una lámina blanca o cian opaca.
9. **Vegetación serrana en posiciones plausibles.** Monte denso en la parte alta y el valle; arbustos, pastos y líquenes aprovechan grietas/represas de suelo. La vegetación acompaña las masas y no tapa las uniones del agua para ocultar defectos.
10. **Escala contenida y paisaje serrano.** La roca, el arroyo, el monolito y las personas de referencia deben conservar relaciones creíbles. No convertir el conjunto en un cañón alpino con una catarata monumental. Tampoco reducir el salto a una fuente ornamental.

## Matriz de aceptación visual

Las notas se asignan comparando los renders con referencias de orientación equivalente. Cada apartado se puntúa de 0 a 10. Para un **mínimo presentable**, se exige un total ponderado de al menos 80/100, todos los apartados dominantes con 7/10 o más, y ningún fallo bloqueante. Una puntuación técnica no anula un fallo de identidad visual.

| Apartado | Peso | Prueba requerida | Rechazo concreto |
| --- | ---: | --- | --- |
| Silueta y asimetría de masas | 25 | Frente abierto, ambos oblicuos y vista alta; comparación con R04/B01/B09 | Dos paredes simétricas; pared vertical plana; montículo cónico; rampa derecha ausente; grandes masas colocadas al revés; monolito que parece un objeto ajeno. |
| Canaleta, pendiente y recorrido del agua | 25 | Frente, perfil/oblicuos, cenital y vista desde arriba; comparación con R08/R10/A24 | Cortina libre dominante; tubo blanco recto; terrazas equidistantes; corriente flotante, interrumpida, que atraviesa roca o que remonta; cabecera sin arroyo. |
| Pozas y continuidad aguas abajo | 15 | Frente bajo, cenital y vista aguas abajo; comparación con R10/B03/B08/F01 | Estanque circular aislado; agua a distinta cota sin transición; orilla que corta la poza con pared artificial; cauce que termina sin salida. |
| Escala y proporciones | 15 | Mismas cámaras con una escala humana diagnóstica y, si existe, mirador; A23/A24/B07 | Desnivel inventado a partir de «60 m»; personas/árboles desproporcionados; canal excesivamente ancho respecto al farallón; gran roca ornamental diminuta o gigante. |
| Planos, fracturas y material rocoso | 10 | Render de arcilla sin vegetación y render de material con luz neutra; R06/R10/R11 | Ruido de polígonos como única forma; bloques redondos repetidos; grietas sin estructura; roca uniforme negra, violeta, naranja o brillante como plástico. |
| Agua, humedad y vegetación | 10 | Render de material de frente y oblicuo cercano; R10/R11/B08 | Espuma en toda la poza; agua cian opaca; humedad distribuida al azar; vegetación usada para ocultar agujeros. El shader exacto WebGL queda fuera del alcance offline. |

Se puede simplificar detalle fino, especies de plantas, equipamiento menor y microtextura. No se puede simplificar la dirección del cauce, las masas principales, las cotas relativas ni la relación entre roca y agua hasta perder el lugar.

### Fallos bloqueantes, independientemente de la nota

- La primera lectura sigue siendo «cascada genérica» y no permite reconocer el conjunto del Penitente en las vistas abiertas.
- Una masa dominante, la canaleta o la poza cambia de forma de manera incompatible entre las vistas: el parecido solo funciona desde una cámara.
- El agua está claramente separada de la roca, atraviesa caras o queda cortada, especialmente desde los laterales.
- Existen agujeros visibles, picos de malla, costuras, caras invertidas, z-fighting o una pared/losa que bloquea el cauce sin razón observada.
- Solo se entrega una imagen favorecedora, imágenes a muy baja resolución o vistas con vegetación/espuma que impiden juzgar la forma.
- Los renders no se pueden vincular a la geometría exacta que usa la implementación, o los archivos cambian después de la revisión.

## Paquete exacto que se debe presentar al revisor

1. Ruta y SHA-256 de la exportación de geometría (`.glb`, `.gltf` o JSON de arrays), de los módulos fuente relevantes y del exportador. Si hay dependencias locales que determinan la forma, incluirlas en la identidad del paquete. Registrar commit/estado de trabajo cuando sea posible.
2. Exportar **los arrays, índices, normales, colores, UV y transformaciones efectivamente construidos por el código**. Incluir roca, lecho, terreno, agua/espuma, pozas, vegetación relevante y monolito. Indicar unidades y convención de ejes. No sustituir después la escena por una recreación manual en Blender.
3. Un manifiesto que liste nodos, materiales y cajas envolventes, y explique qué materiales/shaders se aproximaron para el render offline. Los conteos son controles de integridad, no criterios de belleza o fidelidad.
4. Imágenes de al menos 1400 px de lado largo, sin recorte que oculte la base o la coronación: frente abierto; frente bajo desde la poza; oblicuo izquierdo; oblicuo derecho; vista alta/cenital; vista desde la entrada superior mirando aguas abajo. Cuando la roca oculte el agua en un lado, añadir una cámara de diagnóstico ligeramente elevada y conservar también la vista ocluida realista.
5. Para las vistas frente/oblicuos/cenital, una versión de arcilla con vegetación oculta y agua con color diagnóstico, y una versión con materiales aproximados. Sombras suaves y luz neutra para que un material vistoso no esconda la forma. La vista de arcilla no modifica posiciones ni índices.
6. Un detalle del contacto agua-roca en cabecera, tramo medio y pie; una vista que muestre salida de la poza; y una escala humana temporal o barra de medida fuera del recurso final.

Las cámaras de comparación se alinearán con sus referencias antes de juzgar proporciones. Si se marca el contorno de masas y ocho hitos (entrada, cambios principales de dirección, pie, extremos de poza, alto del farallón, hombro derecho y monolito), el desplazamiento tras una alineación razonable debe ser pequeño respecto al tamaño del conjunto. Un error sistemático que requiera mover cada cámara de forma incompatible será un fallo de geometría, no un permiso para seguir ajustando el encuadre. No se exige una coincidencia fotogramétrica de píxel sin intrínsecos conocidos.

## Procedimiento y registro de dictamen

1. Calcular hashes y verificar integridad del paquete antes de renderizar. Registrar ruta, fecha, fuente/exportación y hash; contrastarlos de nuevo al terminar.
2. Revisar primero la geometría neutra en todas las cámaras. Marcar cada problema por vista y zona, con evidencia de referencia. Resolver los bloqueantes antes de puntuar materiales.
3. Revisar agua y pozas: cotas, conectividad, apoyo, anchos variables y continuidad. Examinar perfiles/oblicuos para detectar un plano flotante que el frente pueda esconder.
4. Comparar masas y escala con las vistas abiertas, y después planos de roca, materiales, humedad y vegetación con las vistas cercanas.
5. Emitir `RECHAZADO` o `APROBADO: mínimo presentable para esta geometría`, con notas de la matriz, bloqueantes, limitaciones y hashes concretos. La aprobación debe ser explícita del revisor independiente.
6. Si se modifica la geometría, el recorrido del agua, sus transformaciones o la composición después del dictamen, la aprobación anterior no cubre el nuevo paquete. Repetir las vistas afectadas y confirmar el nuevo hash.

Plantilla del resultado:

```text
Dictamen: RECHAZADO / APROBADO: mínimo presentable para esta geometría
Revisor y fecha:
Archivo de geometría, SHA-256:
Fuente/exportador, SHA-256:
Renders y cámaras examinados:
Notas de matriz y total:
Fallos bloqueantes (o ninguno):
Comparaciones de referencia que sustentan el resultado:
Limitaciones: render offline; no revisión WebGL ni shader/animación final.
```

**Situación al crear este plan: SIN APROBACIÓN; aún no se había recibido el paquete exacto.**

## Dictamen formal del candidato v6 — 2026-11-06

**RECHAZADO.** La revisión visual obtiene **64,5/100** y conserva tres fallos bloqueantes. El candidato no cumple el mínimo de 80/100 ni el requisito de 7/10 en todos los apartados dominantes. No se creó `assets/penitente/quality-approval.json`.

### Identidad examinada

Directorio del paquete y evidencia: `C:/Users/black/.codex/visualizations/2026/11/05/01a1aa96-24e3-7f02-8d33-b969869ac95f/penitente-rebuild/v6/`.

| Archivo | SHA-256 verificado |
| --- | --- |
| `penitente.glb` | `4518d6df52c78c17cbe3f21a677b1a3e0c84a2f84a287f3ba313b49ab778c35f` |
| `review-scene.json` | `a36f5efface1f35605b7c8caf5f2046ea8372f5f7f133a068bd474a80fb33758` |
| `packed.json` / `src/three/landmarks/penitenteAsset.json` | `a5cb07a049ebcba6e559df12f437b561953e2d30a50968e7db51b15f48ff09f9` |
| `src/three/landmarks/penitente.ts` | `c1b4ca835e436734790afad47ad7566cd284d6ac1b3084ad1308f54b52e67880` |
| `src/three/landmarks/penitenteMesh.ts` | `71b273d41d28c3948648f3ea00f83601dea7d10571b128abab42edef4738c619` |
| `src/three/landmarks/penitenteWater.ts` | `4d140c2a8bcdfedb81c49a51170e23397d75f73b8536b858ab78a1ad4bdb3c68` |
| `src/three/landmarks/penitenteRock.ts` | `37f38b236614e0ccbb37fb4a546cd60079f109ccaa9b1a64ebbff1e5cf3e033e` |

Se inspeccionaron las **20 imágenes**: las nueve vistas de `material/` (`front`, `right-oblique`, `left-oblique`, `aerial`, `upstream`, `outlet`, `close`, `tour`, `tour-top`), las seis vistas de `clay/` (`front`, ambos oblicuos, `aerial`, `upstream`, `outlet`), `night/front`, `night/tour`, `web/tour`, `web/tour-top` y `flow/front`. Los hashes y dimensiones de cada imagen quedaron registrados en `v6/independent-review.json`.

La comparación `v6/independent-front-comparison.jpg` coloca R10 junto a `material/front.png`, sin retocar la forma de ninguna imagen. `v6/independent-aerial-comparison.jpg` coloca B10 junto a la vista aérea de arcilla. Son comparaciones de lectura visual; no superposiciones calibradas de cámaras.

### Evidencia técnica que pasó

- Los cinco archivos de runtime coinciden con `review-manifest.json`. La decodificación independiente de las cinco piezas del recurso empaquetado produce exactamente las mismas posiciones e índices de `review-scene.json`: error máximo de posición 0 en esa comparación.
- El macizo tiene 54.002 vértices y 108.000 triángulos en una única componente conectada. La auditoría independiente encontró 0 bordes abiertos/no manifold, 0 triángulos duplicados y 0 triángulos degenerados; orientación global positiva.
- Se ejecutó `check-penitente-rebuild.mjs --candidate`: pasó, con 266.938 triángulos incluyendo vegetación y 605 muestras de contacto (separación máxima reportada 0,275). Esto verifica las muestras examinadas, no todos los puntos continuos de la superficie.
- La asimetría alta izquierda/baja derecha, la cabecera conectada, el monolito con raíz común, la poza alargada y el contacto del agua mejoraron respecto a los prototipos. La respuesta nocturna aproximada ya evita una cascada con iluminación independiente del entorno.

### Puntuación visual

| Apartado | Nota / 10 | Peso | Aporte / 100 |
| --- | ---: | ---: | ---: |
| Silueta y asimetría | 7 | 25 | 17,5 |
| Canaleta y recorrido | 6 | 25 | 15 |
| Pozas y continuidad | 7 | 15 | 10,5 |
| Escala y proporciones | 7 | 15 | 10,5 |
| Planos, fracturas y material | 5 | 10 | 5 |
| Agua, humedad y vegetación | 6 | 10 | 6 |
| **Total** | | **100** | **64,5** |

La escala recibe una valoración visual de proporciones, sin afirmar medidas reales ni una calibración fotogramétrica. La nota del agua se limita a su forma, distribución y aproximación offline; no certifica el shader final de navegador.

### Fallos bloqueantes y correcciones necesarias

**V6-01 — La roca pierde sus grandes caras y fracturas.** En `clay/front`, `clay/right-oblique` y `clay/aerial`, el frente izquierdo sigue leyendo como columnas redondeadas y la derecha como un talud continuo. Las líneas oscuras del material no sustituyen los planos inclinados, cortes diagonales, bloques y rebordes que se ven en R10/R11/B09. El detalle granular no es el problema principal: esas diferencias ya están presentes sin material. Deben sobrevivir en arcilla varias caras angulares grandes y juntas irregulares en ambas márgenes, especialmente junto a la canaleta y al pie. No se pide subir otra vez parapetos derechos que tapen la corriente.

**V6-02 — El descenso conserva la lectura de cinta.** En `material/front`, `material/close`, `material/outlet` y `clay/front`, el tramo principal es una banda estrecha, de ancho demasiado regular, que llega a la poza sin el ensanche/abanico irregular reconocible de R10/R11. Hay cambios de dirección, pero sus transiciones siguen pareciendo tramos construidos. Es necesario modificar tanto el lecho como el contorno del agua: alternar constricciones y ensanches, introducir apoyos/rebordes desiguales y abrir un remate inferior asimétrico. Aumentar espuma o ruido de color no corrige su silueta.

**V6-03 — El desagüe termina como un parche expuesto.** En `web/tour` se ve el extremo de una franja de agua sobre roca desnuda dentro del terreno. La geometría de desagüe acaba en Z=83 mientras el macizo continúa hasta aproximadamente Z=86. También se reconoce una unión transversal demasiado recta en la salida de la poza (`material/outlet`). El cauce y sus orillas deben continuar hasta una salida visual real del conjunto; el corte de la malla de agua no debe quedar expuesto como un rectángulo pegado al suelo.

No se detectó un cuarto bloqueante distinto en las vistas restantes. El recorte del monolito en `web/tour` es un pendiente de encuadre: `tour-top` sí lo muestra. No exige volver a remodelar el monolito, pero la revisión del encuadre final debe mostrar una lectura completa del lugar a lo largo del recorrido.

### Límites y siguiente revisión

Este dictamen corresponde exclusivamente a los hashes anteriores y a los renders offline de Blender CPU examinados. No se utilizó ni se revisó WebGL; los materiales GLSL, transparencias, luces y animación del navegador siguen aproximados. Una imagen de `flow/front` en t=0,8 no demuestra por sí sola toda la animación final.

La próxima revisión debe presentar el nuevo paquete identificado, vistas de arcilla que hagan visibles los nuevos planos de ambas márgenes, frente/oblicuo cercano del remate del agua y una vista abierta de la salida del desagüe. Mantener los elementos ya corregidos. No corresponde integrar v6 ni tratar sus comprobaciones técnicas como una aprobación visual.
