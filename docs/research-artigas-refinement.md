# Reconstrucción del monumento ecuestre de Artigas

5 de noviembre de 2026. La reconstrucción sustituye exclusivamente la escultura ecuestre del Cerro Artigas de Minas. El cerro, rocas, camino, vegetación, contexto urbano, mástiles, ubicación y encuadres conservan su implementación anterior. Después de aprobarse la escultura, el usuario pidió corregir las tres banderas para que fueran pabellones nacionales de Uruguay.

## Referencias e identidad

El [decreto de la Intendencia de Lavalleja](https://www.gub.uy/intendencia-lavalleja/institucional/normativa/decreto-departamental-n-3978-fecha-11062025) identifica el monumento de Minas. La [galería de Commons](https://commons.wikimedia.org/wiki/Category:Cerro_Artigas,_Lavalleja) reúne 51 fotos. Se inspeccionaron 28 referencias complementarias, incluidas vistas frontales, ambos perfiles, tres cuartos, una posterior de tres cuartos y detalles de las facciones. Las fuentes precisas y la revisión independiente se documentan en [el informe de calidad](artigas-quality-review.md).

Rasgos centrales: caballo quieto y macizo, cuatro apoyos, cuello arqueado y hocico bajo; Artigas descubierto, inclinado suavemente hacia el caballo, rostro adulto serio y anguloso, pelo ondulado hacia atrás; mano baja sobre las riendas y otra recogida sobre el paño. El poncho cae desde los hombros sobre la grupa, con pliegues amplios y flecos; botas, estribos, carona y basamento bajo completan la silueta. Las fotos se usan como referencia y no pasan a las texturas de la web.

## Evaluación de bases y herramientas

- Se buscaron modelos del monumento exacto y estatuas ecuestres existentes. El Artigas disponible en 3D Warehouse corresponde a Montevideo y tiene otra pose. No se verificó un escaneo descargable de la escultura de Minas.
- [Horse Statue 01 de Poly Haven](https://polyhaven.com/a/horse_statue_01), CC0, tiene un caballo encabritado; su postura requiere una reconstrucción importante.
- [Realtime Rancher's 3D Model Pack, Lyndon Daniels](https://opengameart.org/content/realtime-ranchers-3d-model-pack), CC0, aporta una malla equina con anatomía existente y postura de pie. Se eligió como base para modificar masa, cabeza, miembros, orejas, crin y cola.
- [MakeHuman](https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.ASSETS.md) publica malla y objetivos de forma bajo CC0. Se usan para una anatomía humana continua, con cambios de edad, mandíbula, nariz, expresión y pose.
- Blender permite editar volúmenes, simular la caída de la tela, remallar uniones y revisar luces y siluetas antes de exportar. Las fotos públicas de distintas fechas no constituyen por sí solas una captura fotogramétrica métrica.

## Implementación

Los módulos `artigasHead.ts` y `artigasSculpture.ts` se eliminaron íntegramente. El antiguo constructor duplicado de `natureMonuments.ts` se sustituye por una reexportación del único constructor actual. El utilitario de esculpido que sigue usando el Puma de Salus se conserva; Artigas ya no depende de él.

`scripts/artigas/build_artigas.py` construye la nueva escultura en Blender. La anatomía de caballo y jinete se adapta mediante hitos y deformaciones continuas; los cuatro cascos se apoyan en la losa. Cabeza, cuello, ojos y pelo se revisan desde frente y tres cuartos, con cámaras altas y bajas. El paño usa una simulación de 48 fotogramas con colisiones y apoyos, seguida de remallado y optimización. Se conservan el proyecto Blender editable, el GLB y las fuentes CC0 en `assets/artigas/`.

`pack-artigas.mjs` conserva posiciones, índices y normales del GLB en una malla estática cuantizada. El error máximo de posición es inferior a 0,00011 unidades. `artigasMesh.ts` decodifica esa geometría de manera síncrona, incluso al iniciar con el recorrido pausado. La corrección de brazos y manos contiene 13 mallas y 193.458 triángulos, con presupuesto de 200.000. El cerro conserva sus mallas e instancias originales.

### Corrección localizada de brazos y manos

Por observación del usuario se revisan los dos brazos, mangas, muñecas y manos en su conjunto. La revisión anterior fue insuficiente respecto a sus proporciones; se registra un control independiente nuevo en `artigas-proportions-review.md`. `adult_arms.py` equilibra las cadenas hombro–codo–muñeca (1,86 de brazo superior y 1,82 de antebrazo en cada lado), ensancha las mangas localmente y repara sus uniones. La cabeza, el caballo y los otros elementos de la escultura no se escalan.

`anatomical_hands.py` parte de la topología humana CC0 con metacarpo, falanges y pulgar; diferencia la izquierda, cerrada sobre las riendas, de la derecha, semiextendida sobre el paño. Las articulaciones conservan sus longitudes y la muñeca termina cerrada dentro de la manga. Los dedos no se fusionan mediante remallado. `refine_artigas_hands.py` trabaja sobre la escena guardada sin repetir la simulación del manto. Cambian las manos y el grupo de uniforme que contiene las mangas; posiciones, normales, índices, materiales y límites de los otros once grupos permanecen idénticos y están protegidos por `preserved-sculpture.json`. La revisión visual exige palma, dorso y perfil de cada mano aislada, contactos en contexto, ambos perfiles de la figura y vistas a escala de pantalla.

## Validación y límites

La revisión independiente rechaza iteraciones con anatomía, facciones, prendas o uniones deficientes. Para la corrección de proporciones examina 25 imágenes de la geometría final empaquetada: 16 de figura, cabeza y contactos; seis de manos completas aisladas por componente; y tres encuadres a escala de pantalla, incluidos luz nocturna aproximada y dos formatos. Se conservan en `docs/references/artigas-proportions/`, con un manifiesto de SHA-256 de cada imagen y del modelo. El dictamen identifica el SHA-256 del GLB; `check:artigas` requiere que coincida con el activo utilizado.

También se verifican normales e índices válidos, cuatro cascos sobre la losa, proporciones de cabeza/jinete, presupuesto geométrico y alturas compatibles con el encuadre. Huellas de los bloques originales comprueban que cerro, entorno y cámaras permanezcan idénticos. La huella del bloque de banderas se actualiza únicamente por la corrección posterior solicitada, conservando también la huella anterior. Las pruebas del recorrido verifican además el resto de las paradas.

### Banderas nacionales

`uruguayFlag.ts` construye las tres banderas con proporción 3:2, nueve franjas (cinco blancas y cuatro azules), cantón blanco cuadrado junto al asta y Sol de Mayo dorado con rostro y dieciséis rayos alternados, ocho rectos y ocho ondulados. El cantón ocupa las primeras cinco franjas. El diseño se ve por ambos lados y sigue la ondulación del paño; no depende de cargar texturas. Los mástiles conservan posición y altura, y la escultura aprobada conserva exactamente su activo y SHA.

Referencias: [ANEP, Bandera del Uruguay](https://uruguayeduca.anep.edu.uy/sites/default/files/exelearning/06-2026/15088/bandera_del_uruguay.html) e [IMPO, Decreto 339/003, capítulo II](https://www.impo.com.uy/bases/decretos-reglamento/339-2003).

Es una recreación estilizada basada en fotos: pliegues y detalle del rostro se simplifican para la escala del recorrido. La revisión visual se hace mediante renders de la geometría real con Blender CPU; no se afirma una revisión WebGL del navegador, cuyo acceso local estaba restringido en esta sesión.
