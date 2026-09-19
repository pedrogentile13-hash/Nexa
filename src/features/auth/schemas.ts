import { z } from 'zod';

/** Validado na fronteira da Server Action, antes de qualquer coisa chegar ao Supabase. */

const email = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .email('Esse e-mail não parece válido.')
  .toLowerCase();

/** Para onde ir depois de entrar. Só caminhos relativos — veja `safe-next.ts`. */
const next = z.string().optional();

export const magicLinkSchema = z.object({ email, next });

/** Confirmação do código de 8 dígitos que acompanha o link mágico no e-mail. */
export const verifyCodeSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .length(8, 'O código tem 8 dígitos.')
    .regex(/^\d{8}$/, 'O código só tem números.'),
  next,
});

/** Pedido de recuperação: só o e-mail. */
export const recoverSchema = z.object({ email });

/**
 * Nova senha, com confirmação.
 *
 * A confirmação existe porque aqui o aluno não tem como descobrir o erro
 * depois: ele digita uma senha, o campo esconde o que foi digitado, e um
 * deslize deixa a conta trancada com uma senha que ninguém conhece.
 */
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'A senha precisa de pelo menos 8 caracteres.')
      .max(72, 'A senha pode ter no máximo 72 caracteres.'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As duas senhas precisam ser iguais.',
    path: ['confirm'],
  });

/**
 * Criar conta exige 8 caracteres. O mínimo do Supabase é 6, mas quem escolhe a
 * senha aqui é um aluno no celular: 6 caracteres é a senha do Wi-Fi da escola.
 * O teto de 72 é do bcrypt — acima disso o resto é silenciosamente ignorado, e
 * uma senha truncada sem aviso é pior que uma rejeitada.
 */
export const signUpSchema = z.object({
  email,
  password: z
    .string()
    .min(8, 'A senha precisa de pelo menos 8 caracteres.')
    .max(72, 'A senha pode ter no máximo 72 caracteres.'),
  next,
});

/**
 * Entrar não valida tamanho: a senha já existe, e recusar localmente uma senha
 * curta criada antes desta regra deixaria o aluno preso do lado de fora.
 */
export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
  next,
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

/** Qual formulário o aluno está usando. Um só Server Action atende os três. */
export const AUTH_MODES = ['signin', 'signup', 'magic'] as const;
export type AuthMode = (typeof AUTH_MODES)[number];

export function parseAuthMode(value: FormDataEntryValue | null): AuthMode {
  const mode = typeof value === 'string' ? value : '';
  return (AUTH_MODES as readonly string[]).includes(mode) ? (mode as AuthMode) : 'signin';
}

/**
 * Forma devolvida por toda Server Action de auth, para o formulário renderizar
 * de um jeito só. `campo` existe para o erro aparecer colado no input certo.
 */
export type AuthFormState =
  | { status: 'idle' }
  /** Link de recuperação de senha enviado. */
  | { status: 'sent'; email: string }
  /** Link mágico enviado — o e-mail também traz um código de 8 dígitos para digitar aqui. */
  | { status: 'code'; email: string }
  /** Conta criada, mas o projeto exige confirmação por e-mail antes de entrar. */
  | { status: 'confirm'; email: string }
  | { status: 'error'; message: string; mode?: AuthMode; field?: 'email' | 'password' | 'code' };
