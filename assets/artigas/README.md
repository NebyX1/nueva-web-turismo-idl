# Monumento ecuestre de Artigas, Cerro Artigas de Minas

Reconstrucción por observación de fotografías, realizada primero en Blender.
El modelo reemplaza íntegramente la anterior escultura procedural. La colina,
rocas, camino, vegetación, banderas y encuadres del recorrido se conservan.

## Fuentes geométricas

- **Caballo:** Lyndon Daniels, *Realtime Rancher's 3D Model Pack*, publicado en
  [OpenGameArt](https://opengameart.org/content/realtime-ranchers-3d-model-pack),
  licencia CC0. Se conserva la malla OBJ como base editable. La postura de cabeza,
  masa corporal, apoyo de los miembros, orejas, crin, cola y aparejos se adaptan al
  monumento de Minas. Las texturas fotográficas del paquete no se distribuyen.
- **Base humana y objetivos de forma:** MakeHuman Community, malla hm08 y
  objetivos oficiales. Los activos están publicados bajo
  [CC0](https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.ASSETS.md).
  El propio encabezado de `source/human.obj` declara la cesión CC0 de septiembre
  de 2020. Las modificaciones de edad, nariz, mandíbula, expresión, pose, cabello,
  ropa y manto forman parte de esta reconstrucción.
- **Manto, cabello, botas, manos, carona, flecos, riendas y basamento:** geometría
  elaborada para este proyecto, con proporciones ajustadas a las referencias.

Fuentes visuales y evaluación: `docs/artigas-quality-review.md` y
`docs/research-artigas-refinement.md`. Las fotos se usan para estudio y no son
texturas del modelo. Las caras posteriores se interpretan a partir de perfiles
y una fotografía posterior de tres cuartos. No se dispone de un levantamiento
métrico del conjunto.

## Reconstrucción y exportación

1. Con Blender 4.5 LTS: `blender --background --threads 8 --python scripts/artigas/build_artigas.py -- --out DIR --views all --cloth-steps 48`.
2. Revisar frente, dos perfiles, tres cuartos, trasera y primeros planos altos y
   bajos de la cabeza. El dictamen independiente debe corresponder al activo final.
3. `node scripts/artigas/pack-artigas.mjs DIR/artigas-rebuilt.glb DESTINO.json`.
   El empaquetado conserva normales y usa posiciones de 16 bits; registra el
   error máximo y SHA-256 del GLB original. La web recibe geometría estática.
4. `npm run check:artigas` comprueba apoyos, normales, proporciones, entorno
   preservado y aprobación independiente vinculada al mismo GLB.

El script y los OBJ/targets permiten editar y volver a construir el activo sin
depender de servicios de generación remotos ni cuentas de modelado.

## Corrección localizada de brazos y manos

`anatomical_hands.py` conserva la topología humana de palma, cuatro dedos y pulgar,
con flexión articulada. La mano izquierda sujeta las riendas; la derecha descansa
semiextendida sobre el paño. Los dedos no se fusionan con remallado volumétrico.

`adult_arms.py` equilibra los largos de ambos brazos y el volumen de las mangas.
Trabaja sobre el uniforme guardado, sin repetir la simulación del manto. Los
volúmenes internos y el remallado cierran las uniones de codos y hombros.
`refine_artigas_hands.py --input BASE.blend --out DIR` aplica esta revisión a la
escena original y sustituye las dos manos. `BASE.blend` debe ser la escena anterior
a esa revisión: no se deben acumular deformaciones al ejecutarlo repetidamente.

La comprobación compara las huellas de los otros once grupos del activo con
`preserved-sculpture.json`, además de exigir dos manos conexas y cerradas. Caballo,
cabeza, pelo, ojos, botas, aparejos, flecos y basamento conservan sus buffers. La
revisión independiente en `docs/artigas-proportions-review.md` mide brazos, mangas,
palmas y muñecas respecto a la cabeza, y examina ambas manos aisladas, en contexto
y junto a la figura completa a escala de pantalla.

La revisión final de esta corrección contiene 13 grupos y 193.458 triángulos.
Sus 25 renders de inspección están en `docs/references/artigas-proportions/`, con
huellas de cada imagen en `render-evidence.json`. Son renders offline; los
encuadres y la iluminación nocturna a escala de pantalla son aproximaciones.
