/**
 * Traduz a falha do Supabase para uma frase que o aluno consegue agir.
 *
 * A versão anterior colapsava tudo em "não consegui agora, tente de novo".
 * Isso é o pior tipo de mensagem: some com a causa justamente quando ela é a
 * única coisa que resolveria o problema. Um e-mail que não chega porque o SMTP
 * padrão do projeto está no limite e uma senha errada exigem ações opostas do
 * aluno — e nenhuma delas é "tentar de novo".
 *
 * Puro de propósito: dá para testar cada caso sem subir servidor nenhum.
 */

/** O mínimo que precisamos de um erro do Supabase — não amarra a versão do SDK. */
export interface AuthErrorLike {
  code?: string;
  status?: number;
  message?: string;
}

const BY_CODE = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar. O link está na sua caixa de entrada.',
  user_already_exists: 'Esse e-mail já tem conta. Entre em vez de criar.',
  email_exists: 'Esse e-mail já tem conta. Entre em vez de criar.',
  weak_password: 'Senha muito fraca. Use pelo menos 8 caracteres.',
  over_email_send_rate_limit:
    'O envio de e-mails deste projeto atingiu o limite. Espere alguns minutos ou entre com e-mail e senha.',
  over_request_rate_limit: 'Muitas tentativas. Espere um minuto e tente de novo.',
  signup_disabled: 'A criação de contas está desativada no projeto Supabase.',
  email_provider_disabled: 'O login por e-mail está desativado no projeto Supabase.',
  provider_disabled: 'Esse provedor de login não está habilitado no projeto Supabase.',
  validation_failed: 'Dados inválidos. Confira o e-mail e a senha.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  otp_expired: 'Esse link expirou. Peça um novo.',
} as const;

/**
 * Alguns erros de configuração chegam só como texto, sem `code` — normalmente
 * os que vêm do provedor de e-mail. São exatamente os que travam um projeto
 * recém-criado, então vale reconhecê-los pelo conteúdo.
 */
const BY_MESSAGE: Array<[RegExp, string]> = [
  [
    /error sending (confirmation|magic link|recovery)? ?e-?mail/i,
    'O Supabase não conseguiu enviar o e-mail. Verifique o SMTP do projeto — ou crie a conta com e-mail e senha.',
  ],
  [
    /rate limit|too many requests/i,
    'Limite de envios atingido. Espere alguns minutos ou entre com e-mail e senha.',
  ],
  [/already registered|already exists/i, 'Esse e-mail já tem conta. Entre em vez de criar.'],
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/password should be at least/i, 'Senha muito curta. Use pelo menos 8 caracteres.'],
  [
    /signups? not allowed|signup is disabled/i,
    'A criação de contas está desativada no projeto Supabase.',
  ],
  [
    /redirect|not allowed for this url/i,
    'Este endereço não está na lista de redirect URLs do Supabase.',
  ],
];

const FALLBACK = 'Não consegui concluir agora. Tente novamente em instantes.';

export function authErrorMessage(error: AuthErrorLike | null | undefined): string {
  if (!error) return FALLBACK;

  // Indexação por chave vinda da rede: o valor pode não existir no mapa.
  const byCode = error.code
    ? (BY_CODE as Record<string, string | undefined>)[error.code]
    : undefined;
  if (byCode) return byCode;

  const message = error.message ?? '';
  for (const [pattern, text] of BY_MESSAGE) {
    if (pattern.test(message)) return text;
  }

  // 429 sem código nomeado ainda é limite de tentativas — a ação é esperar.
  if (error.status === 429) return BY_CODE.over_request_rate_limit;
  if (error.status === 400 && /credential/i.test(message)) return BY_CODE.invalid_credentials;

  return FALLBACK;
}

/** O erro aponta para configuração do projeto, não para algo que o aluno digitou? */
export function isConfigurationError(error: AuthErrorLike | null | undefined): boolean {
  if (!error) return false;
  const code = error.code ?? '';
  if (['signup_disabled', 'email_provider_disabled', 'provider_disabled'].includes(code)) {
    return true;
  }
  return /error sending|smtp|not allowed for this url|signups? not allowed/i.test(
    error.message ?? '',
  );
}
