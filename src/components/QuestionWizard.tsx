import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { EstadoConfissao, PerguntaPlana, Resposta } from '../types';
import { TOTAL_PERGUNTAS, indicaFalta } from '../data';

interface Props {
  estado: EstadoConfissao;
  item: PerguntaPlana;
  onResponder: (resposta: Resposta) => void;
  onAnotar: (observacao: string) => void;
  onConfirmar: () => void;
  onResponderTexto: (texto: string) => void;
  onVoltar: () => void;
  onPularGrupo: () => void;
  onTerminar: () => void;
}

/** Tempo em que os botões ficam travados após trocar de pergunta (evita toque duplo). */
const TRAVA_MS = 350;

/** TELA 2 — Exame: uma pergunta por vez, com botões SIM / NÃO e anotação de agravantes. */
export function QuestionWizard({
  estado,
  item,
  onResponder,
  onAnotar,
  onConfirmar,
  onResponderTexto,
  onVoltar,
  onPularGrupo,
  onTerminar,
}: Props) {
  const { pergunta, categoria, inicioCategoria } = item;
  const respostaAtual = estado.respostas[pergunta.id];
  const posicao = estado.indice + 1;
  const progresso = Math.round((posicao / TOTAL_PERGUNTAS) * 100);
  const anotando = pergunta.tipo !== 'texto' && indicaFalta(pergunta, estado);

  // O campo de anotação empurra os botões para cima: a trava também evita que
  // um toque duplo na resposta caia no "Confirmar e Avançar".
  const [travado, setTravado] = useState(true);
  useEffect(() => {
    setTravado(true);
    const t = window.setTimeout(() => setTravado(false), TRAVA_MS);
    return () => window.clearTimeout(t);
  }, [pergunta.id, anotando]);

  const terminar = () => {
    if (window.confirm('Ir para o resumo agora? As perguntas que faltam ficarão sem resposta.')) onTerminar();
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-seguro pb-seguro">
      {/* Barra superior: voltar, progresso, terminar */}
      <nav className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onVoltar}
          className="-ml-2 flex items-center gap-1 rounded-xl px-3 py-2 text-lg font-medium text-liturgico-800 active:bg-liturgico-50"
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            ‹
          </span>
          Voltar
        </button>
        <span className="text-base text-stone-500 tabular-nums" aria-live="polite">
          {posicao} de {TOTAL_PERGUNTAS}
        </span>
        <button
          type="button"
          onClick={terminar}
          className="-mr-2 rounded-xl px-3 py-2 text-lg font-medium text-stone-600 active:bg-stone-100"
        >
          Terminar
        </button>
      </nav>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200"
        role="progressbar"
        aria-label="Progresso do exame"
        aria-valuenow={progresso}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-liturgico-700 transition-[width] duration-300" style={{ width: `${progresso}%` }} />
      </div>

      {/* Cabeçalho: categoria atual */}
      <header className="mt-5 text-center">
        <h1 className="text-lg font-bold tracking-wider text-liturgico-800 uppercase">{categoria.categoria}</h1>
        {categoria.titulo && (
          <p className="mt-1 font-serif text-lg text-stone-600 italic">“{categoria.titulo}”</p>
        )}
        {pergunta.grupo && (
          <p className="mt-3 inline-block rounded-full bg-liturgico-100 px-4 py-1 text-base font-medium text-liturgico-900">
            {pergunta.grupo}
          </p>
        )}
      </header>

      {categoria.notas && (
        <details
          key={`${categoria.categoria}-${inicioCategoria}`}
          open={inicioCategoria}
          className="mt-4 rounded-2xl bg-amber-50 p-4 text-base text-amber-950 ring-1 ring-amber-200"
        >
          <summary className="cursor-pointer font-semibold">Observação</summary>
          <div className="mt-2 space-y-2 leading-relaxed">
            {categoria.notas.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </div>
        </details>
      )}

      {/* Centro: a pergunta */}
      <main key={`pergunta-${pergunta.id}`} className="flex flex-1 animate-entrada flex-col justify-center py-8 text-center">
        <p className="text-2xl leading-snug font-semibold text-stone-900 sm:text-3xl">{pergunta.texto}</p>
        {pergunta.subtexto && <p className="mt-4 text-lg leading-relaxed text-stone-500">{pergunta.subtexto}</p>}
      </main>

      {pergunta.grupoOpcional && (
        <button
          type="button"
          onClick={onPularGrupo}
          disabled={travado}
          className="mb-4 rounded-xl px-4 py-3 text-lg text-liturgico-800 underline underline-offset-4 active:bg-liturgico-50"
        >
          Não se aplica a mim — pular esta parte
        </button>
      )}

      {/* Rodapé: respostas */}
      {pergunta.tipo === 'texto' ? (
        <RespostaEscrita
          key={`resposta-${pergunta.id}`}
          valorInicial={estado.textos[pergunta.id] ?? ''}
          placeholder={pergunta.placeholder}
          travado={travado}
          onEnviar={onResponderTexto}
        />
      ) : (
        <footer>
          <div className="grid grid-cols-2 gap-4">
            <BotaoResposta
              rotulo="SIM"
              selecionado={respostaAtual?.resposta === 'SIM'}
              disabled={travado}
              onClick={() => onResponder('SIM')}
              className="bg-liturgico-800 text-white active:bg-liturgico-900"
            />
            <BotaoResposta
              rotulo="NÃO"
              selecionado={respostaAtual?.resposta === 'NAO'}
              disabled={travado}
              onClick={() => onResponder('NAO')}
              className="bg-white text-liturgico-900 ring-2 ring-liturgico-800 active:bg-liturgico-50"
            />
          </div>
          {anotando && (
            <Anotacao
              key={`anotacao-${pergunta.id}`}
              valor={respostaAtual?.observacao ?? ''}
              exemplo={pergunta.exemploAgravante}
              travado={travado}
              onAlterar={onAnotar}
              onConfirmar={onConfirmar}
            />
          )}
        </footer>
      )}
    </div>
  );
}

