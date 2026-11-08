# Represa Stewart Vargas, Villa Serrana

Modelo propio construido en Blender a partir de fotografías de referencia, encargado el 8 de noviembre de 2026. Representa la versión con pasarela rojiza moderna. Es una reconstrucción visual proporcionada, no un levantamiento métrico ni una simulación hidráulica certificada.

- `stewart-vargas.blend`: fuente nativa editable, con paños, canales, deck, puntales, malla, terreno, vegetación y agua separados.
- `stewart-vargas.glb`: exportación estándar Y-up del mismo activo, con materiales y malla procedural propia incorporada.
- `../../src/three/landmarks/stewartVargasAsset.json`: geometría evaluada y agrupada por material; posiciones float32, normales compactadas y UV. Identifica el GLB fuente por SHA-256.
- `../../src/three/landmarks/stewartVargas.ts`: decodificación síncrona, materiales de Three.js, corriente/espuma/salpicaduras y anclajes de reflectores.
- `../../src/three/landmarks/villaSerrana.ts`: visita inicial al Ventorrillo existente, seguida de la represa; conserva su constructor original y la distribución de las nueve paradas.
- `../../src/three/landmarks/stewartVargasFish.ts`: seis arcos de peces comprobados contra la superficie del embalse, con gotas y ondas de `waterLife.ts`.
- `../../src/three/journeyCameraTour.ts`: dos visitas completas de 22 segundos, anclajes locales, progreso continuo y cámara comprobable sin WebGL.

## Reconstrucción

Con Node compatible con `package.json` y Blender 4.5 LTS, desde la raíz del proyecto:

```powershell
& $stewartBlender --background --threads 6 --python-exit-code 1 --python scripts/stewart-vargas/build_model.py -- --out assets/stewart-vargas
node scripts/stewart-vargas/pack_model.mjs assets/stewart-vargas/raw.json src/three/landmarks/stewartVargasAsset.json
npm run check:stewart-vargas
```

`$stewartBlender` debe contener la ruta real de Blender. Se utilizó Blender 4.5.15 LTS del distribuidor oficial, verificando su archivo SHA-256 antes de ejecutarlo. `raw.json` es intermedio reproducible y queda ignorado por Git.

Las fotos no se pegan como texturas ni se incluyen como recursos públicos; los materiales y la malla de la baranda se generan localmente. La búsqueda de mallas similares y el descarte de geometrías incompatibles están en [el estudio](../../docs/research-stewart-vargas.md).

## Control de calidad

El [plan previo](../../docs/stewart-vargas-quality-plan.md) exige contraste independiente con vistas frontal, oblicuas, reverso, perfil, elevada y noche. Los renders de `render_review.py` usan el activo nativo y materiales/luces offline; **no son capturas de Three.js ni certifican ejecución de sus shaders**. La prueba `check:stewart-vargas` verifica contactos agua/hormigón y agua/terreno, reentrancias reales, proporciones, pausa, normales, presupuesto y proyección de ambos extremos de la pasarela.

La primera revisión del navegador quedó bloqueada por la herramienta de control del equipo y se conserva así en el registro histórico V4. En la sesión posterior se pudo usar el navegador integrado para probar ambas tomas de día/noche, a 1440 × 900 y 390 × 844, los atajos, pausa y transferencia automática. Se guardaron capturas reales y observaciones; el dictamen de integración se registra por separado, sin sustituir evidencia web por renders nativos.

El [dictamen independiente V4](../../docs/stewart-vargas-quality-review.md) aprobó el activo nativo como representación estilizada presentable tras examinar ocho vistas diurnas y dos nocturnas. [quality-review.json](quality-review.json) conserva los hashes y distingue `nativeAssetApproved: true` de `approvedForFinalDelivery: false`. [provenance.json](provenance.json) identifica las fuentes editables y los archivos de integración.

La revisión posterior de la secuencia Ventorrillo → represa, peces y navegador está en [runtime-review.json](runtime-review.json) y [su informe independiente](../../docs/stewart-vargas-runtime-review.md). Ese dictamen acota la aprobación a esta integración estilizada de Villa Serrana y sus dos formatos revisados; no cambia el registro histórico V4 ni certifica toda la web.
