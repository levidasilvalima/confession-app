# ✝️ Para uma Boa Confissão

> Exame de consciência católico em forma de **PWA**: funciona offline, instala direto pelo navegador e **nenhum dado sai do seu aparelho**.

Um aplicativo simples, pensado para pessoas leigas, que guia a preparação para o sacramento da Confissão: uma pergunta por vez, com botões grandes de **SIM / NÃO**, e no final um roteiro completo para ler ao padre, contendo apenas os pecados marcados.

As perguntas vêm do material **"Para uma Boa Confissão"** e o roteiro do confessionário segue o **Método de Confissão** do apêndice do *Exame de Consciência* do Pe. Daniel.

---

## 🔒 Regra de ouro: privacidade total

- **Zero backend.** Não existe servidor, API, banco de dados, analytics nem cookies de terceiros.
- **Zero tráfego de rede para dados sensíveis.** As respostas ficam apenas no `localStorage` do aparelho, para que nada se perca se o app for fechado por acidente.
- **Gatilho de destruição.** O botão **"Encerrar e Apagar Tudo"** limpa o `localStorage` e o `sessionStorage` e volta para a tela inicial.
- **Proteção na multitarefa.** Quando o app vai para segundo plano, a tela é desfocada (`filter: blur(10px)`), para que o conteúdo não fique legível no carrossel de apps do celular.
- **Sem sugestões do teclado.** Os campos de texto desativam o corretor e o preenchimento automático (`autoComplete`, `autoCorrect`, `spellCheck`).

> [!NOTE]
> O PDF ou papel gerado pela exportação fica **fora** do app, então o botão "Apagar Tudo" não o remove. O próprio app avisa o usuário para destruí-lo depois da confissão.

---

## ✨ Funcionalidades

### 1. Preparação
- Requisitos para uma boa confissão e a **Oração para antes do exame de consciência**.
- Botão **"Iniciar Exame"** (ou **"Continuar Exame"**, se houver um exame em andamento).

### 2. Exame (wizard)
- **Uma pergunta por vez**, com a categoria atual no topo (ex.: *I MANDAMENTO*) e um subtexto explicativo quando existir.
- **286 perguntas** em 12 categorias: *Antes dos Mandamentos*, os *Dez Mandamentos* e os *Preceitos da Igreja*.
- **NÃO** → avança sozinho para a próxima pergunta.
- **SIM** → o avanço automático para e aparece um campo **"Quantas vezes? Tem algum agravante?"**, com um exemplo próprio de cada pecado. Depois é só tocar em **"Confirmar e Avançar"**.
- **Grupos opcionais** (ex.: *Para os pais*, *Maridos e esposas*, *Para os empregadores*) podem ser pulados de uma vez com "Não se aplica a mim".
- **Perguntas condicionais** (`mostrarSe`) só aparecem quando fazem sentido.
- Barra de progresso, botão **Voltar** com histórico e opção de **Terminar** antes do fim.
- Trava de 350 ms após cada troca de pergunta, para evitar toque duplo acidental.

### 3. Confessionário (Método de Confissão)
Um roteiro litúrgico completo, na ordem em que acontece:

1. Diálogo inicial e *Confiteor* ("Eu, pecador, confesso a Deus...").
2. "Minha última Confissão foi há..." (preenchido com a resposta do exame ou com um espaço em branco).
3. **Meus pecados**: só o que indica falta, escrito em 1ª pessoa e acompanhado das anotações de frequência e agravantes.
4. Encerramento da acusação.
5. **Ato de Contrição** (duas versões).
6. Fórmula da **Absolvição** em português e em latim, só para acompanhar.

### 4. Exportar para PDF / Imprimir
- Botão no topo e no rodapé da tela, usando o `window.print()` nativo (100% offline).
- CSS de impressão (`@media print`): esconde os botões, força fundo branco e texto preto para economizar tinta e evita que um pecado seja separado da sua anotação na quebra de página (`break-inside: avoid`).

---

## 🛠️ Stack

