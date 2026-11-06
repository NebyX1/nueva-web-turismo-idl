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

## Recorrido 3D del encabezado

El encabezado recorre nueve recreaciones geométricas construidas tras inspeccionar múltiples fotografías de cada lugar: monasterio Chagdud Gonpa Sengue Dzong, Salus (Fuente del Puma), las letras monumentales de Minas en La Coronilla, Verdún, Plaza Libertad con la concatedral al fondo, Arequita, Cerro Artigas, Penitente y Villa Serrana (Ventorrillo). El orden y las posiciones siguen el esquema del usuario documentado en `docs/journey-route-layout.md`. Las fuentes, rasgos observados y límites están en los documentos de investigación de `docs/research-*.md`. Las fotos de estudio no se redistribuyen ni se usan como texturas; los materiales se generan localmente.

`src/three/journeyScene.ts` compone terreno, vegetación, luz y una secuencia de 22 segundos por parada: llegada aérea, acercamiento, barrido panorámico desde abajo hacia arriba y alejamiento. Las cámaras usan focos específicos por lugar. Hay selección manual, pausa, reinicio y exploración orbital al pausar. El reloj se detiene fuera de pantalla y con la pestaña oculta; la preferencia de movimiento reducido muestra una toma estática. Una vista fotográfica o fondo informativo sustituye la escena si WebGL no está disponible.

Los modelos viven en `src/three/landmarks/`, la información de las paradas en `src/data/journeyStops.ts` y la interfaz en `src/islands/JourneyHero.tsx`. La composición espacial adapta distancias y relieve para el recorrido; no es una navegación geográfica ni un relevamiento métrico. El aviso de cierre por reformas del templo se incluye junto a su fuente oficial.

El selector Día/Noche abre y cierra un telón antes de revelar el ambiente elegido. El modo nocturno añade luna llena procedural, estrellas y dos reflectores que iluminan la parada activa; sus lámparas y haces se ocultan durante el día. La elección se recuerda localmente. Cambiar de modo conserva la parada y la preferencia de pausa; con movimiento reducido, el telón usa un fundido breve. `src/three/journeyAtmosphere.ts` contiene la iluminación y el cielo nocturno, y `src/lib/journeyModeTransition.ts` controla la transición. `npm run check:journey-mode` verifica interrupciones y temporizadores; `npm run check:journey-atmosphere` comprueba las nueve paradas, proyecciones de la luna, visibilidad y liberación de recursos.

La luna mantiene un rumbo celeste fijo y se desvanece suavemente en los bordes o ante cortes bruscos de cámara. En Plaza Libertad, un foco frontal destaca a Lavalleja, otro ilumina la iglesia y las luminarias de la plaza alumbran los paseos. Los chorros de la fuente y sus luces recorren lentamente tonos violetas, rosados y celestes durante la noche.

Los módulos `arequita.ts` y `artigas.ts` refinan la silueta de la roca y la anatomía de la escultura. `minasSign.ts` modela cada letra con volumen, espesor y apoyos; `plazaLibertad.ts` reúne monumento a Lavalleja, estanque con chorros y arcos animados, palmeras, jardines y la concatedral retirada al fondo del callejón. Las geometrías estáticas se agrupan por material y la vegetación se instancia. `npm run check:journey-models` valida las cuatro construcciones, sus buffers, animaciones y enlaces a la guía.

La escultura de Artigas se edita en Blender y se entrega como geometría estática cuantizada; las fuentes y el proyecto editable están en `assets/artigas/`. `npm run check:artigas` verifica geometría, entorno preservado y aprobación independiente vinculada al mismo archivo. La revisión específica de proporciones de brazos, mangas, muñecas y manos está documentada en `docs/artigas-proportions-review.md`.

## Guía turística

La guía conserva el libro original de **Three.js**: tapas negras, lomo, volumen de hojas, sombras y animación de paso de página. `src/islands/LavallejaGuide.tsx` aporta los controles y `src/islands/ThreeGuideBook.tsx` conecta con el motor original de `public/scripts/tourism.js`. Sus 27 capítulos incluyen bienvenida, 16 destinos, 3 itinerarios y 7 capítulos de planificación, con fuentes oficiales consultadas el 5 de noviembre de 2026.

El contenido completo se distribuye en páginas mediante `src/lib/guidebook.ts`, midiendo el texto antes de componer las texturas; los párrafos continúan en las siguientes hojas. El tamaño de letra vuelve a paginar el libro. En móvil, la cámara muestra una página por vez del mismo modelo 3D. Si WebGL no está disponible, se muestran las mismas páginas como imágenes; «Leer capítulo» ofrece además el texto seleccionable, mapas y fuentes enlazadas.

El diseño editorial es un cuaderno de exploración ilustrado: láminas con estética de tinta y acuarela del siglo XIX, papel marfil y azul pizarra, títulos Cormorant Garamond y anotaciones en itálica. `src/data/bookletDesign.ts` vincula cada ilustración con su lugar y capítulo; los capítulos de destino no usan paisajes ajenos. La procedencia, los prompts y las licencias están en `docs/explorer-edition.md` y `/guide-illustrations.html`. `npm run check:guide-artwork` comprueba las asociaciones geográficas y la paginación. Los recursos se sirven localmente.

El lector tiene índice con búsqueda y categorías y favoritos. Recuerda el capítulo, la página, los favoritos y el tamaño de letra en `localStorage`. «Pantalla completa» amplía el mismo libro mediante la API del navegador, con un modo que ocupa la ventana como alternativa. Las flechas izquierda y derecha pasan páginas, igual que los gestos sobre el libro; Escape cierra los paneles o el lector ampliado y Tab recorre los controles. La preferencia de movimiento reducido conserva el libro 3D y elimina la animación.

El contenido se mantiene en `src/data/guideDestinations.ts` y `src/data/guidePlanning.ts`; `src/data/lavallejaGuide.ts` agrega la bienvenida y ordena los capítulos. El esquema está en `src/data/guideTypes.ts` y el diseño en `src/styles/guide.css`.

## Estado de la migración

El material disponible para esta migración fue el HTML autocontenido en `base-project/`; no se incluyó el ZIP con los módulos fuente. Las secciones editoriales están separadas en componentes Astro; la navegación móvil y los controles de la guía son islas React. El motor del libro, el catálogo, el planificador y Gianna conservan el bundle original, que incluye Three.js r170. El encabezado usa el nuevo recorrido modular de Three.js; la inicialización de la antigua escena se desactivó mediante un puente de eventos. El motor del libro expone un adaptador para recibir las páginas completas de la guía; un puente conserva sus enlaces internos. Gianna funciona como demostración local y no está conectada a un backend.
