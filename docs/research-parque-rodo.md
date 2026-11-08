# Parque Rodó de Minas y noches festivas

Encargo del 8 de noviembre de 2026. Se representa el parque de Minas, Lavalleja, sobre avenida Aparicio Saravia. La reconstrucción conserva sus rasgos fotografiados; las distancias entre sectores se condensan para el recorrido y no se presentan como un levantamiento.

## Referencias examinadas

- [Intendencia: Plan Local de Minas, 2024](https://www.gub.uy/intendencia-lavalleja/sites/intendencia-lavalleja/files/2024-12/Anexo%20I%20PLMinas_Memo%20Informaci%C3%B3n_2024%20%281%29_compressed.pdf): identidad, emplazamiento urbano y festivales. El documento indica que ya no cuenta con área de zoológico.
- [Turismo Minas/Lavalleja, 2017](https://turismominaslavalleja.blogspot.com/2017/05/parque-rodo.html): entrada completa con piedra, columnas claras, marquesina horizontal con oculi y arco metálico con el nombre; palmeras, juegos, pérgola, parador y quinchos. Sólo sus siete fotografías del parque; las miniaturas posteriores del hotel UTE y la represa OSE son otros lugares.
- [Guía Lavalleja, Trotamundo, 2024](https://guiatrotamundo.com/wp-content/uploads/2024/05/lavalleja.pdf), página PDF 7: párrafo del Parque Rodó y fotografía propia de la pasarela/mirador, con postes oscuros, entablonado, diagonales en X y giro/ensanche al fondo. Se examinó la página completa para comprobar la asociación de la imagen.
- [Ministerio de Turismo, Vacaciones en Familia, 2019](https://uruguaynatural.com/wp-content/uploads/2023/02/guia-familia.pdf), página PDF 26: lago, espacios arbolados, picnic, juegos de madera y circuito de bicicletas. Las dimensiones del lago citadas son descriptivas de esa publicación, no mediciones del modelo.
- [IDL: arbolado del parque, marzo de 2026](https://www.gub.uy/intendencia-lavalleja/comunicacion/noticias/lunes-9-marzo-se-reabrira-zona-intervenida-del-parque-rodo): cuatro vistas aéreas bajas y de suelo. Troncos altos, copa separada del suelo, claros, senderos y juegos; maquinaria y ramas cortadas corresponden al mantenimiento y no se recrean.
- [IDL: piscina, agosto de 2026](https://www.gub.uy/intendencia-lavalleja/comunicacion/noticias/piscina-del-parque-rodo-reabre-sus-puertas-jueves-20-agosto): piscina rectangular bajo cubierta liviana azul con cerchas y paños vidriados. Se prioriza esta referencia actual frente al trampolín exterior histórico.
- [Ministerio del Interior: aérea del ruedo, octubre de 2026](https://www.gub.uy/ministerio-interior/comunicacion/noticias/resultado-del-dispositivo-seguridad-semana-lavalleja-2026-parque-rodo): ruedo oval, pista perimetral, tribunas curvas y escenario en un extremo.
- [IDL: Semana de Lavalleja, 2025](https://www.gub.uy/intendencia-lavalleja/comunicacion/noticias/semana-todos-todo-lavalleja-tiempo-record): escenario y multitud; foto `IMG-20251018-WA0102.jpg` muestra la tribuna natural del Cerro Artigas mirando hacia el escenario abajo, con ciudad/valle detrás.
- [Lavalleja Productivo: espacios verdes](https://www.lavallejaproductivo.com/espacios-verdes-y-recreacion/): confirma lago artificial, picnic, rosedal, juegos, piscina, ruedo y tribunas. Su descripción del puente de la represa OSE pertenece a otra sección y no se utiliza aquí.

Las copias de estudio quedan fuera de `public`, en `parque-rodo/references` y `parque-rodo-qa` del directorio local de visualizaciones. No se incluyen fotografías como texturas ni se usan imágenes del parque homónimo de Montevideo. Las cuatro fotografías de la sección Parque Rodó de FredLee (0017, 0015, 0014 y 0016) sirven de contraste del paseo y arbolado; las otras secciones del mismo artículo se excluyen.

## Alternativas y decisión

| Recurso/herramienta | Evaluación | Uso |
|---|---|---|
| [nemeth-balazs/threejs_park](https://github.com/nemeth-balazs/threejs_park) | Parque hecho en Blender/Three.js; código inspeccionado carga objetos OBJ y separa animación/luces. Es un jardín con pozo y faroles; no representa Minas. Sin licencia explícita en el repositorio consultado. | Referencia de organización, sin copiar código ni mallas. |
| [godikensei/Amusement_park_scene](https://github.com/godikensei/Amusement_park_scene) | Escena Three.js de atracciones. Su descripción indica objetos modelados por el autor; carece de correspondencia documentada con Minas. | No sustituye el trazado ni la entrada del parque. |
| [chrisro320/lowpoly-forest-park](https://github.com/chrisro320/lowpoly-forest-park) | Isla flotante de bosque; organización sencilla, forma incompatible con este parque urbano. | No se incorpora su geometría. |
| [Quaternius: Ultimate Nature](https://quaternius.com/packs/ultimatenature.html) | Paquete de vegetación en OBJ/FBX/Blend; útil como alternativa de utilería, pero genérico. | Se elige vegetación propia para ajustar troncos altos y claros fotografiados. |
| Blender paramétrico → GLB | Permite verificar pórtico, pasarela, piscina y tribunas desde distintas vistas, con fuente editable. | Geometría propia del parque, más exportación empaquetada para el constructor síncrono existente. |
| Three.js | Instancias y reloj común permiten público, músicos, luces y pirotecnia sin animaciones independientes que ignoren la pausa. | Presentación e interpretación nocturna, con los montajes temporales enteramente ocultos de día. |

El [plan de calidad independiente](parque-rodo-quality-plan.md) exige revisar el resultado, no sólo esta propuesta. Escenarios, artistas y público son una evocación de los festivales, no una reproducción de una edición o una grilla concreta. Se conserva el monumento y los tres pabellones del Cerro Artigas; el escenario de fogones se sitúa abajo de la cumbre y el público sobre la ladera.
