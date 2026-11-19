import type {
  AchievementDef,
  ChapterDefinition,
  ChapterNumber,
  EndingType,
  InventoryItem,
  LoreEntry,
  RegionId,
  SideMission,
} from './types';

export const MAX_BACKPACK_SLOTS = 24;

export const ITEM_CATALOG: Record<string, Omit<InventoryItem, 'quantity'>> = {
  lanterna: {
    id: 'lanterna',
    name: 'Lanterna de Pilha Velha',
    description: 'Pisca na tempestade, mas clareia qualquer túnel de Santa Batata. [F] liga/desliga.',
    category: 'ferramenta',
    icon: 'flashlight',
    usable: true,
  },
  pao_de_queijo: {
    id: 'pao_de_queijo',
    name: 'Pão de Queijo da Vó',
    description: 'Quentinho, crocante e restaura energia, fome e coragem instantaneamente.',
    category: 'comida',
    icon: 'bread',
    usable: true,
  },
  broa_fuba: {
    id: 'broa_fuba',
    name: 'Broa de Fubá com Goiabada',
    description: 'Receita mineira da Dona Clara. Alivia a fadiga e mata a fome.',
    category: 'comida',
    icon: 'cake',
    usable: true,
  },
  peixe_dourado: {
    id: 'peixe_dourado',
    name: 'Tilápia Assada na Brasa',
    description: 'Pescada na Vila dos Pescadores. Recupera muita energia e saciedade.',
    category: 'comida',
    icon: 'fish',
    usable: true,
    rare: true,
  },
  cafe_coado: {
    id: 'cafe_coado',
    name: 'Garrafa de Café Coado',
    description: 'Forte o suficiente pra espantar o sono da madrugada e agradar o Saci.',
    category: 'bebida',
    icon: 'coffee',
    usable: true,
  },
  agua_mina: {
    id: 'agua_mina',
    name: 'Cantil de Água da Serra',
    description: 'Água fresca de nascente. Restaura a hidratação durante corridas longas.',
    category: 'bebida',
    icon: 'droplet',
    usable: true,
  },
  caldo_cana: {
    id: 'caldo_cana',
    name: 'Garrafinha de Caldo de Cana',
    description: 'Energia pura da feira de Santa Batata. Recupera estamina e hidratação.',
    category: 'bebida',
    icon: 'cup',
    usable: true,
  },
  chave_celeiro: {
    id: 'chave_celeiro',
    name: 'Chave Enferrujada do Celeiro',
    description: 'Abre o cadeado do Celeiro Vermelho na Fazenda Boa Esperança.',
    category: 'chave',
    icon: 'key',
  },
  chave_igreja: {
    id: 'chave_igreja',
    name: 'Chave de Bronze da Igreja',
    description: 'Guardada no Sítio dos Alves. Abre a Igreja Velha de Santa Batata.',
    category: 'chave',
    icon: 'key',
  },
  chave_hospital: {
    id: 'chave_hospital',
    name: 'Chave Mestra do Hospital',
    description: 'Encontrada na Estação Ferroviária. Abre o Hospital Municipal Abandonado.',
    category: 'chave',
    icon: 'key',
  },
  chave_mina: {
    id: 'chave_mina',
    name: 'Chave da Cancela da Mina',
    description: 'Acesso às galerias da Mina Desativada de 1924.',
    category: 'chave',
    icon: 'key',
  },
  cartao_complexo: {
    id: 'cartao_complexo',
    name: 'Cartão Magnético de 1958',
    description: 'Crachá de metal oxidado para o Complexo Subterrâneo Secreto.',
    category: 'chave',
    icon: 'badge',
    rare: true,
  },
  milho_bento: {
    id: 'milho_bento',
    name: 'Espiga de Milho Dourado',
    description: 'Colhida no milharal. A Galinha Gertrudes fica hipnotizada por ela.',
    category: 'missao',
    icon: 'corn',
  },
  fumo_saci: {
    id: 'fumo_saci',
    name: 'Fumo de Corda do Tião',
    description: 'Moeda de troca oficial com o Saci Pererê na Floresta do Esquecimento.',
    category: 'missao',
    icon: 'leaf',
  },
  diario_vizinho: {
    id: 'diario_vizinho',
    name: 'Caderno de Teorias do Seu Zé',
    description: 'Cheio de anotações sobre túneis, apitos de trem e a Primeira Madrugada.',
    category: 'documento',
    icon: 'book',
  },
  radio_portatil: {
    id: 'radio_portatil',
    name: 'Rádio Receptor AM/FM',
    description: 'Capta frequências perdidas do Complexo Subterrâneo e notícias da roça.',
    category: 'ferramenta',
    icon: 'radio',
    usable: true,
  },
  pilha_extra: {
    id: 'pilha_extra',
    name: 'Par de Pilhas Alcalinas',
    description: 'Recarrega dispositivos e reduz falhas de iluminação à noite.',
    category: 'ferramenta',
    icon: 'battery',
    usable: true,
  },
  cruz_madeira: {
    id: 'cruz_madeira',
    name: 'Cruz de Ipê Bento',
    description: 'Relíquia esculpida em 1924 para selar as portas às 03:00 da manhã.',
    category: 'raro',
    icon: 'cross',
    rare: true,
  },
  relogio_prata: {
    id: 'relogio_prata',
    name: 'Relógio Parado às 03:00',
    description: 'Pertencia ao Primeiro Morador. Os ponteiros tremem perto de portais.',
    category: 'raro',
    icon: 'watch',
    rare: true,
  },
  amuleto_ipe: {
    id: 'amuleto_ipe',
    name: 'Amuleto da Serra do Silêncio',
    description: 'Reduz o medo quando equipado na mochila.',
    category: 'raro',
    icon: 'sparkles',
    rare: true,
  },
  selo_primeira_madrugada: {
    id: 'selo_primeira_madrugada',
    name: 'Selo da Primeira Madrugada',
    description: 'Artefato metálico extraído da Mina de 1924 que revela o Complexo Subterrâneo.',
    category: 'secreto',
    icon: 'shield',
    rare: true,
  },
  disco_1958: {
    id: 'disco_1958',
    name: 'Fita Magnética Projeto Aurora-MG',
    description: 'Prova definitiva dos experimentos realizados sob Santa Batata em 1958.',
    category: 'secreto',
    icon: 'disc',
    rare: true,
  },
};

