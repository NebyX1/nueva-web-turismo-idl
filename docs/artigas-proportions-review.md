# Revisión independiente de proporciones: brazos y manos de Artigas

Fecha: 5 de noviembre de 2026. Revisor nuevo, con evaluación independiente de las aprobaciones anteriores. Alcance: escultura ecuestre de Cerro Artigas, Minas, Uruguay.

**Dictamen final: aprobado para integración el paquete `arms-fix/v9`, SHA `112c805995ff0ffd75f752960d38730848ac1fb3a05be9c38e1f546d3592d32f`, después de abrir sus 25 vistas finales y comprobar proporciones, anatomía, contactos y continuidad.** La aprobación es para una recreación estilizada mínima presentable, con las limitaciones offline indicadas al final. Las evaluaciones de partida y los rechazos que siguen conservan el historial de evidencia; no son aprobaciones del paquete final.

## Dictamen de partida

**v6 y la corrección de manos v3 no satisfacen la revisión ampliada de brazos y manos.** El problema no se reduce a la cantidad de dedos. Hay un brazo alto acortado, mangas demasiado finas, muñecas pequeñas y una lectura de manos que no corresponde al peso del abrigo ni a los gestos de las fotografías. v3 mejora la topología digital, pero conserva los brazos anteriores; por tanto no puede aprobarse como solución de esta solicitud.

No se revisó el navegador: sigue restringido. Se inspeccionaron las dos capturas aportadas por el usuario, fotografías del monumento exacto, renders offline existentes y geometría cuantizada decodificada. Una imagen offline con cámara aproximada no prueba cómo renderiza WebGL.

## Fuentes y evidencia abierta

Directorio de estudio absoluto:

`C:/Users/black/.codex/visualizations/2026/11/05/01a1aa96-24e3-7f02-8d33-b969869ac95f/artigas-rebuild/`

Fotografías abiertas y usadas para establecer proporciones:

