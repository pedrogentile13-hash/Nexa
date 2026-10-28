#!/usr/bin/env node
/**
 * Prepara o logo de uma escola para o app: deixa o que está FORA do disco
 * transparente (o fundo colorido/branco do arquivo original some) e mantém a
 * resolução original.
 *
 * Serve para logos REDONDOS que encostam nas bordas da imagem (selos e
 * brasões) — é o caso do Anglo Morumbi e do selo "Leader in Me". O disco é o
 * maior círculo que cabe na imagem; o corte tem borda suavizada (anti-serrilhado)
 * para não ficar com "dente" nem com um fio da cor do fundo.
 *
 * Uso:
 *   node scripts/prepare-school-logo.mjs <entrada> <saida.webp|png> [--trim=1.5] [--feather=1.2]
 *
 *   --trim     quantos pixels recuar do círculo (come o fio de fundo na borda)
 *   --feather  largura do esmaecimento da borda, em pixels
 */
import sharp from 'sharp';

const [, , input, output, ...flags] = process.argv;
if (!input || !output) {
  console.error('Uso: node scripts/prepare-school-logo.mjs <entrada> <saida.webp|png> [--trim=1.5] [--feather=1.2]');
  process.exit(1);
}
const opt = (name, fallback) => {
  const f = flags.find((x) => x.startsWith(`--${name}=`));
  return f ? Number(f.split('=')[1]) : fallback;
};
const trim = opt('trim', 1.5);
const feather = opt('feather', 1.2);

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

const cx = (w - 1) / 2;
const cy = (h - 1) / 2;
const radius = Math.min(w, h) / 2 - trim;

for (let y = 0; y < h; y += 1) {
  for (let x = 0; x < w; x += 1) {
    const d = Math.hypot(x - cx, y - cy);
    // 1 dentro do disco, 0 fora, com uma rampa de `feather` pixels na borda.
    const k = Math.max(0, Math.min(1, (radius - d) / feather + 0.5));
    const i = (y * w + x) * 4 + 3;
    data[i] = Math.round(data[i] * k);
  }
}

const img = sharp(data, { raw: { width: w, height: h, channels: 4 } });
if (output.endsWith('.png')) await img.png({ compressionLevel: 9 }).toFile(output);
else await img.webp({ quality: 95, alphaQuality: 100 }).toFile(output);

console.log(`ok: ${w}x${h} → ${output} (raio ${radius.toFixed(1)}px, transparência fora do disco)`);
