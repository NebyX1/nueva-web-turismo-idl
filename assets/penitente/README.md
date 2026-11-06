# Salto del Penitente

Geometría propia creada en Blender a partir del estudio de fotografías del lugar. Las fotos y los modelos de ejemplos externos no están incorporados en este recurso. Las unidades son proporcionales; no es un levantamiento topográfico.

- `penitente.blend`: fuente editable del relieve, rocas y superficies de agua.
- `penitente.glb`: exportación estática que identifica el recurso de origen.
- `quality-approval.json`: dictamen independiente, identidad del modelo y hashes de archivos revisados.
- `preserved-context.json`: identidad de los otros sitios y del contexto de Villa Serrana antes de esta sustitución.

La página usa `src/three/landmarks/penitenteAsset.json`, obtenido de la misma geometría. La roca conserva posiciones float32 iguales al GLB para evitar que la compresión colapse sus triángulos más finos; la poza conserva también float32 y las corrientes usan posiciones de 16 bits. La vegetación se almacena como anclajes y se instancia al construir la escena. El material de agua retiene las luces y la niebla del recorrido; su reloj avanza mediante `update(time)`.

## Reproducir y revisar

Desde la raíz del proyecto, con Node compatible con `package.json` y Blender 4.5.15 LTS. `$penitenteBlender` debe contener la ruta al ejecutable de Blender; `$penitenteOutput` apunta a una carpeta de trabajo distinta de los activos aprobados.

```powershell
& $penitenteBlender --background --threads 6 --python-exit-code 1 --python scripts/penitente/build_penitente.py -- --out $penitenteOutput
node scripts/penitente/pack_penitente.mjs "$penitenteOutput/raw.json" src/three/landmarks/penitenteAsset.json
node scripts/penitente/export_review.mjs $penitenteOutput
node scripts/check-penitente-rebuild.mjs --candidate
& $penitenteBlender --background --threads 6 --python-exit-code 1 --python scripts/penitente/render_review.py -- --scene "$penitenteOutput/review-scene.json" --out "$penitenteOutput/material"
& $penitenteBlender --background --threads 6 --python-exit-code 1 --python scripts/penitente/render_review.py -- --scene "$penitenteOutput/review-scene.json" --out "$penitenteOutput/clay" --clay
```

El exportador recibe una **carpeta**, no un nombre de archivo. Produce `review-scene.json` con la geometría realmente decodificada por Three.js y `review-manifest.json` con sus hashes. El renderizador también admite `--night`, `--web-scale`, `--time` y `--views front,right-oblique,...`.

Una nueva exportación modifica el SHA del recurso y requiere una nueva revisión visual. No se debe reutilizar una aprobación anterior ni sustituir la escena de revisión por otra geometría. `--candidate` permite comprobar un candidato sin aprobar; la comprobación normal exige el activo aprobado y su integración real.

Los renders offline aproximan materiales y luces: no ejecutan el shader WebGL. El dictamen distingue esa limitación de la revisión exacta de forma y contacto entre roca y agua. Las fuentes y criterios están en `docs/research-penitente-refinement.md` y `docs/penitente-quality-review.md`.
