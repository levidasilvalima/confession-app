import { useCallback, useEffect, useState } from 'react';
import type { EstadoConfissao, Resposta, RespostaPergunta } from '../types';
import { TOTAL_PERGUNTAS, fimDoGrupo, indicaFalta, perguntasPlanas, proximoVisivel } from '../data';

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
};

/** Aceita o formato atual e o antigo (`{ m1_1: 'sim' }`), para não perder um exame em andamento. */
function normalizarRespostas(salvas: unknown): Record<string, RespostaPergunta> {
  if (!salvas || typeof salvas !== 'object') return {};
  const respostas: Record<string, RespostaPergunta> = {};
  for (const [id, valor] of Object.entries(salvas)) {
    const objeto = valor && typeof valor === 'object' ? (valor as Partial<RespostaPergunta>) : undefined;
    const bruta = String(objeto ? objeto.resposta : valor).toUpperCase();
    if (bruta !== 'SIM' && bruta !== 'NAO') continue;
    respostas[id] = { id, resposta: bruta, observacao: typeof objeto?.observacao === 'string' ? objeto.observacao : '' };
  }
  return respostas;
}

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
      respostas: normalizarRespostas(salvo.respostas),
      textos: salvo.textos && typeof salvo.textos === 'object' ? salvo.textos : {},
    };
  } catch {
    return ESTADO_INICIAL;
  }
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

  /**
   * Salva a resposta. Se ela indica falta, fica na pergunta para anotar frequência
   * e agravantes; caso contrário, avança sozinho.
   */
  const responder = useCallback((resposta: Resposta) => {
    setEstado((e) => {
      const { pergunta } = perguntasPlanas[e.indice];
      const anterior = e.respostas[pergunta.id];
      const observacao = anterior?.resposta === resposta ? anterior.observacao : '';
      const respostas = { ...e.respostas, [pergunta.id]: { id: pergunta.id, resposta, observacao } };
      const novo = { ...e, respostas };
      if (indicaFalta(pergunta, novo)) return novo;
      return avancar(novo, proximoVisivel(e.indice + 1, novo));
    });
  }, []);

  /** Salva a anotação a cada alteração, para não perdê-la se o app for fechado. */
  const anotar = useCallback((observacao: string) => {
    setEstado((e) => {
      const { pergunta } = perguntasPlanas[e.indice];
      const atual = e.respostas[pergunta.id];
      if (!atual) return e;
      return { ...e, respostas: { ...e.respostas, [pergunta.id]: { ...atual, observacao } } };
    });
  }, []);

  const confirmarEAvancar = useCallback(() => {
    setEstado((e) => avancar(e, proximoVisivel(e.indice + 1, e)));
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
    anotar,
    confirmarEAvancar,
    responderTexto,
    pularGrupo,
    voltar,
    irParaResumo,
    revisar,
    apagarTudo,
  };
}
