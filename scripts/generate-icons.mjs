// Gera os ícones PNG do PWA a partir de um SVG (uso em desenvolvimento).
//   node scripts/generate-icons.mjs
import sharp from 'sharp';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = resolve(dirname(fileURLToPath(import.meta.url)), '../public');

// Fundo sem cantos arredondados (o sistema aplica a máscara) e cruz dentro da
// "zona segura" de 80% exigida pelos ícones maskable.
const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#5b21b6"/>
  <rect x="234" y="126" width="44" height="260" rx="8" fill="#faf7f2"/>
  <rect x="172" y="196" width="168" height="44" rx="8" fill="#faf7f2"/>
</svg>`);

const saidas = [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
];

for (const [nome, tamanho] of saidas) {
  await sharp(svg).resize(tamanho, tamanho).png().toFile(resolve(PUBLIC, nome));
  console.log(`OK ${nome}`);
}
