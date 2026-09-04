/**
 * Gera os ícones raster do PWA a partir da mesma arte do icon.svg.
 *
 *   node scripts/generate-icons.mjs public
 *
 * Existem em PNG porque nem iOS nem Android usam SVG para ícone de tela
 * inicial: o iOS ignora, e o Android quer um `maskable` para recortar na forma
 * do sistema. Sem eles, "instalar" produz um ícone genérico ou um quadrado
 * branco, que é a primeira coisa que o aluno vê do app fora do navegador.
 *
 * Requer Playwright com o Chromium disponível — é o mesmo motor que renderiza
 * o app, então o degradê sai idêntico ao da interface.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const out = process.argv[2];
mkdirSync(out, { recursive: true });

/**
 * Ícone "any": cantos arredondados, como a arte é.
 * Ícone "maskable": arte a 60% dentro de um fundo cheio, porque o Android
 * recorta o ícone na forma do sistema (círculo, squircle, gota) e come até 20%
 * de cada borda. Sem a zona de segurança, o "N" sai cortado no launcher.
 */
function page(size, maskable) {
  // 20% de cada borda é o que o Android pode comer ao recortar na forma do
  // sistema. A arte "any" usa a viewBox cheia; a maskable recorta na letra e a
  // desenha dentro da zona segura, senão o "N" sai fatiado no launcher.
  const pad = maskable ? Math.round(size * 0.22) : 0;
  const inner = size - pad * 2;
  const radius = maskable ? 0 : Math.round(size * 0.234); // 15/64 da arte original
  return `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden}
    .bg{width:${size}px;height:${size}px;border-radius:${radius}px;
        background:linear-gradient(135deg,#3b82f6,#2563eb);
        display:grid;place-items:center}
    svg{width:${inner}px;height:${inner}px;display:block}
  </style>
  <div class="bg">
    <svg viewBox="${maskable ? '19 18 26 28' : '0 0 64 64'}" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 45V19h5.6l13.2 17.4V19H44v26h-5.6L25.2 27.6V45H20Z" fill="#fff"/>
    </svg>
  </div>`;
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['apple-icon.png', 180, false],
];

for (const [name, size, maskable] of targets) {
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const p = await ctx.newPage();
  await p.setContent(page(size, maskable));
  const buffer = await p.screenshot({ omitBackground: true });
  writeFileSync(`${out}/${name}`, buffer);
  console.log(name, size, maskable ? '(maskable)' : '', buffer.length, 'bytes');
  await ctx.close();
}
await browser.close();
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const out = process.argv[2];
mkdirSync(out, { recursive: true });

/**
 * Ícone "any": cantos arredondados, como a arte é.
 * Ícone "maskable": arte a 60% dentro de um fundo cheio, porque o Android
 * recorta o ícone na forma do sistema (círculo, squircle, gota) e come até 20%
 * de cada borda. Sem a zona de segurança, o "N" sai cortado no launcher.
 */
function page(size, maskable) {
  // 20% de cada borda é o que o Android pode comer ao recortar na forma do
  // sistema. A arte "any" usa a viewBox cheia; a maskable recorta na letra e a
  // desenha dentro da zona segura, senão o "N" sai fatiado no launcher.
  const pad = maskable ? Math.round(size * 0.22) : 0;
  const inner = size - pad * 2;
  const radius = maskable ? 0 : Math.round(size * 0.234); // 15/64 da arte original
  return `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden}
    .bg{width:${size}px;height:${size}px;border-radius:${radius}px;
        background:linear-gradient(135deg,#3b82f6,#2563eb);
        display:grid;place-items:center}
    svg{width:${inner}px;height:${inner}px;display:block}
  </style>
  <div class="bg">
    <svg viewBox="${maskable ? '19 18 26 28' : '0 0 64 64'}" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 45V19h5.6l13.2 17.4V19H44v26h-5.6L25.2 27.6V45H20Z" fill="#fff"/>
    </svg>
  </div>`;
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['apple-icon.png', 180, false],
];

for (const [name, size, maskable] of targets) {
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const p = await ctx.newPage();
  await p.setContent(page(size, maskable));
  const buffer = await p.screenshot({ omitBackground: true });
  writeFileSync(`${out}/${name}`, buffer);
  console.log(name, size, maskable ? '(maskable)' : '', buffer.length, 'bytes');
  await ctx.close();
}
await browser.close();
