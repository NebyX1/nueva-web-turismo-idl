# Arequita — detalles exclusivos para el capítulo

Fecha de generación: 2026-11-05. Modo: **image_gen integrado**, una llamada por lámina. No se usó CLI ni API externa. Originales PNG copiados sin modificaciones desde el directorio de imágenes generadas de Codex. Derivados WebP codificados con Sharp, calidad 90, sin recortes, redimensionamiento, filtros ni cambios artísticos. Ambos formatos tienen 1536 × 1024 px.

La selección responde a la corrección editorial del usuario: las imágenes del capítulo de Arequita muestran únicamente el propio cerro y su entorno observado, sin destinos ajenos. No se han reconstruido grutas, senderos, monumentos o construcciones que no aparecen en la foto de referencia.

## Fuentes realmente utilizadas

- **Forma y geografía:** fotografía local `public/media/c809a84c8bead525.webp`, inspeccionada visualmente. Frente rocoso ancho con juntas verticales irregulares, monte denso en la falda y borde de agua en primer plano.
- **Estilo:** ilustración aprobada `public/media/explorer/arequita.png`, inspeccionada visualmente. Se mantiene el lenguaje de grabado de tinta, grafito y aguadas apagadas sobre marfil.
- **Contexto de referencias existente:** `docs/research-nature-monuments.md`, sección «Cerro Arequita». Se leyó el documento; las fotos remotas allí enlazadas no se utilizaron como inputs ni se atribuyen como inspeccionadas en esta generación.

Son reinterpretaciones contemporáneas de un cuaderno explorador del siglo XIX. La vegetación se trata como masa de monte nativo observada en la foto; no se afirma la identidad botánica de especies concretas ni precisión cartográfica.

## Entregables y procedencia

| Destino PNG | Destino WebP | Original de image_gen |
| --- | --- | --- |
| `public/media/explorer/arequita-roquedo.png` | `public/media/explorer/arequita-roquedo.webp` | `C:/Users/Nebyx/.codex/generated_images/01a1acb7-c91c-7d92-84f6-264098cc7b24/exec-70aa477d-f30e-4296-bc37-064580310627.png` |
| `public/media/explorer/arequita-monte.png` | `public/media/explorer/arequita-monte.webp` | `C:/Users/Nebyx/.codex/generated_images/01a1acb7-c91c-7d92-84f6-264098cc7b24/exec-1a29e840-5f3d-41c5-bd2b-1def22e92928.png` |

Inspección visual: el roquedo presenta un encuadre cercano de la corona y las fisuras, con monte limitado a la base; el monte muestra árboles y ramas ribereñas ampliadas, el agua en una franja baja y el cerro reconocible detrás. Ambas láminas son dibujos completos, sin fotografías, rótulos, fauna, personajes, edificios ni elementos de otros lugares.

## Prompt exacto — roquedo

```text
Use case: illustration-story.
Asset type: final standalone landscape illustration for an illustrated explorer travel booklet about Cerro Arequita, Lavalleja, Uruguay.
Primary request: Create a new detailed study of the actual exposed rock escarpment of Cerro Arequita, drawn as if by an excellent nineteenth-century naturalist in an expedition field journal. This is one close geological landscape plate, not an overview of another destination.
Input images: Image 1 is the real photo and is the ONLY geographical authority. Image 2 is the previously accepted Arequita illustration and guides ONLY the exact antique drawing style, paper, palette and craftsmanship.
Subject and fidelity: Focus closely on the central exposed grey-brown rock face from Image 1, showing its characteristic broad, squat, gently uneven rounded crest, thick irregular vertical fissures and buttresses, subtle broken horizontal joints, and sparse shrubs growing in real crevices. Keep the real stone's proportions and observed shape; it is a low broad cliff, never a tall alpine cone, dramatic spire, regular basalt organ or canyon. Some native woodland clusters cover the lower edge of the face as seen in the real photo. Crop to the rocky crown and its immediate wooded foot to create a distinct tighter composition from Image 2; do not include the river or the whole deep forested slope.
Style and medium: Match Image 2: extraordinarily fine dark sepia/dark slate engraved pen crosshatching, delicate graphite contours, hand-laid pale sage and ochre watercolor with a little desaturated slate-blue sky, warm ivory rag paper #f5ecd4. Every surface must appear hand drawn; geological fissures are described with confident delicate linework. No photographic patches, no digital 3D shading.
Composition: Landscape-oriented canvas 1536x1024, 3:2 ratio. A carefully observed centered horizontal rock study taking about 75 percent of canvas width and 66 percent of height. Airy generous empty ivory paper margins on every side. An irregular feathered vignette edge, gently dissolving hand marks, no hard rectangle or decorative border. Fine paper fibres. Restrained, elegant, expert engraving.
Constraints: Cerro Arequita only. No cave, cave mouth, grotto, path, trail, ladder, doorway, invented geological feature, building, tower, human, animal, bird, text, lettering, label, number, caption, signature, watermark, compass, map, frame, UI or book mockup. Do not copy the overview composition of Image 2.
```

## Prompt exacto — monte

```text
Use case: illustration-story.
Asset type: final standalone landscape illustration for an illustrated explorer travel booklet about Cerro Arequita, Lavalleja, Uruguay.
Primary request: Create a new nineteenth-century naturalist's intimate landscape study of the native woodland at the FOOT OF CERRO AREQUITA, with the same recognizable rocky hill seen behind the trees. This must be a different composition from the existing wide overview and from a rock-face closeup.
Input images: Image 1 is the real photo and the ONLY geographical authority. Image 2 is the accepted Arequita illustration and guides ONLY the exact antique drawing style, paper, palette and craftsmanship.
Subject and fidelity: Concentrate on the dense native woodland on the bottom half of the photo where it meets the calm river. Show the real tangle of small irregular branching trunks, tiny leaves and dense uneven rounded canopies along that quiet bank, with water and fine reflections occupying only a narrow foreground strip. The same broad low vertically fissured Arequita rock escarpment must remain clearly recognizable in the upper background, partly concealed by the trees; follow the photographed long gently irregular rocky crest and real proportions. Native broadleaf scrub, not tropical rainforest, pine forest or deciduous European park. The viewpoint is a closer observation of that photographed riverside bank; do not invent a walking path through it or clear the forest to add a meadow.
Style and medium: Match Image 2 closely: extraordinarily fine dark sepia/dark slate engraved pen crosshatching, delicate graphite contours, restrained hand-laid watercolor with pale sage foliage, ochre stone, desaturated slate-blue water and sky on warm ivory rag paper #f5ecd4. Every surface hand drawn. Observe branches and leaves with field-journal care, use gentle atmospheric lines for the receding rock face. No photographic patches or digital 3D shading.
Composition: Landscape-oriented canvas 1536x1024, 3:2. Centered inset landscape vignette with generous clean ivory paper margins on every side and irregular feathered edges. Woodland is the clear subject, occupying roughly two thirds of the scene; foreground branch structure is more legible and larger than in Image 2; distant hill occupies the upper third, framing the place. Quiet narrow river strip at bottom. Single coherent drawing, fine subtle paper fibres, elegant restrained illustrated atlas craftsmanship.
Constraints: Cerro Arequita only. No other destination, cave, path, clearing, road, bridge, fence, tower, house, building, boat, human, animal, bird, invented monument, text, lettering, label, number, caption, signature, watermark, compass, map, frame, UI or book mockup.
```

## Codificación WebP

```js
await sharp(sourcePng).webp({ quality: 90 }).toFile(destinationWebp);
```