export const CHAPTERS: ChapterDefinition[] = [
  {
    number: 1,
    title: 'Capítulo 1: Cheguei na Roça',
    subtitle: 'Boas-vindas com pão de queijo e fofoca mineira',
    synopsis:
      'Você chegou em Santa Batata para passar as férias na casa da Vó Maria. Antes que anoiteça, conheça a casa, pegue sua lanterna e converse com os vizinhos.',
    climax: 'Primeiro contato com a rotina do povoado antes do pôr do sol.',
    targetHour: 18.75,
    objectives: [
      {
        id: 'cap1_talk_vo',
        title: 'Conversar com a Vó Maria',
        description: 'Fale com sua avó na varanda da Casa da Avó.',
        locationHint: 'Santa Batata (Centro)',
        regionId: 'santa_batata',
      },
      {
        id: 'cap1_get_lanterna',
        title: 'Pegar a Lanterna na Sala',
        description: 'Entre na Casa da Avó e pegue a Lanterna na mesinha da sala.',
        locationHint: 'Sala da Casa da Avó',
        regionId: 'santa_batata',
      },
      {
        id: 'cap1_visit_praca',
        title: 'Conversar com o Seu Zé na Praça',
        description: 'Passe pela Praça Central e ouça as histórias do Seu Zé.',
        locationHint: 'Praça Central',
        regionId: 'santa_batata',
      },
    ],
  },
  {
    number: 2,
    title: 'Capítulo 2: A Regra das Três',
    subtitle: '"NÃO abra a porta depois das três da manhã"',
    synopsis:
      'Panelas caíram sozinhas na cozinha e o rádio AM captou um chiado estranho. Vó Maria revela o aviso mais sério de Santa Batata.',
    climax: 'As primeiras batidas misteriosas ecoam na cozinha.',
    targetHour: 20.0,
    objectives: [
      {
        id: 'cap2_check_cozinha',
        title: 'Checar o Rádio da Cozinha',
        description: 'Entre na cozinha da Vó e inspecione o rádio antigo.',
        locationHint: 'Cozinha da Avó',
        regionId: 'santa_batata',
      },
      {
        id: 'cap2_talk_vo_regra',
        title: 'Ouvir o Aviso da Vó Maria',
        description: 'Pergunte à Vó sobre o barulho e a regra das três da manhã.',
        locationHint: 'Casa da Avó',
        regionId: 'santa_batata',
      },
    ],
  },
  {
    number: 3,
    title: 'Capítulo 3: A Galinha Não É Normal',
    subtitle: 'Ela olha pro seu soul e roubou a chave do celeiro',
    synopsis:
      'A Galinha Gertrudes fugiu com a chave do celeiro da Fazenda Boa Esperança. Só o milho dourado consegue distrair a ave endiabrada.',
    climax: 'Gertrudes começa a patrulhar e perseguir intrusos à noite.',
    targetHour: 21.0,
    objectives: [
      {
        id: 'cap3_find_milho',
        title: 'Colher Milho Dourado',
        description: 'Vá até a lavoura da Fazenda Boa Esperança / Sítio e colha o milho dourado.',
        locationHint: 'Fazenda Boa Esperança',
        regionId: 'fazenda_boa_esperanca',
      },
      {
        id: 'cap3_chave_celeiro',
        title: 'Recuperar a Chave do Celeiro',
        description: 'Recupere a chave perto do galinheiro no Quintal da Avó.',
        locationHint: 'Quintal da Avó',
        regionId: 'santa_batata',
      },
    ],
  },
  {
    number: 4,
    title: 'Capítulo 4: O Caderno da Estrada Velha',
    subtitle: 'Anotações secretas de um vizinho paranoico',
    synopsis:
      'Seu Zé anotou coordenadas estranhas ligando a Estrada Velha ao Mercadinho do Tião e à mata fechada.',
    climax: 'Você descobre que os desaparecimentos seguem o mesmo horário: 03:00.',
    targetHour: 22.0,
    objectives: [
      {
        id: 'cap4_casa_vizinho',
        title: 'Pegar o Caderno de Teorias',
        description: 'Entre na Casa do Seu Zé e recolha o caderno sobre a mesa.',
        locationHint: 'Casa do Seu Zé',
        regionId: 'santa_batata',
      },
      {
        id: 'cap4_mercadinho',
        title: 'Pegar Fumo de Corda no Mercadinho',
        description: 'Visite o Mercadinho do Tião e pegue o fumo de corda para negociar com o Saci.',
        locationHint: 'Mercadinho do Tião',
        regionId: 'santa_batata',
      },
    ],
  },
  {
    number: 5,
    title: 'Capítulo 5: O Redemoinho na Mata',
    subtitle: 'Assobios, travessuras e pistas na Floresta do Esquecimento',
    synopsis:
      'Na densa Floresta do Esquecimento ao sul, o Saci Pererê observa cada passo seu e sabe por onde o Homem do Saco anda rondando.',
    climax: 'Negociação folclórica no meio da neblina da mata.',
    targetHour: 23.0,
    objectives: [
      {
        id: 'cap5_meet_saci',
        title: 'Encontrar o Saci na Clareira',
        description: 'Entre na Floresta do Esquecimento e converse com o Saci Pererê.',
        locationHint: 'Floresta do Esquecimento',
        regionId: 'floresta_esquecimento',
      },
      {
        id: 'cap5_estacao',
        title: 'Checar a Estação Ferroviária',
        description: 'O Saci disse que o último trem trouxe caixas estranhas. Vá à Estação.',
        locationHint: 'Estação Ferroviária',
        regionId: 'estacao_ferroviaria',
      },
    ],
  },
  {
    number: 6,
    title: 'Capítulo 6: Águas da Vila dos Pescadores',
    subtitle: 'Pegadas na lama levam à Represa e ao píer',
    synopsis:
      'Na Vila dos Pescadores e na Represa, Zé Pescador avistou uma figura carregando um saco pesado perto da água escura.',
    climax: 'Os rastros cruzam a ponte da Represa rumo ao Sítio dos Alves.',
    targetHour: 23.75,
    objectives: [
      {
        id: 'cap6_lago',
        title: 'Inspecionar o Píer dos Pescadores',
        description: 'Examine as pegadas molhadas no píer da Vila dos Pescadores.',
        locationHint: 'Vila dos Pescadores',
        regionId: 'vila_pescadores',
      },
      {
        id: 'cap6_represa',
        title: 'Verificar a Comporta da Represa',
        description: 'Suba a passarela da Represa e leia o registro da cheia de 1987.',
        locationHint: 'Represa de Santa Batata',
        regionId: 'represa',
      },
    ],
  },
  {
    number: 7,
    title: 'Capítulo 7: Sítio dos Alves & Fazenda Santa Luzia',
    subtitle: 'Milharais altos onde algo respira perto',
    synopsis:
      'Entre o Sítio dos Alves e a antiga Fazenda Santa Luzia, as porteiras rangem e o Sítio guarda a chave de bronze da Igreja Velha.',
    climax: 'Primeira perseguição tensa por dentro de casarões com portas trancáveis.',
    targetHour: 0.3,
    objectives: [
      {
        id: 'cap7_sitio',
        title: 'Pegar a Chave da Igreja no Sítio dos Alves',
        description: 'Vasculhe o interior do Sítio dos Alves (use o armário se ouvir passos!).',
        locationHint: 'Sítio dos Alves',
        regionId: 'sitio_alves',
      },
      {
        id: 'cap7_santa_luzia',
        title: 'Explorar a Fazenda Santa Luzia',
        description: 'Leia o documento de fundação na sede da Fazenda Santa Luzia.',
        locationHint: 'Fazenda Santa Luzia',
        regionId: 'fazenda_santa_luzia',
      },
    ],
  },
  {
    number: 8,
    title: 'Capítulo 8: As Lápides de 1901',
    subtitle: 'O Cemitério Municipal e o Bairro Abandonado',
    synopsis:
      'O Cemitério Municipal guarda a memória da evacuação de 1987 no Bairro Abandonado. Cada lápide aponta para os subterrâneos da cidade.',
    climax: 'A Criatura da Floresta ronda o muro oeste sob neblina fechada.',
    targetHour: 0.85,
    objectives: [
      {
        id: 'cap8_cemiterio',
        title: 'Ler a Lápide de Nhô Batata',
        description: 'Entre no Cemitério Municipal e examine a lápide central.',
        locationHint: 'Cemitério Municipal',
        regionId: 'cemiterio_municipal',
      },
      {
        id: 'cap8_bairro',
        title: 'Investigar o Bairro Abandonado',
        description: 'Entre nas casas evacuadas de 1987 e encontre o jornal da evacuação.',
        locationHint: 'Bairro Abandonado',
        regionId: 'bairro_abandonado',
      },
    ],
  },
  {
    number: 9,
    title: 'Capítulo 9: O Túnel da Estrada Antiga',
    subtitle: 'Ecos subterrâneos sob a estrada esquecida',
    synopsis:
      'Para alcançar o lado norte isolado, você precisa atravessar o Túnel da Estrada Antiga onde ecos repetem passos mesmo quando você para.',
    climax: 'Som abafado e passos atrás de você dentro do túnel de pedra.',
    targetHour: 1.25,
    objectives: [
      {
        id: 'cap9_tunel',
        title: 'Atravessar o Túnel da Estrada Antiga',
        description: 'Entre no túnel e examine a pichação de alerta de 1987.',
        locationHint: 'Túnel da Estrada Antiga',
        regionId: 'tunel_antigo',
      },
    ],
  },
  {
    number: 10,
    title: 'Capítulo 10: Alas Fechadas do Hospital',
    subtitle: 'Prontuários da Primeira Madrugada no Hospital Abandonado',
    synopsis:
      'Com a chave da Estação, entre no Hospital Municipal Abandonado e descubra os laudos médicos de quem ouviu o sino às 03:00.',
    climax: 'Luzes piscam no corredor médico enquanto passos batem na porta.',
    targetHour: 1.65,
    objectives: [
      {
        id: 'cap10_chave_hosp',
        title: 'Pegar a Chave do Hospital na Estação',
        description: 'Recolha a chave mestra no guichê da Estação Ferroviária.',
        locationHint: 'Estação Ferroviária',
        regionId: 'estacao_ferroviaria',
      },
      {
        id: 'cap10_hospital',
        title: 'Ler os Prontuários no Hospital Abandonado',
        description: 'Destranque o Hospital Municipal e examine o relatório médico.',
        locationHint: 'Hospital Municipal Abandonado',
        regionId: 'hospital_abandonado',
      },
    ],
  },
  {
    number: 11,
    title: 'Capítulo 11: A Serra do Silêncio',
    subtitle: 'Ventania no alto da montanha e a Casa do Primeiro Morador',
    synopsis:
      'Suba a trilha íngreme até o mirante da Serra do Silêncio e desça às ruínas da Casa do Primeiro Morador para achar a chave da Mina.',
    climax: 'Visão panorâmica de toda Santa Batata tomada pela névoa noturna.',
    targetHour: 2.0,
    objectives: [
      {
        id: 'cap11_serra',
        title: 'Subir o Mirante da Serra do Silêncio',
        description: 'Escale a rampa da serra e ative o farol de vigia no topo.',
        locationHint: 'Serra do Silêncio',
        regionId: 'serra_silencio',
      },
      {
        id: 'cap11_primeiro',
        title: 'Explorar a Casa do Primeiro Morador',
        description: 'Encontre a Chave da Mina nas ruínas do Primeiro Morador.',
        locationHint: 'Casa do Primeiro Morador',
        regionId: 'casa_primeiro_morador',
      },
    ],
  },
  {
    number: 12,
    title: 'Capítulo 12: A Mina de 1924',
    subtitle: 'Onde tudo começou na Primeira Madrugada',
    synopsis:
      'Desça à Mina Desativada para encontrar o Selo da Primeira Madrugada e o Cartão Magnético que leva ao projeto secreto de 1958.',
    climax: 'Trilhos antigos descem às profundezas sob aviso de desabamento.',
    targetHour: 2.3,
    objectives: [
      {
        id: 'cap12_mina',
        title: 'Explorar a Mina Desativada',
        description: 'Recolha o Selo da Primeira Madrugada e o Cartão Magnético na galeria.',
        locationHint: 'Mina Desativada',
        regionId: 'mina_desativada',
      },
    ],
  },
  {
    number: 13,
    title: 'Capítulo 13: O Complexo Subterrâneo Secreto',
    subtitle: 'Projeto Aurora-MG (1958) sob a floresta',
    synopsis:
      'Com o cartão magnético, acesse o Complexo Subterrâneo Secreto e descubra a ligação científica e folclórica com o horário das 03:00.',
    climax: 'A verdade completa sobre "A Primeira Madrugada" é revelada.',
    targetHour: 2.6,
    objectives: [
      {
        id: 'cap13_complexo',
        title: 'Acessar o Complexo Subterrâneo',
        description: 'Desça ao laboratório secreto e colete a Fita Magnética de 1958.',
        locationHint: 'Complexo Subterrâneo Secreto',
        regionId: 'complexo_subterraneo',
      },
    ],
  },
  {
    number: 14,
    title: 'Capítulo 14: A Preparação na Igreja e Celeiro',
    subtitle: 'Faltam minutos para as 03:00 da manhã',
    synopsis:
      'Com a verdade em mãos, recupere o Café Coado do Celeiro Vermelho e a Cruz de Ipê Bento na Igreja Velha antes do badalar do relógio.',
    climax: 'Todas as criaturas ficam em alerta máximo com a aproximação das três.',
    targetHour: 2.85,
    objectives: [
      {
        id: 'cap14_celeiro',
        title: 'Abrir o Celeiro Vermelho',
        description: 'Destranque o Celeiro e pegue a Garrafa de Café Coado.',
        locationHint: 'Fazenda Boa Esperança',
        regionId: 'fazenda_boa_esperanca',
      },
      {
        id: 'cap14_igreja',
        title: 'Pegar a Cruz de Ipê na Igreja Velha',
        description: 'Destranque a Igreja Velha e recolha a Cruz de Ipê Bento no altar.',
        locationHint: 'Igreja Velha',
        regionId: 'igreja_velha',
      },
    ],
  },
  {
    number: 15,
    title: 'Capítulo 15: Deu 3 da Manhã',
    subtitle: 'Qual porta você vai abrir quando o sino bater três vezes?',
    synopsis:
      'O relógio marca 03:00! Batem na porta da Casa da Avó. Você pode selar a madrugada com a Cruz, fazer o pacto do Café no Coreto, revelar o dossiê secreto de 1958 — ou abrir a porta!',
    climax: 'Decisão final com 4 desfechos distintos e pós-jogo em mundo aberto.',
    targetHour: 3.0,
    objectives: [
      {
        id: 'cap15_final_choice',
        title: 'Decidir o Destino de Santa Batata às 03:00',
        description:
          'Fale com a Vó Maria (Final Bom), use o Coreto com Café+Milho (Final Secreto do Saci), entregue a Fita de 1958 no Rádio do Complexo/Vó (Final Verdadeiro), ou abra a Porta da Frente às 03:00!',
        locationHint: 'Casa da Avó / Praça Central',
        regionId: 'santa_batata',
      },
    ],
  },
];

