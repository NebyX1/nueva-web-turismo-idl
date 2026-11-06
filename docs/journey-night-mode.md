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

## Verificación

- `npm run check:journey-mode`: cambio bajo cobertura, doble clic, ciclo noche/día, desmontaje, movimiento reducido y recuperación ante errores.
- `npm run check:journey-atmosphere`: nueve sitios × seis proyecciones × dos presupuestos de dispositivo; reflectores y penumbras propios, blancos de estatua e iglesia, transformación local a mundial, sincronización de faroles, dirección y tamaño lunar constantes, traslación sin paralaje, corte de cámara sin teletransporte visible, zoom/formato móvil, salida gradual, finalización del fundido pausado y liberación única de recursos propios.
- `npm run check:journey-models`: orientación de la base de Lavalleja y de la estatua, iluminación directa sobre las normales visibles del bronce, doce luminarias de la plaza, alcance sobre una cuadrícula, tres luces de fuente, colores extremos/interpolación continua y restauración diurna.
- Navegador: transiciones en ambos sentidos, cobertura visual del telón, continuidad del recorrido en marcha, conservación de pausa y parada, preferencia tras recargar, nueve destinos iluminados y composición móvil.
- Distribución: nueve destinos en escritorio y 27 comprobaciones adicionales en 390×844, 320×568 y 701×700, sin colisiones ni recortes detectados con el selector nuevo.
- `npm run check` y `npm run build`. El repositorio conserva sugerencias de variables/funciones no usadas en los módulos de Artigas y el aviso existente de bundles superiores a 500 kB.
