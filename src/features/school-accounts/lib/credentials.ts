/**
 * Login e senha das contas criadas pela escola.
 *
 * Em módulo puro para ser testado: um erro aqui ou cria logins que colidem,
 * ou gera senha previsível, ou fabrica um e-mail que não bate com o que o
 * login usa depois.
 */

export const LOGIN_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/;

/** Igual à `check` da coluna `profiles.school_login`. */
export function isValidLogin(login: string): boolean {
  return LOGIN_PATTERN.test(login);
}

/** Tira acento, minúscula, e troca o que não é permitido por ponto. */
export function normalizeLogin(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 30);
}

const PARTICLES = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/** "Ana Clara da Silva" → "ana.silva". Só uma sugestão; a coordenação pode editar. */
export function suggestLogin(fullName: string): string {
  const parts = normalizeLogin(fullName.replace(/\s+/g, ' '))
    .split('.')
    .filter((p) => p && !PARTICLES.has(p));
  if (parts.length === 0) return '';
  const first = parts[0]!;
  const last = parts.length > 1 ? parts[parts.length - 1]! : '';
  return normalizeLogin(last ? `${first}.${last}` : first);
}

/**
 * O e-mail fabricado que o Supabase Auth exige. Usa o endereço da PRÓPRIA
 * escola como domínio: nunca recebe nada, e como o domínio é nosso, ninguém
 * mais consegue cadastrar esse e-mail "de verdade".
 */
export function loginToEmail(login: string, schoolHost: string): string {
  return `${login}@${schoolHost.toLowerCase()}`;
}

/** Sem 0/O/1/l/I: a senha é lida de um papel e digitada num celular. */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/**
 * Senha aleatória no formato `xxxx-xxxx` (8 caracteres, ~39 bits).
 * `random` devolve bytes aleatórios — injetável para teste; o padrão usa o
 * gerador criptográfico. Rejeita bytes acima do múltiplo do alfabeto para não
 * enviesar a distribuição (viés de módulo).
 */
export function generatePassword(
  random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n)),
): string {
  const limit = 256 - (256 % ALPHABET.length);
  const chars: string[] = [];
  while (chars.length < 8) {
    for (const byte of random(16)) {
      if (byte >= limit) continue;
      chars.push(ALPHABET[byte % ALPHABET.length]!);
      if (chars.length === 8) break;
    }
  }
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

/** Normaliza o que o aluno digita no campo de login (sem exigir minúsculas). */
export function cleanTypedLogin(raw: string): string {
  return raw.trim().toLowerCase();
}
