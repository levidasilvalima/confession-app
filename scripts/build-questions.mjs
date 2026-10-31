// Gera src/data/questions.json e src/data/prayers.json a partir do PDF
// "PARA UMA BOA CONFISSAO.pdf". Uso (somente em desenvolvimento):
//   node scripts/build-questions.mjs "<caminho do pdf>"
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../src/data');
const BULLET = '\u25CF';

// ---------------------------------------------------------------------------
// 1. Extração das linhas do PDF
// ---------------------------------------------------------------------------
async function extractLines(pdfPath) {
  const data = new Uint8Array(readFileSync(pdfPath));
  const doc = await getDocument({ data, verbosity: 0 }).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let lastY = null;
    let line = '';
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line);
        line = '';
      }
      line += item.str;
      lastY = y;
    }
    lines.push(line);
  }
  return lines.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// 2. Regras de classificação
// ---------------------------------------------------------------------------
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const RE_MANDAMENTO = /^(X|IX|VIII|VII|VI|V|IV|III|II|I) MANDAMENTO:\s*(.*)$/;
const RE_SIMNAO = /\[\s*\]\s*Sim\s*\[\s*\]\s*Não/g;
const RE_INTRO_PECADOS = /^(Os )?[Pp]ecados contra o \S+ mandamento/;

// Subdivisões dentro de um mandamento.
const GRUPOS = {
  'Pecados contra a fé': false,
  'Pecados contra a esperança': false,
  'Pecados contra a Caridade': false,
  'Para os pais (caso tenha filhos)': true,
  'Para os filhos (em relação a pais e superiores)': false,
  'Maridos e esposas': true,
  'Súditos da Igreja e do Estado': false,
  'Para os empregadores': true,
  'Para os empregados': true,
  'Para profissionais ou servidores públicos': true,
  'Para os professores': true,
  'Para os estudantes': true,
  'Para todos': false,
};

