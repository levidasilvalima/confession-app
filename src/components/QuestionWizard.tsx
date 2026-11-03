import { useEffect, useState, type FormEvent } from 'react';
import type { EstadoConfissao, Frequencia, PerguntaPlana, Resposta, UnidadeTempo } from '../types';
import { TOTAL_PERGUNTAS } from '../data';
import { DICA_FREQUENCIA, UNIDADES, descreverFrequencia, nomeUnidade, pedeFrequencia } from '../data/frequencia';

interface Props {
  estado: EstadoConfissao;
  item: PerguntaPlana;
  onResponder: (resposta: Resposta, frequencia?: Frequencia) => void;
  onResponderTexto: (texto: string) => void;
  onVoltar: () => void;
  onPularGrupo: () => void;
  onTerminar: () => void;
}

/** Tempo em que os botões ficam travados após trocar de pergunta (evita toque duplo). */
const TRAVA_MS = 350;

/** A dica de "quantas vezes" abre sozinha só na primeira vez em que aparece. */
let dicaFrequenciaVista = false;

/** TELA 2 — Exame: uma pergunta por vez, com botões SIM / NÃO. */
export function QuestionWizard({
  estado,
  item,
  onResponder,
  onResponderTexto,
  onVoltar,
  onPularGrupo,
  onTerminar,
}: Props) {
  const { pergunta, categoria, inicioCategoria } = item;
  const respostaAtual = estado.respostas[pergunta.id];
  const posicao = estado.indice + 1;
  const progresso = Math.round((posicao / TOTAL_PERGUNTAS) * 100);

  const [etapa, setEtapa] = useState<'resposta' | 'frequencia'>('resposta');
  const [travado, setTravado] = useState(true);
  useEffect(() => {
    setEtapa('resposta');
  }, [pergunta.id]);
  useEffect(() => {
    setTravado(true);
    const t = window.setTimeout(() => setTravado(false), TRAVA_MS);
    return () => window.clearTimeout(t);
  }, [pergunta.id, etapa]);

  const responderSim = () => {
    if (pedeFrequencia(pergunta)) setEtapa('frequencia');
    else onResponder('sim');
  };

  const voltar = () => {
    if (etapa === 'frequencia') setEtapa('resposta');
    else onVoltar();
  };

  const terminar = () => {
    if (window.confirm('Ir para o resumo agora? As perguntas que faltam ficarão sem resposta.')) onTerminar();
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-seguro pb-seguro">
      {/* Barra superior: voltar, progresso, terminar */}
      <nav className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={voltar}
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
      {etapa === 'frequencia' ? (
        <>
          <p className="mt-6 text-center text-xl leading-snug font-semibold text-stone-700">{pergunta.texto}</p>
          <PassoFrequencia
            key={`frequencia-${pergunta.id}`}
            valorInicial={estado.frequencias[pergunta.id]}
            travado={travado}
            onConfirmar={(f) => onResponder('sim', f)}
          />
        </>
      ) : (
        <main key={`pergunta-${pergunta.id}`} className="flex flex-1 animate-entrada flex-col justify-center py-8 text-center">
          <p className="text-2xl leading-snug font-semibold text-stone-900 sm:text-3xl">{pergunta.texto}</p>
          {pergunta.subtexto && <p className="mt-4 text-lg leading-relaxed text-stone-500">{pergunta.subtexto}</p>}
        </main>
      )}

      {etapa === 'frequencia' ? null : pergunta.grupoOpcional && (
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
      {etapa === 'frequencia' ? null : pergunta.tipo === 'texto' ? (
        <RespostaEscrita
          key={`resposta-${pergunta.id}`}
          valorInicial={estado.textos[pergunta.id] ?? ''}
          placeholder={pergunta.placeholder}
          travado={travado}
          onEnviar={onResponderTexto}
        />
      ) : (
        <footer className="grid grid-cols-2 gap-4">
          <BotaoResposta
            rotulo="SIM"
            selecionado={respostaAtual === 'sim'}
            disabled={travado}
            onClick={responderSim}
            className="bg-liturgico-800 text-white active:bg-liturgico-900"
          />
          <BotaoResposta
            rotulo="NÃO"
            selecionado={respostaAtual === 'nao'}
            disabled={travado}
            onClick={() => onResponder('nao')}
            className="bg-white text-liturgico-900 ring-2 ring-liturgico-800 active:bg-liturgico-50"
          />
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

const CHIPS_VEZES = [1, 2, 3, 5, 10];

/** Passo exibido após um SIM: quantas vezes, ou com que frequência e por quanto tempo. */
function PassoFrequencia({
  valorInicial,
  travado,
  onConfirmar,
}: {
  valorInicial?: Frequencia;
  travado: boolean;
  onConfirmar: (f: Frequencia) => void;
}) {
  const [modo, setModo] = useState<'vezes' | 'periodo'>(valorInicial?.modo === 'periodo' ? 'periodo' : 'vezes');
  const [vezes, setVezes] = useState(valorInicial?.modo === 'vezes' ? valorInicial.vezes : 1);
  const [aprox, setAprox] = useState(valorInicial?.modo === 'vezes' ? valorInicial.aprox : false);
  const [vezesPeriodo, setVezesPeriodo] = useState(valorInicial?.modo === 'periodo' ? valorInicial.vezes : 1);
  const [por, setPor] = useState<UnidadeTempo>(valorInicial?.modo === 'periodo' ? valorInicial.por : 'semana');
  const [duracao, setDuracao] = useState(valorInicial?.modo === 'periodo' ? valorInicial.duracao : 1);
  const [unidade, setUnidade] = useState<UnidadeTempo>(valorInicial?.modo === 'periodo' ? valorInicial.unidade : 'ano');
  const [dicaAberta] = useState(() => !dicaFrequenciaVista);
  useEffect(() => {
    dicaFrequenciaVista = true;
  }, []);

  const frequencia: Frequencia =
    modo === 'vezes'
      ? { modo, vezes, aprox }
      : { modo, vezes: vezesPeriodo, por, duracao, unidade };

  return (
    <section className="mt-4 flex flex-1 animate-entrada flex-col gap-5 pb-2">
      <h2 className="text-center text-2xl font-bold text-liturgico-900">Quantas vezes?</h2>

      <div role="radiogroup" aria-label="Como informar" className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-200 p-1">
        {(
          [
            ['vezes', 'Nº de vezes'],
            ['periodo', 'Por um período'],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={modo === valor}
            onClick={() => setModo(valor)}
            className={`min-h-12 rounded-xl px-2 text-lg font-semibold transition ${
              modo === valor ? 'bg-white text-liturgico-900 shadow-sm' : 'text-stone-600'
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {modo === 'vezes' ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            {CHIPS_VEZES.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={vezes === n}
                onClick={() => setVezes(n)}
                className={`min-h-12 min-w-12 rounded-full px-3 text-xl font-semibold ring-2 transition ${
                  vezes === n
                    ? 'bg-liturgico-800 text-white ring-liturgico-800'
                    : 'bg-white text-liturgico-900 ring-stone-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <Contador rotulo="Número de vezes" valor={vezes} onChange={setVezes} />
          <label className="flex items-center gap-3 text-xl text-stone-700">
            <input
              type="checkbox"
              checked={aprox}
              onChange={(e) => setAprox(e.target.checked)}
              className="h-6 w-6 accent-liturgico-800"
            />
            Aproximadamente
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col items-center gap-3">
            <legend className="mb-2 w-full text-center text-lg font-medium text-stone-600">Com que frequência?</legend>
            <div className="flex items-center gap-3 text-xl">
              <Contador rotulo="Vezes" valor={vezesPeriodo} onChange={setVezesPeriodo} />
              <span className="whitespace-nowrap">{vezesPeriodo === 1 ? 'vez' : 'vezes'} por</span>
            </div>
            <SeletorUnidade rotulo="Por" valor={por} onChange={setPor} />
          </fieldset>
          <fieldset className="flex flex-col items-center gap-3">
            <legend className="mb-2 w-full text-center text-lg font-medium text-stone-600">Por quanto tempo?</legend>
            <div className="flex items-center gap-3 text-xl">
              <span>durante</span>
              <Contador rotulo="Duração" valor={duracao} onChange={setDuracao} />
            </div>
            <SeletorUnidade rotulo="Unidade da duração" valor={unidade} onChange={setUnidade} plural={duracao} />
          </fieldset>
        </div>
      )}

      <p aria-live="polite" className="rounded-2xl bg-white p-4 text-center font-serif text-xl text-stone-900 italic shadow-sm ring-1 ring-stone-200">
        “{descreverFrequencia(frequencia)}”
      </p>

      <details open={dicaAberta} className="rounded-2xl bg-amber-50 p-4 text-base text-amber-950 ring-1 ring-amber-200">
        <summary className="cursor-pointer font-semibold">Dica: por que dizer quantas vezes?</summary>
        <div className="mt-2 space-y-2 leading-relaxed">
          {DICA_FREQUENCIA.map((d) => (
            <p key={d}>{d}</p>
          ))}
        </div>
      </details>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onConfirmar(frequencia)}
          disabled={travado}
          className="min-h-16 rounded-2xl bg-liturgico-800 text-2xl font-bold text-white shadow-md transition active:scale-[0.98] active:bg-liturgico-900"
        >
          Continuar
        </button>
        <button
          type="button"
          onClick={() => onConfirmar({ modo: 'naosei' })}
          disabled={travado}
          className="rounded-xl px-4 py-3 text-lg text-liturgico-800 underline underline-offset-4 active:bg-liturgico-50"
        >
          Não sei dizer — continuar
        </button>
      </div>
    </section>
  );
}

const MAX_CONTADOR = 999;

function Contador({ rotulo, valor, onChange }: { rotulo: string; valor: number; onChange: (n: number) => void }) {
  const ajustar = (n: number) => onChange(Math.min(MAX_CONTADOR, Math.max(1, n)));
  const botao =
    'h-12 w-12 rounded-full bg-white text-3xl leading-none font-bold text-liturgico-900 ring-2 ring-stone-300 active:bg-liturgico-50 disabled:opacity-40';
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Menos" onClick={() => ajustar(valor - 1)} disabled={valor <= 1} className={botao}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={rotulo}
        min={1}
        max={MAX_CONTADOR}
        value={valor}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) ajustar(n);
        }}
        onFocus={(e) => e.target.select()}
        className="w-20 rounded-xl border-2 border-stone-300 bg-white py-2 text-center text-2xl font-bold tabular-nums focus:border-liturgico-700 focus:outline-none"
      />
      <button type="button" aria-label="Mais" onClick={() => ajustar(valor + 1)} disabled={valor >= MAX_CONTADOR} className={botao}>
        +
      </button>
    </div>
  );
}

function SeletorUnidade({
  rotulo,
  valor,
  onChange,
  plural = 1,
}: {
  rotulo: string;
  valor: UnidadeTempo;
  onChange: (u: UnidadeTempo) => void;
  plural?: number;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="grid w-full grid-cols-4 gap-2">
      {UNIDADES.map((u) => (
        <button
          key={u}
          type="button"
          role="radio"
          aria-checked={valor === u}
          onClick={() => onChange(u)}
          className={`min-h-12 rounded-xl px-1 text-lg font-medium ring-2 transition ${
            valor === u ? 'bg-liturgico-800 text-white ring-liturgico-800' : 'bg-white text-liturgico-900 ring-stone-300'
          }`}
        >
          {nomeUnidade(u, plural)}
        </button>
      ))}
    </div>
  );
}