export function getChapterByNumber(num: ChapterNumber): ChapterDefinition {
  return CHAPTERS.find((c) => c.number === num) ?? CHAPTERS[0];
}

// ============================================================================
// 45 MISSÕES SECUNDÁRIAS (10 Vó Maria, 10 Moradores, 10 Criaturas, 10 Exploração, 5 Especiais)
// ============================================================================
export const SIDE_MISSIONS: SideMission[] = [
  // 1-10: Vó Maria
  { id: 'sm_vo_1', title: 'Pão de Queijo da Tarde', giver: 'Vó Maria', category: 'avo', regionId: 'santa_batata', description: 'Prove o pão de queijo na cozinha da Vó.', rewardText: '+Energia máxima e afinidade com a Vó' },
  { id: 'sm_vo_2', title: 'Acender as Velas do Oratório', giver: 'Vó Maria', category: 'avo', regionId: 'santa_batata', description: 'Acenda a vela na sala da Casa da Avó antes da meia-noite.', rewardText: 'Afasta sustos dentro de casa' },
  { id: 'sm_vo_3', title: 'Desligar a Torneira Pingando', giver: 'Vó Maria', category: 'avo', regionId: 'santa_batata', description: 'Feche a torneira do banheiro que faz barulho no escuro.', rewardText: 'Menos ruído atraindo monstros' },
  { id: 'sm_vo_4', title: 'Conferir a Geladeira à Noite', giver: 'Vó Maria', category: 'avo', regionId: 'santa_batata', description: 'Verifique se alguém mexeu na geladeira da cozinha.', rewardText: 'Garrafinha de água fresca' },
  { id: 'sm_vo_5', title: 'Rezar na Igreja Velha pela Vó', giver: 'Vó Maria', category: 'avo', regionId: 'igreja_velha', description: 'Visite o altar da Igreja Velha e acenda a vela lateral.', rewardText: 'Coragem restaurada' },
  { id: 'sm_vo_6', title: 'O Espelho do Banheiro', giver: 'Vó Maria', category: 'avo', regionId: 'santa_batata', description: 'Encare o espelho da casa após a meia-noite.', rewardText: 'Evento secreto da madrugada' },
  { id: 'sm_vo_7', title: 'Relógio de Parede Atrasado', giver: 'Vó Maria', category: 'avo', regionId: 'santa_batata', description: 'Ajuste o relógio antigo da sala.', rewardText: 'Sincroniza alarme das 03:00' },
  { id: 'sm_vo_8', title: 'Gaveta Trancada da Vó', giver: 'Vó Maria', category: 'avo', regionId: 'santa_batata', description: 'Abra a gaveta da cômoda do quarto.', rewardText: 'Documento antigo da família' },
  { id: 'sm_vo_9', title: 'Fazer Café no Fogão a Lenha', giver: 'Vó Maria', category: 'avo', regionId: 'santa_batata', description: 'Use o fogão a lenha para esquentar a comida.', rewardText: 'Fome e fadiga zeradas' },
  { id: 'sm_vo_10', title: 'Proteger Todas as Trancas', giver: 'Vó Maria', category: 'avo', regionId: 'santa_batata', description: 'Feche a porta da frente e dos fundos antes das 03:00.', rewardText: 'Conquista Guardião da Casa' },

  // 11-20: Moradores
  { id: 'sm_mor_1', title: 'O Sumiço do Chinelo do Seu Zé', giver: 'Seu Zé', category: 'moradores', regionId: 'santa_batata', description: 'Ache a pista no quintal do vizinho.', rewardText: '+Reputação com Seu Zé' },
  { id: 'sm_mor_2', title: 'Estoque do Mercadinho do Tião', giver: 'Tião', category: 'moradores', regionId: 'santa_batata', description: 'Converse com Tião atrás do balcão e pegue mantimentos.', rewardText: 'Broa de Fubá gratuita' },
  { id: 'sm_mor_3', title: 'Truco na Praça Central', giver: 'Tião', category: 'moradores', regionId: 'santa_batata', description: 'Vença uma partida de Truco/Cartas na mesa do coreto.', rewardText: 'Troféu Rei do Zap', minigameTrigger: 'cartas' },
  { id: 'sm_mor_4', title: 'Pescaria com Zé Pescador', giver: 'Zé Pescador', category: 'moradores', regionId: 'vila_pescadores', description: 'Pesque uma tilápia no píer da Vila dos Pescadores.', rewardText: 'Tilápia Assada na Brasa', minigameTrigger: 'pesca' },
  { id: 'sm_mor_5', title: 'Sermão Esquecido de Padre Bento', giver: 'Padre Bento', category: 'moradores', regionId: 'igreja_velha', description: 'Fale com Padre Bento e encontre a chave da sacristia.', rewardText: 'Bênção anti-medo' },
  { id: 'sm_mor_6', title: 'Receita da Dona Clara', giver: 'Dona Clara', category: 'moradores', regionId: 'fazenda_boa_esperanca', description: 'Entregue milho dourado para Dona Clara na Fazenda.', rewardText: '2x Broas de Fubá' },
  { id: 'sm_mor_7', title: 'Caldo de Cana da Feira', giver: 'Dona Clara', category: 'moradores', regionId: 'santa_batata', description: 'Participe da feira noturna na Praça Central.', rewardText: 'Caldo de Cana' },
  { id: 'sm_mor_8', title: 'O Horário do Trem Fantasma', giver: 'Seu Zé', category: 'moradores', regionId: 'estacao_ferroviaria', description: 'Leia a tabela de horários de 1987 na Estação Ferroviária.', rewardText: 'Entrada de Lore de 1987' },
  { id: 'sm_mor_9', title: 'Sintonizar Rádio Pirata', giver: 'Tião', category: 'moradores', regionId: 'complexo_subterraneo', description: 'Resolva o enigma da frequência no minijogo do rádio.', rewardText: 'Acesso a canal secreto', minigameTrigger: 'enigma_radio' },
  { id: 'sm_mor_10', title: 'Bicicleta Emprestada do Tião', giver: 'Tião', category: 'moradores', regionId: 'santa_batata', description: 'Ande na bicicleta encostada perto do Mercadinho.', rewardText: 'Deslocamento rápido nas estradas' },

  // 21-30: Criaturas & Folclore
  { id: 'sm_cri_1', title: 'Trégua com a Gertrudes', giver: 'Dona Clara', category: 'criaturas', regionId: 'fazenda_boa_esperanca', description: 'Sobreviva a um encontro com a Galinha carregando milho.', rewardText: 'Galinha se distrai mais fácil' },
  { id: 'sm_cri_2', title: 'Redemoinho do Saci', giver: 'Saci Pererê', category: 'criaturas', regionId: 'floresta_esquecimento', description: 'Encontre o Saci após a meia-noite e troque fumo.', rewardText: 'Dicas secretas da floresta' },
  { id: 'sm_cri_3', title: 'Jogo da Memória Folclórico', giver: 'Saci Pererê', category: 'criaturas', regionId: 'floresta_esquecimento', description: 'Vença o desafio da memória dos mitos brasileiros.', rewardText: 'Amuleto de proteção', minigameTrigger: 'memoria' },
  { id: 'sm_cri_4', title: 'Fugir sem Fazer Barulho', giver: 'Vó Maria', category: 'criaturas', regionId: 'sitio_alves', description: 'Esconda-se dentro de um armário enquanto uma criatura patrulha.', rewardText: 'Mestre da Furtividade' },
  { id: 'sm_cri_5', title: 'Apagar a Lanterna no Escuro', giver: 'Seu Zé', category: 'criaturas', regionId: 'bairro_abandonado', description: 'Passe agachado pelo Bairro Abandonado com a lanterna desligada.', rewardText: 'Reduz suspeita das criaturas' },
  { id: 'sm_cri_6', title: 'A Sombra na Represa', giver: 'Zé Pescador', category: 'criaturas', regionId: 'represa', description: 'Aviste o Homem do Saco na ponte da Represa sem ser pego.', rewardText: 'Relatório de comportamento' },
  { id: 'sm_cri_7', title: 'Rastro da Criatura da Floresta', giver: 'Padre Bento', category: 'criaturas', regionId: 'floresta_esquecimento', description: 'Chegue ao centro da mata alta e volte vivo.', rewardText: 'Lore da Criatura da Floresta' },
  { id: 'sm_cri_8', title: 'Galope de Fogo na Estrada', giver: 'Seu Zé', category: 'criaturas', regionId: 'estrada_velha', description: 'Observe a Mula-sem-Cabeça correndo pela Estrada Velha.', rewardText: 'Registro folclórico raro' },
  { id: 'sm_cri_9', title: 'Distrair com Caixa Caída', giver: 'Tião', category: 'criaturas', regionId: 'hospital_abandonado', description: 'Empurre um caixote físico no corredor para desviar um monstro.', rewardText: 'Tática avançada de distração' },
  { id: 'sm_cri_10', title: 'Selo de Ferro na Mina', giver: 'Padre Bento', category: 'criaturas', regionId: 'mina_desativada', description: 'Sobreviva dentro da Mina Desativada às 02:00.', rewardText: 'Selo da Primeira Madrugada' },

  // 31-40: Exploração
  { id: 'sm_exp_1', title: 'Desbravador da Estrada Velha', giver: 'Exploração', category: 'exploracao', regionId: 'estrada_velha', description: 'Percorra toda a Estrada Velha até o entroncamento norte.', rewardText: 'Região cartografada' },
  { id: 'sm_exp_2', title: 'Segredo do Hospital', giver: 'Exploração', category: 'exploracao', regionId: 'hospital_abandonado', description: 'Suba ao segundo andar do Hospital Municipal Abandonado.', rewardText: 'Prontuário de 1987' },
  { id: 'sm_exp_3', title: 'Vagão da Maria-Fumaça', giver: 'Exploração', category: 'exploracao', regionId: 'estacao_ferroviaria', description: 'Suba na plataforma elevada da Estação Ferroviária.', rewardText: 'Chave Mestra do Hospital' },
  { id: 'sm_exp_4', title: 'Escada da Serra do Silêncio', giver: 'Exploração', category: 'exploracao', regionId: 'serra_silencio', description: 'Atinja o ponto mais alto da Serra do Silêncio (+4.2m).', rewardText: 'Amuleto da Serra' },
  { id: 'sm_exp_5', title: 'Águas da Represa', giver: 'Exploração', category: 'exploracao', regionId: 'represa', description: 'Atravesse toda a passarela sobre a Represa.', rewardText: 'Água da Serra' },
  { id: 'sm_exp_6', title: 'Ruína do Fundador', giver: 'Exploração', category: 'exploracao', regionId: 'casa_primeiro_morador', description: 'Encontre a carta escondida na Casa do Primeiro Morador.', rewardText: 'Carta de 1924' },
  { id: 'sm_exp_7', title: 'Eco do Túnel Antigo', giver: 'Exploração', category: 'exploracao', regionId: 'tunel_antigo', description: 'Atravesse o Túnel da Estrada Antiga de ponta a ponta.', rewardText: 'Registro sonoro' },
  { id: 'sm_exp_8', title: 'Memória de Santa Luzia', giver: 'Exploração', category: 'exploracao', regionId: 'fazenda_santa_luzia', description: 'Entre na sede da Fazenda Santa Luzia.', rewardText: 'Fotografia antiga' },
  { id: 'sm_exp_9', title: 'Arquivo do Complexo 1958', giver: 'Exploração', category: 'exploracao', regionId: 'complexo_subterraneo', description: 'Explore todas as salas do Complexo Subterrâneo.', rewardText: 'Fita Magnética 1958' },
  { id: 'sm_exp_10', title: 'Turista Completo de MG', giver: 'Exploração', category: 'exploracao', regionId: 'santa_batata', description: 'Visite todas as 18 regiões de Santa Batata.', rewardText: 'Conquista Atlas de Minas' },

  // 41-45: Especiais & Minigames
  { id: 'sm_esp_1', title: 'Caça ao Tesouro de Nhô Batata', giver: 'Mapa Antigo', category: 'especiais', regionId: 'cemiterio_municipal', description: 'Resolva o enigma da Caça ao Tesouro.', rewardText: 'Relógio Parado às 03:00', minigameTrigger: 'caca_tesouro' },
  { id: 'sm_esp_2', title: 'Canal 3 da TV de Tubo', giver: 'Mistério', category: 'especiais', regionId: 'santa_batata', description: 'Ligue a TV da sala às 03:00 da manhã.', rewardText: 'Transmissão secreta ao vivo' },
  { id: 'sm_esp_3', title: 'Dormir Antes das Três', giver: 'Vó Maria', category: 'especiais', regionId: 'santa_batata', description: 'Descanse na cama do quarto para recuperar fadiga.', rewardText: 'Fadiga 0% e avanço de turno' },
  { id: 'sm_esp_4', title: 'Sobrevivente da Chuva Forte', giver: 'Clima', category: 'especiais', regionId: 'estrada_velha', description: 'Explore durante uma tempestade com trovões.', rewardText: 'Conquista Filho da Chuva' },
  { id: 'sm_esp_5', title: 'Colecionador da Verdade', giver: 'Arquivo Histórico', category: 'especiais', regionId: 'complexo_subterraneo', description: 'Desbloqueie 10 ou mais documentos históricos de lore.', rewardText: 'Final Verdadeiro habilitado' },
];

