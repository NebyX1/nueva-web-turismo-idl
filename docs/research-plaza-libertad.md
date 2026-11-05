# Plaza Libertad y concatedral de Minas: referencias del modelo 3D

Consulta y modelado: 5 de noviembre de 2026. Todas las imágenes enumeradas se abrieron e inspeccionaron visualmente antes de modelar. Fotografías de estudio en `C:/Users/Nebyx/AppData/Local/Temp/lavalleja-plaza-libertad-study/`, fuera del repositorio y del directorio público. Se estudian formas y relaciones espaciales; ninguna fotografía se redistribuye como textura del modelo.

La escala es proporcional y aproximada: **no es un levantamiento arquitectónico ni una réplica topográfica**. Se representa la Plaza Libertad de **Minas, Lavalleja, Uruguay**, sin mezclarla con las plazas homónimas de otras ciudades ni con el monumento de Cerro Artigas.

## Fuentes de identidad y obra pública

- [OPP: Minas celebró la remodelación de su plaza histórica, 18/12/2017](https://www.opp.gub.uy/es/noticias/minas-celebro-la-remodelacion-de-su-plaza-historica). Confirma ubicación, reforma de 2017, iluminación, show de aguas, mobiliario y pavimento de hormigón estampado.
- [MVOT: Construir el diálogo en Lavalleja](https://www.gub.uy/ministerio-vivienda-ordenamiento-territorial/comunicacion/noticias/construir-dialogo-lavalleja). Fotografía primaria de fachada de la concatedral.
- [Intendencia: plan local de Minas y su entorno, memoria informativa 2024](https://www.gub.uy/intendencia-lavalleja/sites/intendencia-lavalleja/files/2024-12/Anexo%20I%20PLMinas_Memo%20Informaci%C3%B3n_2024%20%281%29_compressed.pdf). Contexto urbano. No se usa para afirmar dimensiones exactas.

## Fotografías efectivamente inspeccionadas

1. **Aérea de plaza, estanque y callejón hasta la concatedral.** [Fotografía publicada por InfoNegocios sobre inauguración de 2017](https://infonegocios.biz/images/resize/276735-1200x675.webp), [artículo](https://infonegocios.biz/default/minas-corto-cintas-de-su-nueva-plaza-de-us-2-000-000). Archivo de estudio `plaza-layout.webp`. Es la referencia fundamental de implantación: monumento en un extremo del estanque longitudinal, franjas de palmeras, jardines laterales, caminos en cruz y diagonales; la iglesia aparece **retranqueada al final de un amplio callejón**, no pegada al borde de la plaza.
2. **Desde el estanque hacia la concatedral.** [Montevideo Portal, 2017](https://imagenes.montevideo.com.uy/imgnoticias/201712/_W933_80/637941.jpg), [artículo](https://www.montevideo.com.uy/Noticias/Intendenta-de-Lavalleja-inauguro-la-nueva-plaza-de-Minas-uc669975). Archivo `plaza-remodelacion.jpg`. Confirma estanque rectangular, alineación de palmeras y perspectiva al callejón y fachada amarilla de dos torres.
3. **Fuente iluminada de noche.** [Fotografía de OPP](https://www.opp.gub.uy/sites/default/files/noticias/2018-05/50c9eed0996e11b100ab670e647dd444l.jpg). Archivo `opp-fountain.jpg`. Permite reconocer línea de chorros verticales de alturas variables y arcos de agua hacia los bordes. Se interpreta la coreografía; no se copia una secuencia ni programación municipal.
4. **Fachada cercana de la concatedral.** [Fotografía MVOT](https://www.gub.uy/ministerio-vivienda-ordenamiento-territorial/sites/ministerio-vivienda-ordenamiento-territorial/files/imagenes/noticias/DSCN8230.JPG). Archivo `catedral-frente.jpg`. Cinco arcadas de pórtico; pilastras claras, capiteles, entablamento con balaustrada, frontón central bajo y frontón alto con ventana semicircular; relojes circulares y campanas de torres.
5. **Aérea posterior de la concatedral mirando hacia la plaza.** [Uruguayo Sin Fronteras, Centro de Minas](https://i0.wp.com/uruguayosinfronteras.com/wp-content/uploads/2022/03/Centro-de-Minas.jpg?resize=960%2C480&ssl=1), [artículo](https://uruguayosinfronteras.com/paises/uruguay/que-hacer-en-minas/). Archivo `aerial-cathedral.jpg`. Confirma dos torres cuadradas con remates cupulados grises de pendiente curva, cúpula central con linterna y espacio abierto que vincula iglesia y plaza. Se evita inventar pináculos góticos.
6. **Monumento a Juan Antonio Lavalleja, vista lateral cercana.** Fotografía ya existente en proyecto: `public/media/eb7a5d7ba6a26aa0.webp`. Jinete con sombrero, caballo en movimiento y cola proyectada, bronce con pátina verde, gran pedestal rosado con relieves, escalones, medallones y cornisa con dentículos. Se distingue expresamente de la escultura de hormigón de José Artigas en Cerro Artigas.
7. **Estanque hacia el monumento (estado anterior a remodelación).** [Fotografía Wikimapia](https://photos.wikimapia.org/p/00/02/25/59/49_big.jpg), [ficha](https://wikimapia.org/2915139/es/Plaza-Libertad). Archivo `pool-monument.jpg`. Útil para relación lineal monumento/agua y arbustos; la geometría de chorros se toma de las fotos de 2017, no de las antiguas coronas circulares.
8. **Monumento completo y base dentro del estanque.** [Fotografía de Tripadvisor](https://media-cdn.tripadvisor.com/media/photo-s/12/c3/31/6f/plaza-libertad.jpg), [ficha de Plaza Libertad, Minas](https://www.tripadvisor.es/Attraction_Review-g1933338-d13310232-Reviews-Plaza_Libertad-Minas_Lavalleja_Department.html). Archivo `monument-pool.jpg`. Verifica escalones, escala relativa del pedestal, metal verde oscuro y relación del monumento con el agua.

Las descripciones automáticas de resultados de imágenes atribuyeron en algunos casos esta estatua a Artigas u otros generales; **se descartaron esas descripciones** y se utilizó la identidad confirmada del monumento a Juan Antonio Lavalleja.

## Criterios de composición y geometría

- Plaza de unos 110 × 110 m de composición, estanque alargado de unos 16 × 73 m, con monumento próximo a su extremo sur; cuatro sectores ajardinados, cruce de caminos y palmeras laterales.
- Eje local `+z` = lado de cámara preferido; concatedral en `z=-123`, monumento en `z=21`. Esta convención de escena conserva la relación observada, sin presentar estos ejes como orientación geográfica.
- Callejón abierto entre plaza y concatedral, con fachadas bajas laterales de contexto. Sus detalles son aproximaciones de ambiente urbano, sin inventariar propiedades concretas. Las distancias se comprimen ligeramente para un encuadre conjunto.
- Concatedral: nave longitudinal, cinco arcadas, pilastras y capiteles, entablamento y balaustrada, dos frontones, ventana de abanico, torres de reloj, campanarios abiertos con campanas, remates de perfil curvo, cruces, gran cúpula posterior con linterna, escalinata y reja.
- Monumento: granito rosado con textura procedural propia, cuatro escalones, pedestal con relieves bajos y medallones, dentículos; caballo anatómico por masas suaves, patas articuladas separadas, crin, orejas, cabeza inclinada, cola elevada, montura, riendas y jinete con sombrero, nariz, brazos y botas. Es una interpretación de la silueta observada, sin pretensión de reproducción escultórica exacta.
- Palmeras con frondas curvas y folíolos, troncos anillados; arbolado, arbustos, bancos con listones y soportes, farolas de globos y postes altos. Vegetación instanciada.
- `update(time)` mueve alturas de chorros, arcos laterales, gotas y ondas. Agua con material físico y reflejos de entorno; luces interiores con material emisivo, sin añadir costosas luces dinámicas por surtidor.

## Integración y validación

Archivo: `src/three/landmarks/plazaLibertad.ts`.

Exportación: `createPlazaLibertad(): LandmarkModel`.

- `target`: `(0, 13, -24)`.
- `bounds`: `{ radius: 155, height: 44 }`, incluye callejón y concatedral.
- `cameraDirection`: `(.28, .29, 1)`, desde lado de monumento/palmeras hacia iglesia al fondo; una elevación de cámara moderada permite leer el agua detrás del pedestal.
- `groundY`: `0`.
- Para encuadre general se recomienda una distancia de aproximadamente 170–210 m y mirada hacia `z=-30`; un acercamiento a 65–90 m muestra monumento/fuente con la concatedral visible por encima, según FOV. La relación monumento/estanque exige evitar una cámara excesivamente baja justo sobre el eje del pedestal.
- Geometría estática fusionada por material; follaje, troncos, arbustos y agua instanciados. Auditoría runtime: 45 mallas totales, 733 instancias, aproximadamente 138.377 triángulos efectivos; cero coordenadas no finitas. Animación evaluada en 0 y 37,5 segundos.
- Comprobación TypeScript aislada con TypeScript del proyecto y tipos Three.js: sin errores. La revisión de composición final en el recorrido se realiza al integrar con la cámara y luces del encabezado.
