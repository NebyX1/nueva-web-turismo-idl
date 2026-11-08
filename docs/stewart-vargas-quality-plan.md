# Plan de calidad de la represa Stewart Vargas

Fijado antes de modelar, 8 de noviembre de 2026. El control visual final corresponde al subagente independiente `stewart_vargas_quality`, solicitado expresamente por el usuario. Estado inicial: **pendiente de construcción y revisión; no aprobado**.

Estado tras la revisión V4: **activo nativo aprobado como mínimo presentable; aplicación completa pendiente**. El [dictamen independiente](stewart-vargas-quality-review.md) aprueba los criterios 1–8 sobre ocho vistas diurnas y dos nocturnas de Blender. El criterio 9 sigue bloqueado y no ejecutado; no se declara aprobada la entrega final de Three.js.

Revisión posterior: el [dictamen de integración](stewart-vargas-runtime-review.md) registra la comprobación real en navegador de la nueva secuencia Ventorrillo → represa, seis peces y las tomas diurnas/nocturnas de escritorio y móvil. Es el registro vigente para ese alcance; el V4 anterior conserva el bloqueo que existía en su propia sesión.

## Criterios obligatorios

- Silueta larga y baja, en proporción aproximada 120/13 para longitud/altura máxima; no se acepta una represa monumental curva o con torres ajenas.
- Ritmo denso de paños de hormigón anchos e inclinados y canales angostos; coronamiento dentado reconocible. El recuento de módulos es aproximado y no reemplaza el contraste visual.
- Mayor altura junto al monte y al cauce; cimentación/terreno ascendente hacia la pradera, con módulos progresivamente bajos y secos.
- Pasarela moderna recta y estrecha, rojiza, con tablones, diagonales, malla y apoyos cortos. No se mezcla con postes/cables históricos.
- Lago amplio y horizontal aguas arriba, salida angosta más baja aguas abajo y orillas irregulares. El agua debe recorrer los canales hasta el cauce, con espuma localizada, sin atravesar el hormigón ni flotar separada del lecho.
- Margen rocosa/arbolada y margen de pradera diferenciadas. Sin pedestal circular, piezas deformes, apoyos suspendidos, normales invertidas o vegetación que esconda el modelo.
- Lectura suficiente en el recorrido real de Three.js de día, de noche y en móvil. Las fotografías no se pegan sobre planos para simular un volumen.

## Revisiones y evidencias

1. Referencias frontal, oblicuas, perfil, reverso, aérea y detalles del puente; distinguir vistas históricas/modernas y declarar lo no observado.
2. Renders de geometría sólida desde frontal, ambas oblicuas, perfil, aguas arriba y elevada; revisión de proporciones antes de depender de materiales.
3. Pruebas de coordenadas, normales, caras, apoyos, niveles y contacto agua/canal, presupuesto geométrico y pausa del reloj.
4. Capturas del recorrido real en escritorio/móvil, luz diurna/nocturna y comprobación de consola y compilación.
5. Entrega al subagente de los activos, hashes y capturas concretos. Si devuelve «no aprobado», corregir y volver a presentar. No se sustituye su dictamen por tests automáticos ni por una aprobación del plan.

El dictamen final se registra en un archivo propio, ligado al hash del activo efectivamente observado, sin reescribir aprobaciones de Artigas, Penitente u otros destinos.