// ============================================================================
// LORE PROFUNDO: "A PRIMEIRA MADRUGADA" (20 DOCUMENTOS HISTÓRICOS)
// ============================================================================
export const LORE_ENTRIES: LoreEntry[] = [
  {
    id: 'lore_1924_mina',
    title: 'Relatório da Escavação #01 (1924)',
    year: '1924',
    kind: 'relatorio',
    regionId: 'mina_desativada',
    summary: 'Descoberta da fenda mineral na Mina de Santa Batata.',
    content:
      'Em 14 de junho de 1924, os mineiros romperam uma câmara oca a 40 metros de profundidade. Às 03:00 em ponto, todas as lamparinas mudaram de cor e o eco começou a responder antes de falarmos.',
  },
  {
    id: 'lore_1924_carta_fundador',
    title: 'Carta do Primeiro Morador (1924)',
    year: '1924',
    kind: 'carta',
    regionId: 'casa_primeiro_morador',
    summary: 'Aviso escrito por Nhô Batata à própria família.',
    content:
      'Se alguém ler esta carta depois que eu partir: não é ouro o que está embaixo da serra. É um relógio natural que trava o tempo às três da madrugada. Fechem todas as portas.',
  },
  {
    id: 'lore_1938_igreja',
    title: 'Ata Paroquial da Igreja Velha (1938)',
    year: '1938',
    kind: 'documento',
    regionId: 'igreja_velha',
    summary: 'Escultura da Cruz de Ipê Bento.',
    content:
      'Padre Arlindo mandou esculpir a Cruz no tronco do ipê mais antigo da praça. Sempre que alguém toca o sino às 03:00, a neblina recua para o limite da mata.',
  },
  {
    id: 'lore_1958_aurora',
    title: 'Projeto Aurora-MG: Memorando 07 (1958)',
    year: '1958',
    kind: 'relatorio',
    regionId: 'complexo_subterraneo',
    summary: 'Construção do Complexo Subterrâneo Secreto.',
    content:
      'Instalamos geradores sob a Floresta do Esquecimento para medir a anomalia acústica das 03:00. Os funcionários relatam uma figura alta carregando um saco de estopa nos corredores do subsolo.',
  },
  {
    id: 'lore_1958_gravacao',
    title: 'Transcrição de Fita #12 (1958)',
    year: '1958',
    kind: 'gravacao',
    regionId: 'complexo_subterraneo',
    summary: 'Último registro antes do lacre do laboratório.',
    content:
      '[ESTÁTICA]... "Desliga a bobina! A frequência atraiu algo da mata... Não é humano e não obedece parede nenhuma quando a porta fica aberta!" [FIM DA FITA].',
  },
  {
    id: 'lore_1972_fazenda',
    title: 'Livro Caixa da Fazenda Santa Luzia (1972)',
    year: '1972',
    kind: 'documento',
    regionId: 'fazenda_santa_luzia',
    summary: 'O ano em que o gado desapareceu na neblina.',
    content:
      'Terça-feira de julho: sete cabeças de gado apareceram no topo da Serra do Silêncio olhando fixo para a Represa. Nenhuma pegada foi vista na lama.',
  },
  {
    id: 'lore_1987_jornal',
    title: 'Gazeta de Minas — Edição Extra (1987)',
    year: '1987',
    kind: 'jornal',
    regionId: 'bairro_abandonado',
    summary: 'Evacuação repentina do Bairro Norte.',
    content:
      'MORADORES ABANDONAM CASAS APÓS A PRIMEIRA MADRUGADA DE AGOSTO. Relatos incluem TVs ligando sozinhas no canal 3 e um assobio contínuo vindo dos trilhos da estação.',
  },
  {
    id: 'lore_1987_hospital',
    title: 'Prontuário Médico #404 (1987)',
    year: '1987',
    kind: 'relatorio',
    regionId: 'hospital_abandonado',
    summary: 'Registro dos últimos pacientes do Hospital Municipal.',
    content:
      'Paciente acordou às 03:02 afirmando ter visto uma galinha falando com um homem de chapéu preto na recepção. Recomendado fechar a ala oeste permanentemente.',
  },
  {
    id: 'lore_1987_estacao',
    title: 'Manifesto de Carga da Maria-Fumaça (1987)',
    year: '1987',
    kind: 'documento',
    regionId: 'estacao_ferroviaria',
    summary: 'Último trem que partiu de Santa Batata.',
    content:
      'Comboio das 02:50 partiu sem passageiros levando 14 caixotes lacrados do Complexo Subterrâneo. O apito ainda ecoa no Túnel Antigo em noites de lua cheia.',
  },
  {
    id: 'lore_1987_represa',
    title: 'Diário do Engenheiro da Represa (1987)',
    year: '1987',
    kind: 'carta',
    regionId: 'represa',
    summary: 'Por que submergiram o caminho antigo.',
    content:
      'Inundamos a baixada leste na tentativa de bloquear o acesso ao Complexo. Mas a água não detém o folclore da terra.',
  },
  {
    id: 'lore_foto_praca',
    title: 'Fotografia da Praça em 1965',
    year: '1965',
    kind: 'fotografia',
    regionId: 'santa_batata',
    summary: 'Vó Maria jovem diante do coreto.',
    content:
      'Foto sépia mostrando Dona Maria ainda moça ao lado de Padre Bento recém-chegado. No fundo, uma sombra comprida aparece atrás da Igreja Velha.',
  },
  {
    id: 'lore_tunel',
    title: 'Pichação de Alerta no Túnel',
    year: '1988',
    kind: 'documento',
    regionId: 'tunel_antigo',
    summary: 'Mensagem pintada com cal na parede do túnel.',
    content:
      '"Se você ouvir seus próprios passos duas vezes aqui dentro, corra para a saída norte e não olhe para trás."',
  },
  {
    id: 'lore_serra',
    title: 'Caderno do Vigia da Serra',
    year: '1994',
    kind: 'carta',
    regionId: 'serra_silencio',
    summary: 'Observações do alto da Serra do Silêncio.',
    content:
      'Do alto da serra dá pra ver todas as luzes de Santa Batata apagando às 02:59, exceto a varanda da Dona Maria.',
  },
  {
    id: 'lore_pescadores',
    title: 'Caderno de Marés de Zé Pescador',
    year: '2012',
    kind: 'documento',
    regionId: 'vila_pescadores',
    summary: 'Lenda da água parada às três.',
    content:
      'Quando dá três da manhã, nem o lambari mexe na represa. A água fica lisa feito espelho pra refletir quem anda na ponte.',
  },
  {
    id: 'lore_sitio_alves',
    title: 'Bilhete Esquecido no Sítio dos Alves',
    year: '1987',
    kind: 'carta',
    regionId: 'sitio_alves',
    summary: 'Despedida apressada dos antigos donos.',
    content:
      'Deixamos a chave da igreja atrás do armário velho. Não deu tempo de recolher a colheita de milho antes da meia-noite.',
  },
  {
    id: 'lore_galinha_gertrudes',
    title: 'Anotação Veterinária Secreta',
    year: '2021',
    kind: 'relatorio',
    regionId: 'fazenda_boa_esperanca',
    summary: 'Ficha curiosa sobre a Galinha Gertrudes.',
    content:
      'A ave demonstra inteligência incomum, abre fechos simples com o bico e guarda chaves metálicas no galinheiro. Evitar provocá-la após 21:00.',
  },
  {
    id: 'lore_saci_floresta',
    title: 'Estudo Folclórico de Minas Gerais',
    year: '1979',
    kind: 'documento',
    regionId: 'floresta_esquecimento',
    summary: 'Costumes do Saci na Serra Mineira.',
    content:
      'Ao contrário dos monstros da neblina, o Saci é guardião travesso da mata: aprecia fumo de corda e café passado na hora, e detesta invasores arrogantes.',
  },
  {
    id: 'lore_cemiterio_1901',
    title: 'Placa de Bronze do Cemitério',
    year: '1901',
    kind: 'documento',
    regionId: 'cemiterio_municipal',
    summary: 'Fundação do cemitério antes da cidade.',
    content:
      'Erguido em 1901, onze anos antes do registro oficial de Santa Batata. Os túmulos mais antigos estão todos voltados para o Complexo Leste.',
  },
  {
    id: 'lore_mapa_subterraneo',
    title: 'Planta Baixa do Complexo Subterrâneo',
    year: '1958',
    kind: 'mapa',
    regionId: 'complexo_subterraneo',
    summary: 'Diagrama dos geradores e túneis.',
    content:
      'Conecta a Mina Desativada à antiga caixa d’água da floresta através de dutos acústicos. Desativar a trava principal exige o Selo de 1924.',
  },
  {
    id: 'lore_diario_vo',
    title: 'Última Página do Diário da Vó Maria',
    year: 'Hoje',
    kind: 'carta',
    regionId: 'santa_batata',
    summary: 'Por que ela sempre diz para não abrir a porta.',
    content:
      'Meu neto não sabe, mas em 1987 fui eu quem segurou a maçaneta até o amanhecer. Enquanto a porta ficar fechada às 03:00, Santa Batata continua de pé.',
  },
];

