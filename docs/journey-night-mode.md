# Recorrido de día y de noche

Implementado y revisado el 5 de noviembre de 2026.

## Comportamiento

El selector accesible Día/Noche del masthead cambia la iluminación del encabezado. La preferencia se guarda en `lavalleja:journey-mode`; un navegador sin almacenamiento también permite cambiar el ambiente durante la sesión.

Al seleccionar un modo, dos paños de telón cubren la ventana completa, incluida la navegación. El ambiente cambia debajo del telón cerrado y después se revela. La secuencia normal dura 2300 ms: cierre 650, presentación 900 y apertura 750. Con movimiento reducido usa fundidos breves, con un total de 420 ms. Los clics repetidos no interrumpen una transición en curso. Los temporizadores se cancelan al desmontar y un fallo de render libera el telón.

La pausa temporal del telón se combina con la pausa manual y la apertura del diálogo. No cambia la preferencia global de movimiento ni la parada, cámara o reloj del recorrido. Al abrirse, el recorrido retoma el estado que corresponde. La elección guardada se aplica al crear Three.js, antes del primer render; no necesita otra instancia de la escena.

## Ambiente nocturno

`src/three/journeyAtmosphere.ts` añade una luna esférica con cráteres procedurales, estrellas y un único equipo de dos reflectores que sigue la parada activa. Combina una luz cálida principal y un borde frío, con lámparas físicas y haces sutiles. Los reflectores no generan mapas de sombras adicionales. En modo diurno se ocultan juntos luces, lámparas, haces, luna y estrellas.

En Plaza Libertad, el primer reflector ilumina frontalmente el caballo y el jinete de Lavalleja con blanco cálido, un haz más concentrado y penumbra propia. Se ubica del lado que ve la cámara para evitar que sólo se ilumine el reverso del bronce. El segundo apunta a la fachada de la concatedral. `LandmarkModel.nightLighting` entrega esos puntos en coordenadas locales; la atmósfera los transforma a la posición real del modelo. El resto de las paradas conserva el equipo principal y de borde.

Los ocho faroles dobles y las cuatro luminarias altas de la plaza aportan doce luces puntuales reales, además del brillo de sus lámparas. Alumbran las caminerías y jardines sin añadir mapas de sombras. Las fuentes puntuales se activan durante la parada de la plaza para acotar el coste de iluminación; las bombillas mantienen su brillo nocturno cuando se ve la plaza a distancia. El modo diurno y el desmontaje apagan las fuentes. Cambiar de ambiente con el recorrido pausado aplica este estado de inmediato.

`src/three/landmarks/plazaFountainLights.ts` sincroniza los chorros verticales, arcos, gotas, LED y ondas del agua en un ciclo nocturno de 18 segundos: violeta → rosado → celeste → violeta. La interpolación suavizada dedica seis segundos a cada tramo. Tres luces puntuales de color aportan iluminación local al agua y los chorros, sin sombras adicionales. La pausa conserva el color y la forma del agua; volver al día restaura sus materiales y apaga los focos de color.

La luna conserva una dirección celeste fija, por encima del horizonte, y un tamaño angular constante. La cúpula sigue únicamente la traslación de la cámara, por lo que viajar entre lugares no produce paralaje lunar. El giro y el zoom sí cambian su proyección naturalmente. `src/three/journeyMoon.ts` desvanece la luna antes de los bordes; no la recoloca en una esquina para perseguir el encuadre. Los cortes bruscos de orientación, FOV o formato disuelven la posición aparente anterior antes de revelar la nueva. Las estrellas quedan detrás de la esfera y el cielo respeta la profundidad del relieve y la arquitectura.

Si el recorrido está pausado, sólo se dibujan los fotogramas necesarios para terminar ese fundido. El reloj del agua y del viaje permanece detenido, y el bucle breve se cancela al ocultar la pestaña, salir del viewport o desmontar la escena. Una toma que mira al suelo puede dejar la luna fuera de campo; mirar nuevamente hacia su dirección celeste la revela con suavidad.

El modo cambia también cielo, niebla, luz ambiental y exposición en `journeyScene.ts`. La alternativa sin WebGL conserva el selector y la transición, con un cielo nocturno CSS sobre la vista fotográfica. No hay fotografías lunares ni servicios externos nuevos.

## Visitas sorpresa en el cielo

La ampliación solicitada el 6 de noviembre incorpora cuatro esculturas cómicas en `journeyNightVisitors.ts`: bruja con escoba, dragón chino serpenteante, Papá Noel en trineo con reno y ovni con tripulante. Son geometrías locales, sin imágenes descargadas, audio ni luces adicionales. Comparten un presupuesto de 22 108 triángulos y permanecen ocultas durante el día.

