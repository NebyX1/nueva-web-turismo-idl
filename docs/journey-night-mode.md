# Recorrido de día y de noche

Implementado y revisado el 5 de noviembre de 2026.

## Comportamiento

El selector accesible Día/Noche del masthead cambia la iluminación del encabezado. La preferencia se guarda en `lavalleja:journey-mode`; un navegador sin almacenamiento también permite cambiar el ambiente durante la sesión.

Al seleccionar un modo, dos paños de telón cubren la ventana completa, incluida la navegación. El ambiente cambia debajo del telón cerrado y después se revela. La secuencia normal dura 2300 ms: cierre 650, presentación 900 y apertura 750. Con movimiento reducido usa fundidos breves, con un total de 420 ms. Los clics repetidos no interrumpen una transición en curso. Los temporizadores se cancelan al desmontar y un fallo de render libera el telón.

La pausa temporal del telón se combina con la pausa manual y la apertura del diálogo. No cambia la preferencia global de movimiento ni la parada, cámara o reloj del recorrido. Al abrirse, el recorrido retoma el estado que corresponde. La elección guardada se aplica al crear Three.js, antes del primer render; no necesita otra instancia de la escena.

## Ambiente nocturno

`src/three/journeyAtmosphere.ts` añade una luna esférica con cráteres procedurales, estrellas y un único equipo de dos reflectores que sigue la parada activa. Combina una luz cálida principal y un borde frío, con lámparas físicas y haces sutiles. Los reflectores no generan mapas de sombras adicionales. En modo diurno se ocultan juntos luces, lámparas, haces, luna y estrellas.

La luna respeta la proyección asimétrica de la cámara y adapta su posición al ancho actual, incluso al rotar un teléfono o redimensionar la ventana. Los elementos del cielo respetan la profundidad de edificios, relieve y árboles. Por eso el paisaje puede ocultar naturalmente la luna en algunas tomas.

El modo cambia también cielo, niebla, luz ambiental y exposición en `journeyScene.ts`. La alternativa sin WebGL conserva el selector y la transición, con un cielo nocturno CSS sobre la vista fotográfica. No hay fotografías lunares ni servicios externos nuevos.

## Verificación

- `npm run check:journey-mode`: cambio bajo cobertura, doble clic, ciclo noche/día, desmontaje, movimiento reducido y recuperación ante errores.
- `npm run check:journey-atmosphere`: nueve sitios × seis proyecciones × dos presupuestos de dispositivo; dos luces constantes, coordenadas finitas, esfera lunar completa dentro del encuadre, ocultación diurna y liberación única de recursos propios.
- Navegador: transiciones en ambos sentidos, cobertura visual del telón, continuidad del recorrido en marcha, conservación de pausa y parada, preferencia tras recargar, nueve destinos iluminados y composición móvil.
- Distribución: nueve destinos en escritorio y 27 comprobaciones adicionales en 390×844, 320×568 y 701×700, sin colisiones ni recortes detectados con el selector nuevo.
- `npm run check` y `npm run build`. El repositorio conserva sugerencias de variables/funciones no usadas en los módulos de Artigas y el aviso existente de bundles superiores a 500 kB.
