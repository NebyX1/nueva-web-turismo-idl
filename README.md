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

La configuración sigue el esquema de Invest Lavalleja: URL pública de API en el frontend y `CORS_ORIGINS`, `OLLAMA_HOST`, `OLLAMA_API_KEY` y `OLLAMA_MODEL` en el backend. No se añadió un panel administrativo: estas opciones se gestionan desde Environment Variables de Coolify. No hace falta MariaDB, MinIO ni correo para este chat.

### Opción A: dos aplicaciones independientes (como Invest Lavalleja)

Crear ambas aplicaciones desde este repositorio, con build pack **Dockerfile**:

| Recurso | Base Directory / contexto | Dockerfile relativo al contexto | Puerto | Health check |
| --- | --- | --- | --- | --- |
| Turismo | `/` | `/Dockerfile` | `80` | `GET /health` |
| API Gianna | `/gianna-backend` | `/Dockerfile` | `5000` | `GET /api/ready` |

Si Coolify pide la ubicación relativa al repositorio en lugar del contexto, el Dockerfile del backend es `/gianna-backend/Dockerfile`; el contexto debe seguir siendo `/gianna-backend`. También puede desplegarse esa carpeta como repositorio independiente, pero debe incluir su corpus `data/generated/` y `data/source/`.

1. Asignar primero el dominio HTTPS al backend, por ejemplo `https://gianna-api.turismo.example`.
2. Configurar sus variables **runtime**, usando `gianna-backend/.env.example` como referencia:

   ```dotenv
   FLASK_ENV=production
   HOST=0.0.0.0
   PORT=5000
   CORS_ORIGINS=https://turismo.example,https://www.turismo.example
   OLLAMA_HOST=https://ollama.com
   OLLAMA_API_KEY=<secreto de Ollama Cloud>
   OLLAMA_MODEL=deepseek-v4.1-flash:cloud
   ```

   Reemplazar los dominios de ejemplo por los reales. Los orígenes deben ser exactos, sin `/` final, rutas ni `*`. Si sólo se usa un dominio, incluir sólo ese. El modelo debe existir y estar autorizado en la cuenta del proveedor; `OLLAMA_MODEL` gobierna respuestas, router, investigación web y fallback. `OLLAMA_BASE_URL` sigue siendo compatible si no se define `OLLAMA_HOST`.
3. Añadir almacenamiento persistente **volume** para `/app/storage`, dedicado a esta aplicación. Para un bind mount ya existente, su propietario debe ser `10001:10001`. El backend utiliza un único proceso de Waitress con cuatro hilos: no levantar réplicas compartiendo este volumen, porque Qdrant embebido bloquea el índice. SQLite del corpus se incluye en la imagen; el índice se construye al primer inicio.
4. Desplegar el backend y esperar `GET /api/ready` → HTTP 200, `status: ready`. Dar al primer arranque al menos tres minutos; el tiempo depende de la CPU. El health check comprueba modelos, índice y configuración del proveedor, **no** consume tokens ni garantiza que la clave esté autorizada: comprobar además una consulta real.
5. En Turismo, configurar `PUBLIC_GIANNA_API_BASE=https://gianna-api.turismo.example` como variable **Build**. Es el origen de API, sin `/api`, sin credenciales. Asignar el dominio HTTPS del frontend y desplegar. Cada cambio de esa URL requiere reconstruir la imagen; cambiar únicamente una variable runtime no modifica el JavaScript estático.

La API permite preflight CORS para JSON y sólo los orígenes indicados; no usa cookies ni expone la API key al navegador. En producción no se publican rutas de diagnóstico, trazas ni las herramientas web auxiliares: el chat invoca la investigación web internamente. Un servidor fuera de la lista CORS recibe un error explícito. CORS no es autenticación ni impide clientes de consola; para el dominio público de la API configurar protección/rate limiting en el proxy de Coolify si se necesita controlar abuso.

### Opción B: un recurso Docker Compose

Seleccionar `compose.yaml`, configurar `CORS_ORIGINS` con el dominio HTTPS público de Turismo, `OLLAMA_API_KEY` como secreto runtime y, opcionalmente, `OLLAMA_HOST` y `OLLAMA_MODEL`. Asignar el dominio al servicio `web`, puerto `80`; no asignar un dominio al servicio `gianna`. Dejar `PUBLIC_GIANNA_API_BASE` vacío: nginx reenvía `/api` por la red interna. Compose espera al backend saludable y conserva el índice en `gianna-storage`.

