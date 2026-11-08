# Represa Stewart Vargas: referencias y decisiones de reconstrucción

Investigación y encargo: 8 de noviembre de 2026. Se representa la represa de Villa Serrana, Lavalleja, sobre el arroyo Miraflores/De los Chanchos. No se confunde con el Baño de la India. El modelo será una interpretación visual proporcionada, no un levantamiento topográfico ni una simulación hidráulica certificada.

## Referencias observadas

1. [Intendencia de Lavalleja: Memoria de Información de Villa Serrana](https://www.gub.uy/intendencia-lavalleja/sites/intendencia-lavalleja/files/documentos/publicaciones/1%20Memoria%20de%20Informaci%C3%B3n.pdf). El texto en las páginas PDF 77 y 123 informa longitud de 120 m y altura máxima de 13 m; las fotos 19–21 de la página PDF 99 muestran la pasarela, el perfil seco y el frente con vertidos. La foto 22 es otra represa y no se usa.
2. [Marcelo Campi, vista aérea en Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Villa_Serrana_(218241731).jpeg), anterior a julio de 2017, CC BY-SA 3.0. Se ve el conjunto completo, embalse amplio, margen rocosa arbolada, pradera ascendente y cauce angosto. Determina la distribución desigual de altura/caudal y el ritmo de paños.
3. [Wikiloc: Sierra del Guazuvira](https://es.wikiloc.com/rutas-senderismo/sierra-del-guazuvira-29351749), fotografía oblicua elevada junto al estribo. Permite comparar las caras inclinadas, canales estrechos, apoyos cortos de la pasarela y escala humana.
4. [Wikiloc: Villa Serrana–Represa Stewart Vargas](https://es.wikiloc.com/rutas-senderismo/villa-serrana-represa-stewart-vargas-21623441), reverso desde el embalse. Se observan el deck, el agua horizontal y juncos/vegetación acuática.
5. [Galería de viajeros de la represa](https://www.tripadvisor.com/Attraction_Review-g3860179-d12569343-Reviews-Represa_Arq_Stewart_Vargas-Villa_Serrana_Lavalleja_Department.html), dos vistas modernas de ribera y detalle de la baranda. Confirman madera rojiza, puntales repetidos inclinados y malla fina.
6. [Una foto, una historia: Villa Serrana, 2012](https://unafoto-unahistoria.blogspot.com/2012/08/villa-serrana.html), vista longitudinal del coronamiento anterior a la pasarela moderna. Ayuda a reconstruir el dentado del hormigón; sus postes/cables antiguos no se mezclan con la baranda actual.
7. [Portal de Villa Serrana: fotografía del vertedero](https://www.portaldevillaserrana.com.uy/es/blogs/tip/que-hacer-en-uruguay-guia-de-balnearios-para-visitar), vista anterior al deck con varias cintas de agua, útil para proporciones del paño y del canal.

Las fotografías se usan como estudio visual, no como texturas o contenido del modelo. Las copias de trabajo y la lámina comparativa quedan fuera de los archivos públicos. No se cuentan imágenes repetidas/redimensionadas como ángulos nuevos. No se encontró un plano de obra completo ni se afirma haber observado caras ocultas: el recuento de módulos, detalles no visibles y terreno lejano se documentan como aproximaciones.

## Modelos existentes y herramientas evaluados

| Candidato | Aporte posible | Decisión |
|---|---|---|
| [jhenrysec/HooverDam](https://github.com/jhenrysec/HooverDam), Three.js, MIT | Organización modular, vistas de revisión y construcción geométrica de una represa | Su arco alto, torres y central no corresponden al lugar. No se copia esa silueta ni se incorpora su código. |
| [grayfin, Labyrinth Spillway V3](https://sketchfab.com/3d-models/labyrinth-spillway-v3-567409aad7324591aef9a7d4dd36a590), 546 triángulos, CC Attribution | Referencia conceptual de repetición de vertederos y geometría ligera | No reproduce los paños ni la pasarela de Stewart Vargas. No se utiliza su malla como sustituto. |
| [Theovanniekerk, Bell Park Dam Spillway](https://sketchfab.com/3d-models/bell-park-dam-spillway-09950a79a2354e7ea591996c7c73f985), captura de 213 fotos,300 mil triángulos | Comparación del trabajo por fotogrametría | Es otro lugar; no existe correspondencia geométrica demostrada ni se incorpora un recurso cuya descarga/licencia no se haya verificado. |
| Three.js directamente | Buen control de animación, iluminación, coste y materiales | Se usa para presentar y animar la geometría propia, no para improvisar un bloque genérico. |
| Blender con script paramétrico | Secciones, repeticiones, biseles, normales, vistas ortogonales y activo editable | Elegido para construir y verificar la estructura antes de integrarla en la web. |
| Fotogrametría/IA a partir de fotos sueltas | Podría proponer un volumen inicial | Las fotos disponibles no forman una captura calibrada continua; no se da por fiable un resultado inferido sin contraste. |

La geometría propia se conserva en `.blend` y se exporta a GLB. Se empaquetan las mismas posiciones/normales/UV para el constructor síncrono del recorrido existente. [El exportador oficial de Blender](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html) documenta GLB, materiales PBR y conversión a Y-up. La animación de agua usa el reloj de Three.js y conserva su iluminación y niebla.

## Integración y estado de revisión

La represa se integra como motivo principal de la parada ya existente Villa Serrana. Se mantienen las nueve paradas y el Ventorrillo como contexto separado sobre una ladera, sin presentar su ubicación editorial como una distancia real medida respecto a la represa. El relieve propio encaja sobre el terreno general; la cámara y los dos reflectores nocturnos de esta parada se adaptan al dique, el embalse y la salida. No se modifican las estructuras de otros destinos.

El [control independiente V4](stewart-vargas-quality-review.md) aprobó la fidelidad mínima del activo nativo en ocho vistas diurnas y dos nocturnas. Las pruebas geométricas, la comprobación de tipos y la compilación pasaron. Esa primera validación real de Three.js quedó bloqueada al no poder verificar con certeza la URL activa mediante el control del equipo; el registro V4 conserva ese alcance histórico.

La siguiente solicitud del usuario añadió una visita completa al Ventorrillo antes de la represa y seis peces en el embalse. Se mantienen nueve destinos, con dos tomas internas de 22 segundos en Villa Serrana, encuadres y focos independientes y accesos directos que funcionan en pausa. El modelo nativo de la represa no cambia. La sesión posterior sí permitió probar Three.js en el navegador integrado, con capturas de ambas tomas diurnas/nocturnas en escritorio y móvil. La evidencia y el dictamen de integración quedan separados del dictamen nativo V4.

El [informe de integración vigente](stewart-vargas-runtime-review.md) documenta la inspección independiente del código y de once capturas reales, además de las comprobaciones automáticas y las observaciones de navegador del agente principal. Incluye el cambio inmediato de reflectores al nuevo tramo como una limitación visible no bloqueante.
