# Referencias visuales y modelado: arquitectura y agua de Lavalleja

Consulta: 5 de noviembre de 2026. Se inspeccionaron visualmente las imágenes listadas antes de construir las geometrías. Son referencias de estudio; las fotografías de prensa no se usan como texturas ni como contenido del recorrido. El material visual del recorrido se genera con geometría, materiales y texturas procedurales propias.

## Chagdud Gonpa Sengue Dzong

Fuentes de identidad y estado de visita:

- [Centro oficial Chagdud Gonpa Uruguay](https://budismo.com.uy/): el aviso actual indica **templo cerrado por reformas**. No se debe presentar la animación como garantía de acceso o visita disponible.
- [Ministerio de Turismo: Templo Budista Chagdud Gonpa Sengue Dzong](https://uruguaynatural.com/es/experiences/templo-budista-chagdud-gonpa-sengue-dzong/).

Tres imágenes inspeccionadas:

1. [Fachada oblicua desde abajo, AFP / La Nación](https://cloudfront-us-east-1.images.arcpublishing.com/lanacionpy/U5IBV7XB4JG2LCYYAU7QYDTO24.jpg): masa de piedra oscura, pisos escalonados, franjas de rojo profundo, bordes negros con círculos blancos, cornisas con ménsulas blancas, varias cubiertas doradas levantadas en sus esquinas, portal adelantado y escalera de piedra ancha.
2. [Vista elevada oblicua, AFP / AmeliaRueda](https://d39ozdhkcyy1f8.cloudfront.net/031024_budismo_uruguay_1_d856409de0.webp): lectura de terrazas, planta del conjunto, torre superior más estrecha, tejados superpuestos y relación con la ladera boscosa. El volumen no es una pagoda blanca genérica.
3. [Detalle del portal, AFP / O Globo](https://s2-oglobo.glbimg.com/r7hEAnGgbYg7CxSJcz1Cvh_2TLE%3D/0x0%3A6048x4024/1000x0/smart/filters%3Astrip_icc%28%29/i.s3.glbimg.com/v1/AUTH_da025474c0c44edd99332dddb09cabe8/internal_photos/bs/2024/1/H/zklwF4SDSmaR6WtqD5XA/108689633-a-view-of-the-facade-of-the-chagdud-gonpa-sengue-dzong-buddhist-temple-in-aguas-blancas.jpg): columnas rojas, frisos turquesa y oro, puerta azul con ruedas y arco de perfil escalonado/curvo.

### Representación

La reconstrucción se ajustó a las siete fotografías de fachada, tres cuartos y vistas aéreas aportadas por el usuario. `src/three/landmarks/monastery.ts` construye una sala de piedra con alas laterales, franjas granate, terraza y pretiles bajos. Las cubiertas curvas de `monasteryRoof.ts` tienen faldones suaves, aleros turquesa, esquinas levantadas, ganchos dorados y juntas de tejas. Sobre la cubierta superior se eleva un frontón triangular de fondo azul con tres pináculos torneados alineados en la cumbrera. En el tejado inferior, una rueda de ocho radios está flanqueada por dos ciervos arrodillados orientados hacia ella.

El portal adelantado tiene columnas rojas, capiteles pintados, arco festoneado, dos puertas azules con ruedas, rombos y marcos verdes. Ventanas oscuras con parteluces, dinteles claros, frisos de círculos blancos y piezas de colores completan la fachada. Por corrección expresa del usuario, la planta superior tiene **dos ventanas de frente y tres en cada costado**; el espacio central de la fachada queda detrás del emblema. En planta baja hay **cuatro ventanas frontales**: una a cada lado del portal en el cuerpo central y una en cada extremo, cerca de las esquinas de las alas. Las inscripciones no se sustituyen por texto sagrado inventado: se usan motivos florales y geométricos originales. La mampostería y sus juntas se generan con texturas procedurales, sin incorporar las fotografías como texturas.

La fachada principal mira hacia +Z. Cámara sugerida desde `(0.78,0.36,1)`, foco `(0,21,-1)`, altura de encuadre 44 y radio 72, en unidades proporcionales de escena. Los detalles estáticos se agrupan por material; los frisos, piedras y arbustos repetidos usan instancias.

## Villa Serrana: Ventorrillo de la Buena Vista

Fuentes patrimoniales y arquitectónicas:

- [Operador / sitio del Ventorrillo](https://ventorrillodelabuenavista.com.uy/es/).
- [MEC: inventario de Monumentos Históricos Nacionales de Lavalleja](https://www.gub.uy/ministerio-educacion-cultura/sites/ministerio-educacion-cultura/files/2022-10/LAVALLEJA.pdf): registra Ventorrillo y El Mesón, con autoría Julio Vilamajó.
- [BSE, Almanaque 2023: «Una estructura para fusionar construcción y entorno»](https://institucional.bse.com.uy/almanaques/flips/2023/flipbook.pdf).

Tres vistas inspeccionadas:

1. [Frente y gablete, Montevideo Portal](https://imagenes.montevideo.com.uy/imgnoticias/201203/358399.jpg).
2. [Fachada y soportes diagonales al sol, Montevideo Portal](https://imagenes.montevideo.com.uy/imgnoticias/201108/334613.jpg).
3. [Vista inferior al anochecer, Montevideo Portal](https://imagenes.montevideo.com.uy/imgnoticias/201108/334617.jpg).

### Rasgos observados y representación

El edificio posee un gran techo a dos aguas de paja, gabletes amplios, galería vidriada con estructura clara inclinada, apoyos de madera delgados y diagonales, una chimenea alta de ladrillo y basamento de rocas salpicadas por agaves. Se modela este perfil elevado y singular; la escalera de piedra, el cartel de madera, el estriado de la paja, el Mesón como ala secundaria baja y unas pocas cabañas completan el contexto. El agrupamiento del contexto es editorial, no una planta catastral de la localidad. Cámara sugerida `(0.75,0.27,1)`, foco `(0,14,2)`, altura 30 y radio 79.

## Salto del Penitente

Fuente primaria:

- [Parque Salto del Penitente](https://saltodelpenitente.com/es/): describe una cascada de más de 60 metros **de longitud**. Esa cifra no se utiliza como afirmación de altura vertical medida del modelo.

Referencias iniciales inspeccionadas:

1. [Tramo superior de la garganta, Petit Futé](https://www.petitfute.com/medias/photo/900_600/20/41/115847-salto-del-penitente-salto-del-penitente.jpg).
2. [Garganta y laguna inferior, Expedia / trvl-media](https://images.trvl-media.com/place/553248621532370412/a0f4c010-bcaf-4950-b4f6-8ac2a9fbcf81.jpg?ch=480&impolicy=resizecrop&ra=fit&rw=1920).
3. Fotografía local del proyecto `/media/b19eab6a8f7a395a.webp`, vista cercana del cauce, ranura de roca, estratos rojizos y laguna. La URL de la vieja galería de turismo consultada devolvió 404 y **no** se contó como vista inspeccionada.

### Rasgos observados y representación

La reconstrucción del 6 de noviembre amplía ese estudio con fotografías frontales, laterales, aéreas y de la cabecera. El inventario, los ejemplos Three.js evaluados y la elección de Blender están documentados en [el estudio específico](research-penitente-refinement.md); el criterio visual y los dictámenes constan en [la revisión independiente](penitente-quality-review.md).

Se sustituye el constructor anterior por geometría propia creada en Blender: un farallón alto a la izquierda al mirar aguas arriba, monolito partido de raíz común y una rampa derecha más baja de placas inclinadas y fracturas. El arroyo superior atraviesa piedras emergentes y se contrae antes de entrar en una canaleta inclinada y quebrada, apoyada en el lecho. El tramo inferior se abre en abanico hacia una poza oscura alargada; el desagüe continúa entre orillas hasta el monte del límite del modelo. Las orillas de la poza se recortan por intersección con la roca final. El agua conserva el sistema de luces y niebla de Three.js y anima espuma y estrías con coordenadas de tiempo de viaje aguas abajo.

`penitente.ts` utiliza el recurso empaquetado derivado del GLB, con posiciones float32 para la roca y la poza, y de 16 bits para las corrientes. El volumen rocoso es cerrado; roca, cuatro superficies de agua y vegetación instanciada forman seis objetos de dibujo. Cámara preferida `(0.12,0.22,1)`, foco del modelo `(0,25,5)`, altura 74 y radio 132, en unidades proporcionales. Las propias cámaras del Penitente contemplan el abanico y el monolito durante el recorrido. Los renders de revisión usan los arrays y transformaciones realmente decodificados, con materiales y luces aproximados offline; no certifican ejecución WebGL.

## Alcance y rendimiento

Estos son modelos procedurales de aproximación visual basada en fotos; no son levantamientos fotogramétricos ni modelos georreferenciados. Las proporciones se ajustaron para conservar los perfiles y materiales característicos en un recorrido web. Las referencias no permiten reconstruir todas las caras ocultas ni pequeños ornamentos.

La validación estructural ejecuta los constructores sin GPU y comprueba coordenadas, normales, índices y límites. Para el templo también verifica los dos vanos frontales y tres laterales por cara, la elevación de las esquinas de las cubiertas, sus normales exteriores, los tres pináculos, los ocho radios y la posición de los dos ciervos. El agua del Penitente expone `update(time)` para animar el flujo; la pausa del recorrido puede detener ese reloj.