La primera aparición espera aleatoriamente entre 8 y 15 segundos de movimiento nocturno efectivo. Las siguientes esperan entre 30 y 58 segundos y cada vuelo dura entre 9 y 12 segundos. Una bolsa barajada reparte los cuatro personajes antes de repetirlos y evita repetir al último cuando comienza otro ciclo. Vuelan de a uno, en ambos sentidos, con balanceos propios y entrada/salida suaves.

El reloj recibe únicamente los segundos de movimiento efectivo de la escena; seleccionar otra parada, reiniciar el recorrido o redibujar una cámara pausada no consume la espera ni adelanta un vuelo. Pausa, telón, pestaña oculta, recorrido fuera de pantalla y movimiento reducido detienen el reloj existente. Cambiar a día oculta el personaje de inmediato. La proyección usa la cámara real y sus desplazamientos de encuadre; el tamaño se limita tanto en altura como en ancho para escritorio y móvil. La profundidad respeta el relieve y se pospone el inicio cuando la cámara apunta al suelo.

En móvil, la trayectoria baja dentro de su franja de cielo y reduce su altura máxima para dejar libres las dos filas de navegación y el indicador de estado. Si un cambio de cámara o de formato deja la trayectoria por debajo del horizonte, el personaje se desvanece en lugar de aparecer sobre el terreno.

`npm run check:journey-surprises` verifica los cuatro personajes, espera, alternancia, límite de una aparición, pausa, día, movimiento reducido y proyección móvil. También comprueba los peces de la poza del Penitente.

## Comprobaciones del ambiente

- `npm run check:journey-mode`: cambio bajo cobertura, doble clic, ciclo noche/día, desmontaje, movimiento reducido y recuperación ante errores.
- `npm run check:journey-atmosphere`: nueve sitios × seis proyecciones × dos presupuestos de dispositivo; reflectores y penumbras propios, blancos de estatua e iglesia, transformación local a mundial, sincronización de faroles, dirección y tamaño lunar constantes, traslación sin paralaje, corte de cámara sin teletransporte visible, zoom/formato móvil, salida gradual, finalización del fundido pausado y liberación única de recursos propios.
- `npm run check:journey-models`: orientación de la base de Lavalleja y de la estatua, iluminación directa sobre las normales visibles del bronce, doce luminarias de la plaza, alcance sobre una cuadrícula, tres luces de fuente, colores extremos/interpolación continua y restauración diurna.
- Navegador: transiciones en ambos sentidos, cobertura visual del telón, continuidad del recorrido en marcha, conservación de pausa y parada, preferencia tras recargar, nueve destinos iluminados y composición móvil.
- Distribución: nueve destinos en escritorio y 27 comprobaciones adicionales en 390×844, 320×568 y 701×700, sin colisiones ni recortes detectados con el selector nuevo.
- `npm run check` y `npm run build`. El repositorio conserva sugerencias de variables/funciones no usadas en los módulos de Artigas y el aviso existente de bundles superiores a 500 kB.

## Ampliación del 8 de noviembre: festivales

Parque Rodó suma una evocación de Minas y Abril y Semana de Lavalleja: escenario en un extremo del ruedo, cuatro músicos con instrumentos y una multitud instanciada. Cerro Artigas incorpora Noche de los Fogones, con escenario al pie de la cumbre, público sobre la ladera, tres fogones y seis ciclos escalonados de pirotecnia. No se reproduce una edición o banda real. El monumento y los tres pabellones mantienen exactamente su geometría aceptada.

El montaje temporal completo de cada lugar se agrupa bajo un nodo oculto por defecto: escenario, artistas, público, pantallas, haces, fogones y pirotecnia desaparecen juntos durante el día. Cada evento añade dos luces puntuales activas únicamente de noche y en la parada correspondiente. No añade mapas de sombras ni audio. Público, músicos, luces y partículas reciben el mismo reloj del recorrido y se congelan en pausa, telón, movimiento reducido y pestaña oculta. La pirotecnia sale detrás del escenario, asciende, estalla y cae con desvanecimiento.

Las cámaras nocturnas de ambos ruedos priorizan escenario y público. Al cambiar de modo se conserva el tiempo y la parada, y se aplica el encuadre propio mientras el telón está cerrado. El lago y el acceso del Parque Rodó tienen sus propios blancos de reflectores. Las nueve pruebas históricas de atmósfera siguen siendo casos de referencia; `check:parque-rodo` cubre la décima parada, las trece visitas completas, los montajes festivos y la preservación de la escultura.

Las fuentes visuales, límites de fidelidad y decisión Blender → GLB → Three.js se documentan en `research-parque-rodo.md`; el plan y el dictamen de aceptación independiente están en `parque-rodo-quality-plan.md` y `parque-rodo-quality-review.md`.
