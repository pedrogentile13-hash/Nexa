#!/usr/bin/env node
/**
 * Confere se o computador está pronto para desenvolver o Nexa sem estragar o deploy da Hostinger.
 *
 *   node scripts/verificar-ambiente.mjs
 *
 * NUNCA imprime o valor de nenhuma chave: só se ela existe e se parece ser de produção.
 * Funciona no Windows, Mac e Linux (só precisa do Node).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const DEPLOY_BRANCH = 'claude/nexa-review-architecture-o6q9zu';
const REMOTE_PART = 'pedrogentile13-hash/Nexa';

const results = [];
const ok = (msg) => results.push(['OK  ', msg]);
const warn = (msg) => results.push(['ATENÇÃO', msg]);
const fail = (msg) => results.push(['ERRO', msg]);

function git(...args) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

// 1) Node
const [major, minor] = process.versions.node.split('.').map(Number);
if (major > 20 || (major === 20 && minor >= 11))
  ok(
    `Node ${process.versions.node}${major === 22 ? '' : ' (o projeto usa o 22 no CI; funciona, mas prefira o 22 LTS)'}`,
  );
else fail(`Node ${process.versions.node} é antigo. Instale o Node 22 LTS em nodejs.org.`);

// 2) Git: repositório, endereço e branch
if (git('rev-parse', '--is-inside-work-tree') !== 'true') {
  fail('Esta pasta não é um repositório Git. Clone o projeto pelo GitHub Desktop.');
} else {
  const remote = git('remote', 'get-url', 'origin') ?? '';
  if (remote.toLowerCase().includes(REMOTE_PART.toLowerCase()))
    ok('Repositório ligado ao GitHub certo (origin).');
  else fail(`O "origin" não aponta para ${REMOTE_PART}. Encontrei: ${remote || 'nada'}.`);

  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  if (branch === DEPLOY_BRANCH)
    ok(`Você está na branch do deploy (${DEPLOY_BRANCH}). Cada push aqui atualiza a Hostinger.`);
  else
    warn(
      `Você está na branch "${branch}". A Hostinger só publica a ${DEPLOY_BRANCH}. Para publicar, mude para ela no GitHub Desktop.`,
    );

  git('fetch', '--quiet', 'origin');
  const counts = git('rev-list', '--left-right', '--count', `HEAD...origin/${branch}`);
  if (counts) {
    const [ahead, behind] = counts.split(/\s+/).map(Number);
    if (behind > 0)
      warn(
        `Há ${behind} commit(s) no GitHub que você ainda não baixou. Use "Pull origin" ANTES de mexer.`,
      );
    else ok('Você está com tudo que existe no GitHub.');
    if (ahead > 0) warn(`Você tem ${ahead} commit(s) que ainda não foram enviados (Push origin).`);
  }

  const dirty = git('status', '--porcelain');
  if (dirty)
    warn(
      'Há alterações não commitadas. Isso é normal enquanto você trabalha; antes de trocar de computador, faça commit e push.',
    );
  else ok('Nenhuma alteração solta: tudo está commitado.');

  const ignored = git('check-ignore', '.env.local');
  if (ignored) ok('.env.local está no .gitignore (as chaves não vão para o GitHub).');
  else
    fail(
      '.env.local NÃO está ignorado pelo Git. Não commite chaves! Corrija o .gitignore antes de continuar.',
    );

  const tracked = git('ls-files', '.env', '.env.local', '.env.production');
  if (tracked)
    fail(
      `Há arquivo de chaves rastreado pelo Git: ${tracked}. Remova do Git (git rm --cached) e troque as chaves.`,
    );
}

// 3) Dependências
if (existsSync('node_modules')) ok('Dependências instaladas (node_modules).');
else warn('Rode "npm ci" para instalar as dependências.');

// 4) .env.local — só nomes, nunca valores
const REQUIRED = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const RECOMMENDED = ['NEXT_PUBLIC_SITE_URL', 'GEMINI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
if (!existsSync('.env.local')) {
  fail(
    'Falta o arquivo .env.local. Copie o .env.example para .env.local e preencha com os valores da Hostinger (veja docs/MIGRACAO-LOCAL.md).',
  );
} else {
  const env = {};
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) fail(`Faltam no .env.local: ${missing.join(', ')}.`);
  else ok('Chaves obrigatórias do Supabase presentes.');
  const soft = RECOMMENDED.filter((k) => !env[k]);
  if (soft.length)
    warn(`Opcionais ausentes (algumas telas não funcionam sem elas): ${soft.join(', ')}.`);

  if (
    (env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live') ||
    (env.STRIPE_SECRET_KEY ?? '').startsWith('rk_live')
  ) {
    fail(
      'STRIPE_SECRET_KEY é de PRODUÇÃO (live). No computador use SÓ a chave de TESTE (sk_test…/rk_test…), para não cobrar nem mexer em assinaturas reais.',
    );
  } else if (env.STRIPE_SECRET_KEY) ok('Stripe local está com chave de teste.');
  if (env.STRIPE_WEBHOOK_SECRET && !env.STRIPE_SECRET_KEY?.includes('test'))
    warn(
      'STRIPE_WEBHOOK_SECRET definido sem chave de teste: confira que não é o segredo do webhook de produção.',
    );

  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (url && !/localhost|127\.0\.0\.1/.test(url))
    warn(
      'O app local vai falar com o Supabase REAL (o mesmo do site). O que você fizer logado (criar, apagar, publicar) acontece em produção. Para testar sem risco, use um projeto Supabase de teste.',
    );
}

console.log('\nVerificação do ambiente do Nexa\n');
for (const [tag, msg] of results) console.log(`[${tag}] ${msg}`);
const errors = results.filter(([t]) => t === 'ERRO').length;
console.log(
  errors
    ? `\n${errors} problema(s) para corrigir antes de continuar.`
    : '\nTudo certo para desenvolver. Próximo passo: npm run dev',
);
process.exit(errors ? 1 : 0);
