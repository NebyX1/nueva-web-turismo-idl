# Cerro Artigas — refinamiento de la escultura 3D

Investigación y comprobación: 5 de noviembre de 2026. Implementación: `src/three/landmarks/artigas.ts`, exportación `createArtigas(): LandmarkModel`, integrada en el recorrido. El rostro se construye en `src/three/landmarks/artigasHead.ts`.

## Identidad confirmada

El [Decreto Departamental 3978, publicado por la Intendencia de Lavalleja](https://www.gub.uy/intendencia-lavalleja/institucional/normativa/decreto-departamental-n-3978-fecha-11062025), declara patrimonio departamental el monumento ecuestre al General José Artigas ubicado en el Parque Artigas de la ciudad de Minas. Se representa ese monumento: figura de Artigas sin sombrero, abrigo/manto largo, caballo quieto con cabeza inclinada y apoyo pétreo bajo en un cerro herbáceo urbano. No se reutiliza la estatua de Juan Antonio Lavalleja de Plaza Libertad.

Se leyeron `src/three/types.ts`, el `createArtigas()` anterior, `docs/research-nature-monuments.md` y las fuentes específicas de `docs/explorer-prompts-localidades.md` antes del refinamiento.

## Fotografías efectivamente vistas

Se descargaron cuatro fotografías complementarias exclusivamente a `C:/Users/Nebyx/AppData/Local/Temp/lavalleja-artigas-3d-study/` y se abrieron con `view_image`. Ninguna fotografía pasa a `public`, ni se usa como textura ni se distribuye con el módulo.

1. **Perfil próximo, Romi 15, 15/09/2013.** [Ficha Commons](https://commons.wikimedia.org/wiki/File:Monumento_a_Artigas_(Cerro_Ventura)_Lavalleja,_Minas.JPG), [archivo original](https://upload.wikimedia.org/wikipedia/commons/7/79/Monumento_a_Artigas_%28Cerro_Ventura%29_Lavalleja%2C_Minas.JPG), [autor](https://commons.wikimedia.org/wiki/User:Romi_15), licencia fotográfica [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Estudio local: `romi15-profile.jpg`. Permite ver cabeza descubierta, nariz/perfil del rostro, cuello corto, manos bajas sujetando las riendas, botas y estribos, volumen de las alforjas, manto apoyado sobre la grupa, cuello arqueado y hocico hacia abajo. El conjunto se lee como escultura pétrea clara y pesada.
2. **Vista general de la colina.** [Uruguay en Vacaciones](https://uruguayenvacaciones.com/images/cerro-artigas-e1563680241898.jpg). Estudio local: `hill-overview.jpg`. Fuente fotográfica de estudio sin licencia abierta identificada; no se reproduce su fotografía ni su marca. Muestra cima baja de césped, afloramientos al pie, arbolado periférico, camino y tres mástiles; aporta escala de implantación, no detalles anatómicos.
3. **Tres cuartos muy bajo desde el flanco rocoso.** [Fotografía alojada en Tripadvisor](https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/2d/e5/d2/vista-del-monumento-a.jpg?h=800&s=1&w=800). Estudio local: `low-three-quarter.jpg`. Autor/licencia no verificados; solo estudio, sin redistribución. Confirma la cabeza inclinada, cola del abrigo hacia atrás y vegetación de hojas largas sobre el talud de rocas. No se copiaron personas ni elementos transitorios.
4. **Frontal de tres cuartos al atardecer.** [Fotografía alojada en Tripadvisor](https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0b/b6/d4/ea/cerro-artigas.jpg?h=600&s=1&w=1100). Estudio local: `front-sunset.jpg`. Autor/licencia no verificados; solo estudio, sin redistribución. Permite separar las cuatro patas, observar el ancho frontal del pecho y cuello, el giro del hocico, la posición tranquila del caballo, la relación jinete/montura y el tono cálido producido por el sol. Los visitantes se excluyen del modelo.

## Aplicación a la geometría

El caballo mira hacia **−X** y el costado principal está hacia **+Z**. El tronco, cuello arqueado, cabeza inclinada, cola y miembros se construyen como superficies cerradas de secciones variables, con normales suaves calculadas. Hay cuatro miembros separados con transiciones de hombro/muslo, rodilla/corvejón, caña y menudillo; los cascos tienen perfiles biselados. Se sustituyeron las masas de esferas y los cilindros apilados por recorridos continuos con radios anatómicos y extremos de unión ocultos dentro del volumen vecino.

Los detalles del caballo incluyen orejas, crin por surcos sobre el cuello, quijada/hocico, incisiones muy pequeñas de párpado, fosa nasal y boca, cola pesada con surcos, brida, riendas y cincha. Los detalles se mantienen en tonos próximos al hormigón, sin ojos negros ni expresión caricaturesca.

El jinete tiene rostro volumétrico con frente, nariz, pómulo y mentón; ojos/boca apenas marcados, orejas y pelo indicado sin volumen de sombrero. Se acortó el cuello, aumentó el peso de torso y hombros y bajó la cabeza para evitar una figura demasiado delgada. Brazos flexionados y manos siguen la posición baja de las riendas. Muslos, botas con empeine/talón, aciones y estribos completan la postura. Las alforjas tienen sección curva y fondo blando; el manto pesado baja por la espalda y termina apoyado en la grupa, con pliegues largos.

El entorno incluye cerro herbáceo, apoyo pétreo bajo, afloramientos, plantas de hojas en punta, camino ascendente y tres mástiles. Los volúmenes urbanos distantes son contexto esquemático de borde de Minas, no una reproducción ni identificación de edificios particulares. Se redujeron las rocas centrales de primer plano para dejar leer patas y cascos.

## Rendimiento y encuadre

- Las piezas de la escultura se fusionan por material compartido al terminar la construcción. Las fotografías no son necesarias en runtime y no hay dependencias de Canvas/DOM.
- **19 mallas/draw calls antes de pasadas de sombras**, incluidas las tres superficies de la cabeza, y **266 instancias** de rocas, vegetación, troncos y volúmenes distantes.
- **117.184 triángulos efectivos**, incluyendo las instancias del entorno. La mayor parte de las subdivisiones se concentra en anatomía, cabeza y manto.
- `groundY: 0`.
- `target: (-0.35, 35.1, 0)`.
- `bounds: { radius: 100, height: 43.5 }`; el radio es el radio operativo del conjunto para la toma general, como en el módulo anterior. La malla rectangular de suelo llega a x=±109 y z=±98.
- `cameraDirection: normalize(-0.85, 0.14, 1)`; favorece el rostro de tres cuartos y la separación de las patas.
- La escultura está elevada sobre la cima y=26. Para un acercamiento conviene apuntar cerca de y=35 y conservar 17 unidades de altura visible sobre el apoyo; el reveal puede terminar cerca de y=43. El módulo no anima la estatua, cuya quietud forma parte de la postura observada.

## Comprobaciones

1. TypeScript aislado correcto: `npx tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck src/three/landmarks/artigas.ts`.
2. Construcción real mediante Node/Three: todos los componentes de `position`, `normal`, objetivo y dirección son finitos; bounding spheres válidas. La comprobación cuenta mallas, instancias y triángulos del modelo construido, no estimaciones de código.
3. Render WebGL aislado mediante Three/Chrome headless, inspeccionado visualmente. Se corrigieron tapas visibles de uniones anatómicas, cabeza demasiado plana, detalles faciales fuera de la superficie, volumen de cuello, manto demasiado separado de la grupa y alforjas excesivamente rectas. Captura final de estudio: `C:/Users/Nebyx/AppData/Local/Temp/lavalleja-artigas-3d-study/artigas-final-check.png`.

Es una reconstrucción procedural por observación fotográfica, con proporciones de composición y detalle moderado para compartir escena con las demás paradas; no procede de levantamiento o fotogrametría.

## Segunda revisión: rostro según las fotografías del usuario

Se examinaron detalladamente las tres fotografías adjuntas de referencia: vista frontal y baja de tres cuartos, vista de perfil nítido contra el cielo y vista aérea de conjunto sobre el pedestal.

Se rediseñó por completo el monumento ecuestre y la cabeza del General José Gervasio Artigas:
1. **Cabeza del Prócer**: fisonomía heroica y compacta (proporciones sólidas sin elongación ni afinamiento excesivo), frente despejada y noble, arcos superciliares firmes y decididos, cuencas orbitales y párpados de piedra esculpidos, puente nasal recto y aguileño prominente, pómulos altos y mejillas enjutas, labios firmes y resueltos, mentón cuadrado y rotundo (y=0.32, x=-0.54) y mandíbula angulada. La cabellera ondulada está peinada hacia atrás con ondas talladas continuas y patillas que enmarcan las orejas. El cuello anatómico macizo se integra de forma continua con la casaca militar sin anillos ni holguras flotantes.
2. **Caballo criollo**: cuello fuertemente arqueado y musculoso, cresta con crin tallada en mechones ondulados con surcos profundos, cabeza noble y recogida apuntando hacia abajo y adelante, orejas lanceoladas alertas, ojos con párpados esculpidos, pecho profundo y ancho con dos pectorales voluminosos divididos por surco esternal, costillar amplio, grupa redondeada potente, cola pesada cayendo entre las ancas y cuatro extremidades anatómicas firmes con rodillas, corvejones angulados y cascos planos apoyados en el pedestal.
3. **Jinete y poncho criollo**: porte erguido y digno, poncho criollo pesado de paño sobre ambos hombros con ricos pliegues verticales y diagonales que caen sobre el pecho y fluyen por la espalda hasta descansar sobre la grupa del caballo (según las fotos de perfil y aérea). Mano izquierda flexionada sosteniendo las riendas con firmeza; brazo derecho cruzado sobre el pecho/poncho en reposo sereno. Botas de montar altas con estribos y aciones.
4. **Pedestal**: basamento rectangular escalonado de hormigón claro con hiladas horizontales y losa de apoyo superior donde asientan firmemente los cuatro cascos.

Se eliminaron los vóxeles y marching cubes pesados en favor de superficies lofts continuas y analíticas con normales suaves calculadas, reduciendo el tiempo de carga drásticamente y eliminando deformidades orgánicas o cerosas. Se validó visualmente en WebGL en vistas `front`, `side`, `three-quarter`, `head` y `head-front`, y se verificó con `npm run check:journey-models` y `npm run check`.