Compose no ocupa el puerto 80 del host: Coolify publica la web mediante su proxy. nginx reenvía sólo las rutas del chat y limita consultas por IP. Con un proxy inverso por delante, comprobar cómo se identifica la IP real antes de modificar límites; el límite predeterminado usa la IP del cliente que ve nginx. Para desplegar nginx por separado en modo proxy, configurar `GIANNA_BACKEND_URL` como dirección del backend, sin barra final.

### Requisitos y verificación

CPU **x86-64 con AVX2**, Docker y conexión saliente a Hugging Face (descarga inicial de unos 259 MB de modelos), Ollama Cloud y las fuentes web. Los dos modelos de recuperación tienen hashes inmutables y no se cambian con `OLLAMA_MODEL`. La API key sólo es un secreto runtime del backend; no usar `PUBLIC_`, argumentos de build ni versionarla.

La web tiene health check propio y no depende de la API para arrancar en modo URL pública. Si el backend no está listo o falla Ollama, el chat muestra el error y permite reintentar, sin respuestas ficticias. Ambos Dockerfiles excluyen entornos, credenciales e índices locales.

```powershell
# Verificación tras desplegar, con la URL REAL del backend o del proxy /api:
$env:GIANNA_SITE_URL = 'https://gianna-api.turismo.example'
npm run check:gianna -- --live
# Con dos recursos separados:
$env:GIANNA_WEB_URL = 'https://turismo.example'
$env:GIANNA_CORS_ORIGIN = 'https://turismo.example'
$env:GIANNA_EXPECT_PUBLIC_API = 'true'
npm run check:coolify
```

La prueba de Gianna hace consultas reales al modelo: verifica respuesta con evidencia, memoria y límite de mensaje. La de Coolify comprueba assets compilados, health checks, URL incrustada, preflight, orígenes permitidos/rechazados y aislamiento de rutas privadas. Para Compose, ejecutar `check:gianna -- --live` con `GIANNA_SITE_URL` igual a la URL del frontend con proxy. `check:coolify` requiere acceso directo al backend para comprobar CORS: nginx no publica OPTIONS en su proxy same-origin. Verificar también en el navegador del frontend. Modificar `OLLAMA_MODEL` o la API key requiere reiniciar/redeploy del backend; modificar `PUBLIC_GIANNA_API_BASE` requiere rebuild del frontend. No se ha creado ni configurado ningún recurso remoto de Coolify automáticamente.

## Gianna: API real en la interfaz de Lavalleja

