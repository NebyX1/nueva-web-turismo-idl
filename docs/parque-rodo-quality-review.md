# Revisión independiente: Parque Rodó de Minas y Fogones de Artigas

Revisor: `parque_rodo_quality`. Fecha: 8 de noviembre de 2026. Activo nativo: V4.

**Aprobado como mínimo presentable el alcance solicitado:** recreación escénica del Parque Rodó de Minas, visitas a entrada/paseos, lago/mirador y ruedo, festival con banda y público únicamente nocturno, y escena nocturna de Fogones en Cerro Artigas con escenario, público, fogones y fuegos artificiales. No se detectan bloqueantes pendientes dentro de las vistas y comprobaciones realizadas.

El [registro verificable](../assets/parque-rodo/quality-review.json) fija `approved: true`, `nativeAssetApproved: true`, `runtimeApproved: true` y `approvedForFinalDelivery: true`, **acotados a esta integración**. Contiene los hashes de dieciocho fuentes/activos, ocho renders nativos, dieciséis capturas WebGL y las observaciones del navegador. El GLB aceptado tiene SHA-256 `28df17cc7087e09b7a907c679b1a524726b5c08fc3693b60f033887e293a970e`.

## Referencias y método

El [plan previo](parque-rodo-quality-plan.md) distinguió desde el inicio el parque de Minas de su homónimo de Montevideo y de la represa de OSE. El revisor abrió fotografías identificadas del portal, pérgola, juegos, quinchos y arbolado; la aérea oficial del ruedo; la piscina cubierta actual; las cuatro fotos pertinentes de la sección Parque Rodó de FredLee; y las fotografías oficiales de conciertos y tribuna natural del Cerro Artigas.

