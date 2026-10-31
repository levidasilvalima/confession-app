export type Resposta = 'sim' | 'nao';

export interface Pergunta {
  id: string;
  texto: string;
  /** Explicação curta exibida abaixo da pergunta, em fonte menor. */
  subtexto?: string;
  /** "texto" = resposta escrita (ex.: "Há quanto tempo não me confesso?"). Padrão: sim/não. */
  tipo?: 'simnao' | 'texto';
  /** Subdivisão dentro do mandamento (ex.: "Para os pais (caso tenha filhos)"). */
  grupo?: string;
  /** O grupo só se aplica a algumas pessoas e pode ser pulado inteiro. */
  grupoOpcional?: boolean;
  /** Qual resposta indica falta a confessar. Padrão: "sim". */
  pecadoSe?: Resposta;
  /** Texto (em 1ª pessoa) usado no resumo do confessionário. */
  textoResumo?: string;
  /** Rótulo usado no resumo para perguntas do tipo "texto". */
  rotuloResumo?: string;
  placeholder?: string;
  /** Só pergunta se ALGUMA das perguntas indicadas foi respondida indicando falta. */
  mostrarSe?: string[];
}

export interface Categoria {
  categoria: string;
  titulo?: string;
  notas?: string[];
  perguntas: Pergunta[];
}

export interface PerguntaPlana {
  pergunta: Pergunta;
  categoria: Categoria;
  /** Índice da categoria em `categorias`. */
  indiceCategoria: number;
  /** Primeira pergunta da categoria? */
  inicioCategoria: boolean;
  /** Primeira pergunta do grupo? */
  inicioGrupo: boolean;
}

export type Tela = 'preparacao' | 'exame' | 'confessionario';

export interface EstadoConfissao {
  tela: Tela;
  /** Índice (na lista plana) da pergunta atual. */
  indice: number;
  /** Pilha de índices visitados, para o botão "Voltar". */
  historico: number[];
  respostas: Record<string, Resposta>;
  textos: Record<string, string>;
}

export interface Oracao {
  titulo: string;
  texto: string[];
  fonte: string;
}

export interface Oracoes {
  introducao: string[];
  oracaoAntes: Oracao;
  oracaoDepois: Oracao;
}
