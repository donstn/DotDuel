// DotDuel website text — Portuguese (Brazil).
// Same shape in every language (site/langs/types.ts); diagrams from site/diagrams.ts.
import { diagrams } from '../diagrams';
import type { SiteText } from './types';

export const pt: SiteText = {
  paths: { howToPlay: '/pt/como-jogar/', strategy: '/pt/estrategia/', faq: '/pt/perguntas-frequentes/', about: '/pt/sobre/', changelog: '/pt/novidades/' },
  nav: { howToPlay: 'Guia', strategy: 'Estratégia', faq: 'Perguntas', about: 'Sobre', changelog: 'Novidades', play: 'Jogar agora', privacy: 'Privacidade' },
  howToPlay: {
    title: 'Como jogar DotDuel — regras, pontuação e tabuleiros do jogo de pontos',
    description:
      'Aprenda o DotDuel, jogo de pontos grátis, em dois minutos: complete linhas, pontue a mais longa e marque as não marcadas. Regras, exemplos e tabuleiros.',
    h1: 'Guia do DotDuel: como jogar',
    lead: 'Dois jogadores se revezam colorindo pontos. Complete uma linha e você ganha o comprimento dela em pontos. As regras se aprendem em dois minutos; as táticas levam bem mais tempo.',
    body: `
    <h2>O objetivo</h2>
    <p>Fazer mais pontos que o adversário. Os pontos vêm das <strong>linhas</strong>: fileiras e diagonais de pontos no tabuleiro. Quando todos os pontos de uma linha estão coloridos, a linha está completa e vale 1 ponto para cada ponto que a compõe.</p>

    <h2>Sua vez</h2>
    <p>Em cada turno você faz exatamente uma coisa:</p>
    <ul>
      <li><strong>Coloca um ponto</strong> em qualquer espaço vazio, ou</li>
      <li><strong>Marca uma linha não marcada</strong> (mais sobre isso abaixo).</li>
    </ul>
    <p>Depois é a vez do adversário. Os turnos sempre se alternam, mesmo depois de você pontuar.</p>

    <h2>Completar uma linha</h2>
    <p>Não importa quem coloriu os outros pontos de uma linha. Quem coloca o <em>último</em> ponto completa a linha e ganha o comprimento inteiro dela. Uma linha de 3 pontos vale 3, uma linha de 8 pontos vale 8.</p>
    <p>Cada ponto de canto forma sozinho uma linha de apenas um ponto, então o primeiro jogador a colorir um canto ganha 1 ponto na hora.</p>
    <div class="diagrams">
      ${diagrams.lineComplete('Verde coloca o último ponto de uma fileira de 3: +3, mesmo que um dos pontos tenha sido colorido por Creme.')}
      ${diagrams.corner('O canto de baixo é uma linha de 1 ponto: colori-lo vale +1 na hora.')}
    </div>

    <h2>A pegadinha: só a linha mais longa pontua</h2>
    <p>Um único ponto pode completar duas ou três linhas ao mesmo tempo. Quando isso acontece, você pontua <strong>apenas a mais longa</strong> delas. As outras não desaparecem: viram <strong>linhas não marcadas</strong>.</p>
    <p>As linhas não marcadas ainda não são de ninguém. Em qualquer turno posterior, <strong>qualquer um dos jogadores</strong> pode usar a vez para marcar uma delas e ganhar o comprimento inteiro. Para marcar uma linha, toque em qualquer ponto colorido dela. Se o ponto fizer parte de mais de uma linha não marcada, a mais longa é marcada.</p>
    <div class="diagrams">
      ${diagrams.twoAtOnce('Com um só ponto, Verde completa uma fileira de 3 e uma diagonal de 2. A fileira vale +3; a diagonal (tracejada) fica não marcada.')}
      ${diagrams.claim('No turno seguinte, Creme toca em um ponto da diagonal não marcada e a marca: +2 para Creme.')}
    </div>
    <p class="note">É essa regra que faz do DotDuel mais do que uma corrida. Uma jogada que completa duas linhas também dá ao adversário a chance de pegar a segunda, então às vezes a jogada mais forte é a mais discreta.</p>

    <h2>O fim da partida</h2>
    <p>A partida termina quando <strong>todos os pontos estão coloridos e todas as linhas foram marcadas</strong>. Se os pontos acabarem enquanto ainda houver linhas não marcadas, os turnos restantes servem só para marcar: os jogadores se revezam marcando linhas até não sobrar nenhuma. Vence quem tiver mais pontos; em caso de igualdade, é empate.</p>

    <h2>Formas de tabuleiro</h2>
    <div class="table-wrap"><table>
      <tr><th>Forma</th><th>Pontos no tabuleiro</th><th>Direções das linhas</th><th>Pontuação total</th></tr>
      <tr><td>Triângulo</td><td>36 (fileiras de 8 até 1)</td><td>Fileiras e duas diagonais</td><td>108</td></tr>
      <tr><td>Quadrado</td><td>49 (7 × 7)</td><td>Fileiras, colunas e as duas diagonais</td><td>196</td></tr>
      <tr><td>Retângulo</td><td>63 (7 × 9)</td><td>Fileiras, colunas e as duas diagonais</td><td>252</td></tr>
    </table></div>
    <p>Quadrado e Retângulo têm quatro direções de linha em vez de três, então uma única jogada completa várias linhas com muito mais frequência, e o conjunto de linhas não marcadas fica bem maior.</p>

    <h2>Modos de jogo</h2>
    <ul>
      <li><strong>Contra bots</strong>: cinco níveis, do Iniciante ao Impossível. Vença um nível para desbloquear o próximo; vença o Fácil ou um nível acima em uma forma para desbloquear a próxima forma (Triângulo, depois Quadrado, depois Retângulo).</li>
      <li><strong>Partida local</strong>: dois jogadores no mesmo celular ou computador, com todas as formas disponíveis desde o início.</li>
      <li><strong>Ranqueada online</strong>: entre com o Google, seja pareado com um jogador de nível parecido e jogue com relógio de xadrez (Bala: 1 minuto, Relâmpago: 3 minutos ou Rápida: 5 minutos por jogador). Vitórias e derrotas mudam seu Elo no ranking mundial. Adicione amigos e desafie-os diretamente.</li>
      <li><strong>Desafio diário</strong>: um tabuleiro igual para todos a cada dia, já parcialmente jogado. Você tem 3 minutos no relógio e até três tentativas, e sua melhor pontuação vai para o ranking do dia.</li>
    </ul>
    <p>Pronto para o próximo passo? Leia o <a href="/pt/estrategia/">guia de estratégia</a>.</p>
`,
  },
  strategy: {
    title: 'Estratégia do DotDuel — dicas do iniciante ao avançado no jogo de pontos',
    description:
      'Vença mais no DotDuel: não entregue linhas, use as não marcadas como jogadas de reserva, escolha a hora de marcar e planeje o final. Dicas por tabuleiro.',
    h1: 'Guia de estratégia do DotDuel',
    lead: 'No DotDuel não existe sorte: os dois jogadores veem o tabuleiro inteiro, então cada ponto é ganho ou entregue por uma decisão. Estas são as ideias que separam um bot Iniciante de um Impossível.',
    body: `
    <h2>1. Nunca deixe uma linha a um ponto de ser completada</h2>
    <p>O erro mais comum de iniciante é colocar um ponto que deixa uma linha com um único espaço vazio. O adversário simplesmente preenche esse espaço e leva a linha inteira. Antes de cada jogada, olhe para <strong>todas</strong> as linhas que passam pelo espaço que você vai ocupar, não só aquela em que está pensando. No Triângulo são três linhas por ponto; no Quadrado e no Retângulo, quatro.</p>

    <h2>2. Conte o que a sua jogada entrega</h2>
    <p>Um bom hábito: para cada jogada possível, faça duas perguntas. <em>Quanto eu pontuo agora?</em> e <em>Qual é o máximo que o adversário pode pontuar em resposta?</em> Uma jogada que vale 3 mas prepara um 7 para o adversário faz você perder 4 pontos. O bot Difícil joga exatamente assim, e é por isso que ele parece tão mais duro que o Médio.</p>

    <h2>3. Completar duas linhas de uma vez pode ser um presente</h2>
    <p>Quando um ponto completa duas linhas, você pontua só a mais longa, e a mais curta vai para o conjunto compartilhado de linhas não marcadas, onde o adversário pode pegá-la logo no turno seguinte. Completar uma linha de 6 e uma de 4 juntas rende 6 para você, mas provavelmente dá 4 ao adversário. Completá-las em turnos separados, quando possível, pode render as duas para você.</p>

    <h2>4. Linhas não marcadas são jogadas de reserva</h2>
    <p>Marcar uma linha não marcada usa a sua vez <strong>sem colocar nenhum ponto</strong>. Isso faz dela a jogada de espera perfeita. No meio da partida, muitas vezes você chega a uma posição em que qualquer espaço vazio prepararia uma linha para o adversário. Se houver uma linha não marcada no tabuleiro, marque-a em vez disso: você pontua, o tabuleiro não muda e agora é o adversário quem precisa fazer a jogada arriscada.</p>
    <p>Por isso também nem sempre é melhor pegar cada linha não marcada na hora. Uma linha pequena deixada no conjunto pode valer mais depois, como a jogada que permite evitar abrir uma linha grande.</p>

    <h2>5. Fique de olho nas linhas longas</h2>
    <p>As linhas valem o seu comprimento, então são as longas que decidem as partidas. No Triângulo, a fileira de cima vale 8 e as diagonais longas valem 7 ou 8, enquanto os cantos valem 1. Acompanhe quantos espaços vazios restam nas linhas mais longas e tente ser o jogador que ocupa o último, não o penúltimo.</p>

    <h2>6. Planeje o final</h2>
    <p>Depois que todos os pontos estão coloridos, a partida passa a ser só de marcações: os jogadores se revezam pegando linhas não marcadas até não sobrar nenhuma, e cada um naturalmente pega a mais longa disponível. Antes de colocar os últimos pontos, conte as linhas não marcadas e seus comprimentos. O fato de o conjunto ter um número par ou ímpar de linhas decide quem fica com as grandes, e uma única jogada de espera feita antes pode inverter isso.</p>

    <h2>7. Cada forma joga de um jeito</h2>
    <ul>
      <li><strong>Triângulo</strong>: três direções de linha e linhas curtas perto da base. As posições continuam fáceis de ler, o que faz dele a melhor forma para aprender a contar. Jogar primeiro ou segundo não faz diferença real no nível mais alto: em 1.000 partidas entre dois bots Impossível, cada lado venceu cerca de 45% e o restante terminou empatado.</li>
      <li><strong>Quadrado</strong>: quatro direções, incluindo as duas diagonais. Uma única jogada completa várias linhas com muito mais frequência, então o conjunto de linhas não marcadas cresce rápido e a dica 4 vira sua arma principal.</li>
      <li><strong>Retângulo</strong>: o maior tabuleiro, com as partidas mais longas e o maior número de linhas não marcadas no final. Paciência e contagem valem mais aqui.</li>
    </ul>

    <h2>8. Treine contra os bots</h2>
    <div class="table-wrap"><table>
      <tr><th>Bot</th><th>Como joga</th><th>O que ensina</th></tr>
      <tr><td>Iniciante</td><td>Jogadas aleatórias</td><td>As regras e como as linhas se completam</td></tr>
      <tr><td>Fácil</td><td>Pega cantos e linhas grandes óbvias</td><td>Enxergar pontos de graça</td></tr>
      <tr><td>Médio</td><td>Sempre pega o máximo de pontos no momento</td><td>Não deixar linhas a um ponto de serem completadas (dica 1)</td></tr>
      <tr><td>Difícil</td><td>Compara o próprio ganho com a sua melhor resposta</td><td>Contar o que uma jogada entrega (dica 2)</td></tr>
      <tr><td>Impossível</td><td>Pensa três jogadas à frente e valoriza as linhas não marcadas</td><td>Tempo, linhas não marcadas e paridade no final (dicas 4–6)</td></tr>
    </table></div>
    <p>Ficou com dúvida sobre alguma regra? Volte ao <a href="/pt/como-jogar/">guia</a>.</p>
`,
  },
  faq: {
    title: 'Perguntas frequentes do DotDuel — jogo de pontos grátis para dois jogadores',
    description:
      'DotDuel é grátis? Precisa de conta? Como difere do jogo dos pontinhos? Jogar com amigo ou sozinho, ranking online, desafio diário e mais.',
    h1: 'DotDuel: perguntas frequentes',
    lead: 'Respostas rápidas sobre o jogo, seus modos e o jogo online. Novo no DotDuel? O <a href="/pt/como-jogar/">guia</a> explica as regras em dois minutos.',
    body: `
    <h2>O que é o DotDuel?</h2>
    <p>Um jogo de estratégia grátis para dois jogadores. Vocês se revezam colorindo pontos em um tabuleiro; complete uma linha e você ganha o comprimento dela em pontos. Uma jogada pode completar várias linhas, mas só a mais longa pontua, e as outras viram linhas não marcadas que qualquer um dos jogadores pode pegar.</p>

    <h2>O DotDuel é grátis?</h2>
    <p>Sim. Ele roda em qualquer navegador em <a href="/">www.dotduel.com</a> e no Android pelo Google Play. Não é preciso comprar nada para jogar o jogo completo.</p>

    <h2>Preciso instalar algo ou criar uma conta?</h2>
    <p>Não. Jogue contra bots ou contra um amigo no mesmo dispositivo na hora. O login com o Google só é necessário para partidas ranqueadas online, amigos e o ranking do desafio diário.</p>

    <h2>O DotDuel é parecido com o Jogo dos pontinhos?</h2>
    <p>Os dois usam pontos, mas se jogam de forma diferente. No DotDuel você colore os próprios pontos, as linhas seguem fileiras e diagonais e só a linha completada mais longa pontua, então a tática gira em torno do momento certo, não de cadeias de quadradinhos.</p>

    <h2>É parecido com xadrez?</h2>
    <p>Ele pega emprestadas ideias do xadrez: os dois jogadores veem tudo, não existe sorte, e as partidas ranqueadas usam relógio de xadrez e classificação Elo. Mas dá para aprender as regras em dois minutos e terminar uma partida em menos de dez.</p>

    <h2>Posso jogar com um amigo?</h2>
    <p>Sim: no mesmo celular ou computador (partida local) ou online. Adicione seu amigo e desafie-o diretamente.</p>

    <h2>Posso jogar sozinho?</h2>
    <p>Sim. Há cinco níveis de bot, do Iniciante ao Impossível. Vencer um nível desbloqueia o próximo, e novas formas de tabuleiro são desbloqueadas conforme você avança.</p>

    <h2>Quem joga primeiro tem vantagem?</h2>
    <p>Não. Em 1.000 partidas entre os nossos dois bots mais fortes, cada lado venceu cerca de 45% das vezes e o restante terminou empatado.</p>

    <h2>Quanto tempo dura uma partida?</h2>
    <p>Uma partida no Triângulo leva poucos minutos. As partidas ranqueadas online usam relógio de xadrez: 1, 3 ou 5 minutos por jogador.</p>

    <h2>Como funciona o ranking online?</h2>
    <p>Você é pareado com um jogador de nível parecido. Vitórias e derrotas mudam seu Elo no ranking mundial.</p>

    <h2>O que é o desafio diário?</h2>
    <p>Um tabuleiro igual para todos a cada dia, já jogado pela metade. Você tem 3 minutos no relógio e três tentativas; sua melhor pontuação vai para o ranking do dia.</p>

    <h2>O que são linhas não marcadas?</h2>
    <p>Quando um ponto completa várias linhas, só a mais longa pontua. As outras ficam esperando como linhas não marcadas, e qualquer um dos jogadores pode usar a vez para marcar uma delas e ganhar o comprimento inteiro. O <a href="/pt/como-jogar/">guia</a> mostra isso com imagens.</p>

    <h2>Como termina uma partida?</h2>
    <p>Quando todos os pontos estão coloridos e todas as linhas foram marcadas. Vence quem tiver mais pontos; em caso de igualdade, é empate.</p>

    <h2>Em quais idiomas o DotDuel está disponível?</h2>
    <p>Inglês, lituano, espanhol, português, polonês e tcheco.</p>

    <h2>Meu progresso fica salvo?</h2>
    <p>O progresso contra os bots fica salvo no seu dispositivo. Seu Elo online, amigos e estatísticas ficam salvos na sua conta do Google.</p>

    <h2>O que acontece com os meus dados?</h2>
    <p>Só coletamos o que o jogo precisa, e análises ou anúncios personalizados só com o seu consentimento. Todos os detalhes estão na <a href="/privacy.html">política de privacidade</a>, incluindo como baixar ou excluir sua conta.</p>

    <h2>Encontrei um bug ou tenho uma ideia.</h2>
    <p>Escreva para <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>. As mudanças recentes estão listadas nas <a href="/pt/novidades/">novidades</a>.</p>

    <p>Quer vencer mais? Leia o <a href="/pt/estrategia/">guia de estratégia</a>.</p>
`,
  },
  about: {
    title: 'Sobre o DotDuel — jogo de estratégia grátis para dois jogadores',
    description:
      'DotDuel: jogo de estratégia grátis para dois jogadores, no navegador e Android. Bots, amigo no mesmo aparelho ou ranqueada online. O que é, quem faz e dúvidas.',
    h1: 'Sobre o DotDuel',
    lead: 'O DotDuel é um jogo de estratégia grátis e rápido para dois jogadores, sobre colorir pontos e completar linhas, feito por um desenvolvedor independente.',
    body: `
    <h2>O que é</h2>
    <p>O DotDuel pega o clima de papel e caneta de jogos como o Jogo dos pontinhos e o jogo da velha e acrescenta uma regra que muda tudo: quando uma jogada completa várias linhas de uma vez, só a mais longa pontua, e as outras viram linhas não marcadas que qualquer um dos jogadores pode marcar em um turno posterior. As partidas duram poucos minutos, não há sorte envolvida e as regras cabem em uma tela.</p>
    <p>Você pode jogar em qualquer navegador moderno em <a href="/">www.dotduel.com</a>, sem baixar nada. Ele também está no Google Play como app para Android.</p>

    <h2>O que você pode fazer</h2>
    <ul>
      <li>Aprender contra cinco bots, do Iniciante, que joga ao acaso, até o Impossível, que pensa três jogadas à frente.</li>
      <li>Jogar com um amigo no mesmo celular ou computador (partida local).</li>
      <li>Entrar com o Google para partidas ranqueadas online com relógio de xadrez, um ranking mundial de Elo, amigos e desafios.</li>
      <li>Tentar o desafio diário: o mesmo tabuleiro parcialmente jogado para todos, com um ranking do dia.</li>
      <li>Escolher seu idioma: inglês, lituano, espanhol, português, polonês ou tcheco.</li>
    </ul>

    <p>Dúvidas? Veja as <a href="/pt/perguntas-frequentes/">perguntas frequentes</a>.</p>

`,
  },
  changelog: {
    title: 'Novidades do DotDuel — histórico de atualizações',
    description: 'Todas as atualizações do DotDuel: novos recursos, mudanças e correções, das mais recentes para as mais antigas.',
    h1: 'Novidades do DotDuel',
    lead: 'Todas as atualizações, das mais recentes para as mais antigas. A mesma lista está no jogo: toque no número da versão na parte de baixo da tela.',
  },
};
