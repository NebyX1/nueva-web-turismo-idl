# Referencias visuales: Arequita, Verdún y Artigas

Consulta: 5 de noviembre de 2026. Las fotografías se utilizaron para estudiar la forma; no se copiaron como texturas ni se publicaron en la web. Las descargas temporales de trabajo están fuera del repositorio. La geometría es una reconstrucción procedural aproximada, sin levantamiento topográfico, escaneo ni fotogrametría.

## Cerro Arequita

Fuentes de identidad y geología:

- [Ministerio de Ambiente: Parque Nacional Arequita](https://www.gub.uy/ministerio-ambiente/politicas-y-gestion/parque-nacional-arequita): formación de origen volcánico y área protegida. Se descartan las descripciones automáticas de algunas fotografías que lo llaman caliza.
- [Intendencia de Lavalleja: subida al cerro Arequita](https://www.gub.uy/intendencia-lavalleja/comunicacion/calendario-actividades/subida-cerro-arequita).

Tres imágenes efectivamente inspeccionadas:

1. [Frente cercano, pared y edificio al pie](https://i.pinimg.com/originals/fc/d9/5c/fcd95ce4634bf67bf9e97b2f9a18f87c.jpg). Gran pared gris clara, fisuras verticales profundas, juntas horizontales irregulares, coronación redondeada y vegetación en grietas.
2. [Vista lateral de la pared y monte, Daniel Ferreira-Leites Ciccarino](https://www.saatchiart.com/en-gb/print/Photography-Arequita-National-Park-Lavalleja-Uruguay/279477/8267552/view). La masa rocosa es ancha, con contrafuertes verticales y hombros irregulares; el monte cubre la ladera y oculta parte de la base.
3. Fotografía local ya provista en el proyecto: `/media/c809a84c8bead525.webp`. Vista abierta desde el agua, útil para la relación entre el cerro, la falda boscosa y el primer plano de río.

Aplicación: volumen elíptico extenso con paredes casi verticales, tapa irregular, juntas geométricas y variaciones de color; monte nativo instanciado y rocas al pie. No se representa como cono. El río y la distribución de árboles son composiciones aproximadas, sin pretensión cartográfica.

## Cerro del Verdún

Fuentes principales:

- [Conferencia Episcopal del Uruguay: historia del santuario](https://iglesiacatolica.org.uy/virgen-del-verdun/). Describe el proyecto de tres pilares y su posterior reducción; confirma la identidad del santuario.
- [Sitio del Santuario Virgen del Verdún](https://www.virgendelverdun.com/).
- [Intendencia: colaboración con la peregrinación de 2026](https://www.gub.uy/intendencia-lavalleja/institucional/normativa/resolucion-n-1356026).

Tres fotografías efectivamente inspeccionadas:

1. [Vista frontal inferior, ACI Prensa](https://www.aciprensa.com/imagespp/Virgen-Del-Verdun-Uruguay-21042023.jpg?h=480&w=720). Permite reconocer la cruz, el estrechamiento del fuste, el coronamiento y el globo.
2. [Frente completo y vano abierto](https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/a8/43/9f/santuario-con-la-virgen.jpg?h=1200&s=1&w=1200). Muestra el arco apuntado, las curvas de los contrafuertes blancos, el interior verde azulado y la inscripción AVE MARIA.
3. [Vista posterior de tres cuartos](https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/ac/52/c6/cerro-del-verdun.jpg?h=-1&s=1&w=1200). Ayuda a leer las caras del templete, la escala humana, la capa azul de la Virgen, el halo y la plataforma de la cima.

Aplicación: tres fachadas con vanos apuntados y fuste convergente, plataforma escalonada, azul verdoso interior, globo, figura mariana con vestido claro y manto azul, halo, cruz y rótulo. El sendero de subida y sus hitos son interpretativos; no sirven como guía de navegación real. No se ha reconstruido el interior de la capilla de la falda.

## Cerro y Parque Artigas

Fuentes de identidad:

- [Intendencia: declaración de patrimonio departamental del monumento ecuestre, Decreto 3978/2025](https://www.gub.uy/intendencia-lavalleja/institucional/normativa/decreto-departamental-n-3978-fecha-11062025).
- [Junta Departamental: referencia a José y Stelio Belloni e inauguración de 1974](https://juntadepartamentallavalleja.gub.uy/images/pdf/actas/ACTA_766.pdf).

Tres fotografías efectivamente inspeccionadas:

1. [Conjunto del cerro, camino y banderas](https://uruguayenvacaciones.com/images/cerro-artigas-e1563680241898.jpg). Cima herbácea, implantación de la escultura sobre afloramientos y banderas al costado.
2. [Frente cercano al atardecer](https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/b6/d4/ea/cerro-artigas.jpg?h=600&s=1&w=1100). Caballo claro de cabeza algo inclinada, jinete sin sombrero, piernas y riendas, volumen del abrigo largo sobre la grupa. El color cambia con la luz; no corresponde tratar la escultura como bronce oscuro.
3. [Tres cuartos inferior, base y plantas](https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/2d/e5/d2/vista-del-monumento-a.jpg?h=800&s=1&w=800). Relación entre rocas, plantas de hojas en punta y estatua; silueta lateral del jinete y caballo.

Aplicación: caballo modelado por masas anatómicas, articulaciones y patas separadas; cabeza, orejas, crin, cola curvada, aparejos y riendas. Jinete con manos, rostro aproximado, botas, estribos y abrigo que cae hacia atrás. Base baja, rocas, vegetación y tres banderas. La escultura es una interpretación geométrica, no una copia exacta de la obra escultórica.

## Integración del módulo

Archivo: `src/three/landmarks/natureMonuments.ts`.

| Función | Suelo | Objetivo de cámara | Radio de conjunto | Altura de conjunto |
| --- | --- | --- | --- | --- |
| `createArequita()` | y=0 | (0,43,0) | 136 | 89 |
| `createVerdun()` | y=0 | (0,149.2,0) | 380 | 160 |
| `createArtigas()` | y=0 | (0,34.5,0) | 96 | 44 |

Las unidades son metros aproximados de composición. El radio incluye el entorno y sirve para tomas generales; para el acercamiento al templete o la escultura conviene reducir la distancia a una fracción de ese radio. Cada retorno incluye `cameraDirection`, dirección recomendada desde el objetivo hacia la cámara. `createArtigas()` incluye `update(time)` para una brisa suave en las banderas.

La vegetación, troncos y rocas dispersas se instancian. Las texturas de las inscripciones y banderas se dibujan con Canvas, sin imágenes externas. Los componentes reciben y proyectan sombras para integrarse con la luz de la escena. La comprobación aislada con TypeScript 6 terminó sin errores; la revisión visual definitiva corresponde al recorrido integrado.

## Verdún como cumbre dominante del escenario

Por indicación del usuario, el relieve del Verdún pasa a ser el punto más alto y el cerro más ancho del mapa esquemático. `VERDUN_SUMMIT_HEIGHT` fija su cumbre local en 140 unidades de escena; esta es una decisión de composición, no una afirmación de altitud geográfica. La base elíptica se extiende 660 × 570 unidades, frente a las 264 × 244 anteriores, con laderas suaves y una plataforma de integración de 800 × 700. Sendero, rocas y árboles toman su altura del relieve nuevo. El camino amplía sus curvas y se ajusta a los triángulos de la ladera; el santuario conserva su escala original.

`journeySites.ts` deriva la altura del enfoque y del barrido de esa misma constante. La plataforma de integración con el terreno cubre el pie del cerro. `journeyTerrain.ts` comparte el cálculo de altura entre suelo, vegetación, colocación de modelos y verificaciones. La prueba de modelos compara la cima del cerro en coordenadas mundiales con las mallas completas de las otras ocho paradas, incluidas sus copas y monumentos, y con el terreno de fondo. También verifica que el camino apoye sobre la ladera y la cámara cercana quede por encima de la cumbre.
