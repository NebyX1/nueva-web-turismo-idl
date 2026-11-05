# Explorá Lavalleja — cuaderno ilustrado

Dirección editorial: cuaderno de exploración contemporáneo inspirado en las láminas de viajeros del siglo XIX. Papel marfil, tinta azul pizarra, acuarelas apagadas, títulos Cormorant Garamond e itálicas de anotación. La referencia del usuario se empleó únicamente como guía visual.

Se mantienen el libro y la deformación de hojas originales de Three.js, la guía completa de 27 capítulos, la búsqueda, los favoritos, la lectura accesible y la pantalla completa. La paginación mide el texto con las fuentes locales cargadas y continúa el contenido en nuevas hojas.

## Láminas y generación

Dieciocho ilustraciones generadas individualmente con el **generador de imágenes integrado `image_gen.imagegen`**, usando fotografías identificadas como referencia de los lugares. No se aplicaron filtros a las fotografías para simular dibujos. Son interpretaciones gráficas actuales, no láminas históricas ni reproducciones documentales exactas.

Los PNG originales de 1536 × 1024 están en `public/media/explorer/`. La web usa copias WebP del mismo tamaño, codificadas con Sharp a calidad 90, sin recortes, filtros ni alteración de la composición. Cada apertura conserva la ilustración completa. Los pies identifican el lugar y los detalles dibujados.

Cada capítulo de destino tiene un ámbito geográfico explícito: todas sus láminas pertenecen a ese lugar, incluidas sus páginas de cierre. Se eliminaron los adelantos visuales del capítulo siguiente y el relleno con otros destinos. Cuando existe una sola lámina, el diseño muestra esa lámina con los puntos de interés del propio capítulo. Los capítulos prácticos usan brújula y listas propias; la bienvenida, el capítulo territorial y los itinerarios muestran únicamente destinos incluidos en su recorrido.

`npm run check:guide-artwork` comprueba la identidad de los destinos, la existencia de los archivos, la ausencia de imágenes ajenas en cada doble página y el renderizado de páginas con cero, una, dos y tres láminas en tres escalas de texto. Los capítulos futuros no heredan imágenes genéricas.

| Archivo base (PNG original y WebP para la web) | Motivo |
| --- | --- |
| arequita | Cerro Arequita |
| arequita-roquedo | Detalle del roquedo de Arequita |
| arequita-monte | Monte al pie de Arequita |
| villa-serrana | Villa Serrana |
| penitente | Salto del Penitente |
| minas | Monumento de Plaza Libertad, Minas |
| verdun | Cerro del Verdún |
| solis-mataojo | Avenida arbolada de Solís de Mataojo |
| salus | Camino de la Reserva Natural Salus |
| aguas-blancas | Represa de Aguas Blancas |
| marco-de-los-reyes | Panorama de las sierras |
| zapican | Campo de Zapicán |
| solis-acceso | Acceso a Solís de Mataojo |
| cerro-artigas | Monumento a Artigas del cerro, Minas |
| mariscala | Parroquia Nuestra Señora de Pompeya, Mariscala |
| jose-pedro-varela | Plaza central de José Pedro Varela |
| batlle-y-ordonez | Iglesia de José Batlle y Ordóñez |
| piraraja | Torre de OSE en Plaza Roma, Pirarajá |

Prompts finales exactos, referencias, originales del generador y revisión visual:

- [Sierras: Arequita, Villa Serrana y Penitente](explorer-prompts-sierras.md).
- [Cultura: Minas, Verdún y Solís](explorer-prompts-culture.md).
- [Agua y campo: Salus, Aguas Blancas, Marco de los Reyes, Zapicán y acceso a Solís](explorer-prompts-country.md).
- [Detalles exclusivos de Arequita](explorer-prompts-arequita-details.md).
- [Mariscala y José Pedro Varela](explorer-prompts-norte.md).
- [Cerro Artigas, Batlle y Ordóñez y Pirarajá](explorer-prompts-localidades.md).

Los créditos y licencias de las nuevas adaptaciones de fotografías están también publicados en `public/guide-illustrations.html`: Mariscala, a partir de Marinna, CC BY-SA 4.0; Cerro Artigas, a partir de Romi 15, CC BY-SA 3.0; Batlle y Ordóñez, a partir de JacobinoWunsh, CC BY-SA 4.0. Las láminas adaptadas conservan esas licencias. La fotografía de estudio de Pirarajá es anterior a la remodelación de Plaza Roma de 2024; el dibujo identifica su torre, sin afirmar que el mobiliario represente el estado actual.

Las fotografías de referencia y otras secciones del sitio conservan sus créditos en `public/guide-photo-credits.html`. Ningún archivo fotográfico se utiliza como imagen de las páginas de este cuaderno. Cormorant Garamond se distribuye localmente con su licencia OFL en `public/fonts/CormorantGaramond-OFL.txt`.
