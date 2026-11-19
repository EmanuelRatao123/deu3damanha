import type { ChapterNumber, DialogueLine, WeatherType } from './types';

export interface DialogueContextInput {
  npcId: string;
  chapter: ChapterNumber;
  hour24: number;
  weather: WeatherType;
  reputation: number;
  completedObjectives: Set<string>;
  seenDialogueIds: Set<string>;
  inventoryIds: Set<string>;
}

/**
 * Rich multi-line dialogue repository with memory-backed variation
 * so NPCs react to time of day, weather, reputation, and avoid repeating lines unnecessarily.
 */
export const DIALOGUE_LINES: Record<string, Record<string, DialogueLine>> = {
  avo: {
    start_cap1: {
      id: 'avo_start_cap1',
      speaker: 'Vó Maria',
      role: 'Avó Mineira',
      text: 'Ô meu fio, que alegria cê ter chegado em Santa Batata! Toma um cafezin... mas olha: a fiação tá piscando hoje. Pega a lanterna lá na mesinha da sala antes de sair pros cantos da cidade.',
      comedyTone: true,
      choices: [
        { label: 'Pode deixar, Vó! Tem algum perigo por aqui?', nextId: 'aviso_1', reputationDelta: 5 },
        { label: 'E aquela galinha me encarando no quintal?', nextId: 'galinha_piada', reputationDelta: 5 },
      ],
    },
    aviso_1: {
      id: 'avo_aviso_1',
      speaker: 'Vó Maria',
      role: 'Avó Mineira',
      text: 'Perigo? Só lembra da regra da família: pode andar pela cidade toda, mas NÃO abra a porta da frente depois das três da manhã. E se ouvir batida na janela, finge que tá roncando!',
      choices: [{ label: 'Anotado, Vó! Vou pegar a lanterna.', action: 'complete_cap1_vo', reputationDelta: 5 }],
    },
    galinha_piada: {
      id: 'avo_galinha_piada',
      speaker: 'Vó Maria',
      role: 'Avó Mineira',
      text: 'Ah, a Gertrudes? Ela não paga aluguel, rouba milho e já botou o carteiro pra correr! Fecha a porta do quintal se ela olhar torto pra você.',
      comedyTone: true,
      choices: [{ label: 'Kkkk beleza Vó, vou lá na sala.', action: 'complete_cap1_vo', reputationDelta: 5 }],
    },
    cap2_alerta: {
      id: 'avo_cap2_alerta',
      speaker: 'Vó Maria',
      role: 'Avó Mineira',
      text: 'Cê ouviu aquele estrondo na cozinha? Quando o rádio chiado liga sozinho, é sinal de que a Primeira Madrugada tá mexendo nas lembranças da serra. Fecha as portas antes da meia-noite!',
      choices: [{ label: 'Entendi, Vó! Vou investigar Santa Batata.', action: 'complete_cap2_vo', reputationDelta: 5 }],
    },
    cap15_ritual: {
      id: 'avo_cap15_ritual',
      speaker: 'Vó Maria',
      role: 'Avó Mineira',
      text: 'Deu 3 da manhã! Tá ouvindo as batidas pesadas lá fora?! Com a Cruz de Ipê na mão (ou com a fita de 1958), a gente decide o futuro de Santa Batata agora!',
      choices: [
        { label: 'Selar a casa com a Cruz de Ipê! (Final Bom)', action: 'ending_good' },
        { label: 'Usar Selo de 1924 + Fita 1958 + Cruz! (Final Verdadeiro)', action: 'ending_true' },
        { label: 'Ainda quero explorar mais a cidade.', nextId: 'fechar' },
      ],
    },
    chuva_varanda: {
      id: 'avo_chuva_varanda',
      speaker: 'Vó Maria',
      role: 'Avó Mineira',
      text: 'Olha o pé d’água caindo na Serra do Silêncio! Se sair na chuva com o estômago vazio, passa no fogão a lenha antes que a friagem pega.',
      comedyTone: true,
      choices: [{ label: 'Obrigado pelo cuidado, Vó!', nextId: 'fechar' }],
    },
    madrugada_tensa: {
      id: 'avo_madrugada_tensa',
      speaker: 'Vó Maria',
      role: 'Avó Mineira',
      text: 'Tá tarde demais pra andar no escuro sem rumo, fio. Se ouvir passos pesados atrás de você, entra num armário e apaga essa lanterna na hora!',
      choices: [{ label: 'Pode deixar, Vó!', nextId: 'fechar' }],
    },
    idle: {
      id: 'avo_idle',
      speaker: 'Vó Maria',
      role: 'Avó Mineira',
      text: 'Se a fome apertar, tem pão de queijo na cozinha. E lembra: nunca confie em porta que abre sozinha depois das três!',
      comedyTone: true,
      choices: [{ label: 'Valeu, Vó Maria!', nextId: 'fechar' }],
    },
  },
  vizinho: {
    intro: {
      id: 'viz_intro',
      speaker: 'Seu Zé',
      role: 'Vizinho Teórico da Roça',
      text: 'Ô meu jovem! Neto da Dona Maria, né? Ontem eu vi um trem esquisito rondando o milharal... mas como era terça-feira, eu voltei a dormir porque assombração de terça tem preguiça.',
      comedyTone: true,
      choices: [
        { label: 'Um trem estranho tipo o quê, Seu Zé?', nextId: 'teoria', reputationDelta: 5 },
        { label: 'Faz sentido... vou dar uma volta na Praça.', action: 'complete_cap1_vizinho', reputationDelta: 3 },
      ],
    },
    teoria: {
      id: 'viz_teoria',
      speaker: 'Seu Zé',
      role: 'Vizinho Teórico da Roça',
      text: 'Era um sujeito alto com um saco nas costas trocando ideia com uma galinha! E pior: a galinha tava concordando! Meu caderno lá em casa tem o mapa dos túneis antigos.',
      comedyTone: true,
      choices: [{ label: 'Vou ler esse caderno, Seu Zé!', action: 'complete_cap1_vizinho', reputationDelta: 5 }],
    },
    estacao_dica: {
      id: 'viz_estacao_dica',
      speaker: 'Seu Zé',
      role: 'Vizinho Teórico da Roça',
      text: 'Cê já passou lá na Estação Ferroviária e no Túnel Antigo? Desde 1987 ninguém entra no Hospital Municipal... e a chave mestra ficou com o chefe da estação!',
      choices: [{ label: 'Boa pista! Obrigado!', nextId: 'fechar', reputationDelta: 4 }],
    },
    idle: {
      id: 'viz_idle',
      speaker: 'Seu Zé',
      role: 'Vizinho Teórico da Roça',
      text: 'Se o sinal de celular cair, não é a operadora não: é o Complexo de 1958 debaixo da floresta puxando o Wi-Fi da cidade!',
      comedyTone: true,
      choices: [{ label: 'Kkkk você não perde uma teoria, Seu Zé.', nextId: 'fechar' }],
    },
  },
  tiao: {
    intro: {
      id: 'tiao_intro',
      speaker: 'Tião do Mercadinho',
      role: 'Comerciante & Campeão de Truco',
      text: 'Chega mais, patrão! Aqui no Mercadinho tem fumo de corda pro Saci, broa fresca e a bicicleta encostada ali fora se quiser rodar rápido pela Estrada Velha!',
      comedyTone: true,
      choices: [
        { label: 'Valeu Tião! Bora jogar um Truco na Praça? (Minigame)', action: 'start_minigame_cartas', reputationDelta: 5 },
        { label: 'O que você sabe sobre o Complexo Subterrâneo?', nextId: 'segredo', reputationDelta: 3 },
        { label: 'Só olhando por enquanto, valeu!', nextId: 'fechar' },
      ],
    },
    segredo: {
      id: 'tiao_segredo',
      speaker: 'Tião do Mercadinho',
      role: 'Comerciante & Campeão de Truco',
      text: 'Meu avô vendia querosene pros engenheiros de 1958. Eles diziam que a Mina Desativada guarda o selo que abre as portas do subsolo. Mas só doido entra lá às 2 da manhã!',
      choices: [{ label: 'Vou conferir com cuidado, Tião!', nextId: 'fechar' }],
    },
    idle: {
      id: 'tiao_idle',
      speaker: 'Tião do Mercadinho',
      role: 'Comerciante & Campeão de Truco',
      text: 'Fiado hoje só pra quem trouxer foto do Homem do Saco sorrindo! Quer apostar uma mão de Truco?',
      comedyTone: true,
      choices: [
        { label: 'Bora jogar Truco agora!', action: 'start_minigame_cartas' },
        { label: 'Depois a gente joga, Tião!', nextId: 'fechar' },
      ],
    },
  },
  padre_bento: {
    intro: {
      id: 'padre_intro',
      speaker: 'Padre Bento',
      role: 'Pároco da Igreja Velha',
      text: 'Que Deus te acompanhe, meu filho! A Igreja Velha guarda a Cruz de Ipê Bento desde 1938, mas em 1987 os irmãos Alves levaram a chave de bronze pro Sítio deles.',
      choices: [
        { label: 'Por que a Igreja protege contra as 03:00?', nextId: 'historia_cruz', reputationDelta: 5 },
        { label: 'Vou buscar a chave no Sítio dos Alves.', nextId: 'fechar' },
      ],
    },
    historia_cruz: {
      id: 'padre_historia',
      speaker: 'Padre Bento',
      role: 'Pároco da Igreja Velha',
      text: 'Porque a madeira de ipê desta serra absorve o mesmo magnetismo estranho da Mina de 1924. Junte a Cruz à fé e à prudência de manter as portas fechadas!',
      choices: [{ label: 'Obrigado pela orientação, Padre!', nextId: 'fechar' }],
    },
    idle: {
      id: 'padre_idle',
      speaker: 'Padre Bento',
      role: 'Pároco da Igreja Velha',
      text: 'Se o medo apertar na madrugada, acenda uma vela e respire fundo. O pânico faz mais barulho que seus passos.',
      choices: [{ label: 'Amém, Padre Bento.', nextId: 'fechar' }],
    },
  },
  ze_pescador: {
    intro: {
      id: 'pesc_intro',
      speaker: 'Zé Pescador',
      role: 'Pescador da Represa',
      text: 'Shhh... fala baixo que o peixe espanta! De noite a Represa vira um espelho e eu já vi pegadas enormes indo daqui pro Bairro Abandonado. Quer tentar pescar uma tilápia?',
      choices: [
        { label: 'Bora pescar agora! (Minigame Pesca)', action: 'start_minigame_pesca', reputationDelta: 5 },
        { label: 'O que tem do outro lado da Represa?', nextId: 'represa_info' },
      ],
    },
    represa_info: {
      id: 'pesc_info',
      speaker: 'Zé Pescador',
      role: 'Pescador da Represa',
      text: 'Pra lá fica o paredão de 1987 e a Fazenda Santa Luzia. Se bater sede, sobe na serra que tem água limpinha da nascente.',
      choices: [{ label: 'Valeu, Zé Pescador!', nextId: 'fechar' }],
    },
    idle: {
      id: 'pesc_idle',
      speaker: 'Zé Pescador',
      role: 'Pescador da Represa',
      text: 'Tilápia na brasa dá mais energia que café! Quer pegar a vara de pesca?',
      comedyTone: true,
      choices: [
        { label: 'Partiu pescar!', action: 'start_minigame_pesca' },
        { label: 'Agora não, valeu!', nextId: 'fechar' },
      ],
    },
  },
  dona_clara: {
    intro: {
      id: 'clara_intro',
      speaker: 'Dona Clara',
      role: 'Quitandeira da Fazenda Boa Esperança',
      text: 'Ô meu querido! Tá explorando a Fazenda Boa Esperança? Cuidado com o Celeiro Vermelho: a Gertrudes vigia aquilo como se tivesse ouro dentro!',
      comedyTone: true,
      choices: [
        { label: 'Tem alguma comida aí pra viagem?', nextId: 'broa', reputationDelta: 5 },
        { label: 'Vou tomar cuidado com a galinha!', nextId: 'fechar' },
      ],
    },
    broa: {
      id: 'clara_broa',
      speaker: 'Dona Clara',
      role: 'Quitandeira da Fazenda Boa Esperança',
      text: 'Sempre! Toma aqui uma dica: se você colher Milho Dourado, a Gertrudes esquece de te bicar na hora! E passa no fogão da sua avó sempre que cansar.',
      choices: [{ label: 'Muito obrigado, Dona Clara!', action: 'gift_broa', reputationDelta: 6 }],
    },
    idle: {
      id: 'clara_idle',
      speaker: 'Dona Clara',
      role: 'Quitandeira da Fazenda Boa Esperança',
      text: 'De tardezinha eu levo caldo de cana e broa lá pra Praça Central. Cidade pequena é assim: todo mundo cuida de todo mundo!',
      choices: [{ label: 'Com certeza, Dona Clara!', nextId: 'fechar' }],
    },
  },
  saci: {
    encontro: {
      id: 'saci_encontro',
      speaker: 'Saci Pererê',
      role: 'Mestre dos Redemoinhos',
      text: 'Fiu-fiu! Achou que ia passear na Floresta do Esquecimento sem pagar pedágio, guri da cidade? Senti cheiro de fumo de corda ou café nessa mochila!',
      comedyTone: true,
      choices: [
        { label: 'Toma o Fumo de Corda! Me conta o segredo.', action: 'give_fumo_saci', reputationDelta: 10 },
        { label: 'Aceita um Desafio da Memória Folclórica?', action: 'start_minigame_memoria', reputationDelta: 5 },
        { label: 'Só tô de passagem, Saci!', nextId: 'saci_aviso' },
      ],
    },
    saci_aviso: {
      id: 'saci_aviso',
      speaker: 'Saci Pererê',
      role: 'Mestre dos Redemoinhos',
      text: 'Se não tem fumo, corre! A Chave da Igreja tá no Sítio dos Alves, e o Complexo Subterrâneo fica lá pros fundos da mata. Só não esquece de olhar pros lados!',
      choices: [{ label: 'Credo! Valeu pelo toque!', action: 'complete_cap5_saci' }],
    },
    saci_cafe: {
      id: 'saci_cafe',
      speaker: 'Saci Pererê',
      role: 'Mestre dos Redemoinhos',
      text: 'Êta cafezão passado na hora! Com um gole desse e uma espiga de milho pra Gertrudes, a gente espanta o Homem do Saco lá no coreto da Praça!',
      comedyTone: true,
      choices: [
        { label: 'Fechado! Vamos selar o Pacto no Coreto! (Final Secreto)', action: 'ending_secret' },
        { label: 'Ainda quero desvendar o Complexo de 1958!', nextId: 'fechar' },
      ],
    },
    idle: {
      id: 'saci_idle',
      speaker: 'Saci Pererê',
      role: 'Mestre dos Redemoinhos',
      text: 'Quer testar sua cuca no Jogo da Memória dos Mitos ou tá com pressa pra fugir do Homem do Saco?',
      comedyTone: true,
      choices: [
        { label: 'Bora jogar Memória Folclórica!', action: 'start_minigame_memoria' },
        { label: 'Agora não, Saci!', nextId: 'fechar' },
      ],
    },
  },
};

