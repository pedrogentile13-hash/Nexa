/**
 * Gera os ícones raster do PWA a partir da arte oficial em assets/brand/logo-mark-src.png.
 *
 *   node scripts/generate-icons.mjs public
 *
 * Existem em PNG porque nem iOS nem Android usam SVG para ícone de tela
 * inicial: o iOS ignora, e o Android quer um `maskable` para recortar na forma
 * do sistema. Sem eles, "instalar" produz um ícone genérico ou um quadrado
 * branco, que é a primeira coisa que o aluno vê do app fora do navegador.
 *
 * Requer Playwright com o Chromium disponível — é o mesmo motor que renderiza
 * o app, então o degradê de fundo sai idêntico ao de `--gradient-header`.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const out = process.argv[2];
mkdirSync(out, { recursive: true });

const markPath = fileURLToPath(new URL('../assets/brand/logo-mark-src.png', import.meta.url));
// Data URI em vez de `file://`: o Chromium sandboxed do Playwright recusa
// carregar arquivos locais por padrão, e a imagem chegava quebrada.
const markDataUri = `data:image/png;base64,${readFileSync(markPath).toString('base64')}`;

/**
 * Ícone "any": a marca sobre o degradê de marca, cantos arredondados.
 * Ícone "maskable": a marca a ~56% do canvas sobre o degradê cheio, porque o
 * Android recorta o ícone na forma do sistema (círculo, squircle, gota) e come
 * até 20% de cada borda. Sem a zona de segurança, a marca sai cortada no
 * launcher.
 */
function page(size, maskable) {
  const markFraction = maskable ? 0.56 : 0.72;
  const markSize = Math.round(size * markFraction);
  const radius = maskable ? 0 : Math.round(size * 0.234); // mesma proporção do card antigo
  return `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden}
    .bg{width:${size}px;height:${size}px;border-radius:${radius}px;
        background:linear-gradient(135deg,#7c3aed 0%,#0e7490 100%);
        display:grid;place-items:center}
    img{width:${markSize}px;height:${markSize}px;display:block}
  </style>
  <div class="bg">
    <img src="${markDataUri}" />
  </div>`;
}

// apple-icon.png segue a convenção de arquivo do Next (precisa estar em
// src/app/, não em public/) — por isso o destino dele é fixo, independente
// do argumento `out`, que só vale para os ícones do manifest do PWA.
const appleIconPath = fileURLToPath(new URL('../src/app/apple-icon.png', import.meta.url));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const targets = [
  [`${out}/icon-192.png`, 192, false],
  [`${out}/icon-512.png`, 512, false],
  [`${out}/icon-maskable-512.png`, 512, true],
  [appleIconPath, 180, false],
];

for (const [dest, size, maskable] of targets) {
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const p = await ctx.newPage();
  await p.setContent(page(size, maskable));
  await p.waitForTimeout(50); // deixa a <img> local terminar de decodificar
  const buffer = await p.screenshot({ omitBackground: true });
  writeFileSync(dest, buffer);
  console.log(dest, size, maskable ? '(maskable)' : '', buffer.length, 'bytes');
  await ctx.close();
}
await browser.close();
