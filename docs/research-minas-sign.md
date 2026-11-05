# Letras de Minas — estudio y modelado 3D

Consulta: 5 de noviembre de 2026. Se inspeccionaron tres fotografías complementarias antes de construir las geometrías. Las fotos se guardaron solo como estudio fuera del repositorio (`TEMP/lavalleja-minas-sign-study/`); no se redistribuyen ni se usan como texturas.

Identidad contrastada con la [Resolución 2.425/024 de la Intendencia de Lavalleja](https://www.gub.uy/intendencia-lavalleja/institucional/normativa/resolucion-n-2425024): suministro e instalación de las letras monumentales para el acceso de Minas. La localización en La Coronilla y el aspecto terminado se contrastaron con la cobertura fotográfica posterior.

## Fotografías observadas

1. [El Observador / Diario La Unión de Minas, cartel terminado visto desde la ruta](https://media.elobservador.com.uy/p/ed2e7e12fb0f6a468074089095547294/adjuntos/362/imagenes/100/653/0100653646/1000x0/smart/letras-gigantes-minas.jpg), en [artículo del 18 de julio de 2025](https://www.elobservador.com.uy/nacional/letras-gigantes-minas-tuvieron-visita-concurrida-este-feriado-no-laborable-del-18-julio-n6009130): letras blancas sobre una terraza de tierra rojiza, por debajo de la corona de una ladera rocosa; matorral abajo y ruta en primer término.
2. [Debate Uruguay, vista cercana oblicua](https://www.debate.com.uy/__export/1751572311016/sites/debate/img/2025/07/03/minas.jpeg_1902800913.jpeg), en [artículo del 3 de julio de 2025](https://www.debate.com.uy/actualidad/Minas-alza-sus-letras-gigantes-Un-hito-de-US-650.000-que-supera-a-Hollywood-20250703-0082.html): M ancha, I vertical sin remates, N diagonal, A abierta y S curva, separación entre letras y pequeña diferencia de cotas.
3. [El Observador, montaje estructural visto desde dron](https://media.elobservador.com.uy/p/998a68e996be6b91d445423c39086550/adjuntos/362/imagenes/100/638/0100638019/1200x675/smart/letrasminasnotapng.png): profundidad y arriostramiento metálico detrás de las letras; trazado de la terraza y relación con el corte del cerro. Se utiliza para entender la estructura, no para representar la obra inacabada.

## Criterio de la escena

`src/three/landmarks/minasSign.ts` construye las cinco letras como contornos extruidos propios, con espesor, pequeños biseles y estructura posterior. No son una imagen plana ni un rótulo superpuesto a la cámara. La proporción de referencia del conjunto ronda 70 × 15 m; el terreno, la ruta y los accesos son una composición visual aproximada, no un levantamiento topográfico.

Ladera amplia y baja con rocas dispersas, vegetación instanciada y plataforma rojiza recortada en la pendiente. La cámara se acerca desde el frente con una oblicuidad leve, sube su mirada del terreno hacia las letras y luego abre el encuadre. Geometría estática agrupada por material para reducir llamadas de dibujo.