// ============================================================================
// 30 EVENTOS ESPECIAIS & 20 HISTÓRIAS OPCIONAIS
// ============================================================================
export const SPECIAL_EVENTS: Array<{
  id: string;
  title: string;
  regionId: RegionId | 'global';
  nightOnly?: boolean;
  subtitle: string;
  sound: 'wood' | 'viola' | 'thunder' | 'chicken' | 'saci' | 'spooky' | 'cricket';
}> = [
  { id: 'ev_1', title: 'Panela na Cozinha', regionId: 'santa_batata', nightOnly: true, subtitle: 'CLANK! Uma panela de ferro caiu sozinha na cozinha da Vó!', sound: 'wood' },
  { id: 'ev_2', title: 'Geladeira Aberta', regionId: 'santa_batata', nightOnly: true, subtitle: 'O motor da geladeira estalou e a porta entreabriu sozinha.', sound: 'wood' },
  { id: 'ev_3', title: 'Rádio Pirata AM', regionId: 'global', subtitle: 'Rádio AM: "Atenção Santa Batata, previsão de neblina e sumiço de chinelo..."', sound: 'viola' },
  { id: 'ev_4', title: 'Propaganda do Tião', regionId: 'santa_batata', subtitle: 'Alto-falante da Praça: "Oferta no Mercadinho do Tião: alho e café forte!"', sound: 'viola' },
  { id: 'ev_5', title: 'Passos no Telhado', regionId: 'santa_batata', nightOnly: true, subtitle: 'Telhas de barro rangeram bem em cima da sua cabeça...', sound: 'wood' },
  { id: 'ev_6', title: 'Trovão na Serra', regionId: 'global', subtitle: 'TROVÃO! Um relâmpago iluminou os morros de Minas!', sound: 'thunder' },
  { id: 'ev_7', title: 'Risada da Gertrudes', regionId: 'fazenda_boa_esperanca', subtitle: 'Có-có-có... Essa galinha tá rindo de você?!', sound: 'chicken' },
  { id: 'ev_8', title: 'Assobio no Milharal', regionId: 'floresta_esquecimento', nightOnly: true, subtitle: 'Fiu-fiu! Um redemoinho de folhas rodou entre as árvores.', sound: 'saci' },
  { id: 'ev_9', title: 'Apito da Maria-Fumaça', regionId: 'estacao_ferroviaria', nightOnly: true, subtitle: 'PIUÍÍÍ! Um apito de trem antigo ecoou nos trilhos vazios!', sound: 'spooky' },
  { id: 'ev_10', title: 'Sino da Igreja Velha', regionId: 'igreja_velha', nightOnly: true, subtitle: 'BÉM... O sino da igreja tocou uma única vez sem ninguém na torre.', sound: 'spooky' },
  { id: 'ev_11', title: 'Batida na Janela', regionId: 'sitio_alves', nightOnly: true, subtitle: 'TOC-TOC-TOC! Alguém bateu no vidro pelo lado de fora.', sound: 'wood' },
  { id: 'ev_12', title: 'Eco Duplo do Túnel', regionId: 'tunel_antigo', subtitle: 'Seus passos ecoaram três vezes depois que você parou.', sound: 'spooky' },
  { id: 'ev_13', title: 'Peixe Saltando na Represa', regionId: 'represa', subtitle: 'SPLASH! Algo grande mergulhou nas águas escuras da Represa.', sound: 'cricket' },
  { id: 'ev_14', title: 'Maca Rangendo no Hospital', regionId: 'hospital_abandonado', nightOnly: true, subtitle: 'Rodinhas metálicas rangeram no corredor da ala fechada.', sound: 'wood' },
  { id: 'ev_15', title: 'Picareta Fantasma', regionId: 'mina_desativada', nightOnly: true, subtitle: 'TIN-TIN... Som de picareta batendo em pedra lá no fundo da mina.', sound: 'wood' },
  { id: 'ev_16', title: 'Voz no Duto de 1958', regionId: 'complexo_subterraneo', subtitle: 'Zumbido elétrico: "Frequência Aurora alinhada para 03:00..."', sound: 'spooky' },
  { id: 'ev_17', title: 'Coruja no Cruzeiro', regionId: 'cemiterio_municipal', nightOnly: true, subtitle: 'Uhuuu... Uma coruja branca levantou voo de uma lápide.', sound: 'cricket' },
  { id: 'ev_18', title: 'Vento Gelado da Serra', regionId: 'serra_silencio', subtitle: 'Uma lufada gelada soprou da Serra do Silêncio apagando brasas.', sound: 'thunder' },
  { id: 'ev_19', title: 'Chaleira Apitando', regionId: 'santa_batata', subtitle: 'A chaleira no fogão a lenha começou a chiar sem fogo aceso.', sound: 'wood' },
  { id: 'ev_20', title: 'TV no Canal 3', regionId: 'santa_batata', nightOnly: true, subtitle: 'Estática de televisão chiou brevemente na sala.', sound: 'spooky' },
  { id: 'ev_21', title: 'Cachorro da Vizinha', regionId: 'bairro_abandonado', nightOnly: true, subtitle: 'Au-au-au! Um cachorro latiu na direção do Bairro Abandonado.', sound: 'cricket' },
  { id: 'ev_22', title: 'Porteira Rangendo', regionId: 'fazenda_santa_luzia', subtitle: 'A porteira da Fazenda Santa Luzia balançou sozinha.', sound: 'wood' },
  { id: 'ev_23', title: 'Barco Batendo no Píer', regionId: 'vila_pescadores', subtitle: 'TUM... O barquinho de madeira bateu na estaca do píer.', sound: 'wood' },
  { id: 'ev_24', title: 'Galope Distante', regionId: 'estrada_velha', nightOnly: true, subtitle: 'Cascos rápidos ecoaram na Estrada Velha e sumiram na curva.', sound: 'spooky' },
  { id: 'ev_25', title: 'Sombra na Varanda', regionId: 'casa_primeiro_morador', nightOnly: true, subtitle: 'Uma silhueta esguia passou atrás das ruínas do Primeiro Morador.', sound: 'spooky' },
  { id: 'ev_26', title: 'Vaga-lumes Dourados', regionId: 'floresta_esquecimento', nightOnly: true, subtitle: 'Um enxame de vaga-lumes acendeu a trilha da floresta.', sound: 'cricket' },
  { id: 'ev_27', title: 'Viola Caipira ao Longe', regionId: 'santa_batata', subtitle: 'Alguém dedilhou uma moda de viola melancólica perto da praça.', sound: 'viola' },
  { id: 'ev_28', title: 'Torneira do Banheiro', regionId: 'santa_batata', nightOnly: true, subtitle: 'Plim... plim... A torneira começou a pingar no ritmo de um relógio.', sound: 'wood' },
  { id: 'ev_29', title: 'Porta Testada', regionId: 'santa_batata', nightOnly: true, subtitle: 'A maçaneta da porta da frente girou devagar e parou.', sound: 'wood' },
  { id: 'ev_30', title: 'Canto do Galo Antecipado', regionId: 'fazenda_boa_esperanca', subtitle: 'Cocoricóóó! O galo cantou errado no meio da noite.', sound: 'chicken' },
];

