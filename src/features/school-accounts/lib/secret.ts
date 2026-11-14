import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Cifra a senha de uma conta da escola para guardá-la e mostrá-la de novo à
 * coordenação. AES-256-GCM: o formato é `v1.<iv>.<tag>.<texto>` em base64url.
 * A chave vem de `SCHOOL_PASSWORD_KEY` (ou, se não existir, da chave de serviço
 * do Supabase, que já só existe no servidor).
 */

const toKey = (secret: string) => createHash('sha256').update(`nexa-school-password:${secret}`).digest();

export function sealPassword(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', toKey(secret), iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), body.toString('base64url')].join('.');
}

/** `null` se o formato estiver errado, a chave for outra ou o texto tiver sido adulterado. */
export function openPassword(sealed: string, secret: string): string | null {
  const [version, iv, tag, body] = sealed.split('.');
  if (version !== 'v1' || !iv || !tag || !body) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', toKey(secret), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(body, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function passwordSecret(): string | null {
  return process.env.SCHOOL_PASSWORD_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}
