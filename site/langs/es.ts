// DotDuel website text — Spanish.
// Same shape in every language (site/langs/types.ts); diagrams from site/diagrams.ts.
import { diagrams } from '../diagrams';
import type { SiteText } from './types';

export const es: SiteText = {
  paths: { howToPlay: '/es/como-jugar/', strategy: '/es/estrategia/', faq: '/es/preguntas-frecuentes/', about: '/es/acerca-de/', changelog: '/es/novedades/' },
  nav: { howToPlay: 'Guía', strategy: 'Estrategia', faq: 'Preguntas frecuentes', about: 'Acerca de', changelog: 'Novedades', play: 'Jugar ahora', privacy: 'Privacidad' },
  howToPlay: {
    title: 'Cómo jugar a DotDuel — reglas, puntuación y tableros del juego de puntos',
    description:
      'Aprende DotDuel en dos minutos: coloca puntos, completa líneas, puntúa la más larga y reclama líneas sin reclamar. Reglas, ejemplos de puntuación y tableros.',
    h1: 'Guía de DotDuel: cómo jugar',
    lead: 'Dos jugadores colorean puntos por turnos. Completa una línea y sumas tantos puntos como su longitud. Las reglas se aprenden en dos minutos; la táctica lleva bastante más.',
    body: `
    <h2>El objetivo</h2>
    <p>Conseguir más puntos que tu rival. Los puntos salen de las <strong>líneas</strong>: filas y diagonales de puntos del tablero. Cuando todos los puntos de una línea están coloreados, la línea está completa y vale un punto por cada uno de sus puntos.</p>

    <h2>Tu turno</h2>
    <p>En cada turno haces exactamente una cosa:</p>
    <ul>
      <li><strong>Colocar un punto</strong> en cualquier casilla vacía, o</li>
      <li><strong>Reclamar una línea sin reclamar</strong> (más detalles abajo).</li>
    </ul>
    <p>Después le toca a tu rival. Los turnos siempre se alternan, incluso después de puntuar.</p>

    <h2>Completar una línea</h2>
    <p>No importa quién coloreó los demás puntos de una línea. Quien coloca el <em>último</em> punto la completa y se lleva su longitud entera. Una línea de 3 puntos vale 3, una de 8 puntos vale 8.</p>
    <p>Los puntos de las esquinas forman por sí solos una línea de un único punto, así que el primero en colorear una esquina suma 1 punto en el acto.</p>
    <div class="diagrams">
      ${diagrams.lineComplete('Verde coloca el último punto de una fila de 3: +3, aunque Crema coloreó uno de sus puntos.')}
      ${diagrams.corner('La esquina inferior es una línea de 1 punto: colorearla suma +1 en el acto.')}
    </div>

    <h2>El giro: solo puntúa la línea más larga</h2>
    <p>Un mismo punto puede terminar dos o tres líneas a la vez. Cuando pasa, solo puntúas <strong>la más larga</strong>. Las demás no desaparecen: se convierten en <strong>líneas sin reclamar</strong>.</p>
    <p>Las líneas sin reclamar todavía no son de nadie. En cualquier turno posterior, <strong>cualquiera de los dos jugadores</strong> puede gastar su turno en reclamar una y llevarse su longitud entera. Para reclamar una línea, toca cualquier punto coloreado de ella. Si un punto pertenece a más de una línea sin reclamar, se reclama la más larga.</p>
    <div class="diagrams">
      ${diagrams.twoAtOnce('Verde termina con un solo punto una fila de 3 y una diagonal de 2. La fila suma +3; la diagonal (discontinua) queda sin reclamar.')}
      ${diagrams.claim('En el turno siguiente, Crema toca un punto de la diagonal sin reclamar y la reclama: +2 para Crema.')}
    </div>
    <p class="note">Esta regla es lo que convierte DotDuel en algo más que una carrera. Una jugada que completa dos líneas también le da a tu rival la oportunidad de quedarse con la segunda, así que a veces la jugada más fuerte es la más discreta.</p>

    <h2>El final de la partida</h2>
    <p>La partida termina cuando <strong>todos los puntos están coloreados y todas las líneas han sido reclamadas</strong>. Si se acaban los puntos y aún quedan líneas sin reclamar, los turnos restantes son solo para reclamar: los jugadores se turnan reclamando líneas hasta que no quede ninguna. Gana quien tenga más puntos; con los mismos puntos, es empate.</p>

    <h2>Formas del tablero</h2>
    <div class="table-wrap"><table>
      <tr><th>Forma</th><th>Puntos</th><th>Direcciones de las líneas</th><th>Puntos totales</th></tr>
      <tr><td>Triángulo</td><td>36 (filas de 8 a 1)</td><td>Filas y dos diagonales</td><td>108</td></tr>
      <tr><td>Cuadrado</td><td>49 (7 × 7)</td><td>Filas, columnas y ambas diagonales</td><td>196</td></tr>
      <tr><td>Rectángulo</td><td>63 (7 × 9)</td><td>Filas, columnas y ambas diagonales</td><td>252</td></tr>
    </table></div>
    <p>El Cuadrado y el Rectángulo tienen cuatro direcciones de línea en lugar de tres, así que una sola jugada completa varias líneas mucho más a menudo y la reserva de líneas sin reclamar crece mucho más.</p>

    <h2>Modos de juego</h2>
    <ul>
      <li><strong>Contra bots</strong>: cinco niveles, de Principiante a Imposible. Gana a un nivel para desbloquear el siguiente; gana en Fácil o superior con una forma para desbloquear la siguiente forma (Triángulo, luego Cuadrado, luego Rectángulo).</li>
      <li><strong>Partida local</strong>: dos jugadores en un mismo teléfono o computadora, con todas las formas disponibles desde el principio.</li>
      <li><strong>Clasificatoria en línea</strong>: inicia sesión con Google, te emparejamos con un jugador de nivel parecido y juegas con reloj de ajedrez (Bala 1 minuto, Relámpago 3 minutos o Rápida 5 minutos por jugador). Las victorias y derrotas mueven tu puntuación Elo en la clasificación mundial. Añade amigos y desafíalos directamente.</li>
      <li><strong>Puzle diario</strong>: cada día, un mismo tablero para todos, ya empezado. Tienes un reloj de 3 minutos y hasta tres intentos, y tu mejor puntuación entra en la clasificación diaria.</li>
    </ul>
    <p>¿Listo para el siguiente paso? Lee la <a href="/es/estrategia/">guía de estrategia</a>.</p>
`,
  },
  strategy: {
    title: 'Estrategia de DotDuel — consejos para ganar, de principiante a avanzado',
    description:
      'Gana más partidas de DotDuel: no regales líneas, usa las líneas sin reclamar como jugadas de espera, elige cuándo reclamar y planifica el final en cada tablero.',
    h1: 'Guía de estrategia de DotDuel',
    lead: 'En DotDuel no hay suerte: los dos jugadores ven todo el tablero, así que cada punto se gana o se regala con una decisión. Estas son las ideas que separan a un bot Principiante de uno Imposible.',
    body: `
    <h2>1. Nunca dejes una línea a un punto de completarse</h2>
    <p>El error de principiante más común es colocar un punto que deja una línea con una sola casilla vacía. Tu rival solo tiene que llenarla y se lleva la línea entera. Antes de cada jugada, mira <strong>todas</strong> las líneas que pasan por la casilla que vas a ocupar, no solo la que tienes en mente. En el Triángulo son tres líneas por punto; en el Cuadrado y el Rectángulo, cuatro.</p>

    <h2>2. Cuenta lo que regala tu jugada</h2>
    <p>Un buen hábito: para cada jugada posible, hazte dos preguntas. <em>¿Cuánto sumo ahora?</em> y <em>¿Qué es lo máximo que puede sumar mi rival en respuesta?</em> Una jugada que vale 3 pero le prepara un 7 a tu rival te hace perder 4 puntos. El bot Difícil juega exactamente así, y por eso se nota mucho más duro que el Medio.</p>

    <h2>3. Una doble finalización puede ser un regalo</h2>
    <p>Cuando un punto termina dos líneas, solo puntúas la más larga y la más corta va a la reserva común de líneas sin reclamar, donde tu rival puede llevársela en su siguiente turno. Terminar una de 6 y una de 4 a la vez te da 6, pero probablemente le da 4 a tu rival. Si puedes terminarlas en turnos distintos, quizá te lleves las dos.</p>

    <h2>4. Las líneas sin reclamar son jugadas de reserva</h2>
    <p>Llevarte una línea sin reclamar gasta tu turno <strong>sin colocar ningún punto</strong>. Eso la convierte en la jugada de espera perfecta. En el medio juego llegarás a menudo a posiciones en las que cualquier casilla vacía le prepararía una línea a tu rival. Si hay una línea sin reclamar en el tablero, reclámala: sumas puntos, el tablero no cambia y ahora es tu rival quien tiene que hacer la jugada arriesgada.</p>
    <p>Por eso tampoco conviene siempre reclamar cada línea en cuanto aparece. Una línea pequeña que se queda en la reserva puede valer más después, como la jugada que te evita abrir una grande.</p>

    <h2>5. Vigila las líneas largas</h2>
    <p>Las líneas valen lo que miden, así que las largas deciden las partidas. En el Triángulo la fila superior vale 8 y las diagonales largas 7 u 8, mientras que las esquinas valen 1. Lleva la cuenta de cuántas casillas vacías quedan en las líneas más largas e intenta ser quien ocupa la última, no la penúltima.</p>

    <h2>6. Planifica el final</h2>
    <p>Cuando todos los puntos están coloreados, la partida pasa a ser solo de reclamar: los jugadores se turnan reclamando líneas sin reclamar hasta que no quede ninguna, y cada uno tomará, lógicamente, la más larga disponible. Antes de colocar los últimos puntos, cuenta las líneas sin reclamar y sus longitudes. Que la reserva tenga un número par o impar de líneas decide quién se lleva las grandes, y una sola jugada de espera antes puede darle la vuelta.</p>

    <h2>7. Cada forma se juega distinto</h2>
    <ul>
      <li><strong>Triángulo</strong>: tres direcciones de línea y líneas cortas cerca de la base. Las posiciones se leen con facilidad, así que es la mejor forma para aprender a contar. Mover primero o segundo no supone una diferencia real al máximo nivel: en 1000 partidas entre dos bots Imposible, cada lado ganó alrededor del 45 % y el resto fueron empates.</li>
      <li><strong>Cuadrado</strong>: cuatro direcciones, incluidas las dos diagonales. Una sola jugada completa varias líneas mucho más a menudo, así que la reserva de líneas sin reclamar crece deprisa y el consejo 4 se convierte en tu arma principal.</li>
      <li><strong>Rectángulo</strong>: el tablero más grande, con las partidas más largas y más líneas sin reclamar en el final. Aquí es donde más rinden la paciencia y el cálculo.</li>
    </ul>

    <h2>8. Practica contra los bots</h2>
    <div class="table-wrap"><table>
      <tr><th>Bot</th><th>Cómo juega</th><th>Qué te enseña</th></tr>
      <tr><td>Principiante</td><td>Jugadas al azar</td><td>Las reglas y cómo se completan las líneas</td></tr>
      <tr><td>Fácil</td><td>Toma esquinas y líneas grandes evidentes</td><td>Detectar puntos gratis</td></tr>
      <tr><td>Medio</td><td>Siempre toma lo que más puntos da en ese momento</td><td>No dejar líneas a un punto de completarse (consejo 1)</td></tr>
      <tr><td>Difícil</td><td>Compara lo que gana con tu mejor respuesta</td><td>Contar lo que regala una jugada (consejo 2)</td></tr>
      <tr><td>Imposible</td><td>Calcula tres jugadas por delante y valora las líneas sin reclamar</td><td>Jugadas de espera, líneas sin reclamar y paridad del final (consejos 4–6)</td></tr>
    </table></div>
    <p>¿Dudas con alguna regla? Vuelve a la <a href="/es/como-jugar/">guía</a>.</p>
`,
  },
  faq: {
    title: 'Preguntas frecuentes de DotDuel — juego de puntos gratis para dos: reglas, modos y online',
    description:
      'DotDuel: si es gratis, si necesitas cuenta, en qué se diferencia del Timbiriche, jugar con un amigo o solo, la clasificación online, el puzle diario y más.',
    h1: 'DotDuel: preguntas frecuentes',
    lead: 'Respuestas rápidas sobre el juego, sus modos y el juego en línea. ¿Nuevo en DotDuel? La <a href="/es/como-jugar/">guía</a> explica las reglas en dos minutos.',
    body: `
    <h2>¿Qué es DotDuel?</h2>
    <p>Un juego de estrategia gratis para dos jugadores. Por turnos, cada jugador colorea puntos de un tablero; si completas una línea, sumas tantos puntos como su longitud. Una jugada puede terminar varias líneas, pero solo puntúa la más larga, y las demás pasan a ser líneas sin reclamar que cualquiera de los dos puede llevarse.</p>

    <h2>¿DotDuel es gratis?</h2>
    <p>Sí. Se juega en cualquier navegador en <a href="/">www.dotduel.com</a> y en Android a través de Google Play. No hay que comprar nada para jugar al juego completo.</p>

    <h2>¿Tengo que instalar algo o crear una cuenta?</h2>
    <p>No. Juega contra bots o contra un amigo en el mismo dispositivo desde el primer momento. Solo necesitas iniciar sesión con Google para las partidas clasificatorias en línea, los amigos y la clasificación diaria.</p>

    <h2>¿DotDuel se parece al Timbiriche (puntos y cajas)?</h2>
    <p>Los dos usan puntos, pero se juegan de forma diferente. En DotDuel coloreas los propios puntos, las líneas van por filas y diagonales, y solo puntúa la línea completada más larga, así que la táctica gira en torno al momento justo, no a cadenas de cajas.</p>

    <h2>¿Se parece al ajedrez?</h2>
    <p>Toma ideas del ajedrez: los dos jugadores lo ven todo, no hay suerte y las partidas clasificatorias usan reloj de ajedrez y puntuación Elo. Pero las reglas se aprenden en dos minutos y una partida dura menos de diez.</p>

    <h2>¿Puedo jugar con un amigo?</h2>
    <p>Sí: en un mismo teléfono o computadora (partida local) o en línea. Añádelo como amigo y desafíalo directamente.</p>

    <h2>¿Puedo jugar solo?</h2>
    <p>Sí. Hay cinco niveles de bot, de Principiante a Imposible. Al ganar a un nivel se desbloquea el siguiente, y vas desbloqueando nuevas formas de tablero sobre la marcha.</p>

    <h2>¿Tiene ventaja el primer jugador?</h2>
    <p>No. En 1000 partidas entre nuestros dos bots más fuertes, cada lado ganó alrededor del 45 % de las veces y el resto fueron empates.</p>

    <h2>¿Cuánto dura una partida?</h2>
    <p>Una partida en el Triángulo dura unos minutos. Las partidas clasificatorias en línea usan reloj de ajedrez: 1, 3 o 5 minutos por jugador.</p>

    <h2>¿Cómo funciona la clasificación en línea?</h2>
    <p>Te emparejamos con un jugador de nivel parecido. Las victorias y derrotas cambian tu puntuación Elo en la clasificación mundial.</p>

    <h2>¿Qué es el puzle diario?</h2>
    <p>Cada día, un mismo tablero a medio jugar para todos. Tienes un reloj de 3 minutos y tres intentos; tu mejor puntuación entra en la clasificación diaria.</p>

    <h2>¿Qué son las líneas sin reclamar?</h2>
    <p>Cuando un punto completa varias líneas, solo puntúa la más larga. Las demás quedan como líneas sin reclamar, y cualquiera de los dos jugadores puede gastar un turno en reclamar una y llevarse su longitud entera. La <a href="/es/como-jugar/">guía</a> lo explica con imágenes.</p>

    <h2>¿Cómo termina una partida?</h2>
    <p>Cuando todos los puntos están coloreados y todas las líneas han sido reclamadas. Gana quien tenga más puntos; con los mismos puntos, es empate.</p>

    <h2>¿En qué idiomas está DotDuel?</h2>
    <p>Inglés, lituano, español, portugués, polaco y checo.</p>

    <h2>¿Se guarda mi progreso?</h2>
    <p>El progreso contra los bots se guarda en tu dispositivo. Tu puntuación en línea, tus amigos y tus estadísticas se guardan con tu inicio de sesión de Google.</p>

    <h2>¿Qué pasa con mis datos?</h2>
    <p>Solo se usa lo que el juego necesita, y la analítica o los anuncios personalizados solo con tu consentimiento. Todos los detalles están en la <a href="/privacy.html">política de privacidad</a>, incluido cómo descargar o eliminar tu cuenta.</p>

    <h2>He encontrado un error o tengo una idea.</h2>
    <p>Escribe a <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>. Los cambios recientes están en <a href="/es/novedades/">Novedades</a>.</p>

    <p>¿Quieres ganar más? Lee la <a href="/es/estrategia/">guía de estrategia</a>.</p>
`,
  },
  about: {
    title: 'Acerca de DotDuel — juego de estrategia gratis para dos jugadores',
    description:
      'DotDuel es un juego de estrategia gratis para dos jugadores, en navegador y Android: contra bots, con un amigo en un mismo dispositivo o clasificatorias online.',
    h1: 'Acerca de DotDuel',
    lead: 'DotDuel es un juego de estrategia gratis y rápido para dos jugadores, en el que se colorean puntos y se completan líneas, creado por un desarrollador independiente.',
    body: `
    <h2>Qué es</h2>
    <p>DotDuel recoge el espíritu de lápiz y papel de juegos como el Timbiriche o el tres en raya y le añade una regla que lo cambia todo: cuando una jugada completa varias líneas a la vez, solo puntúa la más larga, y las demás pasan a ser líneas sin reclamar que cualquiera de los dos jugadores puede reclamar en un turno posterior. Las partidas duran unos minutos, la suerte no interviene y las reglas caben en una pantalla.</p>
    <p>Puedes jugar en cualquier navegador moderno en <a href="/">www.dotduel.com</a>, sin descargar nada. También está en Google Play como app para Android.</p>

    <h2>Qué puedes hacer</h2>
    <ul>
      <li>Aprender contra cinco bots, desde un Principiante que juega al azar hasta un bot Imposible que calcula tres jugadas por delante.</li>
      <li>Jugar contra un amigo en el mismo teléfono o computadora (partida local).</li>
      <li>Iniciar sesión con Google para jugar partidas clasificatorias en línea con reloj de ajedrez, entrar en la clasificación Elo mundial, añadir amigos y lanzar desafíos.</li>
      <li>Probar el puzle diario: el mismo tablero ya empezado para todos, con su clasificación diaria.</li>
      <li>Elegir tu idioma: inglés, lituano, español, portugués, polaco o checo.</li>
    </ul>

    <p>¿Tienes preguntas? Consulta las <a href="/es/preguntas-frecuentes/">preguntas frecuentes</a>.</p>

`,
  },
  changelog: {
    title: 'Novedades de DotDuel — historial de cambios',
    description: 'Todas las actualizaciones de DotDuel: nuevas funciones, cambios y correcciones, de la más reciente a la más antigua.',
    h1: 'Novedades de DotDuel',
    lead: 'Todas las actualizaciones, de la más reciente a la más antigua. La misma lista está en el juego: toca el número de versión en la parte inferior de la pantalla.',
  },
};
