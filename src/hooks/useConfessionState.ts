import { useCallback, useEffect, useState } from 'react';
import type { EstadoConfissao, Frequencia, Resposta } from '../types';
import { TOTAL_PERGUNTAS, fimDoGrupo, perguntasPlanas, proximoVisivel } from '../data';
import { validarFrequencia } from '../data/frequencia';

/**
 * Chave usada no localStorage. Os dados ficam SOMENTE neste aparelho
 * (texto pleno, sem nenhum envio pela rede) e são apagados no fim.
 */
const CHAVE = 'exame-de-consciencia:v1';

const ESTADO_INICIAL: EstadoConfissao = {
  tela: 'preparacao',
  indice: 0,
  historico: [],
  respostas: {},
  textos: {},
  frequencias: {},
};

function carregar(): EstadoConfissao {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return ESTADO_INICIAL;
    const salvo = JSON.parse(bruto) as Partial<EstadoConfissao>;
    const tela = salvo.tela === 'exame' || salvo.tela === 'confessionario' ? salvo.tela : 'preparacao';
    const indice =
      typeof salvo.indice === 'number' && salvo.indice >= 0 && salvo.indice < TOTAL_PERGUNTAS ? salvo.indice : 0;
    return {
      tela,
      indice,
      historico: Array.isArray(salvo.historico)
        ? salvo.historico.filter((n) => typeof n === 'number' && n >= 0 && n < TOTAL_PERGUNTAS)
        : [],
      respostas: salvo.respostas && typeof salvo.respostas === 'object' ? salvo.respostas : {},
      textos: salvo.textos && typeof salvo.textos === 'object' ? salvo.textos : {},
      frequencias: carregarFrequencias(salvo.frequencias),
    };
  } catch {
    return ESTADO_INICIAL;
  }
}

function carregarFrequencias(bruto: unknown): Record<string, Frequencia> {
  if (!bruto || typeof bruto !== 'object') return {};
  const frequencias: Record<string, Frequencia> = {};
  for (const [id, valor] of Object.entries(bruto)) {
    const f = validarFrequencia(valor);
    if (f) frequencias[id] = f;
  }
  return frequencias;
}

/** Avança para `proximo` (ou para o resumo, se acabaram as perguntas). */
function avancar(estado: EstadoConfissao, proximo: number): EstadoConfissao {
  if (proximo >= TOTAL_PERGUNTAS) return { ...estado, tela: 'confessionario' };
  return { ...estado, indice: proximo, historico: [...estado.historico, estado.indice] };
}

/**
 * Estado do exame de consciência sincronizado continuamente com o localStorage,
 * para que nada se perca se o app for fechado por acidente.
 */
export function useConfessionState() {
  const [estado, setEstado] = useState<EstadoConfissao>(carregar);

  useEffect(() => {
    try {
      if (estado === ESTADO_INICIAL) localStorage.removeItem(CHAVE);
      else localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch {
      // Armazenamento indisponível (ex.: modo privado): o app segue funcionando só em memória.
    }
  }, [estado]);

  const iniciar = useCallback(() => {
    setEstado((e) => ({ ...e, tela: 'exame', indice: proximoVisivel(e.indice, e) }));
  }, []);

  const responder = useCallback((resposta: Resposta, frequencia?: Frequencia) => {
    setEstado((e) => {
      const { pergunta } = perguntasPlanas[e.indice];
      const respostas = { ...e.respostas, [pergunta.id]: resposta };
      const frequencias = { ...e.frequencias };
      if (frequencia) frequencias[pergunta.id] = frequencia;
      else delete frequencias[pergunta.id];
      const novo = { ...e, respostas, frequencias };
      return avancar(novo, proximoVisivel(e.indice + 1, novo));
    });
  }, []);

  const responderTexto = useCallback((texto: string) => {
    setEstado((e) => {
      const { pergunta } = perguntasPlanas[e.indice];
      const textos = { ...e.textos };
      const limpo = texto.trim();
      if (limpo) textos[pergunta.id] = limpo;
      else delete textos[pergunta.id];
      const novo = { ...e, textos };
      return avancar(novo, proximoVisivel(e.indice + 1, novo));
    });
  }, []);

  const pularGrupo = useCallback(() => {
    setEstado((e) => avancar(e, proximoVisivel(fimDoGrupo(e.indice), e)));
  }, []);

  const voltar = useCallback(() => {
    setEstado((e) => {
      if (e.historico.length === 0) return { ...e, tela: 'preparacao' };
      const historico = e.historico.slice(0, -1);
      return { ...e, indice: e.historico[e.historico.length - 1], historico };
    });
  }, []);

  const irParaResumo = useCallback(() => {
    setEstado((e) => ({ ...e, tela: 'confessionario' }));
  }, []);

  const revisar = useCallback(() => {
    setEstado((e) => ({ ...e, tela: 'exame' }));
  }, []);

  /** Gatilho de destruição: apaga TUDO do armazenamento local e volta à Tela 1. */
  const apagarTudo = useCallback(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignora
    }
    setEstado(ESTADO_INICIAL);
  }, []);

  const temProgresso = Object.keys(estado.respostas).length > 0 || Object.keys(estado.textos).length > 0;

  return {
    estado,
    temProgresso,
    iniciar,
    responder,
    responderTexto,
    pularGrupo,
    voltar,
    irParaResumo,
    revisar,
    apagarTudo,
  };
}