export const OPTIONAL_STORIES: Array<{ id: string; title: string; regionId: RegionId; text: string }> = [
  { id: 'st_1', title: 'A Origem do Nome Santa Batata', regionId: 'santa_batata', text: 'Dizem que em 1912 caiu um meteoro redondo na lavoura do fundador, que achou que era uma batata gigante abençoada.' },
  { id: 'st_2', title: 'O Campeão de Truco de 1998', regionId: 'santa_batata', text: 'Tião jura que ganhou um saco de milho e um rádio do Seu Zé usando apenas um 4 de paus blefado.' },
  { id: 'st_3', title: 'A Galinha Gertrudes e o Carteiro', regionId: 'fazenda_boa_esperanca', text: 'Nenhum carteiro entra no quintal desde 2022 depois que Gertrudes roubou três boletos e enterrou no milharal.' },
  { id: 'st_4', title: 'O Mistério da Terça-Feira', regionId: 'santa_batata', text: 'Seu Zé acredita firmemente que todas as assombrações de Minas têm folga na quinta e fazem hora extra na terça.' },
  { id: 'st_5', title: 'Por Que o Saci Usa Gorro', regionId: 'floresta_esquecimento', text: 'Segundo o próprio Saci, sem a carapuça vermelha a neblina da Serra do Silêncio congela a orelha dele.' },
  { id: 'st_6', title: 'O Último Paciente Feliz', regionId: 'hospital_abandonado', text: 'Antes de fechar, o Hospital ficou famoso pelo melhor chá de erva-cidreira da região.' },
  { id: 'st_7', title: 'O Peixe de Três Olhos', regionId: 'represa', text: 'Zé Pescador garante que devolveu um dourado que pediu licença antes de pular de volta pra represa.' },
  { id: 'st_8', title: 'As Cartas de Padre Bento', regionId: 'igreja_velha', text: 'Padre Bento escreve poemas de comédia mineira no verso dos panfletos de quermesse.' },
  { id: 'st_9', title: 'O Vagão nº 3', regionId: 'estacao_ferroviaria', text: 'O terceiro vagão da Maria-Fumaça sempre chegava gelado mesmo no verão de janeiro.' },
  { id: 'st_10', title: 'O Café Premiado de Santa Luzia', regionId: 'fazenda_santa_luzia', text: 'Os grãos colhidos ali antes de 1987 tinham gosto de canela e fumaça de fogão a lenha.' },
  { id: 'st_11', title: 'A Promessa do Sítio dos Alves', regionId: 'sitio_alves', text: 'Os irmãos Alves saíram só pra comprar querosene na cidade vizinha e nunca voltaram pra buscar a chave.' },
  { id: 'st_12', title: 'O Relógio da Igreja', regionId: 'igreja_velha', text: 'O ponteiro dos minutos travou exatamente no número 3 durante a tempestade de 1987.' },
  { id: 'st_13', title: 'O Bairro que Dormiu Cedo', regionId: 'bairro_abandonado', text: 'Todas as casas ainda têm xícaras de café pela metade sobre a mesa.' },
  { id: 'st_14', title: 'A Viga Mestre da Mina', regionId: 'mina_desativada', text: 'Esculpida em aroeira maciça, resistiu a um século de umidade subterrânea.' },
  { id: 'st_15', title: 'Os Fones do Cientista', regionId: 'complexo_subterraneo', text: 'Um pesquisador de 1958 esqueceu um par de fones no laboratório porque ouviu viola caipira dentro do capacete.' },
  { id: 'st_16', title: 'A Cruz no Cruzeiro da Serra', regionId: 'serra_silencio', text: 'Foi erguida para guiar tropeiros perdidos quando a serra fechava na neblina.' },
  { id: 'st_17', title: 'O Barco Azul da Vila', regionId: 'vila_pescadores', text: 'Pintado todos os anos por Dona Clara em homenagem aos antigos pescadores.' },
  { id: 'st_18', title: 'O Eco da Estrada Velha', regionId: 'estrada_velha', text: 'Quem assobia na curva das três porteiras recebe um assobio de volta da floresta.' },
  { id: 'st_19', title: 'O Chapéu do Primeiro Morador', regionId: 'casa_primeiro_morador', text: 'Nhô Batata nunca tirava o chapéu nem na cozinha — dizia que segurava as ideias no lugar.' },
  { id: 'st_20', title: 'O Pão de Queijo Inacabado', regionId: 'santa_batata', text: 'Vó Maria guarda sempre uma fornada extra na cozinha caso algum visitante chegue antes do amanhecer.' },
];

