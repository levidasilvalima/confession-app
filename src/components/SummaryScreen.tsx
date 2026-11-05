import type { ReactNode } from 'react';
import type { EstadoConfissao, Pergunta } from '../types';
import { categorias, deveMostrar, indicaFalta, metodo } from '../data';
import { Cruz } from './Cruz';

interface Props {
  estado: EstadoConfissao;
  onRevisar: () => void;
  onApagar: () => void;
}

interface ItemResumo {
  pergunta: Pergunta;
  /** Resposta escrita (para perguntas do tipo "texto"). */
  valor?: string;
  /** Frequência e agravantes anotados no exame. */
  observacao?: string;
}

/** Pergunta cuja resposta preenche o "Minha última Confissão foi há..." do roteiro. */
const ID_ULTIMA_CONFISSAO = 'ant_1';

/** TELA 3 — Confessionário: roteiro completo, com só o que indica falta, para ler ao padre. */
export function SummaryScreen({ estado, onRevisar, onApagar }: Props) {
  const grupos = categorias
    .map((categoria) => ({
      categoria,
      itens: categoria.perguntas.flatMap<ItemResumo>((pergunta) => {
        if (pergunta.id === ID_ULTIMA_CONFISSAO) return [];
        if (pergunta.tipo === 'texto') {
          const valor = estado.textos[pergunta.id];
          return valor && deveMostrar(pergunta, estado) ? [{ pergunta, valor }] : [];
        }
        return indicaFalta(pergunta, estado)
          ? [{ pergunta, observacao: estado.respostas[pergunta.id].observacao.trim() }]
          : [];
      }),
    }))
    .filter((g) => g.itens.length > 0);

  const ultimaConfissao = estado.textos[ID_ULTIMA_CONFISSAO];

  const apagar = () => {
    if (window.confirm('Apagar todas as respostas deste aparelho? Esta ação não pode ser desfeita.')) onApagar();
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl animate-entrada flex-col px-5 pt-seguro pb-seguro">
      <header className="mt-6 mb-6 text-center">
        <Cruz className="mx-auto h-10 w-8 text-liturgico-800" />
        <h1 className="mt-3 font-serif text-3xl font-bold text-liturgico-900">{metodo.titulo}</h1>
        <p className="mt-2 text-lg text-stone-600">Siga este roteiro no confessionário.</p>
      </header>

      <BotaoImprimir className="mb-6" />

      <main className="flex-1 space-y-5">
        <Bloco titulo="Ao começar">
          <dl className="space-y-3">
            {metodo.dialogoInicial.map((fala) => (
              <div key={fala.texto} className="impressao-inteiro">
                <dt className="text-base font-bold text-liturgico-800">{fala.quem}</dt>
                <dd lang={fala.lingua} className="font-serif text-xl leading-relaxed text-stone-800">
                  {fala.texto}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-base font-bold text-liturgico-800">Penitente</p>
          <div className="space-y-3 font-serif text-xl leading-relaxed text-stone-800">
            {metodo.confiteor.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Bloco>

        <Bloco titulo="Última confissão">
          <p className="font-serif text-xl leading-relaxed text-stone-900">
            {metodo.ultimaConfissao}{' '}
            {ultimaConfissao ? (
              <strong>{ultimaConfissao}.</strong>
            ) : (
              <span
                aria-label="espaço para completar"
                className="inline-block w-32 border-b-2 border-stone-400 align-baseline"
              />
            )}
          </p>
          {!ultimaConfissao && <Rubrica>{metodo.ultimaConfissaoNota}</Rubrica>}
        </Bloco>

        <section>
          <h2 className="mb-1 font-serif text-2xl font-bold text-liturgico-900">Meus pecados</h2>
          <p className="mb-3 text-base text-stone-500">{metodo.acusacaoNota}</p>
          {grupos.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-xl text-stone-600 shadow-sm ring-1 ring-stone-200">
              Você não marcou nenhum pecado no exame.
            </p>
          ) : (
            <div className="space-y-5">
              {grupos.map(({ categoria, itens }) => (
                <section
                  key={categoria.categoria}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200"
                >
                  <h3 className="impressao-com-seguinte text-base font-bold tracking-wider text-liturgico-800 uppercase">
                    {categoria.categoria}
                  </h3>
                  {categoria.titulo && (
                    <p className="impressao-com-seguinte font-serif text-base text-stone-500 italic">
                      “{categoria.titulo}”
                    </p>
                  )}
                  <ul className="mt-3 divide-y divide-stone-100">
                    {itens.map(({ pergunta, valor, observacao }) => (
                      <li key={pergunta.id} className="impressao-inteiro flex gap-3 py-3">
                        <span
                          aria-hidden="true"
                          className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-liturgico-700 print:border print:border-black"
                        />
                        {valor !== undefined ? (
                          <p className="text-xl leading-snug">
                            {pergunta.rotuloResumo ?? pergunta.texto}: <strong>{valor}</strong>
                          </p>
                        ) : (
                          <div className="min-w-0">
                            <p className="text-xl leading-snug text-stone-900">
                              {pergunta.textoResumo ?? pergunta.texto}
                            </p>
                            {observacao && (
                              <p className="mt-1 text-lg leading-snug font-semibold break-words whitespace-pre-line text-liturgico-900">
                                {observacao}
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={onRevisar}
          className="w-full rounded-2xl px-4 py-3 text-lg font-medium text-liturgico-800 underline underline-offset-4 active:bg-liturgico-50 print:hidden"
        >
          ‹ Voltar e revisar respostas
        </button>

        <Bloco titulo="Ao terminar de se acusar">
          <p className="font-serif text-xl leading-relaxed text-stone-800">{metodo.encerramento}</p>
          <Rubrica>{metodo.praticaNota}</Rubrica>
        </Bloco>

        <Bloco titulo="Ato de Contrição">
          <div className="space-y-3 font-serif text-xl leading-relaxed text-stone-800">
            <p>{metodo.atoContricao[0]}</p>
            <p className="text-base text-stone-500 italic">ou:</p>
            <p>{metodo.atoContricao[1]}</p>
          </div>
        </Bloco>

        <Bloco titulo="Absolvição">
          <Rubrica>{metodo.absolvicaoNota}</Rubrica>
          <div className="mt-3 space-y-3 font-serif text-lg leading-relaxed text-stone-800">
            {metodo.absolvicaoPortugues.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <h3 className="impressao-com-seguinte mt-5 text-base font-bold text-liturgico-800">Em latim</h3>
          <div lang="la" className="mt-2 space-y-3 font-serif text-lg leading-relaxed text-stone-600">
            {metodo.absolvicaoLatim.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-4 text-base font-bold text-liturgico-800">Sacerdote</p>
          <p className="font-serif text-xl text-stone-800">{metodo.despedida}</p>
          <p className="mt-3 text-right text-sm text-stone-500 italic">{metodo.fonte}</p>
        </Bloco>
      </main>

      <footer className="mt-8 mb-4 space-y-5 print:hidden">
        <div>
          <BotaoImprimir />
          <p className="mt-3 text-center text-base text-stone-500">
            O papel ou arquivo gerado fica fora do app: o botão abaixo não o apaga. Destrua-o depois da confissão.
          </p>
        </div>
        <button
          type="button"
          onClick={apagar}
          className="w-full rounded-2xl bg-red-700 px-6 py-6 text-2xl font-extrabold text-white shadow-lg ring-4 ring-red-200 transition active:scale-[0.98] active:bg-red-800 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          Encerrar e Apagar Tudo
        </button>
        <p className="text-center text-base text-stone-500">
          Apaga todas as respostas deste aparelho e volta ao início.
        </p>
      </footer>
    </div>
  );
}

function BotaoImprimir({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`w-full rounded-2xl bg-white px-4 py-4 text-xl font-bold text-liturgico-900 shadow-sm ring-2 ring-liturgico-800 transition active:scale-[0.98] active:bg-liturgico-50 print:hidden ${className}`}
    >
      Exportar para PDF / Imprimir
    </button>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-liturgico-50 p-5 ring-1 ring-liturgico-100">
      <h2 className="impressao-com-seguinte mb-3 text-xl font-semibold text-liturgico-900">{titulo}</h2>
      {children}
    </section>
  );
}

function Rubrica({ children }: { children: ReactNode }) {
  return <p className="impressao-inteiro mt-3 text-base text-stone-500 italic">{children}</p>;
}