| Camada        | Tecnologia                                                         |
| ------------- | ------------------------------------------------------------------ |
| UI            | [React 19](https://react.dev/) + TypeScript                        |
| Build         | [Vite](https://vite.dev/)                                          |
| Estilo        | [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)  |
| PWA / offline | [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Workbox)   |
| Persistência  | `localStorage` (somente no aparelho)                               |
| Scripts (dev) | `pdfjs-dist` (extração do PDF) e `sharp` (geração de ícones)       |

---

## 🚀 Como rodar

**Pré-requisitos:** Node.js 20.19+ (ou 22.12+) e npm.

```bash
# instalar dependências
npm install

# servidor de desenvolvimento
npm run dev

# checagem de tipos
npm run typecheck

# build de produção (gera a pasta dist/)
npm run build

# pré-visualizar o build (com service worker ativo)
npm run preview
```

> [!TIP]
> O service worker só funciona em **HTTPS** ou em `localhost`. Para testar a instalação no celular, publique a pasta `dist/` em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel, Cloudflare Pages...). Não é preciso servidor de aplicação.

### Instalando no celular
- **Android (Chrome):** menu ⋮ → *Instalar app* / *Adicionar à tela inicial*.
- **iPhone (Safari):** botão Compartilhar → *Adicionar à Tela de Início*.

Depois do primeiro acesso, o app funciona **sem internet**.

---

## 📂 Estrutura do projeto

```
confissao-pwa/
├── public/                     # favicon e ícones do PWA
├── scripts/                    # utilitários de desenvolvimento (não vão para o build)
│   ├── build-questions.mjs     # PDF → questions.json + prayers.json
│   ├── extract-pdf.mjs         # despeja o texto bruto do PDF (depuração)
│   ├── generate-icons.mjs      # gera os PNGs do PWA a partir de um SVG
│   ├── resumos.json            # texto em 1ª pessoa de cada pecado (para o resumo)
│   └── exemplos.json           # exemplo de agravante de cada pergunta
├── src/
│   ├── components/
│   │   ├── StartScreen.tsx     # Tela 1 — Preparação
│   │   ├── QuestionWizard.tsx  # Tela 2 — Exame
│   │   ├── SummaryScreen.tsx   # Tela 3 — Confessionário + impressão
│   │   ├── PrivacyBlur.tsx     # desfoque via Page Visibility API
│   │   └── Cruz.tsx
│   ├── data/
│   │   ├── questions.json      # perguntas (gerado pelo script)
│   │   ├── prayers.json        # introdução e orações (gerado pelo script)
│   │   ├── metodo.json         # roteiro do Método de Confissão
│   │   └── index.ts            # lista plana, condições e navegação
│   ├── hooks/
│   │   └── useConfessionState.ts  # estado do exame sincronizado com o localStorage
│   ├── types.ts
│   ├── App.tsx                 # alterna entre as 3 telas
│   ├── main.tsx
│   └── index.css               # tema litúrgico + regras de @media print
├── index.html
└── vite.config.ts              # configuração do Vite + manifesto do PWA
```

---

## 🧩 Modelo de dados

**Perguntas** (`src/data/questions.json`):

```json
[
  {
    "categoria": "I MANDAMENTO",
    "titulo": "Eu sou o Senhor teu Deus, não terás outro deus diante de mim",
    "notas": ["..."],
    "perguntas": [
      {
        "id": "m1_1",
        "texto": "Pergunta exibida no exame",
        "subtexto": "Explicação curta (opcional)",
        "grupo": "Pecados contra a fé",
        "grupoOpcional": false,
        "textoResumo": "Texto em 1ª pessoa mostrado ao padre",
        "exemploAgravante": "Exemplo mostrado no campo de anotação"
      }
    ]
  }
]
```

Campos opcionais: `tipo` (`"simnao"` | `"texto"`), `pecadoSe` (qual resposta indica falta; o padrão é `"SIM"`), `mostrarSe` (ids que condicionam a pergunta), `placeholder` e `rotuloResumo`.

**Estado salvo** (`localStorage`, chave `exame-de-consciencia:v1`):

```json
{
  "tela": "exame",
  "indice": 42,
  "historico": [0, 1, 2],
  "respostas": {
    "m1_1": { "id": "m1_1", "resposta": "SIM", "observacao": "2 vezes, no trabalho..." }
  },
  "textos": { "ant_1": "6 meses" }
}
```

---

## 🔄 Regerando o conteúdo

As perguntas e orações são extraídas do PDF original, que fica **fora do repositório**, uma pasta acima do projeto:

```bash
# lê "../PARA UMA BOA CONFISSÃO.pdf" e regrava src/data/questions.json e prayers.json
npm run gerar:perguntas

# regenera os ícones do PWA em public/
npm run gerar:icones
```

Para ajustar o texto que aparece no resumo ou os exemplos de agravante, edite [`scripts/resumos.json`](scripts/resumos.json) e [`scripts/exemplos.json`](scripts/exemplos.json) (a chave é o `id` da pergunta) e rode `npm run gerar:perguntas` de novo. O script avisa se alguma pergunta ficou sem resumo ou exemplo.

> [!IMPORTANT]
> Não edite `questions.json` à mão: ele é sobrescrito sempre que o script roda. Faça as correções no script ou nos arquivos `resumos.json` / `exemplos.json`.

---

## 🙏 Créditos

- Perguntas: material **"Para uma Boa Confissão"**.
- Método de Confissão, Ato de Contrição e fórmula da absolvição: apêndice do **Exame de Consciência do Pe. Daniel**.

Este app é só um **auxílio** para o exame de consciência e não substitui a orientação de um sacerdote.
