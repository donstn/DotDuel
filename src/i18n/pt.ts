/**
 * Portuguese — Brazilian (pt-BR). Must satisfy `Messages` (the shape from en.ts).
 *
 * Brazilian gaming conventions: Multijogador, Conquistas, Configurações,
 * Ranqueada, Desistir, Tabuleiro, Marcar (claim), Empate. Register: "você"-style
 * imperatives (Toque, Escolha, Entre). Reviewed in 3 native passes; pending user sign-off.
 */
import type { Messages } from './en';

const pts = (n: number) => `${n} ${n === 1 ? 'ponto' : 'pontos'}`;

export const pt: Messages = {
  common: {
    back: 'Voltar',
    cancel: 'Cancelar',
    close: 'Fechar',
    locked: 'Bloqueado',
    signInToView: 'Entre para ver.',
    signInToPlay: 'Entre para jogar.',
    w: 'V',
    d: 'E',
    l: 'D',
    you: 'Você',
  },

  lang: {
    label: 'Idioma',
    english: 'English',
    lithuanian: 'Lietuvių',
  },

  shapes: {
    triangle: 'Triângulo',
    square: 'Quadrado',
    rectangle: 'Retângulo',
    rhombus: 'Losango',
  },

  difficulty: {
    1: 'Iniciante',
    2: 'Fácil',
    3: 'Médio',
    4: 'Difícil',
    5: 'Impossível',
  },

  menu: {
    tagline:
      'Em turnos, coloque pontos; ao completar uma linha, você ganha pontos conforme o comprimento dela. Pinte todo o tabuleiro: vence quem tiver mais pontos.',
    welcomeLead: 'Boas-vindas,',

    changeTheme: 'Mudar o tema de cores',

    profile: 'Perfil',
    signOut: 'Sair',
    signIn: 'Entrar',
    shareDotDuel: 'Compartilhar DotDuel',

    singlePlayer: 'Um jogador',
    singlePlayerSub: 'Bots e desafio diário.',
    multiplayer: 'Multijogador',
    multiplayerSub: 'Local e ranqueada online.',
    rankings: 'Rankings',
    rankingsSub: 'Desafios, locais e ranqueados.',

    bots: 'Bots',
    botsSub: 'Cinco níveis, do suave ao impiedoso.',

    hotseat: 'Partida local',
    hotseatSub: '1 dispositivo · 2 jogadores.',

    puzzleRankings: 'Ranking de desafios',
    puzzleRankingsSub: 'Melhores pontuações do desafio de hoje.',
    localRankings: 'Ranking local',
    localRankingsSub: 'Seus recordes neste dispositivo.',
    ratedRankings: 'Ranking online',
    ratedRankingsSub: 'Ranking de Elo mundial.',
    achievements: 'Conquistas',
    achievementsSub: 'Emblemas que você ganha jogando.',

    dailyPuzzle: 'Desafio diário',
    dailyDoneSub: (best: number) => `✓ Concluído · melhor ${best} · reinicia à meia-noite (UTC)`,
    dailyDoneTitle: 'Você usou as 3 tentativas. Volte amanhã.',
    dailyAttemptSub: (attempt: number, max: number, best: number) =>
      `Tentativa ${attempt}/${max} · melhor ${best}`,
    dailyFreshSub: (max: number) => `${max} tentativas · 3 min · vence a melhor pontuação.`,
    dailySignInTitle: 'Entre para jogar o desafio de hoje',

    onlineRanked: 'Ranqueada online',
    onlineFindMatch: 'Encontrar uma partida ranqueada.',
    onlineSignInTitle: 'Entre para jogar online',
    onlineUnreachable: 'Servidor inacessível: sua rede pode estar bloqueando-o.',
    onlineUnreachableTitle:
      'Sua rede está bloqueando o servidor do jogo (provavelmente um bloqueador de anúncios/rastreadores ou um filtro DNS)',
    onlineLocked: 'Ativo em outra aba/dispositivo: termine ou feche por lá.',
    onlineLockedTitle: 'Você tem uma sessão multijogador aberta em outra aba ou dispositivo',

    chooseShape: 'Escolha uma forma',
    chooseDifficulty: 'Escolha a dificuldade',
    dots: (n: number) => pts(n),
    level: (d: number) => `Nível ${d}`,
    shapeLockedTitle: 'Vença a forma anterior no Difícil para desbloquear a próxima',

    whosPlaying: 'Quem vai jogar?',
    vsBot: (shape: string, difficulty: string) => `${shape} · contra Bot · ${difficulty}`,
    hotseatHint: (shape: string) => `${shape} · confirme ou altere os nomes antes de começar`,
    yourNameFirst: 'Seu nome — joga primeiro',
    player1First: 'Jogador 1 — joga primeiro',
    player2: 'Jogador 2',
    signedInAs: (name: string) => `Conectado como ${name}. Altere no Perfil.`,
    swapColours: 'Trocar as cores (Jogador 1 ↔ Jogador 2)',
    startGame: 'Começar partida',
    player1Placeholder: 'Jogador 1',
    player2Placeholder: 'Jogador 2',
  },

  footer: {
    howToPlay: 'Como jogar',
    rules: 'Regras',
    settings: 'Configurações',
    privacy: 'Privacidade',
    theme: 'Tema',
    brand: 'DotDuel © 2026',
    brandTitle:
      '© 2026 DotDuel. Todos os direitos reservados. DotDuel e o logotipo DotDuel são marcas reivindicadas pelo seu autor.',
    versionTitle: 'Novidades',
  },

  game: {
    ptsLeft: 'RESTANTES',
    boardAriaLabel: (shape: string) => `Tabuleiro do jogo: ${shape}`,
    liveDraw: (s1: number, s2: number) => `Fim de jogo. Empate, ${s1} a ${s2}.`,
    liveWin: (winner: number, s1: number, s2: number) =>
      `Fim de jogo. O Jogador ${winner} venceu, ${s1} a ${s2}.`,
    liveTurn: (current: number, s1: number, s2: number) =>
      `Vez do Jogador ${current}. Placar: Jogador 1, ${s1}; Jogador 2, ${s2}.`,
    linesToClaim: (n: number) => (n === 1 ? 'linha para marcar' : 'linhas para marcar'),
    pendingTitle:
      'Linhas esperando para serem marcadas: toque em um ponto colorido de uma delas para marcá-la.',
    leaveMatch: 'Sair da partida',
    backToMenu: 'Voltar ao menu',
    dailyTime: 'Seu tempo para esta tentativa',
    seeUnclaimed: 'Ver linhas não marcadas',
    seeUnclaimedTitle: (on: boolean) =>
      `Ver linhas não marcadas: ${on ? 'ativado' : 'desativado'}`,
    rules: 'Como jogar',
    showRules: 'Mostrar regras',
    resign: 'Desistir',
    resignTitle: 'Desistir e encerrar a partida',
    resignConfirmTitle: 'Desistir?',
    resignConfirmBody: 'Você vai perder esta partida.',
    resignRankedTitle: 'Desistir desta partida ranqueada?',
    resignRankedBody: 'Contará como derrota no seu histórico ranqueado.',
    dailyForfeitTitle: 'Sair desta tentativa?',
    dailyForfeitBody: (remaining: number, max: number) =>
      `Isso vai usar 1 das suas ${max} tentativas diárias — restarão ${remaining} depois disso.`,
    dailyForfeitConfirm: 'Sair',
    thinking: 'Pensando',
    bot: 'BOT',
    aiOpponent: 'Oponente de IA',
  },

  rules: {
    aria: 'Como jogar DotDuel',
    close: 'Fechar regras',
    title: 'Como jogar DotDuel',
    tagline: 'Jogue em turnos. Complete linhas. Faça mais pontos.',
    goalH: 'Objetivo',
    goalP: 'Faça mais pontos que seu oponente.',
    turnH: 'A cada turno',
    turnP: 'Faça uma destas ações e o turno passa para o adversário:',
    turnTapEmpty: 'Toque em um ponto vazio para colori-lo.',
    turnTapClaim:
      'Toque em um ponto de uma linha concluída e não marcada para marcar os pontos dela (nenhum ponto novo é colocado).',
    scoringH: 'Pontuação',
    scoringP:
      'Uma linha é qualquer sequência reta de pontos: horizontal, vertical ou diagonal. Quando todos os pontos dela estão coloridos, ela vale tantos pontos quanto o seu comprimento.',
    score3: 'Linha de 3 pontos → 3 pts',
    score5: 'Linha de 5 pontos → 5 pts',
    score8: 'Linha de 8 pontos → 8 pts',
    scoreCorner: 'Um ponto de canto conta como uma “linha” de 1 pt',
    catchH: 'A pegadinha: um movimento, uma pontuação',
    catchP:
      'Se o seu ponto concluir várias linhas de uma vez, você pontua apenas a mais longa. As outras linhas concluídas ficam não marcadas: qualquer um pode marcá-las em um turno posterior.',
    watchH: 'Fique de olho no tabuleiro',
    watchP:
      'O jogo não sinaliza as linhas não marcadas. Identifique uma linha totalmente colorida que não esteja riscada e toque em qualquer um de seus pontos para marcá-la. Pontos de graça por prestar atenção.',
    endH: 'Fim da partida',
    endP:
      'Quando todos os pontos estão coloridos e todas as linhas concluídas foram marcadas. Vence quem tiver mais pontos; em caso de igualdade, é empate.',
    tipsH: 'Dicas',
    tip1: 'Evite jogadas que concluam duas linhas: você entrega o resto.',
    tip2: 'Pegue sempre um canto de graça ou uma grande conclusão.',
    tip3: 'Às vezes bloquear (0 pontos) é mais esperto que pontuar pouco.',
    tip4: 'No fim da partida, procure linhas não marcadas antes de jogar.',
    modesH: 'Modos',
    modeBotsLead: 'Contra Bots',
    modeBots: '— cinco níveis de dificuldade. Vença no Fácil com uma forma para desbloquear a próxima.',
    modeHotseatLead: 'Partida local',
    modeHotseat: '— dois jogadores, um dispositivo.',
    modeMpLead: 'Multijogador',
    modeMp: '— ao vivo, com ranking Elo mundial, controles de tempo estilo xadrez e revanches.',
    gotIt: 'Entendi',
  },

  settings: {
    aria: 'Configurações',
    close: 'Fechar configurações',
    title: 'Configurações',
    tagline: 'Salvo localmente neste dispositivo.',
    yourName: 'Seu nome',
    yourNameHintSignedIn: (name: string) => `Conectado como ${name}. Renomeie no Perfil.`,
    yourNameHint: 'Usado no modo contra Bot E como Jogador 1 na partida local.',
    hotseatOpponent: 'Oponente da partida local',
    player2Name: 'Nome do Jogador 2',
    swapColours: 'Trocar as cores (Jogador 1 ↔ Jogador 2)',
    privacyH: 'Privacidade',
    whoCanChallenge: 'Quem pode me desafiar para uma partida?',
    everyone: 'Todos',
    friendsOnly: 'Apenas amigos',
    nobody: 'Ninguém',
    showStatus: 'Mostrar meu status para os amigos',
    showStatusHint:
      'Quando desativado, seus amigos veem você como offline. Os pedidos de amizade continuam funcionando; só o indicador de status ao vivo fica oculto.',
    resetProgress: 'Redefinir progresso',
    resetProgressConfirm: 'Redefinir o progresso? As formas e os níveis desbloqueados serão perdidos.',
    resetStats: 'Redefinir estatísticas',
    resetStatsConfirm:
      'Redefinir estatísticas? O histórico de vitórias/empates/derrotas de todos os jogadores neste dispositivo será apagado.',
    renameNote:
      'Observação: mudar seu nome inicia uma nova linha de estatísticas. O histórico do nome antigo é mantido com aquele nome.',
    appearanceH: 'Aparência',
    colourTheme: 'Tema de cores',
    changeTheme: 'Mudar',
    done: 'Concluído',
  },

  theme: {
    aria: 'Escolha um tema',
    close: 'Fechar temas',
    title: 'Tema',
    tagline: 'Escolha uma paleta. Salvo neste dispositivo.',
    sunFriendly: 'Bom sob o sol',
    done: 'Concluído',
    taglines: {
      'forest-pearl': 'O original. Esmeralda sobre vinheta jade.',
      'royal-court': 'Veludo violeta contra ouro antigo.',
      'tempo-rivals': 'Vermelho-vinho contra azul-céu. Clássico.',
      'sunset-catan': 'Desertos de terracota, peças de pergaminho.',
      'coral-reef': 'Águas verde-azuladas profundas, peças de coral.',
      'twilight-cosmos': 'Vazio índigo contra ciano elétrico.',
      'monochrome-pro': 'Peças em preto e branco sobre madeira. Contraste máximo.',
      'vintage-press': 'Tinta bordô e azul-marinho sobre pergaminho. Bom sob o sol.',
    },
  },

  changelog: {
    aria: 'Novidades',
    close: 'Fechar',
    title: 'Novidades',
    tagline: 'Atualizações recentes do DotDuel, da mais nova para a mais antiga.',
    empty: 'Ainda não há notas de versão.',
    entryEmpty: 'Notas de versão em breve.',
    added: 'Adicionado',
    changed: 'Alterado',
    fixed: 'Corrigido',
    done: 'Concluído',
    months: ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'],
    entries: {
      'Alpha 0.4.12.2': {
        highlight: 'O app agora fala ainda mais o seu idioma',
        changes: [
          'O nome do oponente IA, a imagem/texto do cartão de vitória compartilhado e algumas telas de status de conexão ficavam presos em inglês, independente do seu idioma — agora estão traduzidos.',
          'Todas as notas de versão anteriores deste histórico (desde o início) já estão disponíveis em lituano, espanhol, português, polonês e tcheco, não só em inglês.',
        ],
      },
      'Alpha 0.4.12.1': {
        highlight: 'Correção',
        changes: [
          'Corrigido o tabuleiro pulando/encolhendo em celulares quando a pontuação passava de 2 para 3 dígitos.',
        ],
      },
      'Alpha 0.4.12.0': {
        highlight: 'Ajustes',
        changes: [
          'O seletor de idioma foi movido para o canto superior esquerdo para não sobrepor mais a logo (o botão de tema continua no canto superior direito).',
          'Os dois cards de jogador no celular agora espelham um ao outro corretamente, em vez de parecerem desalinhados.',
          'As cores da partida local e a opção "trocar cores" agora seguem o tema escolhido, em vez de sempre mostrar creme e verde.',
          'O botão/gesto de voltar agora navega pelos menus e telas um passo de cada vez, em vez de sair do app — partidas ranqueadas e tentativas do desafio diário continuam pedindo confirmação antes.',
        ],
      },
      'Alpha 0.4.11.0': {
        highlight: 'Como jogar',
        changes: [
          'Novo guia "Como jogar" com pequenos exemplos animados em um tabuleiro real — veja um canto marcar 1 ponto, uma linha se completar, várias linhas esperando para serem marcadas, e como as linhas correm em cada direção no Triângulo (3 formas) e no Quadrado (4 formas). Abra pelo rodapé, ao lado de Regras; toque no tabuleiro para pausar, deslize ou use as setas para navegar.',
          'O tema de cores agora é escolhido em Configurações (saiu do rodapé para abrir espaço para o "Como jogar").',
        ],
      },
      'Alpha 0.4.10.1': {
        highlight: 'Correções',
        changes: [
          'Os pop-ups de conquista desbloqueada e o menu de idiomas agora são sólidos e fáceis de ler (antes eram transparentes, deixando o conteúdo atrás aparecer). O pop-up de conquista também ficou maior.',
          'Entrar em um novo dispositivo não mostra mais todas as conquistas que você já tinha ganhado.',
          'A conquista "Encurralado" (marcar uma linha de canto de 1 ponto) agora é desbloqueada corretamente — antes não estava sendo registrada.',
        ],
      },
      'Alpha 0.4.10.0': {
        highlight: 'Totalmente traduzido',
        changes: [
          'O aplicativo inteiro agora está traduzido, não só os menus. Seu Perfil, Amigos e convites, o lobby multijogador e as telas de partida, a tela de Fim de Jogo, os Rankings e o ranking do desafio diário, o compartilhamento e todas as 97 Conquistas (nomes e descrições) agora aparecem em inglês, lituano, espanhol, português, polonês e tcheco.',
        ],
      },
      'Alpha 0.4.9.0': {
        highlight: 'Idiomas',
        changes: [
          'O DotDuel agora fala seis idiomas: inglês, lituano, espanhol, português, polonês e tcheco. Escolha o seu no botão de idioma no canto superior direito do menu.',
          'O jogo agora inicia automaticamente no seu idioma — pelas configurações do navegador na web, e pelo idioma do dispositivo no aplicativo.',
        ],
      },
      'Alpha 0.4.8.0': {
        highlight: 'Conquistas',
        changes: [
          'Conquistas! Ganhe até 100 emblemas jogando — vencendo os Bots em cada forma e nível, sequências de vitórias, desafios diários, sequências de dias e grandes marcos. Encontre-as em Rankings → Conquistas; cada emblema acende nas cores do seu tema ao ser desbloqueado, e você recebe um aviso "🏆 Conquista desbloqueada" no momento em que a ganha.',
          'Fixe um emblema favorito para mostrá-lo ao lado do seu nome enquanto joga.',
        ],
      },
      'Alpha 0.4.7.0': {
        highlight: 'Novo menu + Bots',
        changes: [
          'O menu principal foi reorganizado em três seções claras — Um jogador, Multijogador e Rankings — cada uma abrindo uma lista organizada com seus próprios ícones.',
          'Os oponentes do computador agora são chamados de "Bots" em vez de "IA" em todo o app.',
          'Escolher uma forma de tabuleiro ou um nível de bot agora mostra um ícone correspondente — a forma do tabuleiro, e o rosto de cada bot para sua dificuldade.',
          'No Android, o app agora permanece no modo retrato ao inclinar o celular.',
        ],
      },
      'Alpha 0.4.6.2': {
        changes: [
          'Card de resultado compartilhado reformulado: um tabuleiro maior, o resultado mostrado de forma simples como Vitória / Derrota / Empate, e o QR code agora nas cores do jogo no centro do tabuleiro com a legenda "Escaneie para jogar agora!".',
        ],
      },
      'Alpha 0.4.6.0': {
        changes: [
          'Os cards de resultado compartilhados agora trazem um QR code para escanear — os amigos podem apontar a câmera (ou tocar e segurar a imagem) para entrar direto no jogo. Os links de convite agora usam um código de convite privado em vez do seu ID de conta.',
        ],
      },
      'Alpha 0.4.5.3': {
        changes: [
          'Card de compartilhamento redesenhado: o tabuleiro agora fica sobre a mesa de feltro 3D real, como no jogo, o texto está centralizado, e o endereço DotDuel.com ficou muito mais fácil de ler.',
        ],
      },
      'Alpha 0.4.5.2': {
        changes: [
          'O card de compartilhamento agora é renderizado em resolução dupla — sem mais pixels visíveis ao abrir a imagem em tela cheia no Messenger ou WhatsApp.',
        ],
      },
      'Alpha 0.4.5.1': {
        changes: [
          'Card de compartilhamento: o tabuleiro agora se parece com o jogo de verdade (espessura das linhas ajustada; os pontos não ficam mais escondidos em tabuleiros cheios) e a pontuação não sobrepõe mais o rótulo "pts".',
        ],
      },
      'Alpha 0.4.5.0': {
        highlight: 'Mais rápido em celulares',
        changes: [
          'Efeitos gráficos mais leves durante a partida — o jogo roda visivelmente mais suave em celulares de entrada, sem mudar a aparência.',
          'O ranking agora mostra linhas de espaço reservado enquanto carrega e um botão de tentar de novo se a conexão cair.',
          'Política de privacidade atualizada: provedor de backend corrigido para Supabase, com divulgações do app Android e do AdMob adicionadas.',
          'App Android: o botão voltar agora fecha os pop-ups abertos em vez de fechar o jogo.',
        ],
      },
      'Alpha 0.4.4.0': {
        highlight: 'Compartilhe seu resultado',
        changes: [
          'Novo botão "Compartilhar resultado" na tela de fim de jogo — ele monta uma imagem do seu tabuleiro finalizado com a pontuação e compartilha em qualquer lugar, junto com um link que seus amigos podem usar para jogar contra você.',
        ],
      },
      'Alpha 0.4.3.0': {
        highlight: 'Tabuleiro mais limpo, texto maior',
        changes: [
          'Removidas as dicas em balão que apareciam durante a partida — passavam rápido demais para ler e atrapalhavam. A tela de Regras e a visão "Ver linhas não marcadas" continuam ensinando a pontuação.',
          'Aumentado todo texto pequeno para um tamanho mínimo legível em todo o app, melhorando a legibilidade e a acessibilidade.',
        ],
      },
      'Alpha 0.4.2.0': {
        highlight: 'Desafio diário renovado — um tabuleiro compartilhado, corrida contra o relógio',
        changes: [
          'O desafio diário agora é o mesmo tabuleiro para todos, todos os dias: uma forma aleatória com uma abertura pré-jogada, e então 3 minutos no relógio para fazer a maior pontuação possível. Melhor de 3 tentativas.',
          'A classificação diária agora é pela sua pontuação (não pela margem contra a IA), e o ranking mostra o vencedor de cada dia dos últimos 30 dias.',
        ],
      },
      'Alpha 0.4.1.0': {
        highlight: 'Os temas de cores agora estilizam o tabuleiro inteiro',
        changes: [
          'Os temas de cores agora estilizam o tabuleiro inteiro — a superfície de jogo, as peças, a celebração de vitória e os botões combinam com o esquema escolhido, em vez de um tabuleiro verde aparecer sob qualquer tema.',
          'Em partidas online, quem começa agora é decidido por sorteio justo, e as revanches alternam quem começa — assim, ao longo de uma série, cada um joga primeiro cerca de metade das vezes.',
          'O oponente do computador joga mais rápido, deixando as partidas contra a IA mais ágeis.',
          'Menus, pop-ups e a tela de fim de jogo abrem de forma mais suave, com menos travamentos.',
          'Formas e dificuldades bloqueadas agora mostram um cadeado claro em vez de parecerem apagadas ou quebradas.',
          'Os campos de e-mail e senha para entrar agora estão claramente visíveis, e as peças ficam mais legíveis contra o tabuleiro em qualquer tema.',
        ],
      },
      'Alpha 0.4.0.0': {
        highlight: 'Atualização do servidor + multijogador mais suave',
        changes: [
          'Multijogador movido para um backend novo e mais rápido, para partidas mais confiáveis.',
          'Os relógios do multijogador agora são suaves e justos — seu relógio não pula mais nem continua correndo depois que você joga.',
          'Os convites de partida agora permanecem na tela até o amigo responder, e você pode aceitá-los direto na tela de resultado.',
          'Agora você é encontrável automaticamente pelo seu nome de usuário, para que amigos possam te adicionar sem passos extras.',
        ],
      },
      'Alpha 0.3.7.0': {
        highlight: 'App com atualização automática + correção da rolagem do menu',
        changes: [
          'O app agora se atualiza sozinho — se você adicionou o DotDuel à tela inicial, ele passa a buscar novas versões automaticamente em vez de ficar preso numa versão antiga em cache.',
          'No celular, o menu agora rola corretamente, deixando o card de Rankings totalmente visível no final.',
        ],
      },
      'Alpha 0.3.6.1': {
        highlight: 'Posição do tabuleiro no celular',
        changes: [
          'O tabuleiro no celular agora realmente sobe para perto dos cards de jogador (a tentativa anterior não tinha funcionado).',
        ],
      },
      'Alpha 0.3.6.0': {
        highlight: 'Entre para jogar',
        changes: [
          'A primeira abertura agora começa com uma tela "Entre para jogar" — entre para multijogador e progresso sincronizado na nuvem, ou escolha "jogar anônimo" para entrar direto.',
          'No celular, o tabuleiro agora fica junto aos cards de jogador em vez de deixar um espaço grande acima.',
        ],
      },
      'Alpha 0.3.5.0': {
        highlight: 'Vencedores de desafios anteriores + rankings mais organizados',
        changes: [
          'O ranking de desafios agora tem uma aba "Vencedores recentes" — quem venceu cada um dos últimos 30 dias, com a data ao lado de cada nome.',
          'O ranking global de Elo agora começa pela classificação: posição, Elo e depois o nome do jogador.',
        ],
      },
      'Alpha 0.3.4.0': {
        highlight: 'Celebrações de vitória de acordo com a dificuldade',
        changes: [
          'Sua celebração de vitória agora cresce com o desafio — uma pequena explosão para uma vitória contra o Iniciante, aumentando nível a nível até o show dourado completo por derrotar o Impossível.',
        ],
      },
      'Alpha 0.3.3.0': {
        highlight: 'Um tabuleiro mais limpo e polido — pronto para o beta',
        changes: [
          'Moldura do tabuleiro redesenhada: o feltro agora fica numa borda uniformemente espaçada, com cantos arredondados suaves e um leve efeito 3D recuado — e encaixa corretamente em cada forma, incluindo a ponta afiada do triângulo (antes o contorno parecia desigual).',
          'Os cards de jogador na partida agora ficam totalmente visíveis na tela como cards arredondados, em vez de vazarem para fora das bordas.',
          'Corrigido um pop-up de dica no jogo cujo texto podia ultrapassar o tabuleiro.',
        ],
      },
      'Alpha 0.3.2.0': {
        highlight: 'Um visual mais premium · celebrações de vitória',
        changes: [
          'Ajuste visual geral — os botões e os cards de Contra-IA / forma / dificuldade agora têm profundidade 3D de verdade (levantam ao passar o mouse e afundam ao clicar), e os botões principais combinam com a cor de cada tema em vez de sempre serem verdes.',
          'Celebrações de vitória! Terminar uma partida com uma vitória dispara fogos de artifício e confete — com um show dourado exagerado por derrotar a IA Impossível.',
        ],
      },
      'Alpha 0.3.1.0': {
        highlight: 'Direto para o jogo · como jogar mais claro na tela inicial',
        changes: [
          'Removido o pop-up do tutorial inicial — o jogo agora abre direto no menu. O "como jogar" é uma única linha clara na tela inicial, e as regras completas estão sempre a um toque de distância pelo botão ?.',
        ],
      },
      'Alpha 0.3.0.0': {
        highlight: 'Anúncios sustentam o jogo gratuito · proteção contra ausência no multijogador',
        changes: [
          'Pequenos anúncios agora aparecem no menu e nas telas gratuitas de um jogador (Contra Bot, Partida local, Diário) para manter o DotDuel gratuito. Sem anúncios durante partidas ranqueadas. O consentimento é gerenciado por um aviso de privacidade do Google.',
          'Proteção contra ausência no multijogador: se um jogador não fizer o primeiro movimento em 10 segundos, a partida é cancelada sem mudança de classificação para nenhum dos lados — assim uma desconexão ou distração no início nunca custa pontos.',
        ],
      },
      'Alpha 0.2.9.0': {
        highlight: 'Reformulação visual + legível em qualquer tema',
        changes: [
          'Visual renovado: tipografia nova, um tabuleiro emoldurado que combina com cada forma (triângulo, losango, quadrado), peças mais brilhantes e pontuações mais claras.',
          'Os painéis de jogador se ajustam graciosamente conforme a tela encolhe — no celular eles viram um card compacto com o avatar ao lado do nome, dando mais espaço ao tabuleiro.',
          'Configurações, Regras e Privacidade foram organizadas em cards limpos, mais fáceis de ler.',
          'Os pontos vazios agora aparecem claramente em qualquer tema, em vez de se misturarem ao tabuleiro — especialmente nos temas claros.',
          'Botões, a tela de Fim de Jogo e os pop-ups não ficam mais difíceis de ler nos temas claros (Monochrome Pro, Vintage Press) — texto e fundo mantêm contraste adequado em todos os lugares agora.',
        ],
      },
      'Alpha 0.2.8.0': {
        highlight: 'Jogo completo pelo teclado',
        changes: [
          'Jogo completo pelo teclado: Tab para ir ao tabuleiro, setas para mover entre os pontos, Enter ou Espaço para colocar ou marcar uma linha.',
          'Partidas ranqueadas agora encontram um oponente bot em cerca de 15 segundos quando não há humanos disponíveis, em vez de até um minuto.',
        ],
      },
      'Alpha 0.2.7.2': {
        highlight: 'Correção: tremulação / tela preta no fim de jogo',
        changes: [
          'A tremulação (e a tela preta ocasional) do meio ao fim da partida em tabuleiros mais cheios acabou. Cada linha completada usava um efeito de mesclagem aditiva para um destaque mais brilhante; no Quadrado e no Retângulo, isso empilhava dezenas de camadas de composição na GPU, eventualmente estourando a memória gráfica do celular. As linhas agora são renderizadas com cores simples de alto contraste — o visual brilhante de "fita" é mantido, a falha não.',
        ],
      },
      'Alpha 0.2.7.1': {
        highlight: 'Correção: sem mais tremulação no Quadrado/Retângulo',
        changes: [
          'O destaque de "Ver linhas não marcadas" agora só aparece no tabuleiro Triângulo. No Quadrado e no Retângulo, ele ocasionalmente causava tremulação e escurecimento da tela quando havia muitas linhas não marcadas. A opção fica oculta nessas formas até que o bug visual seja corrigido.',
        ],
      },
      'Alpha 0.2.7.0': {
        highlight: 'Desafio diário: 3 tentativas + ranking',
        changes: [
          'Agora você tem 3 tentativas no desafio de hoje, em vez de 1. Sua melhor margem é a que conta — a sequência ainda avança na primeira conclusão do dia.',
          'Novo card "Ranking de desafios" no menu. As maiores margens de hoje ao vivo, ordenadas da maior para a menor. Empates são desempatados por quem terminou primeiro. Rankings históricos (por dia, mês, busca por nome) em breve.',
        ],
      },
      'Alpha 0.2.6.0': {
        highlight: 'Desafio de hoje',
        changes: [
          'Novo card "Desafio de hoje" no menu. Uma tentativa por dia contra a IA Difícil em uma forma rotativa. A pontuação é sua margem (você menos a IA), e cada vitória soma um dia à sua sequência no Perfil. O desafio de amanhã é liberado à meia-noite (UTC).',
          'É preciso entrar na conta para jogar o desafio diário e construir uma sequência — a sequência fica na sua conta, então funciona em qualquer dispositivo.',
        ],
      },
      'Alpha 0.2.5.0': {
        highlight: 'Base para a sequência diária',
        changes: [
          'Nova seção "Sequência diária" no seu Perfil, pronta para o desafio diário (que vem a seguir). Quando o desafio for lançado, completá-lo todo dia constrói sua sequência em todos os seus dispositivos — guardada na sua conta, não no navegador, então sobrevive a limpezas de cache e trocas de dispositivo.',
        ],
      },
      'Alpha 0.2.4.0': {
        highlight: 'Compartilhar + convidar pelo menu',
        changes: [
          'Agora você pode compartilhar o DotDuel direto do menu principal. Jogadores conectados veem "Convidar um amigo" — os links carregam sua indicação, então a pessoa vira sua amiga automaticamente ao se cadastrar. Quem não está conectado vê um link "Compartilhar DotDuel" abaixo do login, para compartilhar o jogo de forma simples e rápida.',
        ],
      },
      'Alpha 0.2.3.0': {
        highlight: 'Dicas de aprendizado + opção de linhas marcáveis',
        changes: [
          'Dicas contextuais que aparecem uma única vez enquanto você aprende: na primeira vez que você pontua, na primeira vez que um único movimento fecha duas linhas (regra da maior linha apenas), na primeira vez que uma linha fica esperando para ser marcada no início do seu turno, e perto do fim da partida.',
          'Novo ícone de olho "Mostrar linhas marcáveis" ao lado do botão de regras no modo contra Bot Iniciante/Fácil/Médio/Difícil. Ativado por padrão do Iniciante ao Médio, desativado no Difícil. Oculto no Impossível, na partida local e no multijogador — ler o tabuleiro faz parte do desafio.',
          'O armazenamento interno de configurações foi atualizado; será pedido que você digite seu nome novamente e verá o pop-up do tutorial de novo na primeira abertura. Estatísticas, desbloqueios e dados da conta não são afetados.',
        ],
      },
      'Alpha 0.2.2.0': {
        highlight: 'Pontuação visível',
        changes: [
          'A pontuação agora é visível: um "+N" flutuante aparece do ponto que completou a linha na sua cor, o selo da sua pontuação pulsa quando muda, e o selo de "linhas para marcar" pisca quando uma nova linha fica pendente.',
        ],
      },
      'Alpha 0.2.1.0': {
        highlight: 'Telemetria nos bastidores',
        changes: [
          'Interno: adicionada análise anônima de funil para jogadores que aceitaram o aviso de cookies — ajuda a ver onde o jogo frustra novos jogadores, para que possamos suavizar esses pontos. Nenhum dado pessoal sai do dispositivo.',
        ],
      },
      'Alpha 0.2.0.0': {
        highlight: 'Amigos e convites',
        changes: [
          'Lista de amigos. Adicione um amigo pelo nome de usuário, veja quais amigos estão online e o que estão fazendo (contra IA, partida local, partida ranqueada), convide um amigo para uma partida específica (sua escolha de forma, controle de tempo, ranqueada ou casual). Convites recebidos enquanto você está em uma partida ficam na fila e aparecem assim que você volta ao menu. Um convite ranqueado só conta para o Elo se ambos os lados escolherem Ranqueada; caso contrário, é uma partida casual. Depois de uma partida multijogador, você pode adicionar o oponente como amigo com um toque.',
          'Indique um amigo: convide pessoas para experimentar o DotDuel — elas ainda não precisam de uma conta. Use o menu de compartilhamento do seu celular ou seu cliente de e-mail; nunca vemos o endereço delas. Quando elas se cadastrarem, você recebe um pedido de amizade automaticamente.',
          'Configurações → Privacidade: escolha quem pode te desafiar para uma partida (Todos / Apenas amigos / Ninguém) e se seu status ao vivo é visível para os amigos.',
        ],
      },
      'Alpha 0.1.5.0': {
        highlight: 'Limpeza no backend',
        changes: [
          'Interno: o estado das partidas multijogador foi migrado totalmente para o novo transporte. O antigo caminho pelo Realtime Database não é mais usado para dados de partida. Sem diferença visível — se algo, um pouco mais ágil.',
        ],
      },
      'Alpha 0.1.4.4': {
        highlight: 'Atualizar página volta ao início',
        changes: [
          'Atualizar a página (forçar recarregamento) depois de uma partida terminada agora volta ao menu principal, em vez de repetir a mesma tela de Fim de Jogo a cada recarregamento.',
        ],
      },
      'Alpha 0.1.4.3': {
        highlight: 'Botão Pronto + limpeza de abas travadas',
        changes: [
          'O botão Pronto agora responde instantaneamente ao toque, em vez de esperar a ida e volta pela rede, e contra a IA a partida começa assim que você o pressiona (sem esperar a contagem regressiva).',
          'Se você assumiu a sessão multijogador em um segundo dispositivo, o primeiro dispositivo não mostra mais um fim de jogo fantasma da partida que você terminou lá.',
        ],
      },
      'Alpha 0.1.4.2': {
        highlight: 'Recuperação de trava de sessão',
        changes: [
          'Se uma sessão anterior ficou presa segurando a trava do multijogador, agora você pode tocar no botão Multijogador para assumir aqui, em vez de esperar ela liberar sozinha.',
          'Travas de sessão presas agora se liberam sozinhas duas vezes mais rápido (45s em vez de 90s) quando a aba que a segurava desaparece.',
        ],
      },
      'Alpha 0.1.4.1': {
        highlight: 'Ajustes no multijogador',
        changes: [
          'O botão Pronto agora realmente inicia a partida assim que os dois lados o pressionam (contra a IA, isso significa assim que você o pressiona).',
          'O primeiro movimento de uma partida não demora mais 8-9 segundos até o oponente reagir.',
          'Entrar em um segundo dispositivo não te joga mais acidentalmente na sua partida ativa no primeiro.',
          'Botões do menu alinhados ao mesmo tamanho para um visual mais limpo.',
        ],
      },
      'Alpha 0.1.4.0': {
        highlight: 'Multijogador agora funciona em mais redes',
        changes: [
          'O multijogador agora conecta em redes que antes bloqueavam o servidor do jogo (Whalebone, AdGuard, NextDNS, Brave Shields e filtros DNS parecidos). O jogo usa um novo caminho de transporte que trafega por HTTPS padrão e não é bloqueado por listas de bloqueio de rastreadores. Se o multijogador costumava travar na tela de carregamento para você, tente de novo.',
        ],
      },
      'Alpha 0.1.3.6': {
        highlight: 'Correção na exibição do relógio',
        changes: [
          'A exibição do relógio no multijogador não pisca mais a cada movimento.',
        ],
      },
      'Alpha 0.1.3.5': {
        highlight: 'Mensagem amigável de rede offline',
        changes: [
          'Se sua rede bloqueia o servidor do jogo (comum com bloqueadores de anúncios/rastreadores no celular, como AdGuard, NextDNS ou Whalebone), o Multijogador agora mostra uma explicação clara com dicas de solução, em vez de travar em uma tela de carregamento. O modo um jogador contra a IA funciona offline normalmente.',
        ],
      },
      'Alpha 0.1.3.1': {
        highlight: 'Correção de botão no celular',
        changes: [
          'Os botões de Multijogador e Sair às vezes não faziam nada em navegadores móveis rígidos com privacidade (Brave, Firefox Focus). A interface agora faz a transição imediatamente e a limpeza acontece em segundo plano.',
        ],
      },
      'Alpha 0.1.3.0': {
        highlight: 'Exército de bots — nunca espere sozinho',
        changes: [
          'Se nenhum humano for encontrado em ~15s, você será pareado com um oponente de IA ranqueado (Pip, Cricket, Ranger, Knight ou Voidstar). Eles contam para o Elo e aparecem no ranking.',
          'A tela de busca agora avisa quando um bot pode entrar em cena.',
          'O botão de revanche agora fica oculto quando seu oponente era um bot (bots não aceitam revanches).',
        ],
      },
      'Alpha 0.1.2.5': {
        highlight: 'Continuação da correção de cadastro',
        changes: [
          'Escolher um nome de usuário agora funciona mesmo se uma tentativa de cadastro anterior deixou um perfil incompleto',
          'Botão de sair na tela de escolha de nome, para você nunca ficar travado',
        ],
      },
      'Alpha 0.1.2.4': {
        highlight: 'Correção de cadastro',
        changes: [
          'Cadastrar uma nova conta não falha mais com um erro de "permissões ausentes" ao escolher um nome de usuário',
        ],
      },
      'Alpha 0.1.2.3': {
        highlight: 'Links compartilháveis + reforço de segurança',
        changes: [
          'Ícone da aba do navegador e ícone da tela inicial — os dois pontos do DotDuel aparecem onde quer que você salve ou instale o jogo',
          'Prévias de compartilhamento — colar o link do DotDuel no Discord, Telegram, Slack ou Twitter agora mostra um card com a marca e o slogan em vez de uma caixa em branco',
          'Mudanças de nome de usuário agora acontecem de forma atômica — o nome antigo é liberado e o novo é reservado na mesma operação',
          'Reforço de segurança nos bastidores — política de segurança de conteúdo mais rígida, limites de taxa no servidor para exclusão de conta e verificação de nome de usuário, limpeza programada de partidas encerradas (em até ~24h, conforme a política de privacidade), e IDs de usuário hasheados nos registros do servidor',
        ],
      },
      'Alpha 0.1.2.2': {
        highlight: 'Ritmo e legibilidade do multijogador',
        changes: [
          'A forma de tabuleiro do multijogador é desbloqueada em 50 e 100 partidas ranqueadas (Quadrado, depois Retângulo)',
          'Bala (1 min) e Rápida (5 min) temporariamente bloqueadas — só o Relâmpago (3 min) disponível enquanto a base de jogadores cresce',
          'O pop-up de Regras agora diz que o multijogador está ativo',
          'Os títulos "Campeão do DotDuel" e "Impossível — vencido" estavam invisíveis nos temas claros',
        ],
      },
      'Alpha 0.1.2.1': {
        highlight: 'Ajustes de tema',
        changes: [
          'Cada tema de cores agora tem suas próprias cores de texto e de marca, em vez de usar o verde padrão',
          'O selo de provisório estava invisível no tema Vintage Press (pergaminho)',
        ],
      },
      'Alpha 0.1.2': {
        highlight: 'Ajustes de experiência',
        changes: [
          'O seletor de tema agora é acessível de qualquer tela pelo rodapé',
          'Relógio visível no celular no multijogador',
          'O destaque do último movimento agora mostra o ponto do oponente, não o seu',
          'A tela de vitória agora conta COMO você venceu (no tempo / nos pontos / oponente desistiu)',
          'Os pop-ups no celular eram impossíveis de fechar — o botão de fechar agora está sempre acessível',
          'O selo do rodapé quebra para uma segunda linha em celulares estreitos, em vez de ser cortado',
          'O seletor de tema e outros pop-ups agora têm rolagem correta quando o conteúdo é mais alto que a tela',
          'Os pop-ups ficavam ilegíveis no desktop quando o aviso de cookies estava visível — o tamanho dos pop-ups agora reserva espaço corretamente',
        ],
      },
      'Alpha 0.1': {
        highlight: 'O DotDuel está no ar!',
        changes: [
          'Lançamento do alfa público — multijogador, ranking, temas, modo amigável ao sol',
        ],
      },
    } as Record<string, { highlight?: string; changes: string[] }>,
  },

  privacy: {
    aria: 'Política de Privacidade',
    close: 'Fechar',
    title: 'Política de Privacidade',
    tagline: 'O que coletamos, por que coletamos e como excluir.',
    whoH: 'Quem somos',
    whoP: 'O DotDuel é um jogo independente de colorir pontos para dois jogadores. O controlador dos seus dados pessoais sob o GDPR é o desenvolvedor. Contato:',
    collectH: 'O que coletamos',
    collectP: 'Apenas o necessário para o jogo funcionar e ser justo.',
    collectAccountLead: 'Conta:',
    collectAccount:
      'e-mail, nome de exibição, provedor de login (Google ou senha) e data de criação da conta. Fonte: você, pelo Supabase Auth ao se cadastrar.',
    collectRatingLead: 'Classificação multijogador:',
    collectRating:
      'seu Elo atual, o contador de partidas de colocação e a data/hora da última partida. Fonte: calculada no servidor ao fim de cada partida ranqueada.',
    collectHistoryLead: 'Histórico de partidas:',
    collectHistory:
      'cada partida ranqueada armazena os IDs de ambos os jogadores, os nomes de exibição, as pontuações finais, as variações de classificação, a forma, o controle de tempo, a duração e como a partida terminou (normal / tempo esgotado / desistência).',
    collectLiveLead: 'Estado da partida ao vivo:',
    collectLive:
      'enquanto uma partida multijogador está em andamento, armazenamos o tabuleiro, o relógio e de quem é a vez no nosso banco de dados em tempo real. Isso é excluído logo após o fim da partida.',
    collectFriendsLead: 'Amigos e convites:',
    collectFriends:
      'sua lista de amigos, pedidos pendentes, status online e convites para partidas. Se você entrou pelo link de convite ou QR code de outro jogador, registramos qual jogador convidou você (o código de convite aleatório dele, para que futuras recompensas por indicação possam ser concedidas).',
    collectDeviceLead: 'Dados apenas do dispositivo:',
    collectDevice:
      'seu progresso de um jogador, as estatísticas contra IA / de partida local, a preferência de tema e o indicador de “tutorial visto”. Armazenados no localStorage do seu navegador e nunca transmitidos para nós.',
    collectAnalyticsLead: 'Análises (somente se você aceitar):',
    collectAnalytics:
      'eventos coletados automaticamente pelo Google Analytics: visualizações de página, modelo do dispositivo, idioma, tamanho da tela e ID de sessão anônimo. Não vinculado à sua conta no nosso sistema.',
    whyH: 'Por que coletamos (bases legais)',
    whyContractLead: 'Contrato (art. 6.1.b):',
    whyContract:
      'conta, classificação, histórico de partidas e estado da partida ao vivo: tudo necessário para operar o serviço multijogador no qual você se cadastrou.',
    whyLegitLead: 'Legítimo interesse (art. 6.1.f):',
    whyLegit:
      'a tabela de classificação e o jogo ranqueado, para oferecer um ambiente justo e competitivo a todos os jogadores.',
    whyConsentLead: 'Consentimento (art. 6.1.a):',
    whyConsentAds:
      'Google Analytics E Google AdSense: ambos são carregados somente depois que você clicar em Aceitar no aviso de consentimento. Se recusar ou não decidir, nenhum dos dois inicia.',
    whyConsentNoAds:
      'Google Analytics: carregado somente depois que você clicar em Aceitar no aviso de consentimento. Se recusar ou não decidir, ele nunca inicia.',
    sharedH: 'Com quem é compartilhado',
    sharedAds:
      'Usamos o Supabase (banco de dados, autenticação, infraestrutura em tempo real e funções serverless, hospedado na UE) como provedor de backend, além do Google para login e análises condicionadas ao consentimento, e o Google AdSense para exibir pequenos banners de anúncios em algumas telas de menu. Tanto o Analytics quanto o AdSense são carregados somente depois que você aceitar o aviso de consentimento. O Supabase e o Google tratam os dados de acordo com seus termos padrão / acordos de tratamento de dados. Não vendemos nem compartilhamos seus dados com nenhum outro terceiro.',
    sharedNoAds:
      'Usamos o Supabase (banco de dados, autenticação, infraestrutura em tempo real e funções serverless, hospedado na UE) como provedor de backend, além do Google para login e análises condicionadas ao consentimento. O Analytics é carregado somente depois que você aceitar o aviso de consentimento. O Supabase e o Google tratam os dados de acordo com seus termos padrão / acordos de tratamento de dados. Não vendemos nem compartilhamos seus dados com nenhum outro terceiro. Atualmente não usamos redes de anúncios de terceiros.',
    keepH: 'Por quanto tempo guardamos',
    keepAccountLead: 'Conta + tabela de classificação:',
    keepAccount: 'até você excluir sua conta.',
    keepHistoryLead: 'Histórico de partidas:',
    keepHistory: 'até 24 meses após o fim da partida; depois, excluído permanentemente.',
    keepLiveLead: 'Estado da partida ao vivo:',
    keepLive: 'excluído em cerca de 24 horas após o fim da partida.',
    keepAnalyticsLead: 'Análises:',
    keepAnalytics: 'conforme os padrões do Google (atualmente 14 meses para dados de eventos).',
    keepDeviceLead: 'Dados apenas do dispositivo:',
    keepDevice: 'permanecem até você limpar os dados do navegador.',
    rightsH: 'Seus direitos',
    rightsP: 'Sob o GDPR, você tem o direito de:',
    rightAccessLead: 'Acessar',
    rightAccess: 'os dados pessoais que temos sobre você: use “Baixar meus dados” no seu Perfil.',
    rightRectifyLead: 'Corrigir',
    rightRectify: 'dados incorretos: use o botão “Renomear” no seu Perfil.',
    rightEraseLead: 'Excluir',
    rightErase:
      'sua conta (“direito ao esquecimento”): use “Excluir minha conta” no seu Perfil. O efeito é imediato.',
    rightPortLead: 'Portar',
    rightPort: 'seus dados: o download acima é um arquivo JSON legível por máquina que você pode levar para outro lugar.',
    rightObjectLead: 'Opor-se',
    rightObject: 'às análises: use o botão abaixo ou clique em Recusar no aviso na primeira abertura.',
    rightComplainLead: 'Apresentar uma reclamação',
    rightComplain:
      'à sua autoridade nacional de proteção de dados se você acreditar que tratamos seus dados de forma inadequada.',
    rankingsNoteLead: 'Observação importante sobre as classificações.',
    rankingsNote:
      'Se você excluir sua conta (ou for removido por qualquer motivo), seu nome de exibição e o identificador da conta são apagados de todos os registros públicos. No entanto, as mudanças de classificação que você causou no Elo de outros jogadores NÃO são revertidas: as partidas passadas são imutáveis. Os oponentes contra quem você jogou mantêm seus ganhos e perdas de classificação; o histórico de partidas deles mostra “Jogador excluído” onde antes estava o seu nome.',
    cookiesH: 'Cookies e análises',
    cookiesP:
      'Não usamos cookies de rastreamento. Nosso login (Supabase Auth) usa armazenamento de sessão próprio para manter você conectado. O Google Analytics usa cookies, mas só se você aceitar abaixo.',
    currentChoice: 'Escolha atual de análises:',
    choiceAccepted: 'Aceitas',
    choiceDeclined: 'Recusadas',
    choiceUndecided: 'Ainda não decididas',
    acceptAnalytics: 'Aceitar análises',
    declineAnalytics: 'Recusar análises',
    consentReloadHint:
      'Mudar de Aceitas para Recusadas recarregará a página para parar completamente o SDK do Analytics.',
    contactH: 'Como entrar em contato',
    contactP: 'Para qualquer dúvida de privacidade, pedido de acesso a dados ou reclamação:',
    effectiveH: 'Data de vigência',
    effectiveLead: (date: string) =>
      `Esta política entra em vigor a partir de ${date}. Vamos atualizá-la aqui se algo material mudar. A versão canônica é publicada em`,
    done: 'Concluído',
  },

  profile: {
    aria: 'Perfil',
    close: 'Fechar',
    title: 'Seu perfil',
    tagline: 'Dados da conta + histórico offline.',
    accountH: 'Conta',
    gameName: 'Nome no jogo',
    rename: 'Renomear',
    email: 'E-mail',
    signInMethod: 'Método de login',
    providerGoogle: 'Google',
    providerEmail: 'E-mail e senha',
    providerUnknown: 'Desconhecido',
    emailUnverified:
      'E-mail ainda não verificado. Procure na sua caixa de entrada (e no spam) o link que enviamos.',
    fallbackName: 'Jogador 1',
    accountFallback: 'Conta',
    multiplayerH: 'Multijogador',
    rating: 'Classificação',
    provisional: (n: number, total: number) => `Provisória ${n}/${total}`,
    provisionalTitle: 'A classificação se estabiliza após 10 partidas ranqueadas',
    lastMatches: (n: number) => `Últimas ${n} partidas`,
    noMatches: 'Nenhuma partida ranqueada ainda. Entre na fila pelo menu.',
    streakH: 'Sequência diária',
    streakEmpty: 'Jogue o desafio de hoje para iniciar uma sequência. (Em breve.)',
    currentStreak: 'Sequência atual',
    longest: 'Maior',
    dayN: (n: number) => `Dia ${n}`,
    streakHint: 'A sequência conta as conclusões do desafio diário. Perca um dia e ela zera.',
    offlineHistoryH: (name: string) => `Histórico offline — “${name}”`,
    offlineEmpty:
      'Ainda não há partidas neste dispositivo. Inicie uma partida contra IA ou local para preencher isto.',
    totalGames: 'Total de partidas',
    vsBotsWDL: 'Contra Bots · V/E/D',
    hotseatWDL: 'Partida local · V/E/D',
    pointsScored: 'Pontos marcados',
    pointsGiven: 'Pontos cedidos',
    avg: (v: string) => `média ${v}`,
    offlineHint: 'Armazenado neste dispositivo com o nome das Configurações. A sincronização na nuvem vem a seguir.',
    dataH: 'Seus dados',
    dataHint:
      'Sob o GDPR, você pode baixar tudo o que temos sobre você ou excluir sua conta por completo. A exclusão é imediata e não pode ser desfeita.',
    preparing: 'Preparando…',
    downloadData: 'Baixar meus dados',
    deleteAccount: 'Excluir minha conta',
    signOut: 'Sair',
    done: 'Concluído',
    deleteFailed: 'Falha na exclusão. Tente novamente.',
    deleteConfirmTitle: 'Excluir sua conta?',
    deleteConfirmBody:
      'Isto remove permanentemente sua conta, seu login e sua entrada na tabela de classificação, e apaga seu nome das partidas passadas. Os oponentes mantêm o histórico de classificação deles. Se você estiver em uma partida ao vivo, ela será dada como perdida. Isto não pode ser desfeito.',
    cancel: 'Cancelar',
    deleting: 'Excluindo…',
    deleteForever: 'Excluir para sempre',
  },

  signIn: {
    aria: 'Entrar',
    close: 'Fechar',
    titleGate: 'Entre para jogar',
    titleSignIn: 'Entrar',
    titleSignUp: 'Criar conta',
    google: 'Continuar com o Google',
    orEmail: 'ou com e-mail',
    emailPlaceholder: 'voce@exemplo.com',
    passwordPlaceholder: 'Senha (mín. 6 caracteres)',
    confirmPlaceholder: 'Confirmar senha',
    submitSignIn: 'Entrar',
    submitSignUp: 'Criar conta',
    newHere: 'É novo por aqui?',
    createAccount: 'Crie uma conta',
    haveOne: 'Já tem uma?',
    signInLink: 'Entrar',
    tryAnon: 'Quer tentar anônimo sem entrar?',
    accountCreated: (email: string) =>
      `Conta criada. Se a confirmação por e-mail estiver ativa, verifique ${email} (e o spam) para confirmar.`,
    errPasswordsMatch: 'As senhas não coincidem.',
    errInvalidCreds: 'E-mail ou senha incorretos.',
    errAlreadyRegistered: 'Esse e-mail já está cadastrado. Entre em vez de criar conta.',
    errWeakPassword: 'A senha deve ter pelo menos 6 caracteres.',
    errInvalidEmail: 'Esse e-mail não parece válido.',
    errNotConfirmed: 'Primeiro confirme seu e-mail (verifique sua caixa de entrada).',
    errRateLimit: 'Tentativas demais. Tente novamente em um minuto.',
    errNetwork: 'Erro de rede. Verifique sua conexão e tente novamente.',
    errGeneric: 'Algo deu errado.',
  },

  username: {
    ariaClaim: 'Escolha um nome no jogo',
    ariaRename: 'Renomear',
    cancel: 'Cancelar',
    titleClaim: 'Escolha seu nome no jogo',
    titleRename: 'Renomear',
    taglineClaim:
      'É isso que os outros jogadores vão ver. Exclusivo seu. Você pode renomear depois.',
    taglineRename: 'As estatísticas seguem sua conta, não o nome — elas são mantidas.',
    placeholder: 'ex.: Donatas',
    claim: 'Reservar nome',
    save: 'Salvar',
    signOut: 'Sair',
    checking: 'Verificando…',
    available: 'Disponível',
    taken: 'Em uso — tente outro',
    hint: '3–16 caracteres · letras, dígitos, _ ou -',
    checkFailed: 'Falha na verificação.',
    genericError: 'Algo deu errado.',
    invalidShort: 'No mínimo 3 caracteres.',
    invalidLong: 'No máximo 16 caracteres.',
    invalidChars: 'Apenas letras, dígitos, _ ou -.',
  },

  friendStatus: {
    menu: 'No menu',
    'in-ai': 'Contra Bots',
    'in-hotseat': 'Partida local',
    'in-ranked': 'Partida ranqueada',
    'searching-ranked': 'Procurando…',
    'in-daily': 'Desafio de hoje',
    offline: 'Offline',
  },

  timeControls: {
    '1min': { label: 'Bala', per: '1 minuto por jogador', sub: 'Rápida e frenética.' },
    '3min': { label: 'Relâmpago', per: '3 minutos por jogador', sub: 'Padrão equilibrado.' },
    '5min': { label: 'Rápida', per: '5 minutos por jogador', sub: 'Tempo para pensar.' },
  },

  friends: {
    online: (n: number) => `👥 ${n} online`,
    friends: '👥 Amigos',
    addFriendTitle: 'Adicionar um amigo',
    onlineOfTotal: (online: number, total: number) => `${online} de ${total} online`,
    newBadge: (n: number) => `${n} novos`,
    aria: 'Amigos',
    close: 'Fechar',
    title: 'Amigos',
    tabOnline: 'Online',
    tabAll: 'Todos',
    tabRequests: 'Pedidos',
    emptyOnline: 'Nenhum amigo online agora.',
    emptyAll: 'Ainda sem amigos — adicione um abaixo.',
    addByUsername: 'Adicionar um amigo pelo nome de usuário',
    usernamePlaceholder: 'nome de usuário',
    sending: 'Enviando…',
    send: 'Enviar',
    requestSent: 'Pedido enviado.',
    requestFailed: 'Falha no pedido.',
    removeConfirm: (name: string) => `Remover ${name} dos amigos?`,
    blockConfirm: (name: string) =>
      `Bloquear ${name}? Ele não poderá enviar pedidos de amizade nem convites para partidas.`,
    inviteToGame: 'Convidar para uma partida',
    friendMustBeOnMenu: 'O amigo precisa estar no menu',
    invite: 'Convidar',
    more: 'Mais',
    removeFriend: 'Remover amigo',
    block: 'Bloquear',
    statusAria: (label: string) => `Status: ${label}`,
    noPending: 'Nenhum pedido pendente.',
    incomingH: 'Recebidos',
    wantsToBeFriends: 'quer ser seu amigo',
    accept: 'Aceitar',
    decline: 'Recusar',
    sentH: 'Enviados',
    waitingForThem: 'aguardando resposta',
    cancel: 'Cancelar',
  },

  invite: {
    aria: 'Enviar convite',
    close: 'Fechar',
    title: (name: string) => `Convidar ${name}`,
    waiting: (name: string) => `Convite enviado para ${name}. Aguardando aceitar…`,
    cancelInvite: 'Cancelar convite',
    declined: (name: string) => `${name} não aceitou o convite.`,
    sendAgain: 'Enviar de novo',
    shapeH: 'Forma',
    timeH: 'Controle de tempo',
    ranked: 'Partida ranqueada',
    rankedHint:
      'Conta para o Elo só se o seu oponente também aceitar ranqueada. Caso contrário, é uma partida casual.',
    cancel: 'Cancelar',
    send: 'Enviar convite',
    sending: 'Enviando…',
    inviteFailed: 'Falha no convite.',
    reasonOffline: 'está offline',
    reasonSearching: 'está procurando partida',
    reasonInGame: 'está em uma partida',
    declinedReason: (name: string, reason: string) => `${name} ${reason}.`,
    cantInviteNow: (name: string, reason: string) =>
      `${name} ${reason} — não dá para convidar agora.`,
    toastAria: 'Convites para partidas',
    aFriend: 'Um amigo',
    invitesYou: 'convida você',
    theyPickedRanked: 'Ele escolheu Ranqueada',
    declineFrom: (name: string) => `Recusar convite de ${name}`,
    decline: 'Recusar',
    acceptCasual: 'Aceitar casual',
    acceptRanked: 'Aceitar ranqueada',
    accept: 'Aceitar',
  },

  share: {
    title: 'DotDuel — estratégia de pontos rápida para 2 jogadores',
    textInvite: 'Bora uma partida rápida de pontos comigo?',
    textShare: 'Conheça o DotDuel — um jogo de estratégia de pontos rápido para 2 jogadores.',
    labelInvite: '➕ Convidar um amigo',
    labelShare: 'Compartilhar DotDuel',
    linkCopied: 'Link copiado — cole onde quiser',
    couldNotShare: 'Não foi possível compartilhar — tente de novo',
    preparing: 'Preparando…',
    shareResult: '📤 Compartilhar resultado',
    imageCopied: 'Imagem copiada — cole onde quiser',
    imageCopyFailed: 'Não foi possível copiar a imagem — tente Baixar',
    textCopied: 'Texto e link copiados',
    textCopyFailed: 'Não foi possível copiar — tente Baixar',
    imageSaved: 'Imagem salva',
    dialogAria: 'Compartilhar seu resultado',
    dialogTitle: 'Compartilhar seu resultado',
    close: 'Fechar',
    resultCardAlt: 'Seu card de resultado',
    copyImage: '📋 Copiar imagem',
    copyTextLink: '🔗 Copiar texto + link',
    hintCardLink:
      'Seu link mostra a imagem do card automaticamente ao ser colado. Para uma imagem embutida, use Copiar imagem e cole na sua publicação.',
    hintNoCardLink:
      'Os botões das plataformas compartilham seu texto e link. Para incluir a imagem, use Copiar imagem e cole na sua publicação.',
    downloadImage: '⬇ Baixar imagem',

    result: {
      genericBot: 'Bot',
      ptsLabel: 'pts',
      scanCaption: 'Escaneie para jogar agora!',
      ctaWin: 'Consegue me vencer?',
      ctaLoss: 'Acha que consegue fazer melhor?',
      ctaDraw: 'Desempata?',

      tagDaily: 'DESAFIO DIÁRIO',
      tagVsBot: (shape: string) => `CONTRA BOT · ${shape.toUpperCase()}`,
      tagRanked: (shape: string) => `RANQUEADA · ${shape.toUpperCase()}`,
      tagHotseat: (shape: string) => `PARTIDA LOCAL · ${shape.toUpperCase()}`,

      dailyHeadline: 'Desafio de hoje',
      dailyCta: 'Consegue superar?',
      dailyShareText: (score: number, url: string) =>
        `Fiz ${score} pontos no desafio de hoje do DotDuel — consegue superar?\n${url}`,

      aiHeadlineWin: (level: string) => `Bot ${level} — derrotado`,
      aiHeadlineLoss: (level: string) => `O Bot ${level} venceu esta`,
      aiHeadlineDraw: (level: string) => `Empate contra o Bot ${level}`,
      aiShareTextWin: (level: string, s1: number, s2: number, shape: string, url: string) =>
        `Venci o Bot ${level} por ${s1}–${s2} no tabuleiro ${shape} no DotDuel — e você?\n${url}`,
      aiShareTextLoss: (level: string, s2: number, s1: number, url: string) =>
        `O Bot ${level} me venceu por ${s2}–${s1} no DotDuel. Acha que consegue fazer melhor?\n${url}`,
      aiShareTextDraw: (level: string, s1: number, s2: number, url: string) =>
        `Empatei com o Bot ${level} por ${s1}–${s2} no DotDuel. Consegue terminar o serviço?\n${url}`,

      rankedHeadlineWin: (elo: string) => `Vitória ranqueada${elo}`,
      rankedHeadlineLoss: 'Partida ranqueada difícil',
      rankedHeadlineDraw: 'Empate ranqueado',
      rankedShareTextWin: (myScore: number, oppScore: number, elo: string, url: string) =>
        `Acabei de vencer uma partida ranqueada do DotDuel por ${myScore}–${oppScore}${elo} — consegue me vencer?\n${url}`,
      rankedShareTextLoss: (myScore: number, oppScore: number, url: string) =>
        `Acabei de jogar uma partida ranqueada do DotDuel (${myScore}–${oppScore}). Topa um jogo?\n${url}`,
      rankedShareTextDraw: (myScore: number, oppScore: number, url: string) =>
        `Partida ranqueada do DotDuel empatada (${myScore}–${oppScore}). Desempata para nós?\n${url}`,

      hotseatHeadlineWin: (winnerName: string) => `${winnerName} venceu`,
      hotseatHeadlineDraw: 'Empate total',
      hotseatShareTextWin: (
        winnerName: string,
        loserName: string,
        winnerScore: number,
        loserScore: number,
        url: string,
      ) =>
        `${winnerName} venceu ${loserName} por ${winnerScore}–${loserScore} no DotDuel. Acha que consegue fazer melhor?\n${url}`,
      hotseatShareTextDraw: (p1: string, p2: string, s1: number, s2: number, url: string) =>
        `${p1} e ${p2} empataram por ${s1}–${s2} no DotDuel. Desempata para nós?\n${url}`,
    },
  },

  gameOver: {
    oppWantsRematchTitle: 'Seu oponente quer revanche',
    acceptRematch: 'Aceitar revanche',
    waitingForOpponent: 'Aguardando o oponente…',
    cancel: 'Cancelar',
    rematch: 'Revanche',
    youWin: 'Você venceu',
    playerWins: (name: string) => `${name} venceu`,
    aborted: 'Partida cancelada',
    abortedSub: 'sem primeiro movimento · sem mudança de classificação',
    draw: 'A partida terminou empatada',
    youLost: 'Você perdeu',
    onPoints: 'nos pontos',
    onTime: 'no tempo',
    oppResigned: 'oponente desistiu',
    oppDisconnected: 'oponente desconectou',
    youResigned: 'você desistiu',
    disconnected: 'desconectou',
    drawTitle: 'Empate',
    champion: 'Campeão do DotDuel',
    impossibleDefeated: 'Impossível — vencido',
    rating: 'Classificação',
    timesUp: '⏱ Tempo esgotado',
    yourScore: 'Sua pontuação:',
    bestToday: 'Melhor de hoje:',
    attemptOf: (n: number) => ` · tentativa ${n}/3`,
    streakLabel: 'Sequência:',
    dayN: (n: number) => `Dia ${n}`,
    bestDay: (n: number) => `(melhor: Dia ${n})`,
    attemptsLeft: (n: number) =>
      `${n} tentativa${n === 1 ? '' : 's'} restante${n === 1 ? '' : 's'} hoje. Sua melhor conta no ranking.`,
    allAttemptsUsed: 'Você usou as 3 tentativas. Volte amanhã à meia-noite (UTC).',
    savingResult: 'Salvando resultado…',
    menu: 'Menu',
    lobby: 'Lobby',
    playAgain: 'Jogar de novo',
    leaderboard: 'Ranking',
    tryAgainN: (n: number) => `Tentar de novo (${n} restante${n === 1 ? '' : 's'})`,
    addAsFriend: (name: string) => `➕ Adicionar ${name} como amigo`,
    sendingRequest: 'Enviando pedido…',
    friendRequestSent: 'Pedido de amizade enviado.',
    couldntSend: 'Não foi possível enviar — tente de novo',
    champHeadline: 'Você concluiu o DotDuel para um jogador!',
    champBody:
      'Você dominou todas as formas em todos os níveis. O desafio mais difícil que resta são humanos de verdade.',
    comingSoonTitle: 'Em breve',
    multiplayerComingSoon: 'Multijogador · em breve',
    impossibleHeadline: (shape: string) => `Você derrotou a IA mais difícil no ${shape}.`,
    impossibleBody: (nextShape: string, beginner: string) =>
      `${nextShape} é sua próxima montanha. Comece do ${beginner} e suba de novo até o topo.`,
    tryShape: (shape: string) => `Experimentar ${shape}`,
    shapeUnlockedHeadline: (shape: string) => `${shape} foi desbloqueado!`,
    shapeUnlockedBody: (shape: string) =>
      `Um tabuleiro novo com uma nova estratégia. Ou continue no ${shape} e aumente a dificuldade.`,
    pushTo: (level: string, shape: string) => `Ou avance para ${level} no ${shape}`,
    levelUnlockedHeadline: (level: string) => `${level} desbloqueado.`,
    levelUnlockedBody: 'A IA acabou de ficar mais esperta. Pronto para encará-la?',
    tryLevel: (level: string) => `Experimentar ${level}`,
    niceOne: 'Mandou bem.',
    niceOneBody: 'Você já venceu isto. Quer um desafio mais difícil?',
  },

  lobby: {
    back: '‹ Voltar',
    title: 'Multijogador',
    intro: (rating: number) =>
      `Escolha um controle de tempo. Vamos pareá-lo com outro jogador de classificação semelhante (a sua: ${rating}).`,
    lockedTitle: (openLabel: string) =>
      `Bloqueado enquanto a base de jogadores cresce — por enquanto, só o ${openLabel} está aberto para manter o pareamento rápido.`,
    comingBackSoon: 'Voltará em breve',
    board: 'Tabuleiro:',
    unlockHint: (nextLabel: string, n: number) =>
      `— ${nextLabel} desbloqueia em mais ${n} ${n === 1 ? 'jogo' : 'jogos'} ranqueado${n === 1 ? '' : 's'}.`,
    findMatch: 'Encontrar partida ranqueada',
  },

  matchmaking: {
    finding: 'Procurando um oponente…',
    waitingAtRating: (s: number) => `Aguardando um jogador da sua classificação (${s}s)`,
    stillSearching: (s: number) =>
      `Ainda procurando — podemos pareá-lo com uma IA ranqueada em breve (${s}s)`,
    cancelSearch: 'Cancelar busca',
    rangeHint:
      'A faixa de pareamento aumenta cerca de 25 de Elo por segundo. Vamos pareá-lo com o oponente mais próximo.',
  },

  matchFound: {
    opponentFound: 'Oponente encontrado!',
    youPlayerN: (n: number) => `Você · Jogador ${n}`,
    playerN: (n: number) => `Jogador ${n}`,
    ready: '✓ Pronto',
    notReady: '— Não está pronto',
    vs: 'vs',
    bot: 'BOT',
    aiOpponent: 'Oponente de IA',
    bothReady: 'Ambos prontos — começando…',
    startsIn: (s: number) => `Começa em ${s}`,
    shapeLine: (shape: string) => `Forma: ${shape}. O Jogador 1 começa.`,
    shapeRandom: 'aleatória',
    readyWaiting: '✓ Pronto — aguardando o oponente',
    readyBtn: 'Pronto!',
    backToMenu: 'Voltar ao menu',
  },

  clock: {
    remaining: (time: string) => `${time} restantes`,
  },

  mpUnavailable: {
    heading: 'Multijogador indisponível',
    blockedHint:
      'Sua rede está bloqueando o servidor do jogo. A causa mais comum é um bloqueador de anúncios/rastreadores (Whalebone, AdGuard, NextDNS, Pi-hole) ou um filtro DNS no seu celular ou roteador.',
    tryLabel: 'Tente:',
    tryWifi: 'outra rede Wi-Fi ou dados móveis',
    tryBrowser: 'outro navegador',
    tryDisableFilters: 'desativar filtros DNS / VPN por um momento',
    tryWhitelist: (domain: string) => `liberar ${domain} no seu bloqueador`,
    offlineHint: 'O modo um jogador contra os bots funciona offline — abra o Menu e escolha Bots.',
  },

  mpConnecting: {
    heading: 'Conectando à partida…',
    hint: 'Conectando ao servidor do jogo. Se isso demorar mais de ~10 segundos, algo deu errado — volte e tente de novo.',
  },

  rankings: {
    aria: 'Rankings',
    backToRankings: 'Voltar aos rankings',
    closeRankings: 'Fechar rankings',
    back: 'Voltar',
    close: 'Fechar',
    aiOpponent: 'Oponente de IA',
    player: 'Jogador',
    h2hTagline: 'Histórico de confrontos diretos por oponente.',
    title: 'Rankings',
    globalTagline: 'Elo mundial entre todos os jogadores multijogador.',
    localTagline: 'Perfis locais neste dispositivo — histórico contra IA e de partida local.',
    globalElo: 'Elo mundial',
    local: 'Local',
    shape: 'Forma:',
    all: 'Todas',
    emptyLocalAll: 'Nenhuma partida registrada ainda neste dispositivo.',
    emptyLocalShape: (shape: string) => `Nenhuma partida em ${shape} ainda.`,
    colRank: '#',
    colPlayer: 'Jogador',
    colGames: 'Partidas',
    colWinPct: '% de vitórias',
    deleteProfile: 'Excluir perfil',
    noH2H: 'Nenhum confronto direto registrado.',
    colOpponent: 'Oponente',
    colWinPctShort: 'V %',
    colLossPctShort: 'D %',
    colDrawPctShort: 'E %',
    done: 'Concluído',
    confirmAria: 'Confirmar exclusão de perfil',
    deleteTitle: 'Excluir perfil?',
    deleteBody: (name: string) =>
      `${name} será removido dos rankings e de todos os confrontos diretos neste dispositivo.`,
    deleteConfirm2: 'Quer mesmo excluir isto? Os dados não poderão ser recuperados.',
    cancel: 'Cancelar',
    signInPrompt: 'Entre para ver o ranking de Elo mundial.',
    signIn: 'Entrar',
    loadError: 'Não foi possível carregar o ranking — verifique sua conexão.',
    tryAgain: 'Tentar de novo',
    colElo: 'Elo',
    emptyGlobal: 'Nenhuma partida multijogador ranqueada jogada ainda. Seja o primeiro a liderar.',
    you: 'você',
    summaryGames: 'partidas',
    winRate: 'taxa de vitórias',
  },

  puzzleBoard: {
    aria: 'Ranking do desafio',
    close: 'Fechar',
    title: 'Vencedores do dia',
    tagline:
      'A maior pontuação leva o dia. Empates vão para quem terminou primeiro. Reinicia à meia-noite (UTC).',
    loading: 'Carregando…',
    empty: 'Ninguém concluiu o desafio diário ainda. Seja o primeiro.',
    today: 'Hoje',
    date: (month: string, day: number) => `${day} de ${month}`,
    you: ' (você)',
    done: 'Concluído',
  },

  sidePanel: {
    featuredTitle: (title: string) => `${title} — toque para ver as conquistas`,
    noGames: 'sem partidas ainda',
    botLabel: (level: string) => `Bot · ${level}`,
    botShort: (level: number) => `Bot N${level}`,
    hotseat: 'Partida local',
    hotseatShort: 'PL',
    statsTitle: (label: string, total: number, record: string, pct: string) =>
      `${label}: ${total} partidas · ${record} · ${pct} de vitórias`,
    pointsTitle: (games: number, scored: number, given: number, avgS: string, avgG: string) =>
      `Em ${games} partidas: ${scored} pts marcados, ${given} pts cedidos. Médias de ${avgS} / ${avgG} por partida.`,
    aiLabel: (level: string) => `Oponente de IA, dificuldade ${level}`,
  },

  achievements: {
    byId: {
      // Onboarding (4)
      'first-game': { title: 'Primeiros passos', desc: 'Jogue sua primeira partida.' },
      'first-win': { title: 'Vencedor', desc: 'Vença sua primeira partida.' },
      'first-claim': { title: 'Caçador de linhas', desc: 'Marque sua primeira linha pendente.' },
      'all-shapes': { title: 'Cartógrafo', desc: 'Desbloqueie todas as formas de tabuleiro jogáveis.' },

      // Triangle bots (8)
      'beat-triangle-1': { title: 'Triângulo: Iniciante vencido', desc: 'Vença o Bot Iniciante no tabuleiro Triângulo.' },
      'beat-triangle-2': { title: 'Triângulo: Fácil vencido', desc: 'Vença o Bot Fácil no tabuleiro Triângulo.' },
      'beat-triangle-3': { title: 'Triângulo: Médio vencido', desc: 'Vença o Bot Médio no tabuleiro Triângulo.' },
      'beat-triangle-4': { title: 'Triângulo: Difícil vencido', desc: 'Vença o Bot Difícil no tabuleiro Triângulo.' },
      'beat-triangle-5': { title: 'Triângulo: Impossível vencido', desc: 'Vença o Bot Impossível no tabuleiro Triângulo.' },
      'grandmaster-triangle': { title: 'Grão-mestre do Triângulo', desc: 'Vença todos os níveis de Bot (Iniciante → Impossível) no tabuleiro Triângulo.' },
      'slayer-triangle-10': { title: 'Carrasco do Triângulo', desc: 'Vença o Bot Impossível 10 vezes no tabuleiro Triângulo.' },
      'slayer-triangle-50': { title: 'Ceifador do Triângulo', desc: 'Vença o Bot Impossível 50 vezes no tabuleiro Triângulo.' },

      // Square bots (8)
      'beat-square-1': { title: 'Quadrado: Iniciante vencido', desc: 'Vença o Bot Iniciante no tabuleiro Quadrado.' },
      'beat-square-2': { title: 'Quadrado: Fácil vencido', desc: 'Vença o Bot Fácil no tabuleiro Quadrado.' },
      'beat-square-3': { title: 'Quadrado: Médio vencido', desc: 'Vença o Bot Médio no tabuleiro Quadrado.' },
      'beat-square-4': { title: 'Quadrado: Difícil vencido', desc: 'Vença o Bot Difícil no tabuleiro Quadrado.' },
      'beat-square-5': { title: 'Quadrado: Impossível vencido', desc: 'Vença o Bot Impossível no tabuleiro Quadrado.' },
      'grandmaster-square': { title: 'Grão-mestre do Quadrado', desc: 'Vença todos os níveis de Bot (Iniciante → Impossível) no tabuleiro Quadrado.' },
      'slayer-square-10': { title: 'Carrasco do Quadrado', desc: 'Vença o Bot Impossível 10 vezes no tabuleiro Quadrado.' },
      'slayer-square-50': { title: 'Ceifador do Quadrado', desc: 'Vença o Bot Impossível 50 vezes no tabuleiro Quadrado.' },

      // Rectangle bots (8)
      'beat-rectangle-1': { title: 'Retângulo: Iniciante vencido', desc: 'Vença o Bot Iniciante no tabuleiro Retângulo.' },
      'beat-rectangle-2': { title: 'Retângulo: Fácil vencido', desc: 'Vença o Bot Fácil no tabuleiro Retângulo.' },
      'beat-rectangle-3': { title: 'Retângulo: Médio vencido', desc: 'Vença o Bot Médio no tabuleiro Retângulo.' },
      'beat-rectangle-4': { title: 'Retângulo: Difícil vencido', desc: 'Vença o Bot Difícil no tabuleiro Retângulo.' },
      'beat-rectangle-5': { title: 'Retângulo: Impossível vencido', desc: 'Vença o Bot Impossível no tabuleiro Retângulo.' },
      'grandmaster-rectangle': { title: 'Grão-mestre do Retângulo', desc: 'Vença todos os níveis de Bot (Iniciante → Impossível) no tabuleiro Retângulo.' },
      'slayer-rectangle-10': { title: 'Carrasco do Retângulo', desc: 'Vença o Bot Impossível 10 vezes no tabuleiro Retângulo.' },
      'slayer-rectangle-50': { title: 'Ceifador do Retângulo', desc: 'Vença o Bot Impossível 50 vezes no tabuleiro Retângulo.' },

      // Cross-shape nightmare (1)
      'triple-impossible': { title: 'Algoz do pesadelo', desc: 'Vença o Bot Impossível ao menos 3 vezes em cada forma.' },

      // Hot-seat (6)
      'hotseat-5': { title: 'Rivais de sofá', desc: 'Jogue 5 partidas locais.' },
      'hotseat-10': { title: 'Passa o celular', desc: 'Jogue 10 partidas locais.' },
      'hotseat-50': { title: 'Lenda da sala', desc: 'Jogue 50 partidas locais.' },
      'hotseat-100': { title: 'Veterano de mesa', desc: 'Jogue 100 partidas locais.' },
      'hotseat-500': { title: 'Herói da partida local', desc: 'Jogue 500 partidas locais.' },
      'hotseat-1000': { title: 'Soberano da mesma tela', desc: 'Jogue 1.000 partidas locais.' },

      // Daily puzzle (7)
      'daily-first': { title: 'Estreante diário', desc: 'Jogue seu primeiro desafio diário.' },
      'daily-streak-3': { title: 'Em dia', desc: 'Jogue o desafio diário por 3 dias seguidos.' },
      'daily-streak-7': { title: 'Hábito diário', desc: 'Jogue o desafio diário por 7 dias seguidos.' },
      'daily-streak-30': { title: 'Guardião do calendário', desc: 'Jogue o desafio diário por 30 dias seguidos.' },
      'daily-streak-100': { title: 'Inquebrável', desc: 'Jogue o desafio diário por 100 dias seguidos.' },
      'daily-all-attempts': { title: 'Persistente', desc: 'Use as 3 tentativas em um único desafio diário.' },
      'daily-top': { title: 'Campeão do desafio', desc: 'Termine em 1º lugar no ranking de um desafio diário.' },

      // Play streak (7)
      'streak-5': { title: 'Frequente', desc: 'Jogue em 5 dias consecutivos.' },
      'streak-10': { title: 'Empenhado', desc: 'Jogue em 10 dias consecutivos.' },
      'streak-50': { title: 'Devotado', desc: 'Jogue em 50 dias consecutivos.' },
      'streak-100': { title: 'Centurião', desc: 'Jogue em 100 dias consecutivos.' },
      'streak-300': { title: 'Implacável', desc: 'Jogue em 300 dias consecutivos.' },
      'streak-500': { title: 'Inabalável', desc: 'Jogue em 500 dias consecutivos.' },
      'streak-1000': { title: 'Chama eterna', desc: 'Jogue em 1.000 dias consecutivos.' },

      // Days played (3)
      'days-7': { title: 'Primeira semana', desc: 'Jogue em 7 dias diferentes.' },
      'days-30': { title: 'Frequente do mês', desc: 'Jogue em 30 dias diferentes.' },
      'days-100': { title: 'Cem dias', desc: 'Jogue em 100 dias diferentes.' },

      // Milestones (5)
      'total-100': { title: 'Clube dos cem', desc: 'Jogue 100 partidas no total (todos os modos).' },
      'total-500': { title: 'Força dos quinhentos', desc: 'Jogue 500 partidas no total.' },
      'total-1000': { title: 'Mil partidas', desc: 'Jogue 1.000 partidas no total.' },
      'total-10000': { title: 'Dez mil', desc: 'Jogue 10.000 partidas no total.' },
      'total-50000': { title: 'Lenda viva', desc: 'Jogue 50.000 partidas no total.' },

      // Ranked play (9)
      'ranked-first': { title: 'Entrando em campo', desc: 'Jogue sua primeira partida ranqueada online.' },
      'ranked-first-win': { title: 'Primeiro sangue', desc: 'Vença sua primeira partida ranqueada online.' },
      'ranked-play-10': { title: 'Competidor', desc: 'Jogue 10 partidas ranqueadas.' },
      'ranked-play-50': { title: 'Desafiante', desc: 'Jogue 50 partidas ranqueadas.' },
      'ranked-play-100': { title: 'Veterano de campanha', desc: 'Jogue 100 partidas ranqueadas.' },
      'ranked-play-500': { title: 'Calejado na batalha', desc: 'Jogue 500 partidas ranqueadas.' },
      'ranked-win-10': { title: 'Vitorioso', desc: 'Vença 10 partidas ranqueadas.' },
      'ranked-win-50': { title: 'Conquistador', desc: 'Vença 50 partidas ranqueadas.' },
      'ranked-win-100': { title: 'Senhor da guerra', desc: 'Vença 100 partidas ranqueadas.' },

      // Win streak — on fire (8)
      'fire-3': { title: 'Esquentando', desc: 'Vença 3 partidas ranqueadas seguidas.' },
      'fire-5': { title: 'Pegando fogo', desc: 'Vença 5 partidas ranqueadas seguidas.' },
      'fire-7': { title: 'Em chamas', desc: 'Vença 7 partidas ranqueadas seguidas.' },
      'fire-10': { title: 'Inferno', desc: 'Vença 10 partidas ranqueadas seguidas.' },
      'fire-15': { title: 'Imparável', desc: 'Vença 15 partidas ranqueadas seguidas.' },
      'fire-20': { title: 'Arrasador', desc: 'Vença 20 partidas ranqueadas seguidas.' },
      'fire-25': { title: 'Intocável', desc: 'Vença 25 partidas ranqueadas seguidas.' },
      'fire-50': { title: 'Sequência lendária', desc: 'Vença 50 partidas ranqueadas seguidas.' },

      // Rating (6)
      'elo-1100': { title: 'Em ascensão', desc: 'Alcance uma classificação de 1100.' },
      'elo-1200': { title: 'Habilidoso', desc: 'Alcance uma classificação de 1200.' },
      'elo-1400': { title: 'Especialista', desc: 'Alcance uma classificação de 1400.' },
      'elo-1600': { title: 'Mestre', desc: 'Alcance uma classificação de 1600.' },
      'elo-1800': { title: 'Grão-mestre', desc: 'Alcance uma classificação de 1800.' },
      'elo-2000': { title: 'Elite', desc: 'Alcance uma classificação de 2000.' },

      // Ranked feats (3)
      'ranked-time-win': { title: 'Vencendo o relógio', desc: 'Vença uma partida ranqueada deixando o oponente sem tempo.' },
      'ranked-upset': { title: 'Mata-gigantes', desc: 'Vença um oponente com classificação 100+ pontos acima da sua.' },
      'ranked-rematch-win': { title: 'Sem dúvida', desc: 'Vença uma revanche.' },

      // Scoring / lines (6)
      'line-8': { title: 'Casa cheia', desc: 'Complete uma linha de 8 pontos em um único movimento.' },
      'corner': { title: 'Encurralado', desc: 'Marque uma linha de canto de 1 ponto.' },
      'biggest-line': { title: 'Pontuação alta', desc: 'Marque uma única linha que valha 6 ou mais.' },
      'claim-10': { title: 'Oportunista', desc: 'Marque 10 linhas pendentes no total.' },
      'claim-50': { title: 'Catador', desc: 'Marque 50 linhas pendentes no total.' },
      'claim-100': { title: 'Abutre', desc: 'Marque 100 linhas pendentes no total.' },

      // Social (5)
      'add-friend': { title: 'Fazendo amizades', desc: 'Adicione seu primeiro amigo.' },
      'play-friend': { title: 'Rivalidade amigável', desc: 'Jogue uma partida contra um amigo que você convidou.' },
      'refer-friend': { title: 'Recrutador', desc: 'Traga um jogador totalmente novo pelo seu link de convite.' },
      'share-card': { title: 'Mostrando para todos', desc: 'Compartilhe um card de vitória.' },
      'all-themes': { title: 'Decorador', desc: 'Experimente todos os oito temas de cor.' },

      // Bot win streak (3)
      'botstreak-3': { title: 'Mão quente', desc: 'Vença 3 partidas contra Bot seguidas.' },
      'botstreak-5': { title: 'Na zona', desc: 'Vença 5 partidas contra Bot seguidas.' },
      'botstreak-10': { title: 'Quebra-máquinas', desc: 'Vença 10 partidas contra Bot seguidas.' },
    } as Record<string, { title: string; desc: string }>,
    tracks: {
      'Getting started': 'Primeiros passos',
      'Triangle bots': 'Bots do Triângulo',
      'Square bots': 'Bots do Quadrado',
      'Rectangle bots': 'Bots do Retângulo',
      'Mastery': 'Maestria',
      'Bot win streak': 'Sequência contra Bots',
      'Hot-seat': 'Partida local',
      'Daily puzzle': 'Desafio diário',
      'Play streak': 'Sequência de dias',
      'Days played': 'Dias jogados',
      'Milestones': 'Marcos',
      'Ranked play': 'Partidas ranqueadas',
      'Ranked wins': 'Vitórias ranqueadas',
      'Ranked feats': 'Façanhas ranqueadas',
      'Win streak': 'Sequência de vitórias',
      'Rating': 'Classificação',
      'Scoring': 'Pontuação',
      'Claims': 'Marcações',
      'Social': 'Social',
    } as Record<string, string>,
    aria: 'Conquistas',
    close: 'Fechar',
    title: 'Conquistas',
    unlocked: 'desbloqueadas',
    hiddenReveal: 'Oculta — continue jogando para revelá-la.',
    statusUnlocked: '✓ Desbloqueada',
    statusLocked: 'Bloqueada',
    pinTitle: 'Mostrar este emblema ao lado do seu nome nas partidas',
    featured: '★ Em destaque',
    pin: 'Fixar',
    detailHint: 'Toque em um emblema para ver para que ele serve.',
    secret: '???',
    hidden: 'Oculta',
    hiddenAria: 'Conquista oculta',
    nodeTitle: (name: string, descOrHidden: string) => `${name} — ${descOrHidden}`,
    toastKicker: '🏆 Conquista desbloqueada',
  },

  howto: {
    aria: 'Como jogar',
    close: 'Fechar',
    title: 'Como jogar',
    tagline: 'Acompanhe cada jogada — o tabuleiro mostra exatamente o que acontece.',
    prev: 'Anterior',
    next: 'Próximo',
    done: 'Entendi',
    scenes: {
      place: {
        title: 'Coloque um ponto',
        body: 'No seu turno, toque em qualquer ponto vazio para colori-lo. Depois é a vez do seu oponente.',
      },
      corner: {
        title: 'Um canto vale 1',
        body: 'Um ponto de canto conta como uma linha de 1 — sozinho, ele vale 1 ponto.',
      },
      lineScored: {
        title: 'Complete uma linha',
        body: 'Pinte todos os pontos de uma linha reta e ela vale tantos pontos quanto o seu comprimento.',
      },
      claim: {
        title: 'Marque linhas pendentes',
        body: 'Um movimento pode concluir várias linhas — só a mais longa pontua, as outras ficam esperando (brilhando). Toque em um ponto de uma linha pendente para marcar os pontos dela. Qualquer jogador pode pegá-las.',
      },
      triThreeWays: {
        title: 'Triângulo: 3 direções',
        body: 'As linhas correm na horizontal e ao longo das duas diagonais.',
      },
      sqFourWays: {
        title: 'Quadrado: 4 direções',
        body: 'As linhas correm na horizontal, na vertical e ao longo das duas diagonais.',
      },
      finish: {
        title: 'Encerrando a partida',
        body: 'A partida termina quando todos os pontos estão colocados e todas as linhas marcadas. Vence quem tiver mais pontos; em caso de igualdade, é empate.',
      },
    } as Record<string, { title: string; body: string }>,
  },
};
