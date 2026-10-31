import { oracoes } from '../data';
import { Cruz } from './Cruz';

interface Props {
  temProgresso: boolean;
  onIniciar: () => void;
}

/** TELA 1 — Preparação: oração para antes do exame de consciência. */
export function StartScreen({ temProgresso, onIniciar }: Props) {
  const { introducao, oracaoAntes } = oracoes;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-seguro">
      <main className="flex-1 animate-entrada pb-6">
        <header className="mt-6 mb-6 text-center">
          <Cruz className="mx-auto h-12 w-9 text-liturgico-800" />
          <h1 className="mt-4 font-serif text-3xl font-bold text-liturgico-900 sm:text-4xl">
            Para uma Boa Confissão
          </h1>
          <p className="mt-2 text-lg text-stone-600">Exame de consciência</p>
        </header>

        <p className="mb-5 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-base text-emerald-900 ring-1 ring-emerald-200">
          <span aria-hidden="true" className="text-xl leading-none">
            🔒
          </span>
          <span>
            <strong>Tudo fica só neste aparelho.</strong> Nada é enviado pela internet. No final, você apaga
            tudo com um toque.
          </span>
        </p>

        <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <h2 className="mb-3 text-xl font-semibold text-liturgico-900">Para uma boa confissão é preciso:</h2>
          <ol className="list-decimal space-y-2 pl-6 text-lg leading-relaxed marker:font-bold marker:text-liturgico-700">
            {introducao.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <h2 className="mb-3 text-xl font-semibold text-liturgico-900">{oracaoAntes.titulo}</h2>
          <div className="space-y-3 font-serif text-xl leading-relaxed text-stone-800">
            {oracaoAntes.texto.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-3 text-right text-sm text-stone-500 italic">{oracaoAntes.fonte}</p>
        </section>

        <section className="rounded-2xl bg-liturgico-50 p-5 text-lg leading-relaxed text-liturgico-900 ring-1 ring-liturgico-100">
          <h2 className="mb-2 font-semibold">Como funciona</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Aparece <strong>uma pergunta por vez</strong>. Responda <strong>SIM</strong> ou <strong>NÃO</strong>.
            </li>
            <li>Se errar, use o botão “Voltar”.</li>
            <li>
              No final, aparece <strong>só o que você respondeu SIM</strong>, para ler ao padre.
            </li>
          </ul>
        </section>
      </main>

      <footer className="sticky bottom-0 -mx-5 bg-gradient-to-t from-pergaminho via-pergaminho to-transparent px-5 pt-6 pb-seguro">
        <button
          type="button"
          onClick={onIniciar}
          className="w-full rounded-2xl bg-liturgico-800 px-6 py-5 text-2xl font-bold text-white shadow-lg transition active:scale-[0.98] active:bg-liturgico-900 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-liturgico-600"
        >
          {temProgresso ? 'Continuar Exame' : 'Iniciar Exame'}
        </button>
      </footer>
    </div>
  );
}
