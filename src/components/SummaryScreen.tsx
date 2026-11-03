import type { EstadoConfissao, Pergunta } from '../types';
import { categorias, deveMostrar, indicaFalta, oracoes } from '../data';
import { descreverFrequencia } from '../data/frequencia';
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
}

/** TELA 3 — Confessionário: só o que foi respondido SIM, para ler ao padre. */
export function SummaryScreen({ estado, onRevisar, onApagar }: Props) {
  const grupos = categorias
    .map((categoria) => ({
      categoria,
      itens: categoria.perguntas.flatMap<ItemResumo>((pergunta) => {
        if (pergunta.tipo === 'texto') {
          const valor = estado.textos[pergunta.id];
          return valor && deveMostrar(pergunta, estado) ? [{ pergunta, valor }] : [];
        }
        return indicaFalta(pergunta, estado) ? [{ pergunta }] : [];
      }),
    }))
    .filter((g) => g.itens.length > 0);

  const totalFaltas = grupos.reduce((n, g) => n + g.itens.filter((i) => i.valor === undefined).length, 0);

  const apagar = () => {
    if (window.confirm('Apagar todas as respostas deste aparelho? Esta ação não pode ser desfeita.')) onApagar();
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl animate-entrada flex-col px-5 pt-seguro pb-seguro">
      <header className="mt-6 mb-6 text-center">
        <Cruz className="mx-auto h-10 w-8 text-liturgico-800" />
        <h1 className="mt-3 font-serif text-3xl font-bold text-liturgico-900">Confessionário</h1>
        <p className="mt-2 text-lg text-stone-600">
          {totalFaltas > 0
            ? `Leia ao padre ${totalFaltas === 1 ? 'o item abaixo' : `os ${totalFaltas} itens abaixo`}.`
            : 'Revise com calma o que deseja confessar.'}
        </p>
      </header>

      <main className="flex-1 space-y-5">
        {grupos.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-xl text-stone-600 shadow-sm ring-1 ring-stone-200">
            Você não respondeu <strong>SIM</strong> a nenhuma pergunta.
          </p>
        ) : (
          grupos.map(({ categoria, itens }) => (
            <section
              key={categoria.categoria}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200"
            >
              <h2 className="text-base font-bold tracking-wider text-liturgico-800 uppercase">
                {categoria.categoria}
              </h2>
              {categoria.titulo && (
                <p className="font-serif text-base text-stone-500 italic">“{categoria.titulo}”</p>
              )}
              <ul className="mt-3 divide-y divide-stone-100">
                {itens.map(({ pergunta, valor }) => (
                  <li key={pergunta.id} className="flex gap-3 py-3">
                    <span aria-hidden="true" className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-liturgico-700" />
                    {valor !== undefined ? (
                      <p className="text-xl leading-snug">
                        {pergunta.rotuloResumo ?? pergunta.texto}: <strong>{valor}</strong>
                      </p>
                    ) : (
                      <div>
                        <p className="text-xl leading-snug text-stone-900">{pergunta.textoResumo ?? pergunta.texto}</p>
                        {estado.frequencias[pergunta.id] && (
                          <p className="mt-1 text-lg font-semibold text-liturgico-900">
                            {descreverFrequencia(estado.frequencias[pergunta.id])}
                          </p>
                        )}
                        {pergunta.subtexto && !pergunta.textoResumo && (
                          <p className="mt-1 text-base text-stone-500">{pergunta.subtexto}</p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <button
          type="button"
          onClick={onRevisar}
          className="w-full rounded-2xl px-4 py-3 text-lg font-medium text-liturgico-800 underline underline-offset-4 active:bg-liturgico-50"
        >
          ‹ Voltar e revisar respostas
        </button>

        <section className="rounded-2xl bg-liturgico-50 p-5 ring-1 ring-liturgico-100">
          <h2 className="mb-3 text-xl font-semibold text-liturgico-900">{oracoes.oracaoDepois.titulo}</h2>
          <div className="space-y-3 font-serif text-xl leading-relaxed text-stone-800">
            {oracoes.oracaoDepois.texto.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-3 text-right text-sm text-stone-500 italic">{oracoes.oracaoDepois.fonte}</p>
        </section>
      </main>

      <footer className="mt-8 mb-4">
        <button
          type="button"
          onClick={apagar}
          className="w-full rounded-2xl bg-red-700 px-6 py-6 text-2xl font-extrabold text-white shadow-lg ring-4 ring-red-200 transition active:scale-[0.98] active:bg-red-800 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          Encerrar e Apagar Tudo
        </button>
        <p className="mt-3 text-center text-base text-stone-500">
          Apaga todas as respostas deste aparelho e volta ao início.
        </p>
      </footer>
    </div>
  );
}