- `qa-ref-00.jpg`: [perfil de Claudia Garay](https://commons.wikimedia.org/wiki/File:Monumento_a_Artigas_(vista_de_costado).jpg). Permite relacionar cabeza, manga y puño bajo. La manga queda parcialmente cubierta por el poncho.
- `qa-ref-03.jpg`: [frente de Marioml](https://commons.wikimedia.org/wiki/File:Monumento_a_Jos%C3%A9_Artigas_en_Cerro_Ventura,_Minas,_de_frente..JPG). Confirma volumen de hombro y manga, aunque el caballo oculta gran parte del lado opuesto.
- `qa-misc-05.jpg`: [Monumento Artigas a Caballo](https://commons.wikimedia.org/wiki/File:Monumento_Artigas_a_Caballo.JPG). Es el detalle más útil para cabeza, manga robusta, puño bajo y mano alta semiextendida.
- `qa-misc-03.jpg`: vista baja lateral de brazo, pliegues y puño.
- `qa-rear-threequarter.jpg`: continuidad del hombro y brazo con el poncho desde atrás.
- `hands-reference/{low-hand-profile,hands-front,hands-low-side}.png`: ampliaciones fotográficas de los gestos.
- Se consultó la [galería del monumento exacto](https://commons.wikimedia.org/wiki/Category:Cerro_Artigas,_Lavalleja), sin usar otro Artigas como sustituto.

Modelos y vistas abiertas:

- `v6-packed/{front,other-side,head-low-front,head-three-quarter}.png`.
- `hands-fix/v3/review/{low-hand-dorsal,low-hand-palm,low-hand-side,high-hand-dorsal,high-hand-palm,high-hand-side,user-angle}.png`.
- `hands-fix/v3/isolated-low/low-hand-palm.png` y `isolated-high/high-hand-palm.png`.
- Capturas del usuario: `C:/Users/black/AppData/Local/Temp/codex-clipboard-0b64b148-173f-459e-bc6c-6c6deacc59a8.png` y `C:/Users/black/AppData/Local/Temp/codex-clipboard-5b875e59-82a2-44eb-b5c1-6f60a7c2c292.png`.
- Los recortes de análisis con retícula están en `artigas-rebuild/proportions-qa/`: `qa-ref-00-grid.png`, `qa-ref-03-grid.png`, `qa-misc-05-grid.png` y `user-night-upper-grid.png`. Son ayudas de lectura; las fotos originales siguen siendo la evidencia principal.

SHA de las fuentes de geometría examinadas:

| Paquete | `sourceSha256` |
| --- | --- |
| v6 live, `src/three/landmarks/artigasAsset.json` | `3d54f257e90dba0314891417442c832308a3396f7a331f5866b909dfae571985` |
| Manos v3, `hands-fix/v3/packed.json` | `df8804453dcc20649d9af1e03fc88223140ea581fbb29f4b32ef170d992eda61` |

## Método y límites de la medición

Se usa **H = altura de cabeza craneal, de vértex a mentón, excluyendo cuello y volumen extra de cabello**. No se usa el bounding box entero de la malla de rostro: incluye cuello y exageraría el denominador. Para el modelo se tomó como calibración el vértex del cráneo morfeado y el helper de mandíbula de la misma base. Su separación final es aproximadamente **1,58 unidades Blender**, después de `.62 × 1.1`. La localización de mentón de superficie debe contrastarse visualmente; se admite incertidumbre de unos 0,05–0,08 de H. El valor sirve para comparar partes del mismo modelo, no para atribuir dimensiones físicas al monumento.

Las fotos se miden en píxeles dentro de una misma proyección. La inclinación de la cabeza, la vista baja, el acortamiento de antebrazos y la oclusión por el caballo impiden recuperar longitudes 3D exactas. Se usan bandas y se cruzan varias vistas. No se debe trasladar directamente un largo proyectado de una mano a una dimensión 3D sin considerar su orientación.

Los largos de brazos se miden por cadena hombro–codo–muñeca; no por el rectángulo que contiene el brazo doblado. Las secciones de manga se miden perpendicularmente a su tramo. Se distingue muñeca anatómica del borde más ancho de la manga, palma del conjunto de dedos y puño cerrado de mano semiextendida.

## Qué muestran las fotografías

En `qa-misc-05.jpg` (960 × 723), la cabeza craneal mide aproximadamente 150–165 px. La manga superior tiene unos 75–85 px de grosor en la zona visible; el antebrazo vestido unos 70–80 px; la transición de muñeca unos 43–49 px. El bloque visible de puño ocupa alrededor de 80–90 px en su eje largo. El caballo tapa parte de su extremo y la vista baja altera las relaciones. Las bandas útiles son:

| Relación proyectada | Evidencia fotográfica orientativa |
| --- | --- |
| Grosor de manga superior / H | 0,47–0,55 |
| Grosor de antebrazo vestido / H | 0,44–0,52 |
| Muñeca visible junto al puño / H | 0,27–0,32; incluye parte de la transición de manga |
| Largo del bloque visible de puño / H | 0,48–0,55 en este detalle bajo |
| Largo visible de mano alta / H | aproximadamente 0,45–0,52, con acortamiento y dedos apoyados |

En el perfil original `qa-ref-00.jpg` (4288 × 2848), H es aproximadamente 175–190 px, con el vértex craneal bajo el pelo y el mentón inclinado. El puño bajo mide aproximadamente 65–75 px en cada eje de su bloque principal: **0,36–0,43 H**. Esto impide exigir un puño de 0,5 H en todos los ángulos. El frente y el perfil deben poder coexistir en una sola forma.

Las fotos muestran **mangas de abrigo de volumen importante**: hombro, brazo superior, codo y antebrazo forman una continuidad de tela pesada. El codo tiene masa y pliegue. No corresponde un cilindro fino de brazo desnudo ni una bola que conecte una manga a una mano.

El puño bajo izquierdo es compacto: cuatro dedos flexionados alrededor de las correas, con pulgar opuesto por encima. La mano alta derecha tiene palma reconocible y dedos juntos, algo flexionados sobre el paño. No son dos puños iguales ni una mano abierta que flota frente al pecho.

## Medidas del modelo que explican el defecto

Las posiciones finales de v6 producen estas longitudes de cadena:

| Parte | Brazo bajo izquierdo | Brazo alto derecho |
| --- | ---: | ---: |
| Hombro–codo | 1,40 ≈ 0,89 H | 1,05 ≈ 0,66 H |
| Codo–muñeca | 2,02 ≈ 1,28 H | 1,43 ≈ 0,91 H |
| Total | 3,42 ≈ 2,16 H | 2,48 ≈ 1,57 H |

El brazo alto tiene solamente **73% del largo total del bajo**, pese a pertenecer a la misma figura. El brazo bajo conserva aproximadamente el largo global de la base, pero concentra demasiado largo en antebrazo y tiene escaso volumen. No es correcto resolver todo estirando por igual las dos cadenas.

Como control independiente, la base morfeada a la escala de la cabeza tiene hombro–codo ≈1,684 y codo–muñeca ≈1,689: total ≈3,374 (2,13 H). Este control corrige una estimación preliminar demasiado exigente: **no se exige llevar ambos brazos a 4 unidades ni a un canon fijo de 2,5 H**. El parecido fotográfico y la pose vestida tienen prioridad.

Se decodificó el paquete v6 y se intersecaron los triángulos de la ropa con planos perpendiculares a los huesos, en su punto medio. Para el brazo bajo aparecieron secciones cerradas independientes, con centroides a 0,11 y 0,01 unidades del eje esperado:

| Sección de v6 | Diámetro máximo | Respecto a H |
| --- | ---: | ---: |
| Manga superior baja | 0,310 | 0,20 H |
| Antebrazo bajo | 0,453 | 0,29 H |

Es una diferencia grande respecto a la manga real, no un detalle digital. La sección del brazo alto se funde con torso/poncho en esos planos; no se publica un diámetro ficticio para ella. Debe evaluarse por la silueta y por secciones locales que realmente aíslen su manga.

En el paquete de manos v3, se midieron ejes locales a partir de la muñeca y de las orientaciones declaradas de cada mano. Las posiciones cuantizadas dieron:

| Medida de superficie | Mano baja | Mano alta |
| --- | ---: | ---: |
| Extensión distal desde muñeca, en eje longitudinal posado | 0,639 ≈ 0,40 H | 0,971 ≈ 0,61 H |
| Anchura de palma en sección longitudinal 0,22 | 0,461 ≈ 0,29 H | 0,501 ≈ 0,32 H |
| Anchura de muñeca, sección 0,02 | 0,288 ≈ 0,18 H | 0,297 ≈ 0,19 H |
| Espesor de muñeca en esa sección | 0,164 ≈ 0,10 H | 0,174 ≈ 0,11 H |

La mano alta sigue pequeña como conjunto; la baja tiene un largo compacto admisible pero poca anchura y muñeca fina. No se debe inflar el puño bajo hasta igualar el largo de la mano alta. Escalar sólo falanges tampoco resuelve palma, muñeca y manga.

En las capturas web, H visible ronda 34–37 px. Las manos v6 son masas de unos 11–14 px (aproximadamente 0,30–0,40 H); la borrosidad impide una medida más fina. El antebrazo visible ronda sólo 6–8 px de grosor (0,17–0,23 H). La impresión de brazos pequeños se sostiene en la escala real de pantalla. El tamaño proyectado de la mano baja por sí solo no demuestra el defecto completo: también fallan gesto, muñeca y relación con la manga.

## Objetivos para el candidato nuevo

Estas bandas son controles de construcción para este modelo con H≈1,58. No pretenden ser metrología del monumento. Una excepción necesita una comparación de proyección equivalente con la fotografía; no basta alegar perspectiva sin mostrarla.

| Parte | Banda de trabajo | Aproximación en unidades actuales |
| --- | --- | --- |
| Hombros exteriores vestidos, sin cola del poncho | 1,8–2,3 H | 2,84–3,63 |
| Cada cadena hombro–codo–muñeca | alrededor de 2,05–2,60 H, con fotografía y pose como control | 3,24–4,11 |
| Relación entre largo total de ambos brazos | 0,90–1,10 | No conservar una diferencia del 27% |
| Relación superior / antebrazo de cada brazo | aproximadamente 0,8–1,2 | Evitar resolver el alto sólo estirando antebrazo |
| Manga superior, diámetro de volumen útil | 0,45–0,60 H | 0,71–0,95 |
| Antebrazo vestido, diámetro de volumen útil | 0,40–0,53 H | 0,63–0,84 |
| Muñeca anatómica: anchura | 0,22–0,29 H | 0,35–0,46 |
| Muñeca anatómica: espesor | 0,13–0,18 H | 0,21–0,28 |
| Palma: largo muñeca–nudillos | 0,40–0,50 H | 0,63–0,79 |
| Palma: anchura, sin pulgar extendido | 0,32–0,42 H | 0,51–0,66 |
| Mano alta semiextendida, largo anatómico global | aproximadamente 0,70–0,82 H, descontando acortamiento al proyectar | 1,11–1,30 |
| Puño bajo: largo del bloque, no largo de dedos desplegados | 0,38–0,52 H | 0,60–0,82 |
| Puño bajo: ancho / espesor del bloque | 0,32–0,44 H / 0,25–0,36 H | 0,51–0,70 / 0,40–0,57 |

Los hombros actuales no se consideran rechazados por ancho solamente: el problema más claro está en la compresión y el volumen de los brazos. La unión nueva debe dar continuidad a deltoide, sisa y pecho sin engordar toda la cabeza o todo el torso para disimular la escala.

En v3 las escalas de manos `.49` y `.52` son menores que `.682`, usada por la cabeza; es un indicio, no una orden de igualar escalas. Como prueba inicial resulta más prudente un aumento moderado y distinto de cada mano (baja aproximadamente ×1,16–1,24; alta ×1,15–1,25), acomodando muñeca y gesto, que ampliar ambas ×1,4. La decisión final depende de las medidas de superficie y los renders.

## Puerta dura de calidad del paquete final

1. **Identidad exacta.** Proveer GLB, paquete cuantizado, SHA y renders generados desde ese mismo paquete. No sirve un render del `.blend` si el JSON integrado es diferente. Registrar los puntos hombro, codo, muñeca, vértex y mentón usados y los ratios finales.
2. **Ambos brazos completos.** Abrir frente, ambos perfiles y tres cuartos delanteros/posteriores con luz neutra. Deben leerse hombro, manga superior, codo, antebrazo y muñeca de cada brazo. Cuando el poncho o caballo ocultan un segmento, añadir una vista de inspección aislada; después comprobarlo en contexto. Una sección fusionada con el torso no cuenta como manga gruesa.
3. **Tamaño y volumen.** Rechazar si subsiste una manga de aproximadamente 0,20–0,30 H, un brazo alto comprimido, manos de escala juvenil, muñecas como varillas o una cadena que se ha alargado sólo en antebrazo. Las bandas numéricas no pueden aprobar una forma visualmente deforme.
4. **Construcción de tela.** Rechazar brazos de cilindro desnudo, bolas de codo, ensanchamientos abruptos o superficies que penetran el torso sin una sisa coherente. Se necesita masa de manga y un pliegue que explique el codo; no pliegues pequeños para ocultar una cadena incorrecta.
5. **Gestos distintos y contacto.** El puño bajo debe rodear las riendas, con pulgar colocado sobre los dedos. Rechazar ganchos separados con huecos grandes o correas que sólo rozan un borde. La alta debe apoyarse semiextendida sobre el paño, con palma y nudillos adultos; no otro puño ni una mano suspendida frente al pecho.
6. **Seis vistas de mano útiles.** Palma, dorso y costado de cada mano aislada para anatomía; además contactos y muñecas en contexto. `review/low-hand-palm.png` y `review/high-hand-palm.png` de v3 están tapadas por caballo/torso y **no constituyen evidencia de palma**. Los dedos pueden ocluirse naturalmente en el gesto, pero no faltar ni duplicarse, fundirse, cortarse o atravesar la rienda.
7. **Escala de la web.** Abrir figura completa a 646×436 y 455×451, aproximando las cámaras de las dos capturas y una altura de cabeza visible de 34–37 px. Revisar luz de día y nocturna, más la aproximación del recorrido. Primero juzgar esas imágenes sin ampliarlas; luego abrir los primeros planos. No dar aprobación si sólo el close-up permite adivinar una mano o si el brazo sigue pareciendo infantil en el conjunto.
8. **Honestidad de cámara.** La vista `user-angle` actual es una aproximación offline. Debe declararse así, compararse su silueta con las capturas y ajustarse antes de usarla como sustituto. No presentar este paso como prueba de navegador ni intentar eludir su restricción.
9. **Sin regresiones.** Revisar cuello, unión de hombros con torso, borde del poncho, riendas, caballo y figura completa después de la modificación. La protección de otras mallas por hash o localidad ayuda a limitar alcance, pero no aprueba proporciones ni contactos.
10. **Dictamen explícito.** El revisor debe registrar para cada brazo y mano medida, vista, hallazgo y decisión. Una mejoría sobre v6/v3, cinco dedos o una malla cerrada no bastan. Si alguna vista necesaria está oculta o no se generó, queda pendiente; no se aprueba por inferencia.

## Estado de revisión

**Revisión final completada: v9 aprobado para integración con el SHA indicado arriba.** Se actualizó `assets/artigas/quality-approval.json` únicamente después del examen completo documentado en la última sección. La integración debe conservar ese mismo paquete y SHA.

## Candidato de brazos v1: rechazado

Directorio: `artigas-rebuild/arms-fix/v1/`. SHA del paquete revisado: `b92ed337cbcad6bba96bcda93360707a3dd57106ca46f7db5240c365716cb4f4`. Se abrió `review/front.png`, `three-quarter.png`, `user-angle.png` y las cuatro vistas en contexto `low/high-hand-dorsal` y `low/high-hand-side`. Se generó y abrió `review/user-angle-scale-646x436.png`, una copia reducida con H visible de aproximadamente 34 px. No representa otra cámara ni una ejecución de la web. Los perfiles, trasera y las seis vistas aisladas todavía no estaban completos al dictamen; por ello tampoco es posible cerrar el examen de todas las uniones.

### Medición independiente sobre los ejes nuevos

Se usaron los puntos del archivo `arm-proportions.json` del candidato, no los ejes de v6. Ambas cadenas tienen superior 1,86 y antebrazo 1,82: total 3,68 ≈2,33 H. Su relación superior/antebrazo es 1,02 y la relación entre ambos brazos es 1,00. Esta corrección elimina la compresión anterior del brazo alto y es coherente con una figura adulta vestida.

La intersección de triángulos a mitad de los ejes nuevos dio:

| Sección baja | Diámetro máximo | Respecto a H | Evaluación |
| --- | ---: | ---: | --- |
| Manga superior | 0,669 | 0,423 H | Mucho mejor que v6, algo bajo frente al objetivo 0,45–0,60 H |
| Antebrazo | 0,707 | 0,448 H | Dentro de banda de volumen de abrigo |

La sección superior tiene centro a 0,193 unidades del eje; la de antebrazo, a 0,041. En el brazo alto, la sección se conecta con torso/poncho y no permite atribuir al brazo el diámetro del contorno completo. El detalle del cálculo está en `arms-fix/v1/qa-sections-v1.json`. No se presenta esa sección fusionada como prueba de manga correcta.

Medidas de superficie de las manos en sus ejes locales actualizados:

| Medida | Mano baja | Mano alta |
| --- | ---: | ---: |
| Extensión distal desde la muñeca | 0,697 ≈0,44 H | 1,199 ≈0,76 H |
| Anchura de palma, sección longitudinal 0,27 | 0,564 ≈0,36 H | 0,609 ≈0,39 H |
| Muñeca, anchura × espesor, sección 0,02 | 0,337 ×0,212 ≈0,213 ×0,134 H | 0,354 ×0,226 ≈0,224 ×0,143 H |

Los tamaños generales de manos, palma y muñeca alta ya son razonables respecto a la cabeza. La muñeca baja queda cerca del límite inferior. En el conjunto reducido, el brazo conserva mejor una lectura adulta y el puño bajo es compacto; no se detecta necesidad de agrandar de nuevo los dedos por sí solos.

### Defectos que impiden aprobar

1. **Terminación irregular bajo la manga alta.** En `high-hand-dorsal.png`, aproximadamente x200–380/y700–810, se observa un borde angular, zonas negras y pliegues estirados bajo la manga cerca de la muñeca y del paño. En `high-hand-side.png`, aproximadamente x530–630/y845–930, aparece un corte oscuro angular bajo palma/antebrazo. El codo alto, a la izquierda de `front.png`, termina aplastado y cortado. Aunque la malla pueda seguir conectada, visualmente no es una transición continua de abrigo. Debe repararse y abrirse otra vez desde los perfiles y tres cuartos.
2. **Mano alta sin apoyo convincente.** `high-hand-side.png` muestra la palma y varios dedos elevados frente al pecho. Se calculó distancia de los vértices palmares a los triángulos de ropa mediante BVH de Blender, no por proximidad a vértices. Para región longitudinal 0,15–0,55 y coordenada normal palmar menor que −0,08: distancia mínima 0,0666 y mediana 0,239 unidades. Para dedos distales: mínima 0,0643 y mediana 0,458. No hubo puntos de estas regiones a menos de 0,04 de la ropa. Es una prueba auxiliar que coincide con la separación visual; no sustituye comprobar todos los contactos. El signo local de distancia también sugiere penetración en algunos sectores distales mientras otros quedan elevados. Hay que apoyar eminencias/palma y posar dedos de forma coherente, no hundir toda la mano por una traslación global.

El puño bajo sí muestra contacto palmar con las riendas: distancia mínima aproximadamente cero y 739 vértices de la región examinada a menos de 0,04. Esto no prueba por sí solo el agarre de todos los dedos. Los extremos distales tienen distancias mayores y deben comprobarse desde las tres vistas aisladas más contacto en contexto. Los resultados auxiliares están en `arms-fix/v1/qa-contact-v1.json` y el cálculo reproducible en `qa-contact-v1.py`.

**Decisión:** rechazado como paquete de entrega por unión de manga alta y apoyo de mano alta. Se conserva como evidencia de que los largos de brazo y tamaños globales mejoraron. Esta mejora no concede aprobación parcial del paquete ni modifica `quality-approval.json`. El siguiente candidato requiere nueva inspección del paquete completo, incluidos los ángulos aún pendientes y tamaño de pantalla.

## Diagnóstico de brazos v2: no aprobado

SHA examinado: `21b6b9d7cc4c40df3a779dfbdeacc46c838067cb8ae4b7be26e81eca6e75962b`. Se abrieron las diez imágenes de `arms-fix/v2/review/` y `web-night/user-angle.png`. La mano alta tiene deformaciones de dedos y pulgar producidas al acomodarla al paño; el implementador ya la había rechazado antes de esta revisión. Este diagnóstico no cambia esa decisión ni aprueba mangas por separado.

Las cadenas permanecen equilibradas, 3,68 por lado (2,33 H). El antebrazo bajo tiene diámetro máximo medio **0,703 (0,444 H)** y ancho mínimo de la sección **0,672 (0,425 H)**. El volumen no depende de una sección aplastada. El brazo superior bajo se conecta con el contorno del poncho en el plano de medida después del remallado; no existe una sección independiente válida para publicar su diámetro. Un pequeño bucle residual próximo al plano no representa la manga. El cálculo reproducible se guardó en `proportions-qa/measure_sections.py` y el resultado de este paquete en `arms-fix/v2/qa-sections.json`.

El grosor y largo globales se leen adultos en frente, perfiles, trasera y vista nocturna reducida. No se recomienda engrosar de nuevo todo el conjunto. Quedan dos defectos concretos de la ropa, adicionales a la mano descartada:

- **Hombro posterior con agujero o parche negro:** `side.png`, aproximadamente x534–544/y246–260, y `rear.png`, x420–430/y253–267. Es visible desde dos cámaras y debe cerrarse o corregirse su superficie/normales.
- **Cavidad profunda en el codo alto:** `other-side.png`, aproximadamente x587–618/y300–329. La depresión oscura y el remate plano no corresponden a un codo vestido continuo. La reparación debe conservar masa y pliegue de flexión, sin añadir una esfera exterior.

La siguiente versión debe volver a comprobar esos puntos, continuidad de muñeca después de inclinar la mano alta y pulgar completo desde perfil. Una transformación suave o rígida que conserve la anatomía es preferible a acomodar cada vértice al paño; el contacto final sigue sujeto a examen visual y de distancias. **V2 continúa rechazado; no se modificó la aprobación vigente.**

## Examen de brazos v7: rechazado por hombro y codo

SHA del GLB calculado y del paquete: `9a90c7270f8b45e7561d68bfaad5a22c645cc6f5441aed4cfc490217333e1be4`. Ambos coinciden. El paquete tiene 193458 triángulos y 13 grupos. La comparación íntegra de atributos y buffers confirma que sólo cambiaron `Poncho y uniforme — paño continuo` y `Manos y dedos de Artigas`; los otros once grupos son iguales al paquete live v6. Esto verifica alcance, no aprobación anatómica.

Se abrieron las **16 vistas** de `arms-fix/v7/review/`: frente, ambos perfiles, trasera, tres cuartos, cuatro de cabeza, las seis contextuales de manos y `user-angle`. También se abrieron las tres imágenes `web-day/user-angle.png` (646×436), `web-night/user-angle.png` (646×436) y `web-small/user-angle.png` (455×451), primero a su escala nativa. Los renders de palma en contexto vuelven a estar tapados por el resto de la estatua; la anatomía palmar necesita sus vistas aisladas válidas.

Los largos siguen siendo 1,86 +1,82 =3,68 (2,33 H) en ambos brazos. La sección independiente del antebrazo bajo mide **0,700 de diámetro máximo (0,443 H)** y **0,670 de anchura mínima (0,424 H)**. Los otros cortes se unen al contorno de torso/poncho; sus diámetros completos no se atribuyen a mangas. Las manos conservan tamaño adulto: puño bajo distal 0,697 (0,44 H), mano alta distal 1,199 (0,76 H), palmas de aproximadamente 0,36 y 0,39 H. Las muñecas bajas/altas miden respectivamente 0,337×0,212 y 0,354×0,226. En las tres vistas de tamaño de pantalla, la relación de mangas, manos, cabeza y torso se sostiene y no justifica otro aumento global.

Se repitió el cálculo de contacto por BVH, identificando **dos componentes completas de 6654 vértices cada una**, y usando los ejes de mano alta después de la inclinación rígida de 12° y traslación. Para la región palmar alta: distancia mínima 0,00003, mediana 0,070 y 93 puntos a menos de 0,04 de la ropa. Para la región distal: mínima 0,002, mediana 0,114 y 126 puntos a menos de 0,04. La mano alta ya tiene apoyo, sin la deformación por proyección individual de v2. El puño bajo conserva contacto palmar con riendas, 739 puntos a menos de 0,04. Los resultados se interpretan junto a las vistas, no como sustitutos del gesto; no se exige que todos los dedos apoyen exactamente en el mismo plano.

Se abrieron las seis aisladas generadas inicialmente, pero **no son evidencia válida de integridad**: la herramienta aislaba cada cara por `z<11`. El meñique alto cruza ese plano después de la inclinación, por lo que termina dentado en la aislada alta y su extremo aparece flotando en la baja. El corte es una selección del render, no una amputación de la geometría completa. El implementador está corrigiendo el aislamiento por componente conexa y debe regenerar las seis vistas antes de un dictamen favorable.

Persisten dos defectos de ropa que bloquean entrega:

- **Bolsillo oscuro posterior del hombro bajo**, visible en `side.png`, aproximadamente x539/y253; se localizó su superficie cerca de Blender (0,01, −1,53, 11,93). El volumen interior previo no lo eliminó visualmente.
- **Codo alto con boca oval hundida y reborde**, en `other-side.png`, aproximadamente x587–618/y300–329. Se amplió el área x535–665/y245–350 para comprobar que el extremo se lee como una manga cortada/hueca, aunque el núcleo interno pueda cerrar la topología. Requiere continuidad exterior del codo; no basta demostrar una malla cerrada.

Fuera de esos defectos, la inspección contextual no detectó otro bloqueo anatómico en manos, continuidad de muñecas, cuello o relación cabeza/torso. Los pliegues del pecho junto al apoyo son angulosos y simplificados; no se presentan como reproducción exacta del paño real. **V7 no se aprueba ni se actualiza `quality-approval.json`.** El siguiente paquete debe demostrar hombro y codo corregidos, sin bultos nuevos, y seis aisladas completas.

## Dictamen final independiente de v9: aprobado para integración

Revisor: **`artigas_proportions_qa`**. Paquete examinado: `artigas-rebuild/arms-fix/v9/packed.json`. El SHA calculado del GLB coincide con `sourceSha256` del paquete: **`112c805995ff0ffd75f752960d38730848ac1fb3a05be9c38e1f546d3592d32f`**. No se aprobaron v7 ni v8 por inferencia. Se abrieron las imágenes finales de v9 y se repitieron sus mediciones.

### Evidencia final abierta y verificada

Se abrieron **25 PNG finales** del paquete cuantizado decodificado, conservados también en este directorio portable del repositorio:

`D:/Ai Projects/web-turismo/docs/references/artigas-proportions/`

- Las 16 de `review/`: `front`, `side`, `other-side`, `rear`, `three-quarter`, `head-front`, `head-three-quarter`, `head-low-front`, `head-low-quarter`, `low-hand-dorsal`, `low-hand-palm`, `low-hand-side`, `high-hand-dorsal`, `high-hand-palm`, `high-hand-side` y `user-angle`.
- Las tres de `isolated-low/` y las tres de `isolated-high/`, cada mano desde dorso, palma y costado. El filtro por componente completa está corregido: el meñique alto se ve entero y no hay fragmentos de esa mano en la aislada baja.
- `web-day/user-angle.png` y `web-night/user-angle.png`, 646×436, y `web-small/user-angle.png`, 455×451. Se juzgaron primero en tamaño nativo y luego se contrastaron con detalles.

Se verificaron los SHA de las 25 copias del repositorio y de los 25 originales contra `render-evidence.json`: **cero diferencias**. El manifiesto vincula esos PNG al SHA final del activo. Las dos palmas en contexto quedan ocluidas por otras partes de la escultura; no se usaron como prueba anatómica. Las palmas aisladas completas cubren ese examen, mientras las vistas contextuales cubren muñeca y contacto.

### Resultado por parte

Se mantienen H≈1,5807 y la incertidumbre de referencia ya declarada. Las mediciones no atribuyen dimensiones físicas al monumento ni convierten sus fotos en un levantamiento métrico.

| Parte | Medida y vistas principales | Hallazgo y decisión |
| --- | --- | --- |
| Brazo bajo completo | Cadena 1,86 +1,82 =3,68 (2,33 H); frente, perfil, tres cuartos y detalle bajo | Hombro, brazo, codo, antebrazo y muñeca forman una cadena adulta vestida. El hueco posterior desapareció sin crear una bola de hombro. **Cumple.** |
| Antebrazo bajo | Sección perpendicular sobre el eje final: diámetro máximo 0,6997 (0,443 H), ancho mínimo 0,6700 (0,424 H) | Tiene volumen de manga y no depende de una sección plana. Los cortes unidos al poncho no se usan para inflar estas cifras. **Cumple.** |
| Brazo alto completo | Cadena 1,86 +1,82 =3,68; superior/antebrazo 1,02; frente y perfil opuesto | Desapareció la boca oval hundida del codo. La superficie exterior es continua y convexa, conservando el gesto flexionado y sin esfera exterior nueva. **Cumple.** |
| Hombros, cuello y torso | Ambos perfiles, trasera y cuatro vistas de cabeza | Sisa, hombro y cuello mantienen continuidad; no hay otra cavidad oscura, corte ni cambio de tamaño de cabeza para disimular brazos. La relación con el torso se sostiene en el conjunto. **Cumple.** |
| Muñecas | Baja 0,337×0,212; alta 0,354×0,226; costados/contexto | Transiciones continuas dentro de mangas, sin varillas ni muñecas partidas. La baja queda cerca del límite inferior de la banda, aceptable con incertidumbre de H y lectura fotográfica. **Cumple.** |
| Puño bajo izquierdo | Bloque distal 0,697 (0,44 H), palma 0,564 (0,36 H); seis vistas bajas aisladas/contextuales | Cuatro dedos flexionados y pulgar opuesto forman un agarre compacto de las riendas, con masa adulta. No se ven falanges faltantes, dedos duplicados ni flotación del conjunto. **Cumple.** |
| Mano alta derecha | Largo distal 1,199 (0,76 H), palma 0,609 (0,39 H); seis vistas altas aisladas/contextuales | Palma, pulgar y cinco dedos completos, de longitudes escalonadas, con gesto semiextendido distinto del puño. La inclinación conserva anatomía y permite apoyo sobre el paño. **Cumple.** |
| Figura completa | Frente, ambos perfiles, tres cuartos, trasera y tres vistas de tamaño de pantalla | Brazos y manos se leen adultos en relación con cabeza/hombros. El gesto y la masa se reconocen sin ampliar. Caballo, jinete y base mantienen continuidad y cuatro apoyos. **Cumple el mínimo estilizado.** |

El control de contacto se repitió sobre los triángulos finales mediante BVH y componentes de mano completas. Palma alta: mínima 0,00003, mediana 0,0696 y 93 puntos a menos de 0,04 de la ropa. Zona distal alta: mínima 0,00206, mediana 0,1144 y 126 puntos a menos de 0,04. Puño bajo: mínima palmar 0,000075 y 739 puntos a menos de 0,04 de las riendas. Estas cifras acompañan los contactos observados; no se usan para exigir apoyo plano de todos los dedos ni para ocultar penetraciones mediante una prueba automática.

Las manos exportadas no son bitidénticas a v7 por orden de vértices y pequeños valores del remate de muñeca. La diferencia simétrica máxima de superficie por vecino más cercano es aproximadamente 0,000026 unidades. Se revisaron de todos modos las seis aisladas y los contactos **de v9**, sin transferir una aprobación de otra versión.

### Verificación del paquete y límites

Se ejecutó `node scripts/check-artigas-rebuild.mjs` con la ruta explícita del `packed.json` v9: pasó con **13 mallas y 193458 triángulos**, cuatro cascos apoyados, datos/normales válidos, dos manos cerradas y entorno protegido. Los once grupos ajenos a ropa y manos coinciden íntegramente con v6. Esa verificación complementa el examen visual y no lo sustituye.

La aprobación se basa en el paquete final, las fotos del monumento exacto, medidas de partes y lectura de pantalla, **no sólo en que v9 mejora versiones anteriores o tiene cinco dedos**. Los defectos bloqueantes registrados de codo, hombro, muñecas y manos ya no se observan en las vistas finales.

Se aprueba una **recreación estilizada mínima presentable**, no una réplica fotogramétrica. Pliegues de pecho junto al apoyo, cabello y pequeños detalles de superficie siguen simplificados y algo angulosos. Las cámaras y la iluminación de `web-day`, `web-night` y `web-small` son aproximaciones offline a la escala y ángulos aportados; no son capturas de la web ni prueban WebGL. No se intentó eludir la restricción del navegador. La aprobación cubre exclusivamente el SHA registrado; la integración y sus pruebas deben conservarlo.

**Decisión final: aprobado para integración.** Se actualizó `assets/artigas/quality-approval.json` con revisor, SHA final, evidencia de las 25 vistas, medidas y limitaciones. No se modificó geometría desde esta revisión.
