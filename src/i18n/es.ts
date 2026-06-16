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
    swapColours: 'Intercambiar colores (Jugador 1 crema · Jugador 2 verde)',
    startGame: 'Empezar partida',
    player1Placeholder: 'Jugador 1',
    player2Placeholder: 'Jugador 2',
  },

  footer: {
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
    thinking: 'Pensando',
    bot: 'BOT',
    aiOpponent: 'Oponente con IA',
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
    tip2: 'Llévate siempre una esquina gratis o una gran finalización.',
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
    yourNameHintSignedIn: (name: string) => `Sesión iniciada como ${name}. Renómbrate en Perfil.`,
    yourNameHint: 'Se usa en el modo contra Bot Y como Jugador 1 en la partida local.',
    hotseatOpponent: 'Oponente de partida local',
    player2Name: 'Nombre del Jugador 2',
    swapColours: 'Intercambiar colores (Jugador 1 crema · Jugador 2 verde)',
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
};
