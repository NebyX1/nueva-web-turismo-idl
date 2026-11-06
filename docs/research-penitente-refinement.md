# Reconstrucción del Salto del Penitente

Estudio y modelado: 6 de noviembre de 2026. Alcance: sustituir exclusivamente el Salto del Penitente y ajustar sus propias cámaras. El cerro Artigas, su monumento y banderas, el Verdún, el templo, la plaza, Salus y el orden del recorrido se preservan.

## Fotografías y forma del lugar

Se inspeccionaron los trece archivos de la [categoría de Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Salto_del_Penitente), además de vistas altas, laterales y de la cabecera de otras series. La foto histórica de 1907 sirve solamente como corroboración de las masas; las fotos repetidas no se cuentan como ángulos independientes.

Referencias principales:

- [Chrono-strife, frente bajo y poza](https://commons.wikimedia.org/wiki/File:Salto_del_Penitente,_Lavalleja,_Uruguay.jpg) y [Fenris uy, detalle frontal](https://commons.wikimedia.org/wiki/File:Salto_del_Penitente.jpg): canaleta inclinada y quebrada, bordes angulosos, estrechamiento superior y apertura irregular al pie.
- [Jimmy Baikovicius, vista lateral](https://commons.wikimedia.org/wiki/File:Salto_del_Penitente-2.jpg): el agua desciende apoyada en el lecho rocoso; no es una cortina vertical suspendida.
- [Jimmy Baikovicius, roca superior](https://commons.wikimedia.org/wiki/File:Roca_del_Salto_del_Penitente.jpg): monolito partido, dos lajas próximas y base común integrada en la ladera.
- [Es Parte del Viaje, serie fotográfica propia](https://espartedelviaje.com/que-hacer-en-villa-serrana/), especialmente la [vista aérea del farallón](https://espartedelviaje.com/wp-content/uploads/2026/10/salto-del-penitente-dron.jpg): masa alta a la izquierda al mirar aguas arriba, losas bajas y anchas a la derecha, poza inmediata estrecha y monte en las laderas.
- [ACAL, recorrido del arroyo de 2011](https://www.clubacal.org.uy/canotaje_travesia/relatos/arroyo-penitente_julio2011/index.php), fotos 22–24 y 30–35: cauce superior somero, piedras emergentes, rápidos y contracción antes de la canaleta. Las fotos de otros tramos de la excursión no se atribuyen al salto.
- [Jimmy Baikovicius, desembocadura](https://www.flickr.com/photos/jikatu/16060501095/): continuación aguas abajo entre roca y monte.
- [Parque Salto del Penitente](https://saltodelpenitente.com/es/): corroboración del lugar. Su descripción de más de 60 metros corresponde a **longitud**, no a un desnivel vertical medido.

La asimetría entre el farallón y la rampa, las caras mayores de roca fracturada, la dirección del agua y su conexión con la poza tienen prioridad sobre la microtextura. Las cotas del modelo son proporciones de escena interpretadas a partir de fotos. No se presentan como topografía medida o fotogrametría.

El inventario completo de fotos, su utilidad y exclusiones está en [la revisión independiente](penitente-quality-review.md). Las imágenes de estudio y sus metadatos quedan fuera de los recursos públicos. Ninguna fotografía se utiliza como textura ni se distribuye dentro del modelo.

## Modelos y técnicas investigados

| Fuente primaria | Qué se inspeccionó | Decisión |
| --- | --- | --- |
| [Debabrata Giri, low-poly-waterfall](https://github.com/Debabrata-Giri-2001/low-poly-waterfall) | Repositorio clonado: código TypeScript, GLB separados para terreno/roca/flujo y shaders GLSL de ruido y espuma. | Útil como referencia de separación entre geometría estática y agua animada. Su cascada fantástica y su estanque no reproducen la forma del Penitente. No se copian código ni recursos. |
| [free-unife, threejs-waterfall](https://github.com/free-unife/threejs-waterfall) | Ejemplo de simulación de partículas y trayectorias, con licencia GPL-3.0. | Una lluvia de partículas no resuelve las grandes caras de roca ni una canaleta adherida al lecho. No se incorpora. |
| [jeantimex, threejs-water](https://github.com/jeantimex/threejs-water) | Ejemplo de agua y piscina con efectos ópticos. | El coste y la forma de piscina no responden a esta escena. No se incorpora. |

No se encontró un modelo descargable exacto del Penitente con procedencia y condiciones verificadas. Los ejemplos anteriores aportan técnicas; no se usan como si fueran una digitalización del salto real.

## Elección de herramienta y construcción

Se compararon modelado directo en Three.js, un recurso externo genérico y autoría en Blender. Se eligió **Blender para construir y editar el relieve**, exportar un GLB y conservar el archivo `.blend`; Three.js decodifica la geometría estática y anima el material de agua.

Una simulación de fluidos precalculada en Blender exigiría una secuencia o caché pesada. Para el recorrido web se usa un lecho común, agua muestreada sobre ese lecho y coordenadas de tiempo de viaje que permiten animar el flujo aguas abajo mediante shader. No hay una descarga asíncrona adicional al visitar la parada.

La roca forma un volumen cerrado. Las masas, lajas, fracturas y monolitos se definen a escala grande antes de añadir meteorización y color. Las orillas de la poza y del arroyo superior se obtienen por intersección con la roca final. El flujo principal y el desagüe se proyectan sobre esa misma malla; la vegetación se apoya mediante consultas al relieve.

El empaquetado conserva las posiciones de roca en float32 iguales al GLB. Se descartó cuantizarlas en 16 bits porque colapsaban una hilera de triángulos finos del borde posterior; la revisión comprueba también área distinta de cero después de decodificar. La poza conserva también float32 para proteger los recortes mínimos de orilla; las corrientes usan posiciones de 16 bits; las normales se normalizan y los colores se guardan por vértice. Se conserva la identidad SHA-256 del GLB de origen. El código de autoría y los exportadores se encuentran en `scripts/penitente/`. Los módulos de representación son `penitente.ts`, `penitenteMesh.ts`, `penitenteRock.ts` y `penitenteWater.ts`.

## Control de calidad

El agente independiente `penitente_quality` estudió las referencias antes de puntuar candidatos. Su matriz exige al menos **80/100**, categorías dominantes de al menos **7/10** y ausencia de fallos bloqueantes. Se revisan ambos lados, frente, coronación, pie, poza y salida; versiones neutras permiten evaluar los planos sin que el material o la vegetación oculten defectos. Los candidatos rechazados no se integran.

La exportación de revisión parte de los arrays, índices, normales, colores, coordenadas de flujo y matrices de instancias que construye el módulo de Three.js. El manifiesto identifica tanto la escena exportada como los módulos que la generan. El control numérico verifica cierre y orientación de la roca, contactos de agua, dirección del flujo, continuidad con la poza, índices, normales y presupuesto de geometría.

**Límite de la validación visual:** se usan renders offline de la geometría exacta en Blender CPU. Sus materiales procedurales aproximan los shaders de Three.js y su luz diurna/nocturna. Esto verifica forma, contactos y composición; no certifica ejecución de GLSL, transparencia, animación ni rendimiento WebGL en un navegador. La integración y compilación se comprueban por separado.

La aprobación final y sus hashes se registran en `assets/penitente/quality-approval.json` únicamente cuando el revisor aprueba el candidato correspondiente.