/**
 * Selects the best contextual, non-repeating dialogue entry for an NPC based on memory & world state.
 */
export function selectNpcDialogue(ctx: DialogueContextInput): string {
  const { npcId, chapter, hour24, weather, completedObjectives, seenDialogueIds, inventoryIds } = ctx;

  if (npcId === 'avo') {
    if (!completedObjectives.has('cap1_talk_vo')) return 'start_cap1';
    if (chapter >= 2 && !completedObjectives.has('cap2_talk_vo_regra')) return 'cap2_alerta';
    if (
      chapter >= 14 &&
      (inventoryIds.has('cruz_madeira') || inventoryIds.has('disco_1958'))
    ) {
      return 'cap15_ritual';
    }
    if ((weather === 'chuva' || weather === 'tempestade') && !seenDialogueIds.has('avo_chuva_varanda')) {
      return 'chuva_varanda';
    }
    if ((hour24 >= 0 && hour24 <= 4) && !seenDialogueIds.has('avo_madrugada_tensa')) {
      return 'madrugada_tensa';
    }
    return 'idle';
  }

  if (npcId === 'vizinho') {
    if (!seenDialogueIds.has('viz_intro')) return 'intro';
    if (!seenDialogueIds.has('viz_estacao_dica') && chapter >= 4) return 'estacao_dica';
    return 'idle';
  }

  if (npcId === 'saci') {
    if (inventoryIds.has('cafe_coado') && chapter >= 14) return 'saci_cafe';
    if (!completedObjectives.has('cap5_meet_saci')) return 'encontro';
    return 'idle';
  }

  if (npcId === 'tiao') {
    if (!seenDialogueIds.has('tiao_intro')) return 'intro';
    if (!seenDialogueIds.has('tiao_segredo') && chapter >= 6) return 'segredo';
    return 'idle';
  }

  if (npcId === 'padre_bento') {
    if (!seenDialogueIds.has('padre_intro')) return 'intro';
    return 'idle';
  }

  if (npcId === 'ze_pescador') {
    if (!seenDialogueIds.has('pesc_intro')) return 'intro';
    return 'idle';
  }

  if (npcId === 'dona_clara') {
    if (!seenDialogueIds.has('clara_intro')) return 'intro';
    return 'idle';
  }

  return 'idle';
}
