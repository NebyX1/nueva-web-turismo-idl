# Parque Rodó de Minas

Reconstrucción original estilizada basada en fotografías verificadas del parque de Minas, Lavalleja. No representa el parque homónimo de Montevideo. Las fotos de estudio no se redistribuyen ni se usan como texturas. Las distancias entre sectores y el contorno del lago son una composición condensada; no constituyen un relevamiento métrico.

- `parque-rodo.blend`: fuente editable Blender 4.5 LTS; ejes Blender Z arriba.
- `parque-rodo.glb`: exportación estándar glTF; ejes Three.js Y arriba.
- `../../src/three/landmarks/parqueRodoAsset.json`: geometría cuantizada, agrupada en 18 lotes; 169 404 triángulos estáticos.
- `../../scripts/parque-rodo/build_model.py`: construcción reproducible propia.
- `../../scripts/parque-rodo/pack_model.mjs`: empaquetado para el constructor síncrono del recorrido.
- `../../scripts/parque-rodo/render_review.py`: ocho cámaras de revisión nativa.
- `provenance.json`, `quality-review.json`: procedencia y dictamen independiente ligados a hashes concretos.

La entrada conserva pilares de piedra, columnas claras, marquesina con tres óculos y arco metálico con nombre. Hay pérgola, palmeras, juegos, quinchos, arbolado alto con claros, lago/pasarela de madera con diagonales X, piscina cubierta azul y ruedo oval con cinco gradas. La versión V4 corrige la orientación de caminos y contrahuellas, cierra el respaldo de las tribunas y sitúa la piscina sobre ribera seca. La auditoría independiente distingue este activo nativo de las escenas animadas que se verifican en WebGL.

`festivalNight.ts` crea escenarios, banda, público, luces y fuegos de forma procedural e instanciada. El evento de Cerro Artigas es un envoltorio que conserva la estatua y los pabellones existentes. Los montajes temporales sólo aparecen en modo noche; sus relojes comparten la pausa global. No se copia una banda o edición real.

## Reproducción

```powershell
& 'RUTA_A_BLENDER/blender.exe' --background --threads 6 --python-exit-code 1 --python scripts/parque-rodo/build_model.py -- --out assets/parque-rodo
node scripts/parque-rodo/pack_model.mjs assets/parque-rodo/raw.json src/three/landmarks/parqueRodoAsset.json
npm run check:parque-rodo
```

La reconstrucción geométrica y el empaquetado son propios de este proyecto. No se incorpora código ni mallas de los parques externos estudiados; sus licencias no se transfieren a este activo. Las fuentes y alternativas evaluadas están en `../../docs/research-parque-rodo.md`. Una revisión histórica de Stewart Vargas o Artigas no se presenta como aprobación de estas ampliaciones; consultar el dictamen específico del parque para el alcance observado.
