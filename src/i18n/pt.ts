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
    swapColours: 'Trocar as cores (Jogador 1 creme · Jogador 2 verde)',
    startGame: 'Começar partida',
    player1Placeholder: 'Jogador 1',
    player2Placeholder: 'Jogador 2',
  },

  footer: {
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
    swapColours: 'Trocar as cores (Jogador 1 creme · Jogador 2 verde)',
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
      'coral-reef': 'Águas verde-azuladas profundas, companheiras de coral.',
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
      'seu Elo atual, o contador de partidas de posicionamento e a data/hora da última partida. Fonte: calculada no servidor ao fim de cada partida ranqueada.',
    collectHistoryLead: 'Histórico de partidas:',
    collectHistory:
      'cada partida ranqueada armazena os IDs de ambos os jogadores, os nomes de exibição, as pontuações finais, as variações de classificação, a forma, o controle de tempo, a duração e como a partida terminou (normal / tempo esgotado / desistência).',
    collectLiveLead: 'Estado da partida ao vivo:',
    collectLive:
      'enquanto uma partida multijogador está em andamento, armazenamos o tabuleiro, o relógio e de quem é a vez no nosso banco de dados em tempo real. Isso é excluído logo após o fim da partida.',
    collectFriendsLead: 'Amigos e convites:',
    collectFriends:
      'sua lista de amigos, pedidos pendentes, status online e convites para partidas. Se você entrou pelo link de convite ou QR code de outro jogador, registramos qual jogador convidou você (o código de convite aleatório dele, para que futuras recompensas por indicação possam ser honradas).',
    collectDeviceLead: 'Dados apenas do dispositivo:',
    collectDevice:
      'seu progresso de um jogador, as estatísticas contra IA / de partida local, a preferência de tema e a marca de “tutorial visto”. Armazenados no localStorage do seu navegador e nunca transmitidos para nós.',
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
      'à sua autoridade nacional de proteção de dados se você acreditar que tratamos mal os seus dados.',
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
};
