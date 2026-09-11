/**
 * Spanish (Español). Must satisfy `Messages` (the shape derived from en.ts).
 *
 * Neutral/international Spanish, using the terms Spanish-language games
 * conventionally use: Multijugador, Logros, Clasificatoria, Rendirse, Bots,
 * Ajustes, Tablero, Puntos. DRAFT pending multi-pass review.
 */
import type { Messages } from './en';

const pts = (n: number) => `${n} ${n === 1 ? 'punto' : 'puntos'}`;

export const es: Messages = {
  common: {
    back: 'Atrás',
    cancel: 'Cancelar',
    close: 'Cerrar',
    locked: 'Bloqueado',
    signInToView: 'Inicia sesión para ver.',
    signInToPlay: 'Inicia sesión para jugar.',
    w: 'V',
    d: 'E',
    l: 'D',
    you: 'Tú',
  },

  lang: {
    label: 'Idioma',
    english: 'English',
    lithuanian: 'Lietuvių',
  },

  shapes: {
    triangle: 'Triángulo',
    square: 'Cuadrado',
    rectangle: 'Rectángulo',
    rhombus: 'Rombo',
  },

  difficulty: {
    1: 'Principiante',
    2: 'Fácil',
    3: 'Medio',
    4: 'Difícil',
    5: 'Imposible',
  },

  menu: {
    tagline:
      'Por turnos, coloca puntos; al completar una línea ganas puntos según su longitud. Colorea todo el tablero y gana quien tenga más puntos.',
    welcomeLead: 'Te damos la bienvenida,',

    changeTheme: 'Cambiar el tema de color',

    profile: 'Perfil',
    signOut: 'Cerrar sesión',
    signIn: 'Iniciar sesión',
    shareDotDuel: 'Compartir DotDuel',

    singlePlayer: 'Un jugador',
    singlePlayerSub: 'Bots y puzle diario.',
    multiplayer: 'Multijugador',
    multiplayerSub: 'Local y clasificatoria en línea.',
    rankings: 'Clasificaciones',
    rankingsSub: 'Puzle, locales y clasificatorias.',

    bots: 'Bots',
    botsSub: 'Cinco niveles, de suave a despiadado.',

    hotseat: 'Partida local',
    hotseatSub: '1 dispositivo · 2 jugadores.',

    puzzleRankings: 'Clasificación de puzles',
    puzzleRankingsSub: 'Mejores puntuaciones del puzle de hoy.',
    localRankings: 'Clasificaciones locales',
    localRankingsSub: 'Tus récords en este dispositivo.',
    ratedRankings: 'Tabla de clasificación',
    ratedRankingsSub: 'Clasificación Elo mundial en línea.',
    achievements: 'Logros',
    achievementsSub: 'Insignias que ganas al jugar.',

    dailyPuzzle: 'Puzle diario',
    dailyDoneSub: (best: number) => `✓ Hecho · mejor ${best} · se reinicia a medianoche (UTC)`,
    dailyDoneTitle: 'Has usado los 3 intentos. Vuelve mañana.',
    dailyAttemptSub: (attempt: number, max: number, best: number) =>
      `Intento ${attempt}/${max} · mejor ${best}`,
    dailyFreshSub: (max: number) => `${max} intentos · 3 min · gana la mejor puntuación.`,
    dailySignInTitle: 'Inicia sesión para jugar el puzle de hoy',

    onlineRanked: 'Clasificatoria en línea',
    onlineFindMatch: 'Buscar una partida clasificatoria.',
    onlineSignInTitle: 'Inicia sesión para jugar en línea',
    onlineUnreachable: 'Servidor inaccesible: puede que tu red lo esté bloqueando.',
    onlineUnreachableTitle:
      'Tu red está bloqueando el servidor del juego (probablemente un bloqueador de anuncios/rastreadores o un filtro DNS)',
    onlineLocked: 'Activo en otra pestaña/dispositivo: termínalo o ciérralo allí.',
    onlineLockedTitle: 'Tienes una sesión multijugador abierta en otra pestaña o dispositivo',

    chooseShape: 'Elige una forma',
    chooseDifficulty: 'Elige la dificultad',
    dots: (n: number) => pts(n),
    level: (d: number) => `Nivel ${d}`,
    shapeLockedTitle: 'Gana la forma anterior en Difícil para desbloquearla',

    whosPlaying: '¿Quién juega?',
    vsBot: (shape: string, difficulty: string) => `${shape} · contra Bot · ${difficulty}`,
    hotseatHint: (shape: string) => `${shape} · confirma o cambia los nombres antes de empezar`,
    yourNameFirst: 'Tu nombre — juega primero',
    player1First: 'Jugador 1 — juega primero',
    player2: 'Jugador 2',
    signedInAs: (name: string) => `Sesión iniciada como ${name}. Cámbialo en Perfil.`,
    swapColours: 'Intercambiar colores (Jugador 1 ↔ Jugador 2)',
    startGame: 'Empezar partida',
    player1Placeholder: 'Jugador 1',
    player2Placeholder: 'Jugador 2',
  },

  footer: {
    howToPlay: 'Cómo jugar',
    rules: 'Reglas',
    settings: 'Ajustes',
    privacy: 'Privacidad',
    theme: 'Tema',
    brand: 'DotDuel © 2026',
    brandTitle:
      '© 2026 DotDuel. Todos los derechos reservados. DotDuel y el logotipo de DotDuel son marcas reclamadas por su autor.',
    versionTitle: 'Novedades',
  },

  game: {
    ptsLeft: 'RESTANTES',
    boardAriaLabel: (shape: string) => `Tablero de ${shape}`,
    liveDraw: (s1: number, s2: number) => `Partida terminada. Es un empate, ${s1} a ${s2}.`,
    liveWin: (winner: number, s1: number, s2: number) =>
      `Partida terminada. Gana el Jugador ${winner}, ${s1} a ${s2}.`,
    liveTurn: (current: number, s1: number, s2: number) =>
      `Turno del Jugador ${current}. Puntuación: Jugador 1, ${s1}; Jugador 2, ${s2}.`,
    linesToClaim: (n: number) => (n === 1 ? 'línea por reclamar' : 'líneas por reclamar'),
    pendingTitle:
      'Líneas esperando a ser reclamadas: toca un punto de color en una de ellas para reclamarla.',
    leaveMatch: 'Salir de la partida',
    backToMenu: 'Volver al menú',
    dailyTime: 'Tu tiempo para este intento',
    seeUnclaimed: 'Ver líneas sin reclamar',
    seeUnclaimedTitle: (on: boolean) => `Ver líneas sin reclamar: ${on ? 'activado' : 'desactivado'}`,
    rules: 'Cómo jugar',
    showRules: 'Mostrar reglas',
    resign: 'Rendirse',
    resignTitle: 'Rendirse y terminar la partida',
    resignConfirmTitle: '¿Rendirse?',
    resignConfirmBody: 'Perderás esta partida.',
    resignRankedTitle: '¿Rendirse en esta partida clasificatoria?',
    resignRankedBody: 'Contará como una derrota en tu historial clasificatorio.',
    dailyForfeitTitle: '¿Abandonar este intento?',
    dailyForfeitBody: (remaining: number, max: number) =>
      `Esto usará 1 de tus ${max} intentos diarios — quedarán ${remaining} después de esto.`,
    dailyForfeitConfirm: 'Abandonar',
    thinking: 'Pensando',
    bot: 'BOT',
    aiOpponent: 'Oponente IA',
    moveFailed: 'La jugada no se envió — inténtalo de nuevo',
  },

  rules: {
    aria: 'Cómo jugar a DotDuel',
    close: 'Cerrar reglas',
    title: 'Cómo jugar a DotDuel',
    tagline: 'Juega por turnos. Completa líneas. Consigue más puntos.',
    goalH: 'Objetivo',
    goalP: 'Consigue más puntos que tu oponente.',
    turnH: 'En cada turno',
    turnP: 'Haz una de estas acciones y el turno pasa al rival:',
    turnTapEmpty: 'Toca un punto vacío para colorearlo.',
    turnTapClaim:
      'Toca un punto de una línea terminada y sin reclamar para llevarte sus puntos (no se coloca ningún punto nuevo).',
    scoringH: 'Puntuación',
    scoringP:
      'Una línea es cualquier hilera recta de puntos: horizontal, vertical o diagonal. Cuando todos sus puntos están coloreados, da tantos puntos como su longitud.',
    score3: 'Línea de 3 puntos → 3 pts',
    score5: 'Línea de 5 puntos → 5 pts',
    score8: 'Línea de 8 puntos → 8 pts',
    scoreCorner: 'Un punto de esquina cuenta como una «línea» de 1 pt',
    catchH: 'El truco: un movimiento, una puntuación',
    catchP:
      'Si tu punto completa varias líneas a la vez, solo puntúas la más larga. Las demás líneas terminadas quedan sin reclamar: cualquiera puede llevárselas en un turno posterior.',
    watchH: 'Observa el tablero',
    watchP:
      'El juego no marca las líneas sin reclamar. Detecta una línea totalmente coloreada que no esté tachada y toca cualquiera de sus puntos para reclamarla. Puntos gratis por estar atento.',
    endH: 'Fin de la partida',
    endP:
      'Cuando todos los puntos están coloreados y todas las líneas terminadas han sido reclamadas. Gana quien tenga más puntos; si hay igualdad, es empate.',
    tipsH: 'Consejos',
    tip1: 'Evita jugadas que completen dos líneas: regalas el resto.',
    tip2: 'Llévate siempre una esquina gratis o una línea larga.',
    tip3: 'A veces bloquear (0 puntos) es más listo que puntuar poco.',
    tip4: 'Al final de la partida, busca líneas sin reclamar antes de colocar.',
    modesH: 'Modos',
    modeBotsLead: 'Contra Bots',
    modeBots: '— cinco niveles de dificultad. Gana en Fácil con una forma para desbloquear la siguiente.',
    modeHotseatLead: 'Partida local',
    modeHotseat: '— dos jugadores, un dispositivo.',
    modeMpLead: 'Multijugador',
    modeMp: '— en directo, con clasificación Elo mundial, controles de tiempo tipo ajedrez y revanchas.',
    gotIt: 'Entendido',
  },

  settings: {
    aria: 'Ajustes',
    close: 'Cerrar ajustes',
    title: 'Ajustes',
    tagline: 'Se guarda localmente en este dispositivo.',
    yourName: 'Tu nombre',
    yourNameHintSignedIn: (name: string) => `Sesión iniciada como ${name}. Cambia tu nombre en Perfil.`,
    yourNameHint: 'Se usa en el modo contra Bot Y como Jugador 1 en la partida local.',
    hotseatOpponent: 'Oponente de partida local',
    player2Name: 'Nombre del Jugador 2',
    swapColours: 'Intercambiar colores (Jugador 1 ↔ Jugador 2)',
    privacyH: 'Privacidad',
    whoCanChallenge: '¿Quién puede retarme a una partida?',
    everyone: 'Todos',
    friendsOnly: 'Solo amigos',
    nobody: 'Nadie',
    showStatus: 'Mostrar mi estado a los amigos',
    showStatusHint:
      'Si está desactivado, tus amigos te verán como desconectado. Las solicitudes de amistad siguen funcionando; solo se oculta el indicador de estado en directo.',
    resetProgress: 'Restablecer progreso',
    resetProgressConfirm: '¿Restablecer el progreso? Se perderán las formas y niveles desbloqueados.',
    resetStats: 'Restablecer estadísticas',
    resetStatsConfirm:
      '¿Restablecer estadísticas? Se borrará el historial de victorias/empates/derrotas de todos los jugadores en este dispositivo.',
    renameNote:
      'Nota: cambiarte el nombre inicia una nueva fila de estadísticas. El historial del nombre antiguo se conserva con ese nombre.',
    appearanceH: 'Apariencia',
    colourTheme: 'Tema de color',
    changeTheme: 'Cambiar',
    soundH: 'Sonido',
    soundEffects: 'Efectos de sonido',
    backgroundMusic: 'Música de fondo',
    done: 'Hecho',
  },

  theme: {
    aria: 'Elige un tema',
    close: 'Cerrar temas',
    title: 'Tema',
    tagline: 'Elige una paleta. Se guarda en este dispositivo.',
    sunFriendly: 'Apto para el sol',
    done: 'Hecho',
    taglines: {
      'forest-pearl': 'El original. Esmeralda sobre viñeta jade.',
      'royal-court': 'Terciopelo violeta contra oro antiguo.',
      'tempo-rivals': 'Rojo vino contra azul cielo. Clásico.',
      'sunset-catan': 'Desiertos de terracota, piezas de pergamino.',
      'coral-reef': 'Aguas verdeazuladas profundas, compañeras de coral.',
      'twilight-cosmos': 'Vacío índigo contra cian eléctrico.',
      'monochrome-pro': 'Piezas en blanco y negro sobre madera. Máximo contraste.',
      'vintage-press': 'Tinta burdeos y azul marino sobre pergamino. Apto para el sol.',
    },
  },

  changelog: {
    aria: 'Novedades',
    close: 'Cerrar',
    title: 'Novedades',
    tagline: 'Actualizaciones recientes de DotDuel, de la más nueva a la más antigua.',
    empty: 'Aún no hay notas de versión.',
    entryEmpty: 'Notas de versión próximamente.',
    added: 'Añadido',
    changed: 'Cambiado',
    fixed: 'Corregido',
    done: 'Hecho',
    months: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'],
    entries: {
      'Alpha 0.4.12.3': {
        highlight: 'Las tarjetas de jugador ahora sí coinciden',
        changes: [
          'En el móvil, las dos tarjetas de jugador a veces no se parecían en nada — el avatar y la puntuación de una quedaban en un lugar distinto al de la otra. Ahora el avatar, el nombre y la puntuación están siempre en el mismo lugar en ambas tarjetas.',
        ],
      },
      'Alpha 0.4.12.2': {
        highlight: 'La app ahora habla más tu idioma',
        changes: [
          'El nombre del rival IA, la imagen/texto de la tarjeta de victoria compartida y un par de pantallas de estado de conexión se quedaban en inglés sin importar tu idioma — ahora están traducidos.',
          'Todas las notas de versión anteriores de este historial (desde el principio) ya están disponibles en lituano, español, portugués, polaco y checo, no solo en inglés.',
        ],
      },
      'Alpha 0.4.12.1': {
        highlight: 'Corrección',
        changes: [
          'Se corrigió que el tablero saltara o se encogiera en los teléfonos cuando la puntuación pasaba de 2 a 3 dígitos.',
        ],
      },
      'Alpha 0.4.12.0': {
        highlight: 'Pase de pulido',
        changes: [
          'Se movió el selector de idioma a la esquina superior izquierda para que ya no se superponga con el logotipo (el botón de tema se queda a la derecha).',
          'Las dos tarjetas de jugador en los teléfonos ahora son reflejo una de la otra en vez de verse descuadradas.',
          'Las muestras de color del modo local y el ajuste "cambiar colores" ahora coinciden con tu tema elegido en lugar de mostrar siempre crema/verde.',
          'El botón o gesto de retroceso ahora retrocede paso a paso por los menús y pantallas en vez de salir de la app — las partidas clasificatorias y los intentos del puzle diario siguen pidiendo confirmación primero.',
        ],
      },
      'Alpha 0.4.11.0': {
        highlight: 'Cómo jugar',
        changes: [
          'Nueva guía "Cómo jugar" con pequeños ejemplos animados sobre un tablero real: mira una esquina anotar 1 punto, una línea completarse, varias líneas esperando a ser reclamadas, y cómo corren las líneas en cada dirección en el Triángulo (3 formas) y el Cuadrado (4 formas). Ábrela desde el pie de página, junto a Reglas; toca un tablero para pausar, desliza o usa las flechas para navegar.',
          'El tema de color ahora se elige desde Ajustes (se movió del pie de página para hacer sitio a "Cómo jugar").',
        ],
      },
      'Alpha 0.4.10.1': {
        highlight: 'Correcciones',
        changes: [
          'Los avisos de logro desbloqueado y el menú de idioma ahora son sólidos y fáciles de leer (antes eran transparentes, así que el texto de detrás se veía). El aviso de logro también es más grande.',
          'Iniciar sesión en un nuevo dispositivo ya no muestra de golpe todos los logros que ya habías conseguido.',
          'El logro "Acorralado" (anotar una línea de esquina de 1 punto) ahora se desbloquea correctamente — antes no se registraba.',
        ],
      },
      'Alpha 0.4.10.0': {
        highlight: 'Totalmente traducido',
        changes: [
          'Toda la app está ahora traducida, no solo los menús. Tu Perfil, Amigos e invitaciones, el vestíbulo y las pantallas de partida multijugador, la pantalla de Fin de partida, Clasificaciones y la tabla del puzle diario, para compartir, y los 97 Logros (nombres y descripciones) aparecen ahora en inglés, lituano, español, portugués, polaco y checo.',
        ],
      },
      'Alpha 0.4.9.0': {
        highlight: 'Idiomas',
        changes: [
          'DotDuel ahora habla seis idiomas: inglés, lituano, español, portugués, polaco y checo. Elige el tuyo desde el botón de idioma en la esquina superior derecha del menú.',
          'El juego ahora se inicia en tu idioma automáticamente: según los ajustes de tu navegador en la web, y según el idioma de tu dispositivo en la app.',
        ],
      },
      'Alpha 0.4.8.0': {
        highlight: 'Logros',
        changes: [
          '¡Logros! Consigue hasta 100 insignias por jugar — venciendo a los Bots en cada forma y nivel, rachas de victorias, partidas del puzle diario, rachas de días y grandes hitos. Encuéntralos en Clasificaciones → Logros; cada insignia se ilumina con los colores de tu tema al desbloquearse, y recibes un aviso "🏆 Logro desbloqueado" en el momento en que lo consigues.',
          'Fija una insignia favorita para mostrarla junto a tu nombre mientras juegas.',
        ],
      },
      'Alpha 0.4.7.0': {
        highlight: 'Nuevo menú + Bots',
        changes: [
          'El menú principal se reorganizó en tres secciones claras — Un jugador, Multijugador y Clasificaciones — cada una abre una lista ordenada con sus propios iconos.',
          'Los oponentes de la computadora ahora se llaman "Bots" en lugar de "IA" en toda la app.',
          'Elegir una forma de tablero o un nivel de bot ahora muestra un icono a juego: la forma del tablero, y la propia cara de cada bot según su dificultad.',
          'En Android la app ahora se mantiene en vertical al inclinar el teléfono.',
        ],
      },
      'Alpha 0.4.6.2': {
        changes: [
          'Se rediseñó la tarjeta de resultado compartida: un tablero más grande, el resultado mostrado simplemente como Victoria / Derrota / Empate, y el código QR ahora es un código con los colores del juego en el centro del tablero con la etiqueta "¡Escanea y juega ya!".',
        ],
      },
      'Alpha 0.4.6.0': {
        changes: [
          'Las tarjetas de resultado compartidas ahora incluyen un código QR escaneable: tus amigos pueden apuntar la cámara (o mantener pulsada la imagen) para entrar directamente al juego. Los enlaces de invitación usan un código de invitación privado en lugar de tu id de cuenta.',
        ],
      },
      'Alpha 0.4.5.3': {
        changes: [
          'Tarjeta de compartir rediseñada: el tablero ahora reposa sobre su mesa de fieltro 3D real como en el juego, el texto está centrado, y la dirección DotDuel.com es mucho más fácil de leer.',
        ],
      },
      'Alpha 0.4.5.2': {
        changes: [
          'La tarjeta de compartir ahora se renderiza al doble de resolución: ya no se ven píxeles al abrir la imagen a pantalla completa en Messenger o WhatsApp.',
        ],
      },
      'Alpha 0.4.5.1': {
        changes: [
          'Tarjeta de compartir: el tablero ahora se parece al juego real (grosor de línea ajustado; los puntos ya no quedan enterrados en tableros cargados) y la puntuación ya no se superpone con la etiqueta "pts".',
        ],
      },
      'Alpha 0.4.5.0': {
        highlight: 'Más rápido en teléfonos',
        changes: [
          'Efectos gráficos más ligeros durante la partida: el juego va notablemente más fluido en teléfonos de gama baja, sin cambios en el aspecto.',
          'La clasificación ahora muestra filas de marcador de posición mientras carga y un botón de reintentar si se corta tu conexión.',
          'Política de privacidad actualizada: se corrigió el proveedor de backend a Supabase, y se añadieron los avisos de la app de Android y AdMob.',
          'App de Android: el botón de retroceso ahora cierra las ventanas emergentes abiertas en lugar de salir del juego.',
        ],
      },
      'Alpha 0.4.4.0': {
        highlight: 'Comparte tu resultado',
        changes: [
          'Nuevo botón "Compartir resultado" en la pantalla de fin de partida: genera una imagen de tu tablero terminado con la puntuación y la comparte donde quieras, junto con un enlace que tus amigos pueden usar para jugar contra ti.',
        ],
      },
      'Alpha 0.4.3.0': {
        highlight: 'Tablero más limpio, texto más grande',
        changes: [
          'Se eliminaron las burbujas de consejo en partida que aparecían a mitad del juego: pasaban demasiado rápido para leerlas y estorbaban. La pantalla de Reglas y la vista "Ver líneas sin reclamar" siguen enseñando la puntuación.',
          'Se aumentó todo el texto pequeño a un tamaño mínimo legible en toda la app para mejor legibilidad y accesibilidad.',
        ],
      },
      'Alpha 0.4.2.0': {
        highlight: 'El puzle diario renace: un tablero compartido, contrarreloj',
        changes: [
          'El puzle diario ahora es el mismo tablero para todos, cada día: una forma aleatoria con una apertura ya jugada, y luego 3 minutos en el reloj para conseguir la puntuación más alta. Lo mejor de 3 intentos.',
          'La clasificación diaria ahora se basa en tu puntuación (no en el margen frente a la IA), y la tabla muestra el ganador de cada día de los últimos 30 días.',
        ],
      },
      'Alpha 0.4.1.0': {
        highlight: 'Los temas de color rediseñan todo el tablero',
        changes: [
          'Los temas de color ahora rediseñan todo el tablero: la superficie de juego, las piezas, la celebración de victoria y los botones combinan con el esquema que elijas, en lugar de mostrar un tablero verde bajo cualquier tema.',
          'En las partidas online, quién mueve primero ahora se decide con una moneda justa, y las revanchas alternan quién empieza, así que a lo largo de una serie cada uno tiene el primer movimiento aproximadamente la mitad de las veces.',
          'El oponente de la computadora mueve más rápido, así que las partidas contra la IA se sienten más ágiles.',
          'Los menús, las ventanas emergentes y la pantalla de fin de partida se abren con más fluidez y menos retraso.',
          'Las formas y dificultades bloqueadas ahora muestran un candado claro en lugar de verse apagadas o rotas.',
          'Los campos de correo y contraseña para iniciar sesión ahora se ven con claridad, y las piezas se distinguen mejor sobre el tablero en todos los temas.',
        ],
      },
      'Alpha 0.4.0.0': {
        highlight: 'Mejora de servidor + multijugador más fluido',
        changes: [
          'Se trasladó el multijugador a un backend nuevo y más rápido para partidas más fiables.',
          'Los relojes en multijugador ahora son fluidos y justos: tu reloj ya no salta ni sigue corriendo después de mover.',
          'Las invitaciones a partida permanecen en pantalla hasta que tu amigo responde, y puedes aceptarlas directamente desde la pantalla de resultados.',
          'Ahora se te puede encontrar automáticamente por tu nombre de usuario, así que tus amigos pueden añadirte sin pasos extra.',
        ],
      },
      'Alpha 0.3.7.0': {
        highlight: 'App con autoactualización + corrección de desplazamiento del menú',
        changes: [
          'La app ahora se actualiza sola: si añadiste DotDuel a tu pantalla de inicio, recibe las versiones nuevas automáticamente en lugar de quedarse en una versión antigua guardada en caché.',
          'En los teléfonos, el menú ahora se desplaza correctamente para que la tarjeta de Clasificaciones al final sea totalmente visible.',
        ],
      },
      'Alpha 0.3.6.1': {
        highlight: 'Posición del tablero en móvil',
        changes: [
          'El tablero en móvil ahora sí sube junto a las tarjetas de jugador (el intento anterior no surtió efecto).',
        ],
      },
      'Alpha 0.3.6.0': {
        highlight: 'Inicia sesión para jugar',
        changes: [
          'La primera carga ahora abre con una pantalla "Inicia sesión para jugar": inicia sesión para multijugador y progreso sincronizado en la nube, o elige "jugar como anónimo" para entrar directamente.',
          'En los teléfonos, el tablero ahora se coloca junto a las tarjetas de jugador en lugar de dejar un gran hueco arriba.',
        ],
      },
      'Alpha 0.3.5.0': {
        highlight: 'Ganadores anteriores del puzle + clasificaciones más ordenadas',
        changes: [
          'La tabla del puzle ahora tiene una pestaña "Ganadores recientes": quién ganó cada uno de los últimos 30 días, con la fecha junto a cada nombre.',
          'Las clasificaciones globales de Elo ahora empiezan por la puntuación: posición, Elo y luego el nombre del jugador.',
        ],
      },
      'Alpha 0.3.4.0': {
        highlight: 'Las celebraciones de victoria escalan con la dificultad',
        changes: [
          'Tu celebración de victoria ahora crece con el desafío: un pequeño destello para una victoria contra Principiante, subiendo nivel a nivel hasta el gran espectáculo dorado por vencer a Imposible.',
        ],
      },
      'Alpha 0.3.3.0': {
        highlight: 'Un tablero más limpio y pulido — listo para la beta',
        changes: [
          'Se rediseñó el marco del tablero: el fieltro ahora se asienta en un bisel redondeado, uniforme y suave con un sutil efecto 3D hundido, y enmarca correctamente cada forma, incluida la punta afilada del triángulo (antes el contorno se veía irregular).',
          'Las tarjetas de jugador en una partida ahora se ven completamente en pantalla como tarjetas redondeadas en lugar de salirse de los bordes.',
          'Se corrigió una ventana emergente de consejo en partida cuyo texto podía desbordar el tablero.',
        ],
      },
      'Alpha 0.3.2.0': {
        highlight: 'Un aspecto más premium · celebraciones de victoria',
        changes: [
          'Pase de pulido visual: los botones y las tarjetas de Vs-IA / forma / dificultad ahora tienen profundidad 3D táctil real (se elevan al pasar el cursor y se hunden al pulsar), y los botones principales combinan con el color de cada tema en lugar de ser siempre verdes.',
          '¡Celebraciones de victoria! Terminar una partida con una victoria desata fuegos artificiales y confeti, con un espectáculo dorado exagerado por vencer a la IA Imposible.',
        ],
      },
      'Alpha 0.3.1.0': {
        highlight: 'Directo a la partida · explicación más clara en la pantalla de inicio',
        changes: [
          'Se eliminó la ventana emergente del tutorial inicial: el juego ahora abre directamente en el menú. El cómo jugar es una sola línea clara justo en la pantalla de inicio, y las reglas completas están siempre a un toque de distancia con el botón ?.',
        ],
      },
      'Alpha 0.3.0.0': {
        highlight: 'Los anuncios sostienen el juego gratuito · protección ante ausencias en multijugador',
        changes: [
          'Ahora aparecen pequeños anuncios en el menú y en las pantallas gratuitas de un jugador (Vs-Bot, Local, Diario) para mantener DotDuel gratis. Sin anuncios durante las partidas clasificatorias multijugador. El consentimiento se gestiona con un aviso de privacidad de Google.',
          'Protección ante ausencias en multijugador: si un jugador no hace su primer movimiento en 10 segundos, la partida se cancela sin cambio de puntuación para ninguno de los dos, así que una desconexión o distracción al inicio nunca te cuesta puntos.',
        ],
      },
      'Alpha 0.2.9.0': {
        highlight: 'Renovación visual + legible en todos los temas',
        changes: [
          'Aspecto renovado: tipografía nueva, un tablero enmarcado a juego con cada forma (triángulo, rombo, cuadrado), piezas más brillantes y puntuaciones más claras.',
          'Los paneles de jugador se reducen con elegancia a medida que la pantalla se encoge: en los teléfonos se convierten en una tarjeta compacta con el avatar junto al nombre, dando más espacio al tablero.',
          'Ajustes, Reglas y Privacidad se ordenaron en tarjetas limpias más fáciles de leer de un vistazo.',
          'Los puntos vacíos ahora se ven con claridad en todos los temas en lugar de perderse en el tablero, especialmente en los temas claros.',
          'Los botones, la pantalla de Fin de partida y las ventanas emergentes ya no son difíciles de leer en los temas claros (Monochrome Pro, Vintage Press): el texto y los fondos mantienen un contraste correcto en todas partes ahora.',
        ],
      },
      'Alpha 0.2.8.0': {
        highlight: 'Juego completo con teclado',
        changes: [
          'Juego completo con teclado: Tab para ir al tablero, flechas para moverte entre puntos, Intro o Espacio para colocar o reclamar una línea.',
          'Las partidas clasificatorias ahora te encuentran un oponente bot en unos 15 segundos cuando no hay humanos disponibles, en lugar de hasta un minuto.',
        ],
      },
      'Alpha 0.2.7.2': {
        highlight: 'Corrección: parpadeo / pantalla negra al final de la partida',
        changes: [
          'Desapareció el parpadeo (y la ocasional pantalla negra) de mitad a final de partida en tableros más cargados. Cada línea completada se renderizaba antes con un efecto de mezcla aditiva para un brillo más intenso; en Cuadrado y Rectángulo esto acumulaba decenas de capas de composición de la GPU, desbordando eventualmente la memoria gráfica en móviles. Las líneas ahora se renderizan con colores simples de alto contraste: se conserva el aspecto brillante tipo "cinta", pero no el fallo.',
        ],
      },
      'Alpha 0.2.7.1': {
        highlight: 'Corrección: sin más parpadeo en Cuadrado/Rectángulo',
        changes: [
          'El resaltado de "Ver líneas sin reclamar" ahora solo aparece en el tablero Triángulo. En Cuadrado y Rectángulo a veces provocaba que la pantalla parpadeara y se oscureciera cuando había muchas líneas sin reclamar. El interruptor está oculto en esas formas hasta que se corrija el fallo visual de fondo.',
        ],
      },
      'Alpha 0.2.7.0': {
        highlight: 'Puzle diario: 3 intentos + clasificación',
        changes: [
          'Ahora tienes 3 intentos en el puzle de hoy en lugar de 1. Cuenta tu mejor margen; la racha sigue aumentando tras tu primer intento completado del día.',
          'Nueva tarjeta "Clasificación del puzle" en el menú. Los mejores márgenes de hoy en vivo, ordenados de mayor a menor. Los empates se deciden por quién terminó primero. Próximamente: clasificaciones históricas (por día, mes, búsqueda por nombre).',
        ],
      },
      'Alpha 0.2.6.0': {
        highlight: 'El puzle de hoy',
        changes: [
          'Nueva tarjeta "El puzle de hoy" en el menú. Un intento al día contra la IA Difícil en una forma rotativa. La puntuación es tu margen (tú menos la IA), y cada victoria añade un día a tu racha del Perfil. El puzle de mañana se desbloquea a medianoche UTC.',
          'Se requiere iniciar sesión para jugar el puzle diario y mantener una racha: la racha vive en tu cuenta, así que funciona en todos tus dispositivos.',
        ],
      },
      'Alpha 0.2.5.0': {
        highlight: 'Base para la racha diaria',
        changes: [
          'Nueva sección "Racha diaria" en tu Perfil, lista para el puzle diario (próximamente). Cuando el puzle se lance, completarlo cada día aumentará tu racha en todos tus dispositivos: se guarda en tu cuenta, no en tu navegador, así que sobrevive a borrados de caché y cambios de dispositivo.',
        ],
      },
      'Alpha 0.2.4.0': {
        highlight: 'Comparte e invita desde el menú',
        changes: [
          'Ahora puedes compartir DotDuel directamente desde el menú principal. Los jugadores con sesión iniciada obtienen "Invitar a un amigo": los enlaces llevan tu referido, así que se hacen amigos tuyos automáticamente al registrarse. Quien no tenga sesión iniciada verá un enlace "Compartir DotDuel" debajo del inicio de sesión para compartir el juego rápido y sin complicaciones.',
        ],
      },
      'Alpha 0.2.3.0': {
        highlight: 'Consejos de aprendizaje + interruptor de líneas reclamables',
        changes: [
          'Consejos contextuales que aparecen una sola vez mientras aprendes: la primera vez que anotas, la primera vez que un movimiento cierra dos líneas a la vez (regla de "solo la mayor"), la primera vez que una línea espera ser reclamada al empezar tu turno, y cerca del final de la partida.',
          'Nuevo interruptor con icono de ojo "Mostrar líneas reclamables" junto al botón de reglas en Vs-Bot Principiante/Fácil/Medio/Difícil. Activado por defecto de Principiante a Medio, desactivado en Difícil. Oculto en Imposible, modo local y multijugador: leer el tablero es parte del desafío.',
          'Se actualizó el almacenamiento interno de ajustes; se te pedirá que vuelvas a escribir tu nombre y verás de nuevo la ventana emergente del tutorial al cargar por primera vez. Las estadísticas, desbloqueos y datos de cuenta no se ven afectados.',
        ],
      },
      'Alpha 0.2.2.0': {
        highlight: 'Puntuación visible',
        changes: [
          'La puntuación ahora es visible: un +N flotante aparece desde el punto que completa la línea con tu color, tu insignia de puntuación pulsa cuando cambia, y la insignia de "líneas por reclamar" destella cuando una nueva línea queda pendiente.',
        ],
      },
      'Alpha 0.2.1.0': {
        highlight: 'Telemetría interna',
        changes: [
          'Interno: se añadió analítica anónima de embudo para los jugadores que aceptaron el aviso de cookies; nos ayuda a ver dónde se frustran los jugadores nuevos para poder pulirlo. Ningún dato personal sale del dispositivo.',
        ],
      },
      'Alpha 0.2.0.0': {
        highlight: 'Amigos e invitaciones',
        changes: [
          'Lista de amigos. Añade un amigo por su nombre de usuario, ve qué amigos están en línea y qué están haciendo (vs Bot, local, partida clasificatoria), invita a un amigo a una partida concreta (tu elección de forma, control de tiempo, clasificatoria o casual). Las invitaciones que recibes mientras estás en una partida quedan en cola y aparecen en cuanto vuelves al menú. Una invitación clasificatoria solo cuenta para el Elo si ambos eligieron Clasificatoria; si no, es una partida casual. Tras una partida multijugador puedes añadir al oponente como amigo con un toque.',
          'Invita a un amigo: invita a gente a probar DotDuel; todavía no necesitan una cuenta. Usa el panel de compartir de tu teléfono o tu cliente de correo; nunca vemos su dirección. Cuando se registren, recibirás automáticamente una solicitud de amistad de su parte.',
          'Ajustes → Privacidad: elige quién puede retarte (Todos / Solo amigos / Nadie) y si tu estado en línea es visible para tus amigos.',
        ],
      },
      'Alpha 0.1.5.0': {
        highlight: 'Limpieza de backend',
        changes: [
          'Interno: el estado de las partidas multijugador se migró por completo al nuevo transporte. La antigua ruta de Realtime Database ya no se usa para los datos de partida. Sin diferencia visible; si acaso, algo más ágil.',
        ],
      },
      'Alpha 0.1.4.4': {
        highlight: 'Recargar vuelve al inicio',
        changes: [
          'Recargar la página a la fuerza tras una partida terminada ahora vuelve al menú principal en lugar de repetir la misma pantalla de Fin de partida en cada recarga.',
        ],
      },
      'Alpha 0.1.4.3': {
        highlight: 'Botón de Listo + limpieza de pestañas obsoletas',
        changes: [
          'El botón Listo ahora responde al instante al tocarlo en lugar de esperar el viaje de ida y vuelta a la red, y contra la IA la partida empieza en cuanto lo pulsas (sin esperar la cuenta atrás).',
          'Si tomaste el control de la sesión multijugador en un segundo dispositivo, el primer dispositivo ya no muestra un fin de partida fantasma de la partida que terminaste allí.',
        ],
      },
      'Alpha 0.1.4.2': {
        highlight: 'Recuperación del bloqueo de sesión',
        changes: [
          'Si una sesión anterior se quedó bloqueando el multijugador, ahora puedes tocar el botón Multijugador para tomar el control aquí en lugar de esperar a que se libere.',
          'Los bloqueos de sesión atascados ahora se liberan el doble de rápido (45 s en lugar de 90 s) cuando la pestaña que los retenía ha desaparecido.',
        ],
      },
      'Alpha 0.1.4.1': {
        highlight: 'Pulido del multijugador',
        changes: [
          'El botón Listo ahora sí inicia la partida en cuanto ambos lo pulsan (contra la IA, en cuanto tú lo pulsas).',
          'El primer movimiento de una partida ya no tarda 8-9 segundos en que tu oponente reaccione.',
          'Iniciar sesión en un segundo dispositivo ya no te mete accidentalmente en tu partida activa del primero.',
          'Los botones del menú se alinearon al mismo tamaño para un aspecto más limpio.',
        ],
      },
      'Alpha 0.1.4.0': {
        highlight: 'El multijugador ahora funciona en más redes',
        changes: [
          'El multijugador ahora se conecta en redes que antes bloqueaban el servidor del juego (Whalebone, AdGuard, NextDNS, Brave Shields y filtros DNS similares). El juego usa una nueva ruta de transporte que viaja por HTTPS estándar y no la bloquean las listas de bloqueo de rastreadores. Si el multijugador solía quedarse atascado en la pantalla de carga, inténtalo de nuevo.',
        ],
      },
      'Alpha 0.1.3.6': {
        highlight: 'Corrección de la pantalla del reloj',
        changes: [
          'La pantalla del reloj en multijugador ya no parpadea en cada movimiento.',
        ],
      },
      'Alpha 0.1.3.5': {
        highlight: 'Mensaje sin conexión más claro',
        changes: [
          'Si tu red bloquea el servidor del juego (algo común con bloqueadores de anuncios/rastreadores móviles como AdGuard, NextDNS o Whalebone), Multijugador ahora muestra una explicación clara con consejos de solución en lugar de quedarse atascado en una pantalla de carga. El modo un jugador contra la IA funciona sin conexión como siempre.',
        ],
      },
      'Alpha 0.1.3.1': {
        highlight: 'Corrección de botones en móvil',
        changes: [
          'Los botones de Multijugador y Cerrar sesión a veces no hacían nada en navegadores móviles estrictos con la privacidad (Brave, Firefox Focus). Ahora la interfaz cambia de inmediato y la limpieza ocurre en segundo plano.',
        ],
      },
      'Alpha 0.1.3.0': {
        highlight: 'Ejército de bots: nunca esperes solo',
        changes: [
          'Si no se encuentra a ningún humano en unos 15 s, te emparejarán con un oponente IA clasificatorio (Pip, Cricket, Ranger, Knight o Voidstar). Cuentan para el Elo y aparecen en la clasificación.',
          'La pantalla de búsqueda ahora te avisa cuando un bot podría entrar en juego.',
          'El botón de revancha ahora se oculta cuando tu oponente era un bot (los bots no aceptan revanchas).',
        ],
      },
      'Alpha 0.1.2.5': {
        highlight: 'Seguimiento de la corrección de registro',
        changes: [
          'Elegir un nombre de usuario ahora funciona incluso si un intento de registro anterior dejó un perfil a medio terminar',
          'Botón de cerrar sesión en la pantalla de elegir nombre para que nunca te quedes atascado',
        ],
      },
      'Alpha 0.1.2.4': {
        highlight: 'Corrección de registro',
        changes: [
          'Registrarse con una cuenta nueva ya no falla con un error de "permisos faltantes" al elegir un nombre de usuario',
        ],
      },
      'Alpha 0.1.2.3': {
        highlight: 'Enlaces para compartir + refuerzo de seguridad',
        changes: [
          'Icono de la pestaña del navegador e icono de pantalla de inicio: los dos puntos de DotDuel aparecen donde marques o instales el juego',
          'Vistas previas al compartir: pegar el enlace de DotDuel en Discord, Telegram, Slack o Twitter ahora muestra una tarjeta con el logotipo y el eslogan en lugar de una caja en blanco',
          'Los cambios de nombre de usuario ahora ocurren de forma atómica: el nombre antiguo se libera y el nuevo se reserva en la misma operación',
          'Refuerzo de seguridad interno: política de seguridad de contenido más estricta, límites de frecuencia en el servidor para eliminar cuentas y comprobar nombres de usuario, limpieza programada de partidas terminadas (en ~24 h según la política de privacidad), e identificadores de usuario codificados (hash) en los registros del servidor',
        ],
      },
      'Alpha 0.1.2.2': {
        highlight: 'Ritmo del multijugador + legibilidad',
        changes: [
          'Las formas de tablero multijugador se desbloquean a las 50 y 100 partidas clasificatorias (Cuadrado y luego Rectángulo)',
          'Bala (1 min) y Rápida (5 min) bloqueadas temporalmente: solo Relámpago (3 min) disponible mientras crece la base de jugadores',
          'La ventana de Reglas ahora dice que el multijugador está activo',
          'Los títulos "Campeón de DotDuel" e "Imposible — derrotado" eran invisibles en los temas claros',
        ],
      },
      'Alpha 0.1.2.1': {
        highlight: 'Pulido de temas',
        changes: [
          'Cada tema de color ahora tiene sus propios colores de texto y logotipo en lugar de usar siempre el verde predeterminado',
          'La insignia provisional era invisible en el tema de pergamino Vintage Press',
        ],
      },
      'Alpha 0.1.2': {
        highlight: 'Pulido de experiencia de usuario',
        changes: [
          'El selector de temas ahora se puede abrir desde cualquier pantalla mediante el pie de página',
          'Reloj visible en móvil en multijugador',
          'El resaltado del último movimiento ahora muestra el punto del oponente, no el tuyo',
          'La pantalla de victoria ahora te dice CÓMO ganaste (por tiempo / por puntos / el oponente se rindió)',
          'Las ventanas emergentes en móvil eran imposibles de cerrar: el botón de cerrar ahora es siempre alcanzable',
          'La píldora del pie de página ahora pasa a una segunda línea en teléfonos estrechos en lugar de cortarse',
          'El selector de temas y otras ventanas emergentes ahora tienen desplazamiento correcto cuando el contenido es más alto que la pantalla',
          'Las ventanas emergentes eran ilegibles en escritorio cuando el aviso de cookies estaba visible: el tamaño de las ventanas ahora reserva espacio correctamente',
        ],
      },
      'Alpha 0.1': {
        highlight: '¡DotDuel se lanza!',
        changes: [
          'Lanzamiento público en alfa — multijugador, clasificación, temas, modo apto para exteriores',
        ],
      },
    } as Record<string, { highlight?: string; changes: string[] }>,
  },

  privacy: {
    aria: 'Política de privacidad',
    close: 'Cerrar',
    title: 'Política de privacidad',
    tagline: 'Qué recopilamos, por qué lo recopilamos y cómo eliminarlo.',
    whoH: 'Quiénes somos',
    whoP: 'DotDuel es un juego independiente de colorear puntos para dos jugadores. El responsable de tus datos personales según el RGPD es el desarrollador. Contacto:',
    collectH: 'Qué recopilamos',
    collectP: 'Solo lo necesario para que el juego funcione y sea justo.',
    collectAccountLead: 'Cuenta:',
    collectAccount:
      'correo electrónico, nombre visible, proveedor de inicio de sesión (Google o contraseña) y fecha de creación de la cuenta. Fuente: tú, a través de Supabase Auth al registrarte.',
    collectRatingLead: 'Clasificación multijugador:',
    collectRating:
      'tu Elo actual, el contador de partidas de posicionamiento y la marca de tiempo de la última partida. Fuente: se calcula en el servidor al final de cada partida clasificatoria.',
    collectHistoryLead: 'Historial de partidas:',
    collectHistory:
      'cada partida clasificatoria guarda los ID de ambos jugadores, los nombres visibles, las puntuaciones finales, las variaciones de clasificación, la forma, el control de tiempo, la duración y cómo terminó la partida (normal / tiempo agotado / rendición).',
    collectLiveLead: 'Estado de la partida en directo:',
    collectLive:
      'mientras una partida multijugador está en curso, guardamos el tablero, el reloj y de quién es el turno en nuestra base de datos en tiempo real. Esto se elimina poco después de que termine la partida.',
    collectFriendsLead: 'Amigos e invitaciones:',
    collectFriends:
      'tu lista de amigos, solicitudes pendientes, estado de conexión e invitaciones a partidas. Si te uniste mediante el enlace de invitación o el código QR de otro jugador, registramos qué jugador te invitó (su código de invitación aleatorio, para poder reconocer futuras recompensas por recomendación).',
    collectDeviceLead: 'Datos solo del dispositivo:',
    collectDevice:
      'tu progreso de un jugador, las estadísticas contra IA / de partida local, la preferencia de tema y la marca de «tutorial visto». Se almacenan en el localStorage de tu navegador y nunca se nos transmiten.',
    collectAnalyticsLead: 'Analítica (solo si aceptas):',
    collectAnalytics:
      'eventos recopilados automáticamente por Google Analytics: vistas de página, modelo de dispositivo, idioma, tamaño de pantalla e ID de sesión anónimo. No se vincula a tu cuenta en nuestro sistema.',
    whyH: 'Por qué lo recopilamos (bases legales)',
    whyContractLead: 'Contrato (art. 6.1.b):',
    whyContract:
      'cuenta, clasificación, historial de partidas y estado de la partida en directo: todo necesario para operar el servicio multijugador en el que te registraste.',
    whyLegitLead: 'Interés legítimo (art. 6.1.f):',
    whyLegit:
      'la tabla de clasificación y el juego clasificatorio, para ofrecer un entorno justo y competitivo a todos los jugadores.',
    whyConsentLead: 'Consentimiento (art. 6.1.a):',
    whyConsentAds:
      'Google Analytics Y Google AdSense: ambos se cargan solo después de que pulses Aceptar en el aviso de consentimiento. Si rechazas o no decides, no se inicia ninguno.',
    whyConsentNoAds:
      'Google Analytics: se carga solo después de que pulses Aceptar en el aviso de consentimiento. Si rechazas o no decides, nunca se inicia.',
    sharedH: 'Con quién se comparte',
    sharedAds:
      'Usamos Supabase (base de datos, autenticación, infraestructura en tiempo real y funciones sin servidor, alojado en la UE) como proveedor de backend, además de Google para el inicio de sesión y la analítica supeditada al consentimiento, y Google AdSense para mostrar pequeños banners de anuncios en algunas pantallas de menú. Tanto Analytics como AdSense se cargan solo después de que aceptes el aviso de consentimiento. Supabase y Google tratan los datos según sus condiciones estándar / acuerdos de tratamiento de datos. No vendemos ni compartimos tus datos con ningún otro tercero.',
    sharedNoAds:
      'Usamos Supabase (base de datos, autenticación, infraestructura en tiempo real y funciones sin servidor, alojado en la UE) como proveedor de backend, además de Google para el inicio de sesión y la analítica supeditada al consentimiento. Analytics se carga solo después de que aceptes el aviso de consentimiento. Supabase y Google tratan los datos según sus condiciones estándar / acuerdos de tratamiento de datos. No vendemos ni compartimos tus datos con ningún otro tercero. Actualmente no usamos redes de anuncios de terceros.',
    keepH: 'Cuánto tiempo lo conservamos',
    keepAccountLead: 'Cuenta + tabla de clasificación:',
    keepAccount: 'hasta que elimines tu cuenta.',
    keepHistoryLead: 'Historial de partidas:',
    keepHistory: 'hasta 24 meses después del final de la partida; luego se elimina de forma permanente.',
    keepLiveLead: 'Estado de la partida en directo:',
    keepLive: 'se elimina en unas 24 horas tras el fin de la partida.',
    keepAnalyticsLead: 'Analítica:',
    keepAnalytics: 'según los valores predeterminados de Google (actualmente 14 meses para los datos de eventos).',
    keepDeviceLead: 'Datos solo del dispositivo:',
    keepDevice: 'permanecen hasta que borres los datos de tu navegador.',
    rightsH: 'Tus derechos',
    rightsP: 'Según el RGPD, tienes derecho a:',
    rightAccessLead: 'Acceder',
    rightAccess: 'a los datos personales que tenemos sobre ti: usa «Descargar mis datos» en tu Perfil.',
    rightRectifyLead: 'Rectificar',
    rightRectify: 'datos inexactos: usa el botón «Renombrar» en tu Perfil.',
    rightEraseLead: 'Suprimir',
    rightErase:
      'tu cuenta («derecho al olvido»): usa «Eliminar mi cuenta» en tu Perfil. El efecto es inmediato.',
    rightPortLead: 'Portar',
    rightPort: 'tus datos: la descarga anterior es un archivo JSON legible por máquina que puedes llevar a otro sitio.',
    rightObjectLead: 'Oponerte',
    rightObject: 'a la analítica: usa el interruptor de abajo o pulsa Rechazar en el aviso al primer inicio.',
    rightComplainLead: 'Presentar una reclamación',
    rightComplain:
      'ante tu autoridad nacional de protección de datos si crees que hemos tratado mal tus datos.',
    rankingsNoteLead: 'Nota importante sobre las clasificaciones.',
    rankingsNote:
      'Si eliminas tu cuenta (o se te retira por cualquier motivo), tu nombre visible y el identificador de tu cuenta se borran de todos los registros públicos. Sin embargo, los cambios de clasificación que provocaste en el Elo de otros jugadores NO se revierten: las partidas pasadas son inmutables. Los oponentes contra los que jugaste conservan sus ganancias y pérdidas de clasificación; su historial de partidas muestra «Jugador eliminado» donde antes estaba tu nombre.',
    cookiesH: 'Cookies y analítica',
    cookiesP:
      'No usamos cookies de seguimiento. Nuestro inicio de sesión (Supabase Auth) usa almacenamiento de sesión propio para mantenerte con la sesión iniciada. Google Analytics usa cookies, pero solo si aceptas a continuación.',
    currentChoice: 'Elección actual de analítica:',
    choiceAccepted: 'Aceptada',
    choiceDeclined: 'Rechazada',
    choiceUndecided: 'Sin decidir aún',
    acceptAnalytics: 'Aceptar analítica',
    declineAnalytics: 'Rechazar analítica',
    consentReloadHint:
      'Cambiar de Aceptada a Rechazada recargará la página para detener por completo el SDK de Analytics.',
    contactH: 'Cómo contactarnos',
    contactP: 'Para cualquier pregunta de privacidad, solicitud de acceso a datos o reclamación:',
    effectiveH: 'Fecha de entrada en vigor',
    effectiveLead: (date: string) =>
      `Esta política está en vigor desde el ${date}. La actualizaremos aquí si algo material cambia. La versión canónica se publica en`,
    done: 'Hecho',
  },

  profile: {
    aria: 'Perfil',
    close: 'Cerrar',
    title: 'Tu perfil',
    tagline: 'Datos de la cuenta e historial sin conexión.',
    accountH: 'Cuenta',
    gameName: 'Nombre en el juego',
    rename: 'Renombrar',
    email: 'Correo electrónico',
    signInMethod: 'Método de inicio de sesión',
    providerGoogle: 'Google',
    providerEmail: 'Correo y contraseña',
    providerUnknown: 'Desconocido',
    emailUnverified:
      'Correo aún sin verificar. Revisa tu bandeja de entrada (y la carpeta de spam) para encontrar el enlace que te enviamos.',
    fallbackName: 'Jugador 1',
    accountFallback: 'Cuenta',
    multiplayerH: 'Multijugador',
    rating: 'Clasificación',
    provisional: (n: number, total: number) => `Provisional ${n}/${total}`,
    provisionalTitle: 'La clasificación se estabiliza tras 10 partidas clasificatorias',
    lastMatches: (n: number) => `Últimas ${n} partidas`,
    noMatches: 'Aún no hay partidas clasificatorias. Únete a la cola desde el menú.',
    streakH: 'Racha diaria',
    streakEmpty: 'Juega el puzle de hoy para iniciar una racha. (Próximamente.)',
    currentStreak: 'Racha actual',
    longest: 'Más larga',
    dayN: (n: number) => `Día ${n}`,
    streakHint: 'La racha cuenta los puzles diarios completados. Si fallas un día, se reinicia.',
    offlineHistoryH: (name: string) => `Historial sin conexión — «${name}»`,
    offlineEmpty:
      'Aún no hay partidas en este dispositivo. Empieza una partida contra IA o local para llenar esto.',
    totalGames: 'Partidas totales',
    vsBotsWDL: 'Contra Bots · V/E/D',
    hotseatWDL: 'Partida local · V/E/D',
    pointsScored: 'Puntos a favor',
    pointsGiven: 'Puntos en contra',
    avg: (v: string) => `media ${v}`,
    offlineHint: 'Se guarda en este dispositivo con el nombre de Ajustes. La sincronización en la nube llega pronto.',
    dataH: 'Tus datos',
    dataHint:
      'Según el RGPD puedes descargar todo lo que tenemos sobre ti o eliminar tu cuenta por completo. La eliminación es inmediata y no se puede deshacer.',
    preparing: 'Preparando…',
    downloadData: 'Descargar mis datos',
    deleteAccount: 'Eliminar mi cuenta',
    signOut: 'Cerrar sesión',
    done: 'Hecho',
    deleteFailed: 'No se pudo eliminar. Inténtalo de nuevo.',
    deleteConfirmTitle: '¿Eliminar tu cuenta?',
    deleteConfirmBody:
      'Esto elimina de forma permanente tu cuenta, tu inicio de sesión y tu entrada en la tabla de clasificación, y borra tu nombre de las partidas pasadas. Los oponentes conservan su historial de clasificación. Si estás en una partida en directo, la perderás. Esto no se puede deshacer.',
    cancel: 'Cancelar',
    deleting: 'Eliminando…',
    deleteForever: 'Eliminar para siempre',
  },

  signIn: {
    aria: 'Iniciar sesión',
    close: 'Cerrar',
    titleGate: 'Inicia sesión para jugar',
    titleSignIn: 'Iniciar sesión',
    titleSignUp: 'Crear cuenta',
    google: 'Continuar con Google',
    orEmail: 'o con correo electrónico',
    emailPlaceholder: 'tu@ejemplo.com',
    passwordPlaceholder: 'Contraseña (mín. 6 caracteres)',
    confirmPlaceholder: 'Confirmar contraseña',
    submitSignIn: 'Iniciar sesión',
    submitSignUp: 'Crear cuenta',
    newHere: '¿Eres nuevo?',
    createAccount: 'Crear una cuenta',
    haveOne: '¿Ya tienes una?',
    signInLink: 'Iniciar sesión',
    tryAnon: '¿Quieres probar de forma anónima sin iniciar sesión?',
    accountCreated: (email: string) =>
      `Cuenta creada. Si la confirmación por correo está activada, revisa ${email} (y el spam) para verificarla.`,
    errPasswordsMatch: 'Las contraseñas no coinciden.',
    errInvalidCreds: 'El correo o la contraseña son incorrectos.',
    errAlreadyRegistered: 'Ese correo ya está registrado. Inicia sesión en su lugar.',
    errWeakPassword: 'La contraseña debe tener al menos 6 caracteres.',
    errInvalidEmail: 'Ese correo no parece correcto.',
    errNotConfirmed: 'Primero confirma tu correo (revisa tu bandeja de entrada).',
    errRateLimit: 'Demasiados intentos. Vuelve a intentarlo en un minuto.',
    errNetwork: 'Error de red. Comprueba tu conexión e inténtalo de nuevo.',
    errGeneric: 'Algo salió mal.',
  },

  username: {
    ariaClaim: 'Elige un nombre en el juego',
    ariaRename: 'Renombrar',
    cancel: 'Cancelar',
    titleClaim: 'Elige tu nombre en el juego',
    titleRename: 'Renombrar',
    taglineClaim:
      'Esto es lo que verán los demás jugadores. Único para ti. Puedes renombrarlo más tarde.',
    taglineRename: 'Las estadísticas siguen a tu cuenta, no al nombre: se conservan.',
    placeholder: 'p. ej. Donatas',
    claim: 'Reservar nombre',
    save: 'Guardar',
    signOut: 'Cerrar sesión',
    checking: 'Comprobando…',
    available: 'Disponible',
    taken: 'Ocupado — prueba otro',
    hint: '3–16 caracteres · letras, dígitos, _ o -',
    checkFailed: 'La comprobación falló.',
    genericError: 'Algo salió mal.',
    invalidShort: 'Al menos 3 caracteres.',
    invalidLong: 'Máximo 16 caracteres.',
    invalidChars: 'Solo letras, dígitos, _ o -.',
  },

  friendStatus: {
    menu: 'En el menú',
    'in-ai': 'Contra Bots',
    'in-hotseat': 'Partida local',
    'in-ranked': 'Partida clasificatoria',
    'searching-ranked': 'Buscando…',
    'in-daily': 'Puzle de hoy',
    offline: 'Desconectado',
  },

  timeControls: {
    '1min': { label: 'Bala', per: '1 minuto por jugador', sub: 'Rápida y frenética.' },
    '3min': { label: 'Relámpago', per: '3 minutos por jugador', sub: 'Opción equilibrada.' },
    '5min': { label: 'Rápida', per: '5 minutos por jugador', sub: 'Tiempo para pensar.' },
  },

  friends: {
    online: (n: number) => `👥 ${n} en línea`,
    friends: '👥 Amigos',
    addFriendTitle: 'Añadir un amigo',
    onlineOfTotal: (online: number, total: number) => `${online} de ${total} en línea`,
    newBadge: (n: number) => `${n} nuevas`,
    aria: 'Amigos',
    close: 'Cerrar',
    title: 'Amigos',
    tabOnline: 'En línea',
    tabAll: 'Todos',
    tabRequests: 'Solicitudes',
    emptyOnline: 'No hay amigos en línea ahora mismo.',
    emptyAll: 'Aún no tienes amigos: añade uno abajo.',
    addByUsername: 'Añadir un amigo por nombre de usuario',
    usernamePlaceholder: 'nombre de usuario',
    sending: 'Enviando…',
    send: 'Enviar',
    requestSent: 'Solicitud enviada.',
    requestFailed: 'La solicitud falló.',
    removeConfirm: (name: string) => `¿Eliminar a ${name} de tus amigos?`,
    blockConfirm: (name: string) =>
      `¿Bloquear a ${name}? No podrá enviarte solicitudes de amistad ni invitaciones a partidas.`,
    inviteToGame: 'Invitar a una partida',
    friendMustBeOnMenu: 'El amigo debe estar en el menú',
    invite: 'Invitar',
    more: 'Más',
    removeFriend: 'Eliminar amigo',
    block: 'Bloquear',
    statusAria: (label: string) => `Estado: ${label}`,
    noPending: 'No hay solicitudes pendientes.',
    incomingH: 'Recibidas',
    wantsToBeFriends: 'quiere ser tu amigo',
    accept: 'Aceptar',
    decline: 'Rechazar',
    sentH: 'Enviadas',
    waitingForThem: 'esperando su respuesta',
    cancel: 'Cancelar',
  },

  invite: {
    aria: 'Enviar invitación',
    close: 'Cerrar',
    title: (name: string) => `Invitar a ${name}`,
    waiting: (name: string) => `Invitación enviada a ${name}. Esperando a que acepte…`,
    cancelInvite: 'Cancelar invitación',
    declined: (name: string) => `${name} no aceptó la invitación.`,
    sendAgain: 'Enviar de nuevo',
    shapeH: 'Forma',
    timeH: 'Control de tiempo',
    ranked: 'Partida clasificatoria',
    rankedHint:
      'Solo cuenta para el Elo si tu oponente también acepta jugar clasificatoria. De lo contrario, es una partida casual.',
    cancel: 'Cancelar',
    send: 'Enviar invitación',
    sending: 'Enviando…',
    inviteFailed: 'La invitación falló.',
    reasonOffline: 'está desconectado',
    reasonSearching: 'está buscando partida',
    reasonInGame: 'está en una partida',
    declinedReason: (name: string, reason: string) => `${name} ${reason}.`,
    cantInviteNow: (name: string, reason: string) =>
      `${name} ${reason}: no puedes invitarlo ahora mismo.`,
    toastAria: 'Invitaciones a partidas',
    aFriend: 'Un amigo',
    invitesYou: 'te invita',
    theyPickedRanked: 'Eligió Clasificatoria',
    declineFrom: (name: string) => `Rechazar la invitación de ${name}`,
    decline: 'Rechazar',
    acceptCasual: 'Aceptar casual',
    acceptRanked: 'Aceptar clasificatoria',
    accept: 'Aceptar',
  },

  gameOver: {
    oppWantsRematchTitle: 'Tu oponente quiere la revancha',
    acceptRematch: 'Aceptar revancha',
    waitingForOpponent: 'Esperando al oponente…',
    cancel: 'Cancelar',
    rematch: 'Revancha',
    youWin: 'Ganas',
    playerWins: (name: string) => `Gana ${name}`,
    aborted: 'Partida cancelada',
    abortedSub: 'sin primer movimiento · sin cambio de clasificación',
    draw: 'La partida terminó en empate',
    youLost: 'Perdiste',
    onPoints: 'por puntos',
    onTime: 'por tiempo',
    oppResigned: 'el oponente se rindió',
    oppDisconnected: 'el oponente se desconectó',
    youResigned: 'te rendiste',
    disconnected: 'desconectado',
    drawTitle: 'Empate',
    champion: 'Campeón de DotDuel',
    impossibleDefeated: 'Imposible — vencido',
    rating: 'Clasificación',
    timesUp: '⏱ Se acabó el tiempo',
    yourScore: 'Tu puntuación:',
    bestToday: 'Mejor de hoy:',
    attemptOf: (n: number) => ` · intento ${n}/3`,
    streakLabel: 'Racha:',
    dayN: (n: number) => `Día ${n}`,
    bestDay: (n: number) => `(mejor: Día ${n})`,
    attemptsLeft: (n: number) =>
      `Te queda${n === 1 ? '' : 'n'} ${n} intento${n === 1 ? '' : 's'} hoy. Tu mejor marca cuenta en la clasificación.`,
    allAttemptsUsed: 'Has usado los 3 intentos. Vuelve mañana a medianoche (UTC).',
    savingResult: 'Guardando resultado…',
    menu: 'Menú',
    lobby: 'Sala',
    playAgain: 'Jugar de nuevo',
    leaderboard: 'Clasificación',
    tryAgainN: (n: number) => `Inténtalo de nuevo (${n} restantes)`,
    addAsFriend: (name: string) => `➕ Añadir a ${name} como amigo`,
    sendingRequest: 'Enviando solicitud…',
    friendRequestSent: 'Solicitud de amistad enviada.',
    couldntSend: 'No se pudo enviar — inténtalo de nuevo',
    champHeadline: '¡Has completado el modo de un jugador de DotDuel!',
    champBody:
      'Has conquistado todas las formas en todos los niveles. El reto más duro que queda son los humanos de verdad.',
    comingSoonTitle: 'Próximamente',
    multiplayerComingSoon: 'Multijugador · próximamente',
    impossibleHeadline: (shape: string) => `Tumbaste a la IA más dura en ${shape}.`,
    impossibleBody: (nextShape: string, beginner: string) =>
      `${nextShape} es tu próxima montaña. Empieza desde ${beginner} y vuelve a subir.`,
    tryShape: (shape: string) => `Probar ${shape}`,
    shapeUnlockedHeadline: (shape: string) => `¡${shape} ya está desbloqueado!`,
    shapeUnlockedBody: (shape: string) =>
      `Un tablero nuevo con una estrategia nueva. O sigue con ${shape} y sube la dificultad.`,
    pushTo: (level: string, shape: string) => `O pásate a ${level} en ${shape}`,
    levelUnlockedHeadline: (level: string) => `${level} desbloqueado.`,
    levelUnlockedBody: 'La IA acaba de volverse más lista. ¿Lista para enfrentarte a ella?',
    tryLevel: (level: string) => `Probar ${level}`,
    niceOne: 'Bien hecho.',
    niceOneBody: 'Ya superaste esto. ¿Quieres un combate más difícil?',
  },

  lobby: {
    back: '‹ Atrás',
    title: 'Multijugador',
    intro: (rating: number) =>
      `Elige un control de tiempo. Te emparejaremos con otro jugador de clasificación similar (la tuya: ${rating}).`,
    lockedTitle: (openLabel: string) =>
      `Bloqueado mientras crece la base de jugadores: por ahora solo ${openLabel} está abierto para que el emparejamiento sea rápido.`,
    comingBackSoon: 'Vuelve pronto',
    board: 'Tablero:',
    unlockHint: (nextLabel: string, n: number) =>
      `— ${nextLabel} se desbloquea en ${n} ${n === 1 ? 'partida clasificatoria' : 'partidas clasificatorias'} más.`,
    findMatch: 'Buscar partida clasificatoria',
  },

  matchmaking: {
    finding: 'Buscando un oponente…',
    waitingAtRating: (s: number) => `Esperando a un jugador de tu clasificación (${s} s)`,
    stillSearching: (s: number) =>
      `Seguimos buscando — puede que te emparejemos pronto con una IA clasificatoria (${s} s)`,
    cancelSearch: 'Cancelar búsqueda',
    rangeHint: 'El rango de emparejamiento se amplía unos 25 Elo por segundo. Te emparejaremos con el oponente más cercano.',
  },

  matchFound: {
    opponentFound: '¡Oponente encontrado!',
    youPlayerN: (n: number) => `Tú · Jugador ${n}`,
    playerN: (n: number) => `Jugador ${n}`,
    ready: '✓ Listo',
    notReady: '— Sin preparar',
    vs: 'vs',
    bot: 'BOT',
    aiOpponent: 'Oponente IA',
    bothReady: 'Ambos listos — empezando…',
    startsIn: (s: number) => `Empieza en ${s}`,
    shapeLine: (shape: string) => `Forma: ${shape}. El Jugador 1 mueve primero.`,
    shapeRandom: 'aleatoria',
    readyWaiting: '✓ Listo — esperando al oponente',
    readyBtn: '¡Listo!',
    backToMenu: 'Volver al menú',
  },

  clock: {
    remaining: (time: string) => `${time} restante`,
  },

  mpUnavailable: {
    heading: 'Multijugador no disponible',
    blockedHint:
      'Tu red está bloqueando el servidor del juego. La causa más común es un bloqueador de anuncios/rastreadores (Whalebone, AdGuard, NextDNS, Pi-hole) o un filtro DNS en tu teléfono o router.',
    tryLabel: 'Prueba:',
    tryWifi: 'otra red Wi-Fi o datos móviles',
    tryBrowser: 'otro navegador',
    tryDisableFilters: 'desactivar filtros DNS / VPN por un momento',
    tryWhitelist: (domain: string) => `añadir ${domain} a la lista blanca de tu bloqueador`,
    offlineHint: 'El modo un jugador contra los bots funciona sin conexión: abre el Menú y elige Bots.',
  },

  mpConnecting: {
    heading: 'Conectando a la partida…',
    hint: 'Estableciendo conexión con el servidor del juego. Si esto tarda más de ~10 segundos, algo falla: sal y vuelve a intentarlo.',
  },

  share: {
    title: 'DotDuel: estrategia rápida de puntos para 2 jugadores',
    textInvite: 'Échate una partida rápida de puntos conmigo.',
    textShare: 'Prueba DotDuel: un juego rápido de estrategia de puntos para 2 jugadores.',
    labelInvite: '➕ Invitar a un amigo',
    labelShare: 'Compartir DotDuel',
    linkCopied: 'Enlace copiado: pégalo donde quieras',
    couldNotShare: 'No se pudo compartir: inténtalo de nuevo',
    preparing: 'Preparando…',
    shareResult: '📤 Compartir resultado',
    imageCopied: 'Imagen copiada: pégala donde quieras',
    imageCopyFailed: 'No se pudo copiar la imagen: prueba con Descargar',
    textCopied: 'Texto y enlace copiados',
    textCopyFailed: 'No se pudo copiar: prueba con Descargar',
    imageSaved: 'Imagen guardada',
    dialogAria: 'Comparte tu resultado',
    dialogTitle: 'Comparte tu resultado',
    close: 'Cerrar',
    resultCardAlt: 'Tu tarjeta de resultado',
    copyImage: '📋 Copiar imagen',
    copyTextLink: '🔗 Copiar texto + enlace',
    hintCardLink:
      'Tu enlace muestra la imagen de la tarjeta automáticamente al pegarlo. Para una imagen incrustada, usa Copiar imagen y pégala en tu publicación.',
    hintNoCardLink:
      'Los botones de plataforma comparten tu texto y enlace. Para incluir la imagen, usa Copiar imagen y pégala en tu publicación.',
    downloadImage: '⬇ Descargar imagen',

    result: {
      genericBot: 'Bot',
      ptsLabel: 'pts',
      scanCaption: '¡Escanea y juega ya!',
      ctaWin: '¿Puedes ganarme?',
      ctaLoss: '¿Crees que puedes hacerlo mejor?',
      ctaDraw: '¿Desempatamos?',

      tagDaily: 'PUZLE DIARIO',
      tagVsBot: (shape: string) => `VS BOT · ${shape.toUpperCase()}`,
      tagRanked: (shape: string) => `CLASIFICATORIA · ${shape.toUpperCase()}`,
      tagHotseat: (shape: string) => `LOCAL · ${shape.toUpperCase()}`,

      dailyHeadline: 'El puzle de hoy',
      dailyCta: '¿Puedes superarlo?',
      dailyShareText: (score: number, url: string) =>
        `Saqué ${score} puntos en el puzle diario de DotDuel — ¿puedes superarlo?\n${url}`,

      aiHeadlineWin: (level: string) => `Bot ${level} — derrotado`,
      aiHeadlineLoss: (level: string) => `El Bot ${level} gana esta`,
      aiHeadlineDraw: (level: string) => `Empate contra el Bot ${level}`,
      aiShareTextWin: (level: string, s1: number, s2: number, shape: string, url: string) =>
        `Vencí al Bot ${level} ${s1}–${s2} en el tablero de ${shape} en DotDuel — ¿puedes tú?\n${url}`,
      aiShareTextLoss: (level: string, s2: number, s1: number, url: string) =>
        `El Bot ${level} me venció ${s2}–${s1} en DotDuel. ¿Crees que puedes hacerlo mejor?\n${url}`,
      aiShareTextDraw: (level: string, s1: number, s2: number, url: string) =>
        `Empaté con el Bot ${level} ${s1}–${s2} en DotDuel. ¿Puedes terminar el trabajo?\n${url}`,

      rankedHeadlineWin: (elo: string) => `Victoria clasificatoria${elo}`,
      rankedHeadlineLoss: 'Partida clasificatoria reñida',
      rankedHeadlineDraw: 'Empate clasificatorio',
      rankedShareTextWin: (myScore: number, oppScore: number, elo: string, url: string) =>
        `Acabo de ganar una partida clasificatoria de DotDuel ${myScore}–${oppScore}${elo} — ¿puedes ganarme?\n${url}`,
      rankedShareTextLoss: (myScore: number, oppScore: number, url: string) =>
        `Acabo de jugar una partida clasificatoria de DotDuel (${myScore}–${oppScore}). ¿Te animas a una partida?\n${url}`,
      rankedShareTextDraw: (myScore: number, oppScore: number, url: string) =>
        `Partida clasificatoria de DotDuel totalmente empatada (${myScore}–${oppScore}). ¿Nos la desempatas?\n${url}`,

      hotseatHeadlineWin: (winnerName: string) => `${winnerName} gana`,
      hotseatHeadlineDraw: 'Empate total',
      hotseatShareTextWin: (
        winnerName: string,
        loserName: string,
        winnerScore: number,
        loserScore: number,
        url: string,
      ) =>
        `${winnerName} venció a ${loserName} ${winnerScore}–${loserScore} en DotDuel. ¿Crees que puedes hacerlo mejor?\n${url}`,
      hotseatShareTextDraw: (p1: string, p2: string, s1: number, s2: number, url: string) =>
        `${p1} y ${p2} empataron ${s1}–${s2} en DotDuel. ¿Nos lo desempatas?\n${url}`,
    },
  },

  rankings: {
    aria: 'Clasificaciones',
    backToRankings: 'Volver a las clasificaciones',
    closeRankings: 'Cerrar clasificaciones',
    back: 'Atrás',
    close: 'Cerrar',
    aiOpponent: 'Oponente IA',
    player: 'Jugador',
    h2hTagline: 'Historial directo por oponente.',
    title: 'Clasificaciones',
    globalTagline: 'Elo mundial entre todos los jugadores multijugador.',
    localTagline: 'Perfiles locales en este dispositivo: historial contra IA y de partida local.',
    globalElo: 'Elo mundial',
    local: 'Local',
    shape: 'Forma:',
    all: 'Todas',
    emptyLocalAll: 'Aún no hay partidas registradas en este dispositivo.',
    emptyLocalShape: (shape: string) => `Aún no hay partidas en ${shape}.`,
    colRank: '#',
    colPlayer: 'Jugador',
    colGames: 'Partidas',
    colWinPct: '% victorias',
    deleteProfile: 'Eliminar perfil',
    noH2H: 'No hay partidas directas registradas.',
    colOpponent: 'Oponente',
    colWinPctShort: 'V %',
    colLossPctShort: 'D %',
    colDrawPctShort: 'E %',
    done: 'Hecho',
    confirmAria: 'Confirmar eliminación del perfil',
    deleteTitle: '¿Eliminar perfil?',
    deleteBody: (name: string) =>
      `${name} se eliminará de las clasificaciones y de todos los historiales directos de este dispositivo.`,
    deleteConfirm2: '¿Seguro que quieres eliminar esto? Los datos serán irrecuperables.',
    cancel: 'Cancelar',
    signInPrompt: 'Inicia sesión para ver la clasificación Elo mundial.',
    signIn: 'Iniciar sesión',
    loadError: 'No se pudo cargar la clasificación: comprueba tu conexión.',
    tryAgain: 'Inténtalo de nuevo',
    colElo: 'Elo',
    emptyGlobal: 'Aún no se han jugado partidas multijugador clasificatorias. Sé el primero en encabezar la tabla.',
    you: 'tú',
    summaryGames: 'partidas',
    winRate: 'tasa de victorias',
  },

  puzzleBoard: {
    aria: 'Clasificación del puzle',
    close: 'Cerrar',
    title: 'Ganadores del día',
    tagline:
      'La puntuación más alta se lleva el día. Los empates se deciden por quien terminó antes. Se reinicia a medianoche (UTC).',
    loading: 'Cargando…',
    empty: 'Aún nadie ha terminado un puzle diario. Sé el primero.',
    today: 'Hoy',
    date: (month: string, day: number) => `${day} ${month}`,
    you: ' (tú)',
    done: 'Hecho',
  },

  sidePanel: {
    featuredTitle: (title: string) => `${title} — toca para ver los logros`,
    noGames: 'aún no hay partidas',
    botLabel: (level: string) => `Bot · ${level}`,
    botShort: (level: number) => `Bot N${level}`,
    hotseat: 'Partida local',
    hotseatShort: 'PL',
    statsTitle: (label: string, total: number, record: string, pct: string) =>
      `${label}: ${total} partidas · ${record} · ${pct} victorias`,
    pointsTitle: (games: number, scored: number, given: number, avgS: string, avgG: string) =>
      `En ${games} partidas: ${scored} pts a favor, ${given} pts en contra. Medias ${avgS} / ${avgG} por partida.`,
    aiLabel: (level: string) => `Oponente IA, dificultad ${level}`,
  },

  achievements: {
    byId: {
      // ---- A: onboarding ----
      'first-game': { title: 'Primeros pasos', desc: 'Juega tu primera partida.' },
      'first-win': { title: 'Ganador', desc: 'Gana tu primera partida.' },
      'first-claim': { title: 'Aprovechado', desc: 'Reclama tu primera línea pendiente.' },
      'all-shapes': { title: 'Cartógrafo', desc: 'Desbloquea todas las formas de tablero jugables.' },

      // ---- B: Triangle bots ----
      'beat-triangle-1': { title: 'Triángulo: Principiante caído', desc: 'Vence al Bot Principiante en el tablero Triángulo.' },
      'beat-triangle-2': { title: 'Triángulo: Fácil caído', desc: 'Vence al Bot Fácil en el tablero Triángulo.' },
      'beat-triangle-3': { title: 'Triángulo: Medio caído', desc: 'Vence al Bot Medio en el tablero Triángulo.' },
      'beat-triangle-4': { title: 'Triángulo: Difícil caído', desc: 'Vence al Bot Difícil en el tablero Triángulo.' },
      'beat-triangle-5': { title: 'Triángulo: Imposible caído', desc: 'Vence al Bot Imposible en el tablero Triángulo.' },
      'grandmaster-triangle': { title: 'Gran maestro del Triángulo', desc: 'Vence a todos los niveles de Bot (Principiante → Imposible) en el tablero Triángulo.' },
      'slayer-triangle-10': { title: 'Verdugo del Triángulo', desc: 'Vence al Bot Imposible 10 veces en el tablero Triángulo.' },
      'slayer-triangle-50': { title: 'Segador del Triángulo', desc: 'Vence al Bot Imposible 50 veces en el tablero Triángulo.' },

      // ---- C: Square bots ----
      'beat-square-1': { title: 'Cuadrado: Principiante caído', desc: 'Vence al Bot Principiante en el tablero Cuadrado.' },
      'beat-square-2': { title: 'Cuadrado: Fácil caído', desc: 'Vence al Bot Fácil en el tablero Cuadrado.' },
      'beat-square-3': { title: 'Cuadrado: Medio caído', desc: 'Vence al Bot Medio en el tablero Cuadrado.' },
      'beat-square-4': { title: 'Cuadrado: Difícil caído', desc: 'Vence al Bot Difícil en el tablero Cuadrado.' },
      'beat-square-5': { title: 'Cuadrado: Imposible caído', desc: 'Vence al Bot Imposible en el tablero Cuadrado.' },
      'grandmaster-square': { title: 'Gran maestro del Cuadrado', desc: 'Vence a todos los niveles de Bot (Principiante → Imposible) en el tablero Cuadrado.' },
      'slayer-square-10': { title: 'Verdugo del Cuadrado', desc: 'Vence al Bot Imposible 10 veces en el tablero Cuadrado.' },
      'slayer-square-50': { title: 'Segador del Cuadrado', desc: 'Vence al Bot Imposible 50 veces en el tablero Cuadrado.' },

      // ---- D: Rectangle bots ----
      'beat-rectangle-1': { title: 'Rectángulo: Principiante caído', desc: 'Vence al Bot Principiante en el tablero Rectángulo.' },
      'beat-rectangle-2': { title: 'Rectángulo: Fácil caído', desc: 'Vence al Bot Fácil en el tablero Rectángulo.' },
      'beat-rectangle-3': { title: 'Rectángulo: Medio caído', desc: 'Vence al Bot Medio en el tablero Rectángulo.' },
      'beat-rectangle-4': { title: 'Rectángulo: Difícil caído', desc: 'Vence al Bot Difícil en el tablero Rectángulo.' },
      'beat-rectangle-5': { title: 'Rectángulo: Imposible caído', desc: 'Vence al Bot Imposible en el tablero Rectángulo.' },
      'grandmaster-rectangle': { title: 'Gran maestro del Rectángulo', desc: 'Vence a todos los niveles de Bot (Principiante → Imposible) en el tablero Rectángulo.' },
      'slayer-rectangle-10': { title: 'Verdugo del Rectángulo', desc: 'Vence al Bot Imposible 10 veces en el tablero Rectángulo.' },
      'slayer-rectangle-50': { title: 'Segador del Rectángulo', desc: 'Vence al Bot Imposible 50 veces en el tablero Rectángulo.' },

      // ---- E: cross-shape nightmare ----
      'triple-impossible': { title: 'Azote de pesadillas', desc: 'Vence al Bot Imposible al menos 3 veces en cada forma.' },

      // ---- G: hot-seat volume ----
      'hotseat-5': { title: 'Rivales de sofá', desc: 'Juega 5 partidas locales.' },
      'hotseat-10': { title: 'Pásame el móvil', desc: 'Juega 10 partidas locales.' },
      'hotseat-50': { title: 'Leyenda del salón', desc: 'Juega 50 partidas locales.' },
      'hotseat-100': { title: 'Veterano de mesa', desc: 'Juega 100 partidas locales.' },
      'hotseat-500': { title: 'Héroe de la partida local', desc: 'Juega 500 partidas locales.' },
      'hotseat-1000': { title: 'Soberano de la misma pantalla', desc: 'Juega 1.000 partidas locales.' },

      // ---- H: daily puzzle ----
      'daily-first': { title: 'Aficionado al diario', desc: 'Juega tu primer puzle diario.' },
      'daily-streak-3': { title: 'Puntual', desc: 'Juega el puzle diario 3 días seguidos.' },
      'daily-streak-7': { title: 'Hábito diario', desc: 'Juega el puzle diario 7 días seguidos.' },
      'daily-streak-30': { title: 'Guardián del calendario', desc: 'Juega el puzle diario 30 días seguidos.' },
      'daily-streak-100': { title: 'Sin fallar', desc: 'Juega el puzle diario 100 días seguidos.' },
      'daily-all-attempts': { title: 'Persistente', desc: 'Usa los 3 intentos en un mismo puzle diario.' },
      'daily-top': { title: 'Campeón de puzles', desc: 'Termina en el puesto n.º 1 de una clasificación del puzle diario.' },

      // ---- I: consecutive-day play streak ----
      'streak-5': { title: 'Habitual', desc: 'Juega 5 días seguidos.' },
      'streak-10': { title: 'Comprometido', desc: 'Juega 10 días seguidos.' },
      'streak-50': { title: 'Entregado', desc: 'Juega 50 días seguidos.' },
      'streak-100': { title: 'Centurión', desc: 'Juega 100 días seguidos.' },
      'streak-300': { title: 'Implacable', desc: 'Juega 300 días seguidos.' },
      'streak-500': { title: 'Inquebrantable', desc: 'Juega 500 días seguidos.' },
      'streak-1000': { title: 'Llama eterna', desc: 'Juega 1.000 días seguidos.' },

      // ---- J: distinct days played ----
      'days-7': { title: 'Primera semana', desc: 'Juega en 7 días distintos.' },
      'days-30': { title: 'Asiduo del mes', desc: 'Juega en 30 días distintos.' },
      'days-100': { title: 'Cien días', desc: 'Juega en 100 días distintos.' },

      // ---- K: total games played ----
      'total-100': { title: 'Club de los cien', desc: 'Juega 100 partidas en total (todos los modos).' },
      'total-500': { title: 'Quinientas a las espaldas', desc: 'Juega 500 partidas en total.' },
      'total-1000': { title: 'Mil partidas', desc: 'Juega 1.000 partidas en total.' },
      'total-10000': { title: 'Diez mil', desc: 'Juega 10.000 partidas en total.' },
      'total-50000': { title: 'Leyenda viviente', desc: 'Juega 50.000 partidas en total.' },

      // ---- L: ranked volume ----
      'ranked-first': { title: 'Dando el paso', desc: 'Juega tu primera partida clasificatoria en línea.' },
      'ranked-first-win': { title: 'Primera sangre', desc: 'Gana tu primera partida clasificatoria en línea.' },
      'ranked-play-10': { title: 'Aspirante', desc: 'Juega 10 partidas clasificatorias.' },
      'ranked-play-50': { title: 'Retador', desc: 'Juega 50 partidas clasificatorias.' },
      'ranked-play-100': { title: 'En campaña', desc: 'Juega 100 partidas clasificatorias.' },
      'ranked-play-500': { title: 'Curtido en mil batallas', desc: 'Juega 500 partidas clasificatorias.' },
      'ranked-win-10': { title: 'Vencedor', desc: 'Gana 10 partidas clasificatorias.' },
      'ranked-win-50': { title: 'Conquistador', desc: 'Gana 50 partidas clasificatorias.' },
      'ranked-win-100': { title: 'Señor de la guerra', desc: 'Gana 100 partidas clasificatorias.' },

      // ---- M: "on fire" ranked win streak ----
      'fire-3': { title: 'Calentando motores', desc: 'Gana 3 partidas clasificatorias seguidas.' },
      'fire-5': { title: 'En racha', desc: 'Gana 5 partidas clasificatorias seguidas.' },
      'fire-7': { title: 'Ardiendo', desc: 'Gana 7 partidas clasificatorias seguidas.' },
      'fire-10': { title: 'Infierno', desc: 'Gana 10 partidas clasificatorias seguidas.' },
      'fire-15': { title: 'Imparable', desc: 'Gana 15 partidas clasificatorias seguidas.' },
      'fire-20': { title: 'Arrasando', desc: 'Gana 20 partidas clasificatorias seguidas.' },
      'fire-25': { title: 'Intocable', desc: 'Gana 25 partidas clasificatorias seguidas.' },
      'fire-50': { title: 'Racha legendaria', desc: 'Gana 50 partidas clasificatorias seguidas.' },

      // ---- N: Elo milestones ----
      'elo-1100': { title: 'En ascenso', desc: 'Alcanza una clasificación de 1100.' },
      'elo-1200': { title: 'Hábil', desc: 'Alcanza una clasificación de 1200.' },
      'elo-1400': { title: 'Experto', desc: 'Alcanza una clasificación de 1400.' },
      'elo-1600': { title: 'Maestro', desc: 'Alcanza una clasificación de 1600.' },
      'elo-1800': { title: 'Gran maestro', desc: 'Alcanza una clasificación de 1800.' },
      'elo-2000': { title: 'Élite', desc: 'Alcanza una clasificación de 2000.' },

      // ---- O: ranked skill ----
      'ranked-time-win': { title: 'A contrarreloj', desc: 'Gana una partida clasificatoria dejando a tu oponente sin tiempo.' },
      'ranked-upset': { title: 'Matagigantes', desc: 'Vence a un oponente con 100 o más puntos por encima de ti.' },
      'ranked-rematch-win': { title: 'Sin dudas', desc: 'Gana una revancha.' },

      // ---- P: line / scoring mechanics ----
      'line-8': { title: 'Línea completa', desc: 'Completa una línea de 8 puntos en un solo movimiento.' },
      'corner': { title: 'Acorralado', desc: 'Anota una línea de esquina de 1 punto.' },
      'biggest-line': { title: 'Gran puntuación', desc: 'Anota una sola línea que valga 6 o más.' },
      'claim-10': { title: 'Oportunista', desc: 'Reclama 10 líneas pendientes en total.' },
      'claim-50': { title: 'Carroñero', desc: 'Reclama 50 líneas pendientes en total.' },
      'claim-100': { title: 'Buitre', desc: 'Reclama 100 líneas pendientes en total.' },

      // ---- Q: social / cosmetic ----
      'add-friend': { title: 'Haciendo amigos', desc: 'Añade a tu primer amigo.' },
      'play-friend': { title: 'Rivalidad amistosa', desc: 'Juega una partida contra un amigo al que invitaste.' },
      'refer-friend': { title: 'Reclutador', desc: 'Trae a un jugador totalmente nuevo a través de tu enlace de invitación.' },
      'share-card': { title: 'Presumir', desc: 'Comparte una tarjeta de victoria.' },
      'all-themes': { title: 'Decorador', desc: 'Prueba los ocho temas de color.' },

      // ---- R: non-ranked win streaks ----
      'botstreak-3': { title: 'Mano caliente', desc: 'Gana 3 partidas contra Bots seguidas.' },
      'botstreak-5': { title: 'En la zona', desc: 'Gana 5 partidas contra Bots seguidas.' },
      'botstreak-10': { title: 'Rompemáquinas', desc: 'Gana 10 partidas contra Bots seguidas.' },
    } as Record<string, { title: string; desc: string }>,
    tracks: {
      'Getting started': 'Primeros pasos',
      'Triangle bots': 'Bots del Triángulo',
      'Square bots': 'Bots del Cuadrado',
      'Rectangle bots': 'Bots del Rectángulo',
      'Mastery': 'Maestría',
      'Bot win streak': 'Racha contra Bots',
      'Hot-seat': 'Partida local',
      'Daily puzzle': 'Puzle diario',
      'Play streak': 'Racha de juego',
      'Days played': 'Días jugados',
      'Milestones': 'Hitos',
      'Ranked play': 'Partidas clasificatorias',
      'Ranked wins': 'Victorias clasificatorias',
      'Ranked feats': 'Gestas clasificatorias',
      'Win streak': 'Racha de victorias',
      'Rating': 'Clasificación',
      'Scoring': 'Puntuación',
      'Claims': 'Reclamaciones',
      'Social': 'Social',
    } as Record<string, string>,
    aria: 'Logros',
    close: 'Cerrar',
    title: 'Logros',
    unlocked: 'desbloqueados',
    hiddenReveal: 'Oculto: sigue jugando para revelarlo.',
    statusUnlocked: '✓ Desbloqueado',
    statusLocked: 'Bloqueado',
    pinTitle: 'Muestra esta insignia junto a tu nombre en las partidas',
    featured: '★ Destacado',
    pin: 'Fijar',
    detailHint: 'Toca una insignia para ver para qué sirve.',
    secret: '???',
    hidden: 'Oculto',
    hiddenAria: 'Logro oculto',
    nodeTitle: (name: string, descOrHidden: string) => `${name} — ${descOrHidden}`,
    toastKicker: '🏆 Logro desbloqueado',
  },

  howto: {
    aria: 'Cómo jugar',
    close: 'Cerrar',
    title: 'Cómo jugar',
    tagline: 'Mira cada jugada: el tablero muestra justo lo que ocurre.',
    prev: 'Anterior',
    next: 'Siguiente',
    done: 'Entendido',
    scenes: {
      place: {
        title: 'Coloca un punto',
        body: 'En tu turno, toca cualquier punto vacío para colorearlo. Luego le toca a tu rival.',
      },
      corner: {
        title: 'Una esquina vale 1',
        body: 'Un punto de esquina cuenta como una línea de 1: anota 1 punto por sí solo.',
      },
      lineScored: {
        title: 'Completa una línea',
        body: 'Colorea todos los puntos de una línea recta y anota tantos puntos como su longitud.',
      },
      claim: {
        title: 'Reclama líneas en espera',
        body: 'Un movimiento puede terminar varias líneas: solo anota la más larga; el resto espera. Toca un punto de una línea en espera para reclamar sus puntos. Cualquiera de los dos jugadores puede llevárselos.',
      },
      triThreeWays: {
        title: 'Triángulo: 3 direcciones',
        body: 'Las líneas van en horizontal y a lo largo de ambas diagonales.',
      },
      sqFourWays: {
        title: 'Cuadrado: 4 direcciones',
        body: 'Las líneas van en horizontal, en vertical y a lo largo de ambas diagonales.',
      },
      finish: {
        title: 'Terminar la partida',
        body: 'La partida termina cuando todos los puntos están colocados y todas las líneas reclamadas. Gana quien tenga más puntos; en empate, hay tablas.',
      },
    } as Record<string, { title: string; body: string }>,
  },
};