// ============================================================================
// 20 CONQUISTAS
// ============================================================================
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'ach_chegada', title: 'Bem-vindo a Santa Batata', description: 'Inicie sua estadia e converse com a Vó Maria.' },
  { id: 'ach_luz', title: 'Luz no Breu', description: 'Encontre a Lanterna de Pilha Velha na sala.' },
  { id: 'ach_regra3', title: 'A Regra de Ouro', description: 'Sobreviva ao primeiro aviso das 03:00 da manhã.' },
  { id: 'ach_escondido', title: 'Mestre do Armário', description: 'Esconda-se em armários 3 vezes para escapar de criaturas.' },
  { id: 'ach_galinha', title: 'Sobrevivente da Gertrudes', description: 'Recupere a chave e escape da Galinha furiosa.' },
  { id: 'ach_saci', title: 'Diplomata Folclórico', description: 'Negocie com o Saci usando Fumo de Corda.' },
  { id: 'ach_atlas', title: 'Atlas de Minas Gerais', description: 'Descubra pelo menos 12 regiões de Santa Batata.' },
  { id: 'ach_turista18', title: 'Explorador Total', description: 'Descubra todas as 18 regiões do mapa aberto.' },
  { id: 'ach_historiador', title: 'Historiador da Madrugada', description: 'Desbloqueie 10 registros históricos de Lore.' },
  { id: 'ach_pescador', title: 'Rei da Represa', description: 'Vença o minijogo de Pesca na Vila dos Pescadores.' },
  { id: 'ach_truco', title: 'Zap na Mão!', description: 'Vença uma partida de Truco/Cartas na Praça Central.' },
  { id: 'ach_memoria', title: 'Mente Afiada', description: 'Complete o Jogo da Memória Folclórico.' },
  { id: 'ach_radio', title: 'Frequência Oculta', description: 'Decifre o Enigma do Rádio de 1958.' },
  { id: 'ach_tesouro', title: 'Caçador de Relíquias', description: 'Complete a Caça ao Tesouro de Nhô Batata.' },
  { id: 'ach_bike', title: 'Tour de Bicicleta', description: 'Pedale pela Estrada Velha na bicicleta do Tião.' },
  { id: 'ach_missao10', title: 'Mão na Massa', description: 'Conclua 10 missões secundárias dos moradores.' },
  { id: 'ach_final_bom', title: 'O Amanhecer de Minas', description: 'Complete o Final Bom protegendo a porta.' },
  { id: 'ach_final_secreto', title: 'Café com Redemoinho', description: 'Desbloqueie o Final Secreto com Saci e Gertrudes.', secret: true },
  { id: 'ach_final_verdadeiro', title: 'A Primeira Madrugada', description: 'Revele os segredos do Complexo de 1958 e sele a origem.', secret: true },
  { id: 'ach_curioso', title: 'Curiosidade Fatal', description: 'Abra a porta da frente exatamente depois das 03:00.', secret: true },
];

