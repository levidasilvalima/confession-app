import type { Frequencia, Pergunta, UnidadeTempo } from '../types';

/** Dica exibida no passo "Quantas vezes?". */
export const DICA_FREQUENCIA = [
  'Para uma confissão íntegra, diga quantas vezes cometeu cada pecado mortal.',
  'Se não souber o número exato, diga um número aproximado.',
  'Se foi algo que durou muito tempo, diga a frequência e por quanto tempo. Ex.: “Menti cerca de 3 vezes por semana, durante 3 anos.”',
];

export const UNIDADES: UnidadeTempo[] = ['dia', 'semana', 'mes', 'ano'];

const NOMES: Record<UnidadeTempo, [singular: string, plural: string]> = {
  dia: ['dia', 'dias'],
  semana: ['semana', 'semanas'],
  mes: ['mês', 'meses'],
  ano: ['ano', 'anos'],
};

export function nomeUnidade(unidade: UnidadeTempo, n = 1): string {
  return NOMES[unidade][n === 1 ? 0 : 1];
}

const vezes = (n: number) => (n === 1 ? 'vez' : 'vezes');

/** Esta pergunta, respondida como falta, deve perguntar "quantas vezes?" */
export function pedeFrequencia(pergunta: Pergunta): boolean {
  return pergunta.tipo !== 'texto' && (pergunta.pecadoSe ?? 'sim') === 'sim' && !pergunta.semFrequencia;
}

/** Frase em 1ª pessoa para ler ao padre. Ex.: "Cerca de 4 vezes por dia, durante 5 anos." */
export function descreverFrequencia(f: Frequencia): string {
  switch (f.modo) {
    case 'vezes':
      return `${f.aprox ? 'Cerca de ' : ''}${f.vezes} ${vezes(f.vezes)}.`;
    case 'periodo':
      return `Cerca de ${f.vezes} ${vezes(f.vezes)} por ${nomeUnidade(f.por)}, durante ${f.duracao} ${nomeUnidade(f.unidade, f.duracao)}.`;
    case 'naosei':
      return 'Não sei quantas vezes.';
  }
}

const inteiroPositivo = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1;
const unidadeValida = (u: unknown): u is UnidadeTempo => UNIDADES.includes(u as UnidadeTempo);

/** Valida uma frequência lida do localStorage. */
export function validarFrequencia(x: unknown): Frequencia | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const f = x as Record<string, unknown>;
  if (f.modo === 'naosei') return { modo: 'naosei' };
  if (f.modo === 'vezes' && inteiroPositivo(f.vezes)) return { modo: 'vezes', vezes: f.vezes, aprox: f.aprox === true };
  if (
    f.modo === 'periodo' &&
    inteiroPositivo(f.vezes) &&
    unidadeValida(f.por) &&
    inteiroPositivo(f.duracao) &&
    unidadeValida(f.unidade)
  ) {
    return { modo: 'periodo', vezes: f.vezes, por: f.por, duracao: f.duracao, unidade: f.unidade };
  }
  return undefined;
}
