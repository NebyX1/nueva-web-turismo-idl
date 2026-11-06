# Pabellones del Cerro Artigas

Actualización pedida por el usuario el 6 de noviembre de 2026: conservar Uruguay e incorporar Artigas/Liga Federal y Treinta y Tres Orientales, con la inscripción «Libertad o Muerte».

## Diseño verificado

- [Embajada de Uruguay: símbolos patrios](https://www.embajadadeuruguay.org/pages/acerca-de-uruguay/simbolos-patrios.php?categoria=S%C3%ADmbolos+Patrios&id_articulo=18&pagina=deuruguay): proporciones, colores y sentido de la diagonal de Artigas.
- [Embajada de Uruguay en Argentina: Treinta y Tres](https://embajadadeluruguay.com.ar/banderadelostreintaytres): franjas azul, blanca y punzó y leyenda central.
- [Ejército Nacional: desembarco de los Treinta y Tres](https://www.ejercito.mil.uy/index.php/2026/04/19/201-aniversario-del-desembarco-de-los-treinta-y-tres-orientales/): identificación histórica del tricolor y la inscripción.

La corrección posterior del usuario establece el orden visto de frente: Treinta y Tres a la izquierda del visitante, Pabellón Nacional en el centro y Artigas a la derecha. Los apoyos de los mástiles se conservan y sus longitudes se adaptan al desnivel del terreno: las banderas laterales quedan alineadas y el pabellón central se eleva 2,5 unidades del modelo. Su paño también es un 10 % más ancho para darle mayor presencia. El paño nacional conserva el modelo geométrico de nueve franjas y Sol de Mayo. Artigas lleva azul/blanco/azul y una franja punzó desde el ángulo superior del asta al inferior del vuelo. Treinta y Tres lleva azul/blanco/punzó y «LIBERTAD O MUERTE» centrado en negro en la banda blanca.

Los dos diseños nuevos se dibujan localmente en canvas de 1200 × 800 y se aplican sobre una malla ondulada de proporción 3:2. No dependen de descargas de imágenes ni de fuentes externas. Los paños laterales miden 3 unidades de ancho y el central 3,3, por debajo de la separación de 3,6 entre mástiles, para evitar superposiciones. Las letras forman parte de la misma textura que el paño.

La estatua, el cerro, la vegetación y la cámara se conservan. El historial de `assets/artigas/preserved-setting.json` y los seguimientos autorizados de `assets/penitente/preserved-context.json` documentan la sustitución de banderas y su nueva distribución; las aprobaciones de la escultura permanecen asociadas al mismo activo.

`check:journey-models` verifica el orden proyectado desde la vista frontal, el sentido de la diagonal, la inscripción, la proporción de los paños, su separación, la alineación de los laterales y la posición más alta del pabellón nacional central.
