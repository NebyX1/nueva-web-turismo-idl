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

`createMonastery()` reproduce volúmenes escalonados, terraza inferior, dos grandes cubiertas y pequeño acceso cubierto, tejas/ribetes, franjas rojas, hileras de círculos blancos, ventanas con marcos claros, portal de color y ruedas geométricas. Las inscripciones y esculturas no se reproducen como texto sagrado inventado: el ornamento se aproxima mediante motivos geométricos. Un material de piedra generado por código reproduce juntas y variación de mampuestos. La fachada principal mira hacia +Z. Cámara sugerida desde `(0.8, 0.38, 1)`. Foco `(0,17,0)`, altura representada 39 y radio de encuadre 60, en unidades proporcionales de escena.

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

Tres fotografías inspeccionadas:

1. [Tramo superior de la garganta, Petit Futé](https://www.petitfute.com/medias/photo/900_600/20/41/115847-salto-del-penitente-salto-del-penitente.jpg).
2. [Garganta y laguna inferior, Expedia / trvl-media](https://images.trvl-media.com/place/553248621532370412/a0f4c010-bcaf-4950-b4f6-8ac2a9fbcf81.jpg?ch=480&impolicy=resizecrop&ra=fit&rw=1920).
3. Fotografía local del proyecto `/media/b19eab6a8f7a395a.webp`, vista cercana del cauce, ranura de roca, estratos rojizos y laguna. La URL de la vieja galería de turismo consultada devolvió 404 y **no** se contó como vista inspeccionada.

### Rasgos observados y representación

La cascada es un cauce estrecho que se desliza por una garganta de granito irregular rojizo/gris, con manchas claras de líquenes y vegetación escasa, no una lámina de agua sobre un cilindro. Se construyen dos masas rocosas asimétricas con superficies trianguladas y juntas/variaciones de color, un cauce sinuoso en pendiente con shader de espuma en movimiento, laguna oscura en la base, anillos de impacto y una ligera bruma geométrica. Las masas están selladas hacia el terreno para sostener tomas bajas. Cámara sugerida `(0.4,0.31,1)`, foco `(0,28,0)`, altura de encuadre 78 y radio 82.

## Alcance y rendimiento

Estos son modelos procedurales de aproximación visual basada en fotos; no son levantamientos fotogramétricos ni modelos georreferenciados. Las proporciones se ajustaron para conservar los perfiles y materiales característicos en un recorrido web. Las referencias no permiten reconstruir todas las caras ocultas ni pequeños ornamentos.

Validación estructural local: los tres constructores ejecutan sin GPU, no generan coordenadas no finitas y tienen 105, 98 y 11 objetos de malla respectivamente (monasterio, Villa Serrana y Penitente). Piedras, agaves, ventanas y cornisas repetidas usan instancias. El agua expone `update(time)` para que el renderizador principal anime el flujo; la pausa de movimiento del recorrido puede detener ese reloj.
