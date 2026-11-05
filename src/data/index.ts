import questionsJson from './questions.json';
import prayersJson from './prayers.json';
import metodoJson from './metodo.json';
import type { Categoria, EstadoConfissao, MetodoConfissao, Oracoes, Pergunta, PerguntaPlana } from '../types';

export const categorias = questionsJson as Categoria[];
export const oracoes = prayersJson as Oracoes;
export const metodo = metodoJson as MetodoConfissao;

/** Todas as perguntas em sequência, com o contexto da categoria. */
export const perguntasPlanas: PerguntaPlana[] = categorias.flatMap((categoria, indiceCategoria) =>
  categoria.perguntas.map((pergunta, i) => ({
    pergunta,
    categoria,
    indiceCategoria,
    inicioCategoria: i === 0,
    inicioGrupo: !!pergunta.grupo && (i === 0 || categoria.perguntas[i - 1].grupo !== pergunta.grupo),
  })),
);

export const TOTAL_PERGUNTAS = perguntasPlanas.length;

/** A resposta dada indica uma falta a ser confessada? */
export function indicaFalta(pergunta: Pergunta, estado: Pick<EstadoConfissao, 'respostas'>): boolean {
  const resposta = estado.respostas[pergunta.id]?.resposta;
  return resposta !== undefined && resposta === (pergunta.pecadoSe ?? 'SIM');
}

/** A pergunta deve ser exibida, considerando as condições `mostrarSe`? */
export function deveMostrar(pergunta: Pergunta, estado: Pick<EstadoConfissao, 'respostas'>): boolean {
  if (!pergunta.mostrarSe?.length) return true;
  return pergunta.mostrarSe.some((id) => {
    const alvo = perguntasPlanas.find((p) => p.pergunta.id === id)?.pergunta;
    return alvo ? indicaFalta(alvo, estado) : false;
  });
}

/** Próximo índice visível a partir de `inicio` (inclusive). Retorna TOTAL_PERGUNTAS se acabou. */
export function proximoVisivel(inicio: number, estado: Pick<EstadoConfissao, 'respostas'>): number {
  let i = inicio;
  while (i < TOTAL_PERGUNTAS && !deveMostrar(perguntasPlanas[i].pergunta, estado)) i++;
  return i;
}

/** Primeiro índice depois do grupo da pergunta `indice`. */
export function fimDoGrupo(indice: number): number {
  const atual = perguntasPlanas[indice];
  let i = indice + 1;
  while (
    i < TOTAL_PERGUNTAS &&
    perguntasPlanas[i].indiceCategoria === atual.indiceCategoria &&
    perguntasPlanas[i].pergunta.grupo === atual.pergunta.grupo
  ) {
    i++;
  }
  return i;
}
