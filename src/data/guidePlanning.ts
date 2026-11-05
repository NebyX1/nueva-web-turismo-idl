import type { GuideChapter } from './guideTypes';

const tourismSource = { label: 'Turismo · Intendencia de Lavalleja', url: 'https://www.gub.uy/intendencia-lavalleja/turismo' };
const forecastSource = { label: 'INUMET · Pronóstico oficial', url: 'https://www.inumet.gub.uy/pronostico' };

export const planningChapters: GuideChapter[] = [
  {
    id: 'un-dia', title: 'Un día para entrar en ritmo', category: 'Itinerarios', eyebrow: 'MINAS + UNA ESCAPADA',
    intro: 'Una primera visita puede ser sencilla: conocer Minas, compartir un buen almuerzo y elegir una sola salida al paisaje. Este recorrido es una propuesta orientativa para disfrutar sin correr.',
    image: '/media/eb7a5d7ba6a26aa0.webp', imageAlt: 'Plaza de Minas', imageCaption: 'Minas · el punto de partida', duration: '1 día · ritmo tranquilo', location: 'Minas y alrededores',
    highlights: ['Centro de Minas', 'Almuerzo sin apuro', 'Salus o cerro Verdún'],
    sections: [
      { title: 'Mañana · conocer la ciudad', body: 'Empezá en la plaza Libertad y recorré a pie algunas calles del centro. Observá la catedral, las fachadas y la vida cotidiana antes de elegir una visita cultural. Consultá qué espacios están abiertos ese día; una caminata por la ciudad funciona también cuando no coinciden los horarios de los museos. Sumá un café y tiempo para una compra local.' },
      { title: 'Tarde · elegí tu paisaje', body: 'Después del almuerzo, elegí Salus si preferís bosque y una propuesta de naturaleza organizada, o el cerro Verdún si te interesa el paisaje asociado al santuario. Son alternativas, no paradas obligatorias de un mismo circuito. Para Salus confirmá modalidad y reserva con el operador; para Verdún evaluá la subida según el clima y tu movilidad.' },
      { title: 'Antes de volver', body: 'Dejá margen para regresar con luz y para el traslado hasta la terminal si viajás en ómnibus. Sin vehículo, coordiná el viaje de ida y vuelta antes de salir del centro. Si llueve, quedate en Minas y transformá la tarde en una pausa gastronómica y cultural: el viaje no necesita completar una lista.' },
    ],
    tip: { title: 'Cómo usar este recorrido', body: 'La duración es sugerida. Ajustá el orden al horario real de llegada, las visitas habilitadas y el transporte de regreso.' },
    mapQuery: 'Plaza Libertad Minas Lavalleja Uruguay', sources: [tourismSource],
  },
  {
    id: 'dos-dias', title: 'Un fin de semana entre sierras', category: 'Itinerarios', eyebrow: 'VILLA SERRANA + PENITENTE',
    intro: 'Dos días permiten pasar de las calles de Minas al ritmo de Villa Serrana y reservar otra jornada para el Salto del Penitente. La propuesta combina contemplación y actividad sin acumular traslados.',
    image: '/media/ac1362ec4809d96d.webp', imageAlt: 'Paisaje de Villa Serrana entre las sierras', imageCaption: 'Villa Serrana · quedarse también es un plan', duration: '2 días · una noche', location: 'Minas, Villa Serrana y Penitente',
    highlights: ['Una base para dormir', 'Arquitectura y paisaje', 'Cascada y senderos'],
    sections: [
      { title: 'Día 1 · llegar y bajar un cambio', body: 'Hacé una parada en Minas para almorzar o comprar provisiones y continuá hacia tu alojamiento. En Villa Serrana dedicá la tarde a caminar por los sectores de acceso público, mirar la arquitectura integrada al relieve y encontrar un lugar para contemplar la última luz. Si querés comer fuera, confirmá la apertura y reservá antes de que termine la tarde.' },
      { title: 'Día 2 · el agua como destino', body: 'Dedicá la segunda jornada al Salto del Penitente. Consultá acceso, condiciones del sendero y actividades efectivamente disponibles. Empezá por los miradores o recorridos que correspondan a tu grupo y agregá una experiencia guiada solo si está confirmada. No presupongas que el baño está habilitado ni que todas las actividades funcionan con cualquier caudal o condición meteorológica.' },
      { title: 'Armá la logística primero', body: 'Elegí si vas a dormir en Minas o en la zona serrana y comprobá cómo llegar al alojamiento concreto. Llevá la ubicación guardada y coordiná las comidas. Si viajás sin auto, contratá los traslados rurales con anticipación. Con lluvia persistente o tormenta, intercambiá la salida por tiempo en la ciudad o en el alojamiento.' },
    ],
    tip: { title: 'Un fin de semana realista', body: 'No reserves una actividad sobre el horario de llegada. El ingreso al alojamiento, las compras y los caminos también llevan tiempo.' },
    sources: [tourismSource, { label: 'IDL · Operadores de Villa Serrana y Penitente', url: 'https://www.gub.uy/intendencia-lavalleja/comunicacion/noticias/intendente-ximenez-viviana-pristch-directora-turismo-se-reunieron-operadores' }],
  },
  {
    id: 'tres-dias', title: 'Tres días, a tu manera', category: 'Itinerarios', eyebrow: 'CIUDAD, NATURALEZA Y CAMINOS',
    intro: 'Una estadía de tres días deja espacio para conocer los clásicos y elegir un tercer paisaje según tus intereses. Es una propuesta flexible: no hace falta cambiar de cama cada noche ni recorrer todo el departamento.',
    image: '/media/b19eab6a8f7a395a.webp', imageAlt: 'Salto del Penitente', imageCaption: 'Penitente · una jornada para el paisaje', duration: '3 días · dos noches', location: 'Base en Minas o zona serrana',
    highlights: ['Minas y patrimonio', 'Villa Serrana o Penitente', 'Un día a elección'],
    sections: [
      { title: 'Día 1 · una buena base', body: 'Llegá a Minas, instalate y recorré el centro. Sumá un espacio cultural si sus horarios coinciden con tu visita y elegí una salida corta hacia el cerro Artigas o Verdún según las condiciones. Aprovechá para resolver compras, combustible y reservas de los días siguientes. Una tarde liviana ayuda a conocer el ritmo del lugar.' },
      { title: 'Día 2 · profundizar, no coleccionar', body: 'Elegí Villa Serrana para una jornada de paisaje, arquitectura y pausas, o Penitente si preferís una salida centrada en la cascada y las actividades habilitadas. Si combinás ambos, reducí otras paradas y consultá los accesos. Evitá convertir una caminata en una carrera para alcanzar el siguiente punto.' },
      { title: 'Día 3 · elegí tu cierre', body: 'Podés dedicar el último día al entorno de Arequita con la visita o el guía que corresponda, a una experiencia concertada en Salus o a un recorrido por Solís de Mataojo y Aguas Blancas. Son alternativas con logísticas diferentes. El norte del departamento merece su propio circuito y más margen de conducción: no lo sumes como desvío improvisado antes de volver.' },
    ],
    tip: { title: 'Dejá una mañana libre', body: 'Un día flexible permite cambiar el orden por el tiempo, descansar o repetir ese lugar al que llegaste con poco margen.' },
    sources: [tourismSource],
  },
  {
    id: 'como-llegar', title: 'Llegar y moverse por Lavalleja', category: 'Planificá', eyebrow: 'EL VIAJE EMPIEZA EN EL MAPA',
    intro: 'Minas es una base práctica para organizar una primera visita. La ruta 8 conecta la capital departamental con Montevideo y el corredor hacia el noreste; el resto del viaje depende del destino concreto y de su acceso final.',
    duration: 'Antes de salir', location: 'Rutas y caminos del departamento', highlights: ['Ruta 8 como eje', 'Traslados rurales coordinados', 'Regreso previsto'],
    sections: [
      { title: 'En auto · mirá el último tramo', body: 'Las rutas 8 y 12 forman parte de los accesos principales del entorno de Minas, pero una dirección sobre el mapa no describe el estado del camino hasta una cabaña, un camping o una actividad. Pedí al anfitrión la entrada recomendada, las condiciones tras lluvias y si tu vehículo es adecuado. Priorizá llegar de día y respetá la señalización, incluso si el navegador propone un atajo.' },
      { title: 'En ómnibus · separá los dos viajes', body: 'Consultá directamente al transportista las frecuencias vigentes, la terminal o parada de llegada y el último servicio de regreso. Llegar a Minas en transporte interdepartamental no garantiza conexión hasta cada atractivo rural. Para ese segundo tramo, coordiná un traslado o una excursión y acordá el punto de encuentro, el precio y el horario de recogida.' },
      { title: 'En el territorio', body: 'Guardá la dirección del alojamiento y los mapas necesarios antes de salir; no dependas solo de una conexión móvil continua. Planificá combustible, agua y comida en función del recorrido. En caminos rurales reducí la velocidad, prestá atención a animales y maquinaria y evitá estacionar sobre entradas de predios. Los tiempos estimados del teléfono no contemplan todas las pausas ni las condiciones locales.' },
    ],
    tip: { title: 'Una pregunta que resuelve mucho', body: 'Antes de reservar, preguntá: «¿Cómo llego desde mi punto de llegada y cómo vuelvo, a la hora que necesito?».' },
    mapQuery: 'Terminal de omnibus Minas Lavalleja Uruguay', sources: [{ label: 'Uruguay XXI · Informe de Lavalleja', url: 'https://www.uruguayxxi.gub.uy/es/centro-informacion/articulo/informe-de-lavalleja/' }, tourismSource],
  },
  {
    id: 'cuando-venir', title: 'Cuándo venir y qué llevar', category: 'Planificá', eyebrow: 'UNA MOCHILA BIEN PENSADA',
    intro: 'La mejor fecha es la que combina el viaje que querés hacer con las condiciones del momento. Una escapada de miradores, una caminata y una noche de camping requieren preparaciones distintas.',
    duration: 'En cualquier estación', location: 'Sierras, ciudad y campo', highlights: ['Consultar INUMET', 'Vestirse por capas', 'Tener una alternativa'],
    sections: [
      { title: 'Elegí por experiencia', body: 'Para caminatas, buscá jornadas con condiciones adecuadas y suficiente luz, sin dar por seguro el tiempo de ninguna estación. En los días calurosos conviene elegir recorridos cortos, llevar agua y prever sombra; para una estadía invernal, preguntá por la calefacción y las condiciones interiores del alojamiento. La primavera y el otoño tampoco reemplazan la consulta del pronóstico.' },
      { title: 'Lo básico de la mochila', body: 'Llevá calzado con buena suela que ya hayas usado, ropa por capas, protección para el sol, impermeable, agua potable y una colación. Sumá tu medicación habitual, teléfono cargado y una forma de guardar los residuos. Para dormir en camping, verificá la temperatura prevista, el equipo de abrigo y si hay servicios disponibles en esas fechas. Un paraguas no sustituye una prenda adecuada para caminar.' },
      { title: 'Antes de salir cada mañana', body: 'Revisá el pronóstico de INUMET y sus advertencias para la zona, y consultá al prestador si el acceso o la actividad cambió. Con tormentas, viento fuerte o lluvia que comprometa el camino, adaptá el plan. Guardá una alternativa en Minas o en tu alojamiento para poder decidir sin presión. En fines de semana largos, verificá disponibilidad y reservas antes de viajar.' },
    ],
    tip: { title: 'Equipaje pequeño, decisiones útiles', body: 'Elegí lo que necesitás para tu actividad concreta. Si el operador exige equipo o condiciones especiales, confirmalo antes de salir.' },
    sources: [forecastSource, { label: 'INUMET · Advertencias meteorológicas', url: 'https://www.inumet.gub.uy/alerta' }],
  },
  {
    id: 'sabores', title: 'La pausa tiene sabor local', category: 'Planificá', eyebrow: 'MESA, MERIENDA Y PRODUCTORES',
    intro: 'También se conoce Lavalleja sentándose a la mesa. Reservá tiempo para comer, conversar con quien produce y llevarte algo que tenga una historia del lugar: el almuerzo puede ser parte del recorrido.',
    duration: 'Una pausa larga', location: 'Minas, pueblos y zona serrana', highlights: ['Cocina local', 'Dulces y meriendas', 'Artesanías con origen'],
    sections: [
      { title: 'Elegir dónde comer', body: 'Armá las comidas junto con los traslados. En Minas podés buscar una mesa cerca del recorrido urbano; en la zona serrana conviene confirmar apertura y reserva con el establecimiento. Preguntá qué se elabora allí y qué producto es de la zona. Una propuesta breve, bien contada por sus anfitriones, puede ser una mejor experiencia que una lista larga de platos.' },
      { title: 'Probar y llevar', body: 'Explorá la gastronomía dulce, las panaderías y los productos ofrecidos por emprendimientos locales. Si elegís alfajores, conservas u otra especialidad, consultá dónde se elaboran, cómo conservarlos y qué ingredientes contienen. Para un picnic, comprá lo necesario antes del tramo rural y elegí un lugar habilitado para detenerte. No presupongas que un mirador dispone de agua, mesas o recolección de residuos.' },
      { title: 'Comprar con una pregunta más', body: 'Para artesanías y pequeños recuerdos, preguntá por el material, la técnica y la persona que los hizo. Las ferias y las propuestas de productores pueden tener fechas concretas: verificá la agenda local en lugar de planificar una visita sobre una publicación antigua. Avisá con tiempo si necesitás opciones sin gluten, vegetarianas o adaptadas a una alergia; pedí información precisa sobre la preparación.' },
    ],
    tip: { title: 'Un presupuesto que rinde', body: 'Separá el gasto en comidas, provisiones y compras. Preguntá los medios de pago disponibles antes de salir de los centros urbanos.' },
    sources: [{ label: 'MIEM · Geoproductos, artesanías y gastronomía del territorio', url: 'https://www.gub.uy/ministerio-industria-energia-mineria/sites/ministerio-industria-energia-mineria/files/2023-11/TDR%20Comunicacio%CC%81n%20Digital%20Proy.%20Geoparque%20Manantiales%20Serranos.pdf' }, tourismSource],
  },
  {
    id: 'donde-dormir', title: 'Encontrá tu forma de quedarte', category: 'Planificá', eyebrow: 'UNA BASE PARA TU VIAJE',
    intro: 'Elegí el alojamiento por la experiencia y por la logística. Dormir cerca de servicios, despertarte entre sierras o armar una carpa implican necesidades distintas; las fotos son solo una parte de la elección.',
    duration: 'Reservar con anticipación', location: 'Ciudad, sierras y espacios rurales', highlights: ['Elegir la base', 'Confirmar servicios', 'Leer condiciones'],
    sections: [
      { title: 'Qué tipo de estadía te sirve', body: 'Para salir a comer a pie y resolver traslados, compará opciones en Minas y comprobá su ubicación exacta. Si buscás cabaña o casa serrana, evaluá el acceso y cuánto querés conducir cada día. Para una experiencia rural, acordá las comidas y actividades incluidas. En camping, consultá si se requiere reserva y qué equipamiento debés llevar: no todos los predios ofrecen los mismos servicios.' },
      { title: 'Preguntas antes de pagar', body: 'Pedí el precio final para tu grupo y tus fechas, la política de cancelación, la forma de pago y los horarios de entrada y salida. Verificá agua caliente, calefacción o ventilación, ropa de cama, cocina, conectividad y estacionamiento según lo que necesites. Si viajás con mascotas, consultá condiciones específicas. Para una llegada tardía, acordá cómo retirar las llaves y a quién llamar.' },
      { title: 'La reserva también incluye el camino', body: 'Solicitá indicaciones escritas del último tramo y una referencia de la entrada. Si hay personas con movilidad reducida, pedí detalles y fotografías de los accesos, baño y distribución interior. Podés consultar la situación registral de los prestadores a través del Ministerio de Turismo. Guardá la confirmación y el contacto del anfitrión antes de viajar.' },
    ],
    tip: { title: 'Lo que conviene confirmar', body: 'Una piscina, una estufa o una actividad mostrada en fotos puede tener uso estacional o costo adicional. Incluí esas preguntas en tu reserva.' },
    sources: [{ label: 'Ministerio de Turismo · Registro de alojamientos turísticos', url: 'https://www.gub.uy/tramites/inscripcion-prestador-turistico-alojamientos' }],
  },
  {
    id: 'en-familia', title: 'Un viaje que le quede bien a todos', category: 'Planificá', eyebrow: 'FAMILIAS Y ACCESIBILIDAD',
    intro: 'El mejor paseo es el que permite participar a quienes viajan. Elegí experiencias por la movilidad, los intereses y la energía de tu grupo, y pedí información concreta sobre cada espacio antes de reservar.',
    duration: 'Al ritmo de tu grupo', location: 'Cada acceso se consulta por separado', highlights: ['Pausas y recorridos cortos', 'Accesos comprobados', 'Actividades adecuadas'],
    sections: [
      { title: 'Con niñas y niños', body: 'Alterná una actividad con descanso, comida y tiempo libre. Evitá que la primera caminata sea también la más larga. En cascadas, cursos de agua y bordes de miradores, mantené supervisión directa y seguí las indicaciones del lugar. Para cabalgatas o actividades de aventura, preguntá edad mínima, equipo, acompañamiento y condiciones de participación; la presencia de una actividad en una guía no significa que sea apta para cualquier edad.' },
      { title: 'Preguntá por barreras concretas', body: 'No tomes la palabra «accesible» como una descripción suficiente. Consultá superficie y pendiente del recorrido, escalones, ancho de puertas, baño adaptado, estacionamiento cercano y posibilidad de descanso. Preguntá también por apoyos para personas con discapacidad visual o auditiva y por la información disponible antes de la visita. Si hace falta, pedí fotos actuales o una descripción del trayecto desde el vehículo hasta la actividad.' },
      { title: 'Un plan compartido', body: 'Acordá con el grupo una opción principal y otra más breve. Una vista desde un espacio habilitado, una visita cultural o una merienda pueden aportar tanto al viaje como una subida. Confirmá los servicios abiertos el día elegido y las necesidades alimentarias. Esta guía no certifica accesibilidad universal de los destinos: esa verificación corresponde al espacio y al recorrido concreto.' },
    ],
    tip: { title: 'Reservar con información', body: 'Describí qué apoyo necesitás para participar y pedí una respuesta concreta del prestador antes de confirmar.' },
    sources: [tourismSource, { label: 'Ministerio de Turismo · Trabajo en accesibilidad turística', url: 'https://medios.presidencia.gub.uy/legal/2025/proyectos/02/presidencia_1399_tomo2.pdf' }],
  },
  {
    id: 'turismo-responsable', title: 'Cuidar el paisaje que venís a buscar', category: 'Planificá', eyebrow: 'BUENAS PRÁCTICAS EN EL TERRITORIO',
    intro: 'Una visita responsable empieza por reconocer que el paisaje también es hogar, trabajo y patrimonio. Recorré los espacios habilitados y dejá el lugar preparado para quien venga después.',
    duration: 'En cada salida', location: 'Senderos, campos y áreas naturales', highlights: ['Respetar los accesos', 'Volver con los residuos', 'Consultar riesgo de incendio'],
    sections: [
      { title: 'Caminar con permiso', body: 'No cruces alambrados ni ingreses a campos porque una aplicación muestre una huella. Consultá qué caminos son públicos, qué visitas requieren autorización y cuándo se necesita guía. Seguí las indicaciones de las áreas protegidas y de cada operador. No retires piedras, plantas ni objetos y observá animales a distancia; una buena foto no justifica alterar un refugio o acercarse a un borde inestable.' },
      { title: 'Lo que llevás, vuelve', body: 'Prepará una bolsa para todos tus residuos, incluso los restos de comida, y usá los servicios sanitarios disponibles. No alimentes fauna ni dejes envases junto a un contenedor lleno. Si viajás con mascotas, verificá su admisión y las reglas del lugar. Reducí el ruido y respetá el descanso de residentes, campistas y visitantes.' },
      { title: 'Fuego, agua y decisiones', body: 'Consultá las disposiciones vigentes del Sinae y el riesgo de incendio antes de cocinar al aire libre; usá únicamente instalaciones y situaciones permitidas por las autoridades y el predio. No estaciones sobre vegetación seca. Con tormenta, crecidas o accesos comprometidos, suspendé la salida y buscá indicaciones locales. Un arroyo de aspecto tranquilo no garantiza condiciones para bañarse o cruzarlo.' },
    ],
    tip: { title: 'Antes de la caminata', body: 'Avisá tu recorrido y hora prevista de regreso a alguien, llevá agua y batería, y elegí una dificultad acorde a tu grupo.' },
    sources: [{ label: 'Sinae · Incendios forestales o de campo', url: 'https://www.gub.uy/sistema-nacional-emergencias/politicas-y-gestion/incendios-forestales-campo' }, { label: 'Sinae · Disposiciones y riesgo de incendios', url: 'https://www.gub.uy/sistema-nacional-emergencias/incendios' }],
  },
  {
    id: 'preparar', title: 'A mano antes de salir', category: 'Planificá', eyebrow: 'CONTACTOS Y ÚLTIMAS COMPROBACIONES',
    intro: 'Guardá los contactos y las confirmaciones mientras tenés conexión. La información de esta guía orienta el viaje; los horarios, precios, condiciones de acceso y servicios disponibles se confirman con cada responsable.',
    duration: 'Tu lista de salida', location: 'Lavalleja · Uruguay', highlights: ['Turismo departamental', 'Tiempo y advertencias', 'Emergencias: 911'],
    sections: [
      { title: 'Información turística y agenda', body: 'El Observatorio Ambiental Nacional publica como contacto del Centro de Información Turística de Minas el +598 4442 9796 y turismo@lavalleja.gub.uy, con sede en Domingo Pérez 475, junto a plaza Libertad. Confirmá atención antes de acercarte. Usá también la página de Turismo de la Intendencia para información institucional. Para fiestas y ferias, comprobá la fecha de la edición vigente: una noticia de otro año no equivale a una programación confirmada.' },
      { title: 'Tiempo y confirmaciones', body: 'Revisá el pronóstico y las advertencias oficiales de INUMET el día previo y la mañana de cada salida. Guardá comprobantes del alojamiento, reservas, pasajes y traslados; sumá el contacto de tu cobertura de salud y los datos necesarios para usarla. Tené la dirección del alojamiento escrita y un mapa descargado. Acordá un punto de encuentro si el grupo se separa.' },
      { title: 'Si ocurre una emergencia', body: 'El 911 es la línea de emergencia policial: la llamada es gratuita y está disponible las 24 horas, según el Ministerio del Interior. Informá qué sucede, la ubicación o referencia más precisa y si hay personas en riesgo; seguí las instrucciones del servicio. Para necesidades de atención médica, guardá también el contacto de tu prestador de salud. No dependas de esta guía como canal de asistencia en tiempo real.' },
    ],
    tip: { title: 'La última revisión', body: 'Documentación, medicación, agua, batería, reservas y regreso. Repartí las tareas del viaje para que la organización también sea compartida.' },
    sources: [tourismSource, { label: 'Ministerio de Ambiente · Contactos de información turística', url: 'https://www.ambiente.gub.uy/oan/snap/parque-nacional-arequita/' }, forecastSource, { label: 'Ministerio del Interior · Denuncias de emergencia y 911', url: 'https://www.gub.uy/ministerio-interior/comunicacion/campanas/denunciar-0' }],
  },
];