function BotaoResposta({
  rotulo,
  selecionado,
  disabled,
  onClick,
  className,
}: {
  rotulo: string;
  selecionado: boolean;
  disabled: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selecionado}
      className={`relative min-h-20 rounded-2xl text-3xl font-bold shadow-md transition active:scale-[0.97] disabled:opacity-90 ${className} ${
        selecionado ? 'outline-4 outline-offset-4 outline-amber-400' : ''
      }`}
    >
      {rotulo}
      {selecionado && <span className="sr-only"> (resposta anterior)</span>}
    </button>
  );
}

/** Campo revelado ao responder que há falta: frequência e agravantes (opcional). */
function Anotacao({
  valor,
  exemplo,
  travado,
  onAlterar,
  onConfirmar,
}: {
  valor: string;
  exemplo?: string;
  travado: boolean;
  onAlterar: (observacao: string) => void;
  onConfirmar: () => void;
}) {
  const bloco = useRef<HTMLDivElement>(null);

  // Em telas pequenas o campo nasce abaixo da dobra: traz o botão de avançar para a vista.
  useEffect(() => {
    bloco.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, []);

  return (
    <div ref={bloco} className="mt-5 flex animate-entrada flex-col gap-3 pb-1">
      <label htmlFor="observacao" className="text-lg font-semibold text-stone-900">
        Quantas vezes? Tem algum agravante?
      </label>
      {exemplo && (
        <p id="observacao-exemplo" className="-mt-2 text-base leading-snug text-stone-600">
          Ex.: {exemplo}.
        </p>
      )}
      <textarea
        id="observacao"
        rows={3}
        value={valor}
        onChange={(e) => onAlterar(e.target.value)}
        aria-describedby={exemplo ? 'observacao-exemplo' : undefined}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="w-full rounded-2xl border-2 border-stone-300 bg-white px-4 py-3 text-lg focus:border-liturgico-700 focus:outline-none"
      />
      <button
        type="button"
        onClick={onConfirmar}
        disabled={travado}
        className="min-h-16 rounded-2xl bg-liturgico-800 text-2xl font-bold text-white shadow-md transition active:scale-[0.98] active:bg-liturgico-900"
      >
        Confirmar e Avançar
      </button>
    </div>
  );
}

function RespostaEscrita({
  valorInicial,
  placeholder,
  travado,
  onEnviar,
}: {
  valorInicial: string;
  placeholder?: string;
  travado: boolean;
  onEnviar: (texto: string) => void;
}) {
  const [valor, setValor] = useState(valorInicial);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!travado) onEnviar(valor);
  };

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <input
        type="text"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        className="w-full rounded-2xl border-2 border-stone-300 bg-white px-4 py-4 text-xl focus:border-liturgico-700 focus:outline-none"
      />
      <button
        type="submit"
        disabled={travado}
        className="min-h-16 rounded-2xl bg-liturgico-800 text-2xl font-bold text-white shadow-md transition active:scale-[0.98] active:bg-liturgico-900"
      >
        {valor.trim() ? 'Continuar' : 'Pular'}
      </button>
    </form>
  );
}
