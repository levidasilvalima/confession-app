// Extrai o texto do PDF "PARA UMA BOA CONFISSAO.pdf" (uso único, em desenvolvimento).
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'node:fs';

const path = process.argv[2];
const data = new Uint8Array(readFileSync(path));
const doc = await getDocument({ data }).promise;
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  let lastY = null;
  let line = '';
  const lines = [];
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
  console.log(`===== PÁGINA ${p} =====`);
  console.log(lines.join('\n'));
}