export const ENDING_DETAILS: Record<
  EndingType,
  { title: string; subtitle: string; description: string; victory: boolean; badge: string }
> = {
  amanhecer_santa_batata: {
    title: 'O Amanhecer de Santa Batata',
    subtitle: 'Final Bom — Você respeitou a regra da Vó Maria!',
    description:
      'Com a Cruz de Ipê Bento erguida e a porta bem trancada às 03:00 da manhã, o Homem do Saco recuou para dentro da neblina. Às 06:00, o galo cantou, Seu Zé apareceu dizendo que "dormiu num pé de milho sem querer" e a Vó serviu pão de queijo quentinho.',
    victory: true,
    badge: 'SOBREVIVENTE DA ROÇA',
  },
  cafe_com_saci: {
    title: 'Café da Madrugada com o Saci',
    subtitle: 'Final Secreto — Diplomacia Caipira Nível Máximo!',
    description:
      'Em vez de brigar com o folclore, você dividiu Café Coado com o Saci e Milho Dourado com a Galinha Gertrudes no coreto da Praça. Os dois formaram uma barreira de redemoinhos e bicadas que expulsou as sombras pra bem longe da serra!',
    victory: true,
    badge: 'LENDÁRIO DE SANTA BATATA',
  },
  segredo_primeira_madrugada: {
    title: 'A Verdade da Primeira Madrugada',
    subtitle: 'Final Verdadeiro — O Mistério de 1924 e 1958 Selado!',
    description:
      'Unindo a Fita Magnética do Projeto Aurora-MG (1958) ao Selo da Mina de 1924 e à Cruz de Ipê, você desligou a ressonância das 03:00 de uma vez por todas. Santa Batata finalmente terá noites tranquilas — embora Gertrudes ainda cobre pedágio de milho no quintal.',
    victory: true,
    badge: 'FINAL VERDADEIRO · 100%',
  },
  porta_das_tres: {
    title: 'A Porta das Três da Manhã',
    subtitle: 'Final Sombrio — A curiosidade falou mais alto...',
    description:
      'Mesmo com todos os avisos da Vó Maria, você girou a maçaneta depois das 03:00. O vento gelado apagou a lanterna e um saco de estopa gigante fechou a vista... Dizem que até hoje o próximo visitante ouve seus passos na cozinha.',
    victory: false,
    badge: 'QUEBROU A REGRA DAS 3H',
  },
  pego_homem_do_saco: {
    title: 'Levado na Neblina!',
    subtitle: 'Derrota — Uma criatura da madrugada alcançou você.',
    description:
      'Você não conseguiu se esconder ou despistar a criatura atrás das paredes a tempo! Da próxima vez, feche portas atrás de você, apague a lanterna e use os armários espalhados pelas 18 regiões.',
    victory: false,
    badge: 'FIM DE MADRUGADA',
  },
  bicado_pela_galinha: {
    title: 'Derrotado pela Gertrudes',
    subtitle: 'Derrota Cômica — A galinha realmente não era normal.',
    description:
      'A Vó avisou que ela não pagava aluguel! A galinha endiabrada correu mais rápido que você e deu o troco com 47 bicadas por segundo.',
    victory: false,
    badge: 'BICADA LENDÁRIA',
  },
};