`gianna-backend/` contiene una copia del repositorio [NebyX1/gianna-turismo-web](https://github.com/NebyX1/gianna-turismo-web), revisión `dbc66f807d17e147481aa690e009cf9b6e69b9c3`. Se incorporan los archivos directamente, sin depender de un submódulo. Se conserva el backend, la interfaz original, el corpus, las pruebas y los scripts de instalación. La adaptación del backend permite configurar `HOST` para contenedores; localmente sigue escuchando sólo en loopback.

Para ejecutar todo localmente se necesitan Python 3.12 de 64 bits, Node.js compatible, una CPU con AVX2 y Ollama abierto con sesión autorizada:

```powershell
ollama run deepseek-v4.1-flash:cloud
# Salir de la consola de Ollama con /bye; mantener la aplicación abierta.
Push-Location gianna-backend
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
powershell -ExecutionPolicy Bypass -File scripts\start_giana.ps1
Pop-Location
npm run dev
```

Abrir la URL que imprime Astro (puerto 4321, o el siguiente libre). Astro reenvía `/api` a `http://127.0.0.1:5000` tanto en desarrollo como en preview cuando `PUBLIC_GIANNA_API_BASE` está vacío. Si el backend está en otra dirección, copiar `.env.example` a `.env` y ajustar `GIANNA_BACKEND_URL` para usar proxy, o `PUBLIC_GIANNA_API_BASE` para conexión directa. La configuración local del backend usa `.env.local.example`; sus scripts la copian a `.env` sólo si todavía no existe. Si se utiliza conexión directa, incluir el origen local exacto en `CORS_ORIGINS`. Las credenciales de Ollama pertenecen exclusivamente al `.env` del backend o al entorno del servidor.

`src/islands/GiannaChat.tsx` conserva el diálogo visual de Lavalleja y conecta todos los accesos del menú, la guía y los destinos mediante `gianna:open`. Envía consultas a `/api/ask-text`, mantiene un identificador de conversación propio, consulta el progreso de búsqueda y muestra respuestas y fuentes reales. Permite mensajes de 4000 caracteres, Enter para enviar, Shift+Enter para una nueva línea, reintento y nueva conversación. Se retiraron las respuestas preparadas y la simulación de voz. Un fallo del servidor se muestra explícitamente, sin recomendaciones ficticias.

Las conversaciones permanecen en memoria del servidor durante su ejecución. Cerrar el diálogo mantiene la consulta; «Nueva conversación» cancela la espera local y usa otro contexto, pero no borra la memoria anterior del backend. Recargar la página inicia otra conversación. Los mensajes pueden enviarse a Ollama Cloud y las consultas actuales pueden usar búsqueda web; no introducir datos personales o sensibles. La información variable debe confirmarse con cada prestador.

```powershell
npm run check:gianna
# Con ambos servidores iniciados; usar la URL real que imprimió Astro:
$env:GIANNA_SITE_URL = 'http://localhost:4321'
npm run check:gianna -- --live
```

La prueba local verifica el contrato de API, límites, fuentes, respuestas inválidas, errores y eliminación del mock. `--live` exige una respuesta turística real con evidencia, memoria de seguimiento y rechazo de mensajes demasiado largos.

Para detener el backend local, ejecutar `gianna-backend\scripts\stop_giana.ps1` si se inició con su script. Detener Astro con Ctrl+C. Los entornos, modelos descargados, índices y credenciales están excluidos de Git.

## Recorrido 3D del encabezado

El encabezado recorre diez recreaciones geométricas construidas tras inspeccionar múltiples fotografías de cada lugar: monasterio Chagdud Gonpa Sengue Dzong, Salus (Fuente del Puma), las letras monumentales de Minas en La Coronilla, Verdún, Plaza Libertad con la concatedral al fondo, Parque Rodó de Minas, Arequita, Cerro Artigas, Penitente y Villa Serrana (primero el Ventorrillo y después la represa Stewart Vargas). Las nueve posiciones originales siguen el esquema del usuario; Parque Rodó se añade entre Plaza Libertad y Arequita. La distribución se documenta en `docs/journey-route-layout.md`. Las fuentes, rasgos observados y límites están en los documentos de investigación de `docs/research-*.md`. Las fotos de estudio no se redistribuyen ni se usan como texturas; los materiales se generan localmente.

`src/three/journeyScene.ts` compone terreno, vegetación, luz y una secuencia de 22 segundos por motivo: llegada aérea, acercamiento, barrido panorámico desde abajo hacia arriba y alejamiento. Las diez paradas públicas contienen trece visitas, 286 segundos en total. Parque Rodó dedica tres visitas a la entrada, lago/mirador y ruedo (66 segundos). Villa Serrana conserva una sola parada pública y dedica dos visitas consecutivas al Ventorrillo y a la represa Stewart Vargas (44 segundos). `journeyCameraTour.ts` calcula la cámara y el progreso continuo. Las cámaras usan focos específicos por lugar. Hay selección manual, pausa, reinicio y exploración orbital al pausar. El reloj se detiene fuera de pantalla y con la pestaña oculta; la preferencia de movimiento reducido muestra una toma estática. Una vista fotográfica o fondo informativo sustituye la escena si WebGL no está disponible.

Los modelos viven en `src/three/landmarks/`, la información de las paradas en `src/data/journeyStops.ts` y la interfaz en `src/islands/JourneyHero.tsx`. La composición espacial adapta distancias y relieve para el recorrido; no es una navegación geográfica ni un relevamiento métrico. El aviso de cierre por reformas del templo se incluye junto a su fuente oficial.

La represa Stewart Vargas se construye en Blender y conserva `.blend`, GLB y geometría empaquetada: paños inclinados, canales hundidos, pasarela con diagonales y malla, embalse y cauce recortados contra el terreno. `npm run check:stewart-vargas` comprueba integridad, contacto del agua y encuadres matemáticos; no reemplaza la revisión visual independiente ni las capturas de navegador. El estudio, las limitaciones y el estado de control están en `docs/research-stewart-vargas.md`, `docs/stewart-vargas-quality-plan.md` y `assets/stewart-vargas/README.md`.

Villa Serrana ofrece accesos a ambas tomas, también en pausa, e indica el motivo que está mostrando. Cada visita tiene sus propios reflectores nocturnos y encuadre móvil. Seis peces saltan dentro del embalse, con gotas y ondas al caer; comparten el reloj pausado de la escena y reutilizan la escuela de peces de `waterLife.ts`.

Parque Rodó se modeló en Blender a partir de fotografías verificadas de Minas: acceso de piedra y marquesina con óculos, palmeras, pérgola, juegos, quinchos, lago con pasarela de madera, piscina cubierta azul y ruedo ovalado con tribunas. El trazado condensa distancias; no es un relevamiento. El proyecto editable, GLB y procedencia están en `assets/parque-rodo/`; la investigación y el control independiente, en `docs/research-parque-rodo.md` y `docs/parque-rodo-quality-review.md`.

Sólo de noche, el ruedo presenta escenario, cuatro músicos, luces móviles y público saltando. Cerro Artigas suma su propio escenario abajo de la cumbre, público en la ladera, fogones y fuegos artificiales. La estatua y los pabellones aceptados se conservan. Las multitudes usan instancias y todo el movimiento comparte la pausa del recorrido; hay dos luces puntuales reales por escenario, activas sólo en su parada. `npm run check:parque-rodo` comprueba integridad, agua/terreno, cámara, visibilidad diurna, preservación y presupuesto; la aceptación visual tiene un dictamen independiente.

El recorrido es la única cabecera: integra la navegación principal, los lugares guardados y el selector Día/Noche. Se retiraron la barra fija anterior y el título introductorio duplicado. Cada parada presenta un solo título y conserva filas de altura natural en escritorio y móvil.

`JourneyLoadingScreen.tsx` presenta una bienvenida desde el HTML inicial: «Bienvenidos a Lavalleja», una ilustración SVG de sierras al amanecer y un sendero de luz en movimiento. El sol, las nubes, las aves y el aro exterior acompañan la espera con animaciones suaves; la preferencia de movimiento reducido muestra la composición estática. Los mensajes invitan a descubrir el destino, sin cantidades, porcentajes ni etapas técnicas. La bienvenida no muestra un botón para ir a la guía y se retira después del primer fotograma real de WebGL, sin una espera artificial. Si falla, ofrece reintentar o entrar al sitio sin el recorrido. Tras 12 segundos agradece la espera y a los 60 segundos permite reintentar. Las cargas canceladas liberan los recursos de GPU. Durante la preparación, el foco queda dentro de la pantalla y el resto del sitio permanece inerte; sin JavaScript, la pantalla se omite y el contenido sigue accesible.

El selector Día/Noche abre y cierra un telón antes de revelar el ambiente elegido. El modo nocturno añade luna llena procedural, estrellas y dos reflectores que iluminan la parada activa; sus lámparas y haces se ocultan durante el día. La elección se recuerda localmente. Cambiar de modo conserva la parada y la preferencia de pausa; con movimiento reducido, el telón usa un fundido breve. `src/three/journeyAtmosphere.ts` contiene la iluminación y el cielo nocturno, y `src/lib/journeyModeTransition.ts` controla la transición. `npm run check:journey-mode` verifica interrupciones y temporizadores; `npm run check:journey-atmosphere` comprueba nueve casos de referencia, proyecciones de la luna, visibilidad y liberación de recursos.

La luna mantiene un rumbo celeste fijo y se desvanece suavemente en los bordes o ante cortes bruscos de cámara. En Plaza Libertad, un foco frontal destaca a Lavalleja, otro ilumina la iglesia y las luminarias de la plaza alumbran los paseos. Los chorros de la fuente y sus luces recorren lentamente tonos violetas, rosados y celestes durante la noche.

Los módulos `arequita.ts` y `artigas.ts` refinan la silueta de la roca y la anatomía de la escultura. `minasSign.ts` modela cada letra con volumen, espesor y apoyos; `plazaLibertad.ts` reúne monumento a Lavalleja, estanque con chorros y arcos animados, palmeras, jardines y la concatedral retirada al fondo del callejón. Las geometrías estáticas se agrupan por material y la vegetación se instancia. `npm run check:journey-models` valida las cuatro construcciones, sus buffers, animaciones y enlaces a la guía.

La parada «Cerro Arequita y Naciente del Santa Lucía» incorpora el alto río por el costado izquierdo del cerro, girado 90° respecto del primer diseño: cauce excavado, juncos, corriente y brillos animados, siete peces que saltan de forma escalonada y ondas y gotas al volver al agua. En la última revisión se añadieron dos peces y se aumentó su tamaño alrededor de un 20 %. El reloj del recorrido también gobierna estas animaciones, incluida la pausa. El encuadre y los reflectores nocturnos incluyen ambos paisajes. La ficha distingue este tramo de la naciente en Cerro Pelado; las fuentes y el alcance de la recreación están en `docs/research-arequita-river.md`.

El Cerro Artigas presenta, de frente, Treinta y Tres a la izquierda del visitante, Uruguay en el centro elevado y Artigas/Liga Federal a la derecha. El pabellón central es un poco mayor y los laterales se alinean en altura; los paños quedan separados. La diagonal roja de Artigas y la leyenda «LIBERTAD O MUERTE» se dibujan localmente. La escultura y su cámara se conservan. Las referencias están en `docs/artigas-national-flags.md`.

La escultura de Artigas se edita en Blender y se entrega como geometría estática cuantizada; las fuentes y el proyecto editable están en `assets/artigas/`. `npm run check:artigas` verifica geometría, entorno preservado y aprobación independiente vinculada al mismo archivo. La revisión específica de proporciones de brazos, mangas, muñecas y manos está documentada en `docs/artigas-proportions-review.md`.

## Guía turística

La guía conserva el libro original de **Three.js**: tapas negras, lomo, volumen de hojas, sombras y animación de paso de página. `src/islands/LavallejaGuide.tsx` aporta los controles y `src/islands/ThreeGuideBook.tsx` conecta con el motor original de `public/scripts/tourism.js`. Sus 27 capítulos incluyen bienvenida, 16 destinos, 3 itinerarios y 7 capítulos de planificación, con fuentes oficiales consultadas el 5 de noviembre de 2026.

El contenido completo se distribuye en páginas mediante `src/lib/guidebook.ts`, midiendo el texto antes de componer las texturas; los párrafos continúan en las siguientes hojas. El tamaño de letra vuelve a paginar el libro. En móvil, la cámara muestra una página por vez del mismo modelo 3D. Si WebGL no está disponible, se muestran las mismas páginas como imágenes; «Leer capítulo» ofrece además el texto seleccionable, mapas y fuentes enlazadas.

El diseño editorial es un cuaderno de exploración ilustrado: láminas con estética de tinta y acuarela del siglo XIX, papel marfil y azul pizarra, títulos Cormorant Garamond y anotaciones en itálica. `src/data/bookletDesign.ts` vincula cada ilustración con su lugar y capítulo; los capítulos de destino no usan paisajes ajenos. La procedencia, los prompts y las licencias están en `docs/explorer-edition.md` y `/guide-illustrations.html`. `npm run check:guide-artwork` comprueba las asociaciones geográficas y la paginación. Los recursos se sirven localmente.

El lector tiene índice con búsqueda y categorías y favoritos. Recuerda el capítulo, la página, los favoritos y el tamaño de letra en `localStorage`. «Pantalla completa» amplía el mismo libro mediante la API del navegador, con un modo que ocupa la ventana como alternativa. Las flechas izquierda y derecha pasan páginas, igual que los gestos sobre el libro; Escape cierra los paneles o el lector ampliado y Tab recorre los controles. La preferencia de movimiento reducido conserva el libro 3D y elimina la animación.

El contenido se mantiene en `src/data/guideDestinations.ts` y `src/data/guidePlanning.ts`; `src/data/lavallejaGuide.ts` agrega la bienvenida y ordena los capítulos. El esquema está en `src/data/guideTypes.ts` y el diseño en `src/styles/guide.css`.

## Estado de la migración

El material disponible para esta migración fue el HTML autocontenido en `base-project/`; no se incluyó el ZIP con los módulos fuente. Las secciones editoriales están separadas en componentes Astro; el recorrido y los controles de la guía son islas React. El motor del libro, el catálogo y el planificador conservan el bundle original, que incluye Three.js r170. La única cabecera usa el recorrido modular de Three.js; los controles de movimiento y reinicio se conectan mediante eventos. El motor del libro expone un adaptador para recibir las páginas completas de la guía; un puente conserva sus enlaces internos. Gianna usa una isla React conectada al backend real de `gianna-backend/`.