Se abrió también la página completa de la [Guía Trotamundo de Lavalleja](https://guiatrotamundo.com/wp-content/uploads/2024/05/lavalleja.pdf), índice PDF 6 / página impresa 7, y su foto extraída del puente: entablonado, postes oscuros, cruces X y cambio de dirección. La lectura de la página evita atribuirle una imagen del Cerro Artigas situada a continuación. Esa vista respalda su carácter constructivo, pero no un plano completo del puente o del lago.

La entrada y el ruedo se contrastaron con las fotografías identificadas en el plan y la [aérea del Ministerio del Interior](https://www.gub.uy/ministerio-interior/comunicacion/noticias/resultado-del-dispositivo-seguridad-semana-lavalleja-2026-parque-rodo). La [piscina de la Intendencia, agosto de 2026](https://www.gub.uy/intendencia-lavalleja/comunicacion/noticias/piscina-del-parque-rodo-reabre-sus-puertas-jueves-20-agosto) evita reconstruir todo el complejo como si aún fuese una pileta descubierta. La referencia [oficial de Semana de Lavalleja 2025](https://www.gub.uy/intendencia-lavalleja/comunicacion/noticias/semana-todos-todo-lavalleja-tiempo-record) muestra el escenario y el público sobre la tribuna natural del Cerro Artigas.

El revisor examinó los ocho renders V4 y las dieciséis capturas finales de Three.js. **El agente principal recolectó las capturas y las observaciones DOM/consola mediante el navegador; el revisor no controló una sesión UI propia.** Esta revisión fue independiente en la comparación visual, lectura del código, cálculo del winding, ejecución de pruebas y comprobación de hashes. Las copias portables en `docs/references/parque-rodo` coinciden byte por byte con las imágenes efectivamente examinadas.

Los renders de Blender son evidencia del activo nativo. Las capturas WebGL son evidencia de la aplicación. No se sustituyen unas por otras.

## Resultado por criterio

| Criterio | Dictamen | Evidencia y alcance |
|---|---|---|
| Identidad del parque | Cumple como representación estilizada | Portal, palmeras, paseo familiar, pérgola y ruedo ovalado forman un conjunto reconocible de Minas. No se incorporan castillo, canteras, costa o puente de piedra de Montevideo. |
| Entrada | Cumple con simplificación | Pilares de piedra, columnas claras, marquesina horizontal con óculos y arco metálico con el nombre. Proporciones y acabados son aproximados. |
| Sectores y terreno | Cumple con distribución declarada | Puente amaderado con cruces X, rosedal, piscina cubierta, sendas y tribunas curvas coherentes. Las distancias están condensadas y no representan un relevamiento. |
| Contacto e integridad nativa | Cumple | La piscina quedó sobre ribera seca; los caminos tienen winding hacia arriba y las tribunas poseen cierre exterior. No se aprecian piezas deformes o apoyos suspendidos graves en las vistas finales. |
| Festival del parque | Cumple | Ruedo vacío de día y escenario con cuatro músicos, instrumentos, multitud e iluminación de concierto de noche. La geometría del público tiene escala humana y miembros conectados. |
| Fogones de Artigas | Cumple | Escenario bajo la cumbre, público en la ladera, fogones y estallidos sobre el cerro. El monumento y los tres pabellones conservan su geometría y orden aceptados. La escenificación festiva se oculta de día. |
| Movimiento, pausa y modos | Cumple en el alcance comprobado | Pruebas de reloj/poses, ocultación diurna y apagado de luces fuera del motivo; fotogramas y observaciones de reproducción aportados por el agente principal. |
| WebGL e interfaz | Cumple en los formatos revisados | Día/noche en escritorio 1440 × 900 y móvil 390 × 844; textos y controles con separación, sin overflow horizontal reportado y consola sin errores. La muestra 320 × 568 comprueba lectura parcial y requiere scroll para ver los controles inferiores. |
| Preservación | Cumple | Diez destinos y trece visitas; posiciones y orden relativo de los nueve originales intactos. Villa Serrana conserva Ventorrillo → Stewart Vargas. La geometría base de Artigas se compara sin cambios. |

Las ocho vistas nativas están en [native-v4](references/parque-rodo/native-v4/overall.png). Las capturas WebGL cubren entrada, lago, ruedo diurno/nocturno, Artigas diurno/nocturno, una segunda pose del festival, fuegos artificiales y alejamiento nocturno. Son ejemplos verificables [el concierto del parque](references/parque-rodo/web-review/desktop-park-arena-night.jpg), [los Fogones](references/parque-rodo/web-review/desktop-artigas-night.jpg) y [la vista móvil del concierto](references/parque-rodo/web-review/mobile-park-arena-night.jpg).

## Correcciones verificadas

La V2 fue rechazada porque el agua del lago invadía la base de la piscina. Se confirmó mediante inspección y dieciséis raycasts dentro de su huella. En V3 se movió el edificio a terreno seco y se agregó una regresión de la base más dos metros de margen; V4 conserva esa separación.

El agente principal detectó después un winding de caminos hacia abajo que Blender mostraba por doble cara y que no correspondía a `FrontSide` en la web. V4 corrigió caminos, contrahuellas y cierre exterior de tribunas. El revisor calculó de forma independiente las normales geométricas mediante productos cruzados sobre los triángulos empaquetados: cero caras negativas en 20672 caras de suelo, 320 de calle, 360 de sendero y 776 de agua. Sus mínimos de normal Y son 0,9677; 0,9723; 0,9770 y 1,0 respectivamente.

Los lanzadores de pirotecnia se trasladaron detrás del escenario y toman su altura del terreno. No nacen bajo el público o el monumento. Las imágenes finales muestran estallidos separados de la estatua; no equivalen a una simulación pirotécnica certificada.

## Pruebas ejecutadas y límites

El revisor ejecutó independientemente `npm run check:parque-rodo`: pasó con 27 muestras lago/terreno, margen seco de piscina, normales/índices válidos, 155 árboles y 513254 triángulos incluyendo el público del parque. Comprueba cuatro músicos por escenario, 1722 personas en el parque y 1934 en Artigas, visibilidad exclusiva nocturna, dos luces reales por evento, apagado fuera de escena, pausa y animación, geometría base de Artigas conservada y continuidad de cámara en cuatro formatos.

También ejecutó `npm run check:journey-atmosphere`: pasó la regresión existente del equipo compartido de luces y luna con nueve casos sintéticos por formato. La ruta actual de diez destinos y trece visitas se comprueba por separado en `check:parque-rodo`.

El agente principal reportó además `check`, `check:journey-models`, `check:stewart-vargas`, `check:journey-mode` y `build` aprobados. Se distinguen esos resultados reportados de las pruebas ejecutadas por el revisor. El [registro de navegador](references/parque-rodo/web-review/browser-observations.json) contiene `consoleErrors: []`, ausencia de overflow, cambios de pose durante reproducción y progreso congelado en pausa.

La aceptación es de una reconstrucción escénica estilizada. No certifica dimensiones exactas, distribución catastral, especies de árboles, todos los ángulos ocultos, una edición concreta de festival, artistas reales o actuaciones cada noche. Las capturas son fotogramas seleccionados, complementados por código, pruebas y observaciones del agente principal; no se afirma una revisión de vídeo continuo ni rendimiento en teléfonos físicos.

No quedan bloqueantes detectados para este alcance. No se extiende esta aprobación a todas las páginas del sitio, todos los dispositivos o todos los modelos anteriores. El revisor creó el plan, las evidencias de auditoría y este dictamen; no modificó modelos, runtime ni aprobaciones históricas de otros destinos.

## Seguimiento para publicación

Antes del commit se corrigió únicamente la referencia histórica usada por `check-parque-rodo.mjs`. Sus dos lecturas `git show` utilizaban `HEAD`: después de publicar la integración, esa referencia contendría diez destinos en lugar de los nueve que el test debe preservar. Ahora ambas lecturas fijan la revisión aceptada `098597aa5cfac62abb668b3580017e1e6150171c`, sin cambiar las comprobaciones ni el código de la página.

El revisor comprobó que revertir sólo el comentario, la declaración de esa revisión y las dos referencias reconstruye exactamente el script aprobado anteriormente, SHA-256 `54b4e167c45c5b5a9258300606e23eead4bfe75b42d73e87cd0df601429c9d53`. El nuevo script tiene SHA-256 `10688347b414b757b0d2e85ed7e6fa83c39a80f86b834c6705e3cfb4671f4799`. Se ejecutó de nuevo `npm run check:parque-rodo` de forma independiente y pasó.

Se verificó que las otras diecisiete fuentes/activos y todas las imágenes/observaciones conservan sus hashes. El ajuste queda aprobado exclusivamente como continuidad de la regresión al realizar el commit; no cambia el alcance de la aprobación visual. Los registros `quality-review.json` y `provenance.json` conservan el hash anterior, el nuevo y la razón en `publicationFollowups`. El revisor no realizó commit ni publicación en GitHub.
