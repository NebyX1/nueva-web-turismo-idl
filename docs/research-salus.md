# Reserva Natural Salus · investigación visual para el recorrido 3D

Consulta: 5 de noviembre de 2026. Las fotografías se usaron para observar las formas; el modelo utiliza geometría y texturas de ruido procedurales, sin incorporar las fotografías de terceros a la web.

## Referencias efectivamente inspeccionadas

1. **Salus Uruguay, fotografía oficial de la Fuente del Puma (tres cuartos frontal)**: https://salus.com.uy/assets/img/reserva-2.webp — vinculada desde https://salus.com.uy/reserva.html . Se observan la postura recostada, el pecho y cuello levantados, las dos patas delanteras extendidas, orejas cortas redondeadas, hocico ancho y el chorro que sale de la boca. La superficie es piedra gris ocre desgastada, con musgo en las patas. La figura está rodeada por grandes hojas recortadas y vegetación densa.
2. **Presidencia, fotografía de detalle lateral del puma (17/11/2025)**: https://medios.presidencia.gub.uy/tav_portal/2025/noticias/AO_470/fgr_02.jpg — contexto oficial: https://www.gub.uy/presidencia/comunicacion/noticias/orsi-visito-reserva-natural-salus-su-planta-produccion-aguas-minas . Confirma las orejas macizas, ojos tallados pequeños, puente nasal, boca ligeramente abierta y textura irregular de la escultura, con el tubo de agua integrado en la boca.
3. **Fotografía de parque Salus del repositorio original**: `/media/eab864301ac501f8.webp`. Muestra camino ancho de tierra rosada/ocre que gira entre árboles altos de troncos relativamente delgados; copa alta irregular, sotobosque oscuro, claros de pasto y luz filtrada. Sus atribuciones originales siguen en «Fuentes y fotografías» del sitio.

Fotos 1 y 2 descargadas temporalmente e inspeccionadas como imágenes locales en `%TEMP%/lavalleja-salus-reference/`, sin redistribución. Foto 3 inspeccionada directamente en el archivo del proyecto.

## Confirmación del lugar

El operador oficial identifica la reserva con las sierras de Minas, ruta 8 km 109 y más de 1300 hectáreas: https://reservanaturalsalus.com.uy/ y https://reservanaturalsalus.com.uy/que-ver/ . Los Jardines del Puma y el Parque Familiar son espacios diferenciados en su mapa: https://reservanaturalsalus.com.uy/mapa-de-la-reserva/ . No se modela una cueva artificial inventada: la referencia escogida es el manantial y la escultura, entre roca, agua y vegetación.

## Decisiones de modelado

`src/three/landmarks/salus.ts` representa un entorno forestal local, camino curvo, basamento de rocas, puma recostado con anatomía de pecho, cabeza, patas, orejas y cola; estanque irregular y chorro en curva. Las hojas anchas divididas se modelaron por su silueta; los árboles usan instancias y coronas irregulares. El agua incorpora anillos animados. La preferencia de cámara mira desde el frente, por +Z, para que se distingan ambas patas y el chorro.

Las dimensiones y distribución de árboles son una interpretación proporcional para el recorrido, no un relevamiento métrico ni una fotogrametría. Las fotos inspeccionadas no documentan una vuelta completa de la escultura. El foco del modelo es `(0, 2.5, 1.3)` y el entorno mide aproximadamente radio 40, alto 31 en unidades locales; una toma cercana de la cámara debe acercarse a la fuente, cuya altura modelada es de unos cuatro metros con el basamento incluido.
