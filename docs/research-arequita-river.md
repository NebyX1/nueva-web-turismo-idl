# Arequita y el alto Santa Lucía

Ampliación solicitada por el usuario el 6 de noviembre de 2026: añadir el río al paisaje de Arequita, titular la parada «Cerro Arequita y Naciente del Santa Lucía» y animar agua, peces y chapoteos.

## Referencias y alcance geográfico

- [Ministerio de Ambiente: Parque Nacional Arequita](https://www.gub.uy/ministerio-ambiente/politicas-y-gestion/parque-nacional-arequita). Describe el tramo del Santa Lucía próximo a sus nacientes, el valle entre Arequita y Los Cuervos, el monte ribereño y la presencia de peces de agua dulce.
- [Camping Arequita: Sentí Lavalleja](https://campingarequita.uy/senti-lavalleja/). Identifica la naciente en Cerro Pelado y el paisaje del alto Santa Lucía en el entorno del parque.
- Se volvieron a inspeccionar las fotografías oficiales y de Bienflorencia ya documentadas en `research-arequita-refinement.md`: agua verde oscura, orillas vegetadas, ribera irregular y la relación entre el río y el escarpe. No se incorporan fotografías como texturas.

El título responde al pedido del usuario. La ficha aclara que la naciente está en Cerro Pelado y que la escena representa el tramo del río junto a Arequita. El cauce y sus distancias son una interpretación escénica, coherente con el resto del recorrido; no indican la posición exacta de la vertiente.

## Implementación

`arequitaRiver.ts` comparte un mismo perfil de ribera entre el agua, el terreno excavado y la exclusión de árboles. Según la corrección posterior del usuario, todo el sistema gira 90° y recorre el costado izquierdo del cerro: se transforma también el cálculo del lecho y el anclaje de los juncos, no sólo la malla visible. La falda se amplía para alojar el río; se conserva el escarpe y su hombro descendente. El encuadre incluye el río y el cerro, con un acercamiento mayor y un centro visual más alto en móvil para que el paisaje no quede perdido en la niebla ni detrás del título. Dos reflectores nocturnos se sitúan en tierra firme.

El material conserva iluminación y niebla de Three.js. Combina pequeñas ondulaciones, corriente, brillos y espuma de contacto mediante un reloj compartido con la visita. Los siete peces son interpretaciones genéricas de agua dulce, con siluetas ampliadas para su lectura a distancia; no se les atribuye una especie. En la última revisión se añadieron dos ejemplares y se amplió uniformemente su tamaño alrededor de un 20 %. Saltan de forma escalonada, vuelven al agua y producen gotas con trayectoria balística y ondas que se expanden y desaparecen. No se incorpora audio automático. Pausa y movimiento reducido detienen el mismo reloj que el agua.

`check:journey-models` comprueba la separación entre el lecho y el agua, el arco del salto, la inmersión, las gotas, las ondas y la congelación del chapoteo al repetir un instante. También conserva los controles de silueta y vegetación de Arequita y los del resto de las paradas.

La referencia de `journeyStops.ts` en `assets/penitente/preserved-context.json` se actualiza exclusivamente por el nuevo nombre y contenido de Arequita. Su historial `authorizedFollowups` conserva el hash anterior y documenta la autorización del usuario; los otros ocho destinos se compararon con la versión previa y coinciden. La aprobación y los activos del Penitente permanecen intactos.