const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const comPonto = (s) => (/[.?!:]$/.test(s) ? s : `${s}.`);
const tituloBonito = (s) =>
  s
    .replace(/[“”"]/g, '')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bdeus\b/g, 'Deus')
    .replace('outro Deus', 'outro deus')
    .replace(/\bsenhor\b/g, 'Senhor')
    .replace(/santa igreja/g, 'Santa Igreja');

/** "(Texto da nota). (Outra nota)." -> ["Texto da nota.", "Outra nota."] */
const separarNotas = (nota) =>
  nota
    .split(/(?<=\)\.?)\s+(?=\()/)
    .map((n) => comPonto(n.trim().replace(/^\(/, '').replace(/\)\.?$/, '').replace(/\.\)$/, '').trim()))
    .filter(Boolean);

/** Separa o "subtexto" (explicação entre parênteses) do texto principal. */
function separarSubtexto(texto) {
  // "Embriaguei-me? (Em que grau?)"
  let m = texto.match(/^(.*\?)\s*\(([^()]+)\)$/);
  if (m) return { texto: m[1].trim(), subtexto: comPonto(capitalizar(m[2].trim())) };
  // "Fui negligente na oração (distrações voluntárias, poucas orações)?"
  m = texto.match(/^(.*\S)\s+\(([^()]+)\)\?$/);
  if (m) return { texto: `${m[1].trim()}?`, subtexto: comPonto(capitalizar(m[2].trim())) };
  return { texto };
}

// ---------------------------------------------------------------------------
// 3. Parser
// ---------------------------------------------------------------------------
function parse(lines) {
  const introducao = [];
  const oracaoAntes = { titulo: '', texto: [], fonte: '' };
  const oracaoDepois = { titulo: '', texto: [], fonte: '' };
  const categorias = [];

  let modo = 'intro'; // intro | oracaoAntes | exame | oracaoDepois
  let cat = null;
  let grupo = null;
  let pergunta = null; // { raw }
  let notaAberta = false;
  let tituloAberto = false;
  let buffer = '';

  const fecharPergunta = () => {
    if (!pergunta) return;
    const raw = pergunta.raw.replace(/\s+/g, ' ').trim();
    const simNao = RE_SIMNAO.test(raw);
    RE_SIMNAO.lastIndex = 0;
    const limpo = raw.replace(RE_SIMNAO, '').trim();
    const { texto, subtexto } = separarSubtexto(limpo);
    const p = { id: '', texto };
    if (subtexto) p.subtexto = subtexto;
    if (!simNao) p.tipo = 'texto';
    if (grupo) {
      p.grupo = grupo;
      if (GRUPOS[grupo]) p.grupoOpcional = true;
    }
    cat.perguntas.push(p);
    pergunta = null;
  };

  const novaCategoria = (categoria, titulo = '') => {
    fecharPergunta();
    cat = { categoria, titulo, nota: '', perguntas: [] };
    categorias.push(cat);
    grupo = null;
  };

  for (const line of lines) {
    // --- Introdução e oração inicial ---------------------------------------
    if (modo === 'intro') {
      if (line === 'PARA UMA BOA CONFISSÃO') continue;
      if (line.startsWith('Oração para antes')) {
        if (buffer) introducao.push(buffer.trim());
        buffer = '';
        oracaoAntes.titulo = line;
        modo = 'oracaoAntes';
        continue;
      }
      buffer += ` ${line}`;
      if (line.endsWith('.')) {
        introducao.push(buffer.trim());
        buffer = '';
      }
      continue;
    }
    if (modo === 'oracaoAntes') {
      if (/^\(Manual/.test(line)) {
        oracaoAntes.fonte = line.replace(/[()]/g, '');
        oracaoAntes.texto = paragrafos(buffer);
        buffer = '';
        modo = 'exame';
        continue;
      }
      buffer += `${line}\n`;
      continue;
    }
    if (modo === 'oracaoDepois') {
      if (/^\(Manual/.test(line)) {
        oracaoDepois.fonte = line.replace(/[()]/g, '');
        continue;
      }
      buffer += `${line}\n`;
      continue;
    }

    // --- Exame -------------------------------------------------------------
    if (line.startsWith('Oração para depois')) {
      fecharPergunta();
      oracaoDepois.titulo = line;
      buffer = '';
      modo = 'oracaoDepois';
      continue;
    }

    if (line === 'ANTES DOS MANDAMENTOS') {
      novaCategoria('ANTES DOS MANDAMENTOS');
      continue;
    }
    if (line === 'OS PRECEITOS DA SANTA IGREJA') {
      novaCategoria('PRECEITOS DA IGREJA', 'Os preceitos da Santa Igreja');
      notaAberta = true;
      continue;
    }
    const mm = line.match(RE_MANDAMENTO);
    if (mm) {
      novaCategoria(`${mm[1]} MANDAMENTO`, mm[2]);
      tituloAberto = true;
      continue;
    }
    // Continuação do título do mandamento (linha toda em maiúsculas).
    if (tituloAberto) {
      tituloAberto = false;
      if (!line.startsWith(BULLET) && line === line.toUpperCase() && /[A-Z]/.test(line)) {
        cat.titulo += ` ${line}`;
        continue;
      }
    }

    if (line.startsWith(BULLET)) {
      fecharPergunta();
      notaAberta = false;
      pergunta = { raw: line.slice(1).trim() };
      continue;
    }
    if (/^_+$/.test(line)) continue; // linha para resposta escrita

    if (line in GRUPOS) {
      fecharPergunta();
      grupo = line;
      continue;
    }
    if (RE_INTRO_PECADOS.test(line)) {
      fecharPergunta();
      continue;
    }

    // Nota explicativa da categoria (entre parênteses ou parágrafo).
    if (line.startsWith('(') && (!pergunta || RE_SIMNAO.test(pergunta.raw))) {
      RE_SIMNAO.lastIndex = 0;
      fecharPergunta();
      notaAberta = true;
    }
    RE_SIMNAO.lastIndex = 0;
    if (notaAberta || !pergunta) {
      let l = line;
      const fimIntro = l.search(/\s*Pecados contra o \S+ mandamento:?$/);
      if (fimIntro >= 0) {
        l = l.slice(0, fimIntro);
        notaAberta = false;
      }
      cat.nota = `${cat.nota} ${l}`.trim();
      continue;
    }

    // Continuação da pergunta atual.
    pergunta.raw += ` ${line}`;
  }
  fecharPergunta();
  oracaoDepois.texto = paragrafos(buffer);

  return { introducao, oracaoAntes, oracaoDepois, categorias };
}

/** Junta as linhas quebradas do PDF; separa parágrafos onde o PDF os separa. */
function paragrafos(texto) {
  const unido = texto
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
  // Na oração inicial, o 2º parágrafo começa em "Rogo-vos, Senhor".
  return unido.split(/\s(?=Rogo-vos, Senhor)/);
}

// ---------------------------------------------------------------------------
// 4. Ajustes manuais (seção "Antes dos mandamentos")
// ---------------------------------------------------------------------------
// Nessa seção as perguntas estão na 2ª pessoa e algumas indicam falta quando a
// resposta é "NÃO". Para que o resumo lido ao padre fique correto, definimos
// quando a resposta indica falta (pecadoSe) e um texto em 1ª pessoa.
const AJUSTES_ANTES = [
  {
    rotuloResumo: 'Minha última confissão foi há',
    placeholder: 'Ex.: 6 meses, 2 anos…',
  },
  {
    subtexto: 'Na última confissão.',
    pecadoSe: 'nao',
    textoResumo: 'Não recebi a absolvição na última confissão.',
  },
  {
    subtexto: 'A penitência da última confissão.',
    pecadoSe: 'nao',
    textoResumo: 'Não cumpri a penitência da última confissão.',
  },
  {
    textoResumo:
      'Ocultei deliberadamente um pecado mortal, ou confessei sem arrependimento verdadeiro, ou sem um firme propósito de correção, ou sem a intenção de cumprir a penitência.',
  },
  {
    textoResumo: 'Após essa má confissão, recebi a Santa Comunhão em estado de pecado mortal.',
  },
  {
    rotuloResumo: 'Número de Confissões e Comunhões sacrílegas',
    placeholder: 'Ex.: 3 vezes',
    mostrarSe: ['ant_4', 'ant_5'],
  },
  {
    textoResumo: 'Em estado de pecado mortal, recebi outro Sacramento.',
  },
];

// Texto em 1ª pessoa, afirmativo, mostrado no resumo do confessionário no lugar
// da pergunta (o penitente só lê o que já escolheu). Chave = id da pergunta.
const RESUMOS = JSON.parse(readFileSync(resolve(__dirname, 'resumos.json'), 'utf8'));

function finalizar(categorias) {
  const usados = new Set();
  for (const [ci, cat] of categorias.entries()) {
    const prefixo =
      cat.categoria === 'ANTES DOS MANDAMENTOS'
        ? 'ant'
        : cat.categoria === 'PRECEITOS DA IGREJA'
          ? 'prec'
          : `m${ROMANOS.indexOf(cat.categoria.split(' ')[0]) + 1}`;
    cat.perguntas.forEach((p, i) => {
      p.id = `${prefixo}_${i + 1}`;
    });
    if (prefixo === 'ant') {
      cat.perguntas.forEach((p, i) => Object.assign(p, AJUSTES_ANTES[i] ?? {}));
    }
    for (const p of cat.perguntas) {
      if (p.id in RESUMOS) {
        p.textoResumo = RESUMOS[p.id];
        usados.add(p.id);
      } else if (p.tipo !== 'texto' && !p.textoResumo) {
        console.warn(`AVISO: pergunta sem texto de resumo: ${p.id}`);
      }
    }
    if (cat.titulo) cat.titulo = tituloBonito(cat.titulo);
    const notas = cat.nota ? separarNotas(cat.nota) : [];
    // Ordena as chaves para um JSON legível.
    categorias[ci] = {
      categoria: cat.categoria,
      ...(cat.titulo ? { titulo: cat.titulo } : {}),
      ...(notas.length ? { notas } : {}),
      perguntas: cat.perguntas.map(({ id, texto, subtexto, ...resto }) => ({
        id,
        texto,
        ...(subtexto ? { subtexto } : {}),
        ...resto,
      })),
    };
  }
  for (const id of Object.keys(RESUMOS)) {
    if (!usados.has(id)) console.warn(`AVISO: resumo para id inexistente: ${id}`);
  }
  return categorias;
}

// ---------------------------------------------------------------------------
const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error('Uso: node scripts/build-questions.mjs "<caminho do pdf>"');
  process.exit(1);
}
const lines = await extractLines(pdfPath);
const { introducao, oracaoAntes, oracaoDepois, categorias } = parse(lines);
finalizar(categorias);
// Correção ortográfica do original ("invalida" -> "inválida").
for (let i = 0; i < introducao.length; i++) {
  introducao[i] = introducao[i].replace('torna invalida', 'torna inválida');
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, 'questions.json'), `${JSON.stringify(categorias, null, 2)}\n`, 'utf8');
writeFileSync(
  resolve(OUT_DIR, 'prayers.json'),
  `${JSON.stringify({ introducao, oracaoAntes, oracaoDepois }, null, 2)}\n`,
  'utf8',
);

const total = categorias.reduce((n, c) => n + c.perguntas.length, 0);
console.log(`OK: ${categorias.length} categorias, ${total} perguntas.`);
for (const c of categorias) console.log(`  ${c.categoria}: ${c.perguntas.length}`);
