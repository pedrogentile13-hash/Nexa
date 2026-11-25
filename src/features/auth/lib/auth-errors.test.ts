import { describe, expect, it } from 'vitest';
import { authErrorMessage, isConfigurationError } from './auth-errors';
import { parseAuthMode } from '../schemas';

describe('authErrorMessage', () => {
  it('nomeia credenciais inválidas pelo código', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', status: 400 })).toMatch(
      /senha incorret/i,
    );
  });

  it('reconhece e-mail já cadastrado por código e por texto', () => {
    expect(authErrorMessage({ code: 'user_already_exists' })).toMatch(/já tem conta/i);
    expect(authErrorMessage({ message: 'User already registered' })).toMatch(/já tem conta/i);
  });

  it('explica a falha de envio de e-mail, que é o travamento mais comum de projeto novo', () => {
    const message = authErrorMessage({ message: 'Error sending confirmation email' });
    expect(message).toMatch(/SMTP|e-mail e senha/i);
  });

  it('trata 429 sem código como limite de tentativas', () => {
    expect(authErrorMessage({ status: 429, message: 'boom' })).toMatch(/muitas tentativas/i);
  });

  it('diz que a confirmação de e-mail está pendente', () => {
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toMatch(/confirme seu e-mail/i);
  });

  it('cai num texto acionável quando não reconhece nada', () => {
    expect(authErrorMessage({ message: 'algo totalmente novo' })).toMatch(/tente novamente/i);
    expect(authErrorMessage(null)).toMatch(/tente novamente/i);
  });

  it('nunca devolve string vazia', () => {
    for (const error of [{}, { code: 'inexistente' }, { status: 500 }, undefined]) {
      expect(authErrorMessage(error).length).toBeGreaterThan(0);
    }
  });
});

describe('isConfigurationError', () => {
  it('separa erro de configuração de erro do aluno', () => {
    expect(isConfigurationError({ code: 'signup_disabled' })).toBe(true);
    expect(isConfigurationError({ message: 'Error sending magic link email' })).toBe(true);
    expect(isConfigurationError({ code: 'invalid_credentials' })).toBe(false);
    expect(isConfigurationError(null)).toBe(false);
  });
});

describe('parseAuthMode', () => {
  it('aceita os três modos conhecidos', () => {
    expect(parseAuthMode('signin')).toBe('signin');
    expect(parseAuthMode('signup')).toBe('signup');
    expect(parseAuthMode('magic')).toBe('magic');
  });

  it('cai em signin para qualquer coisa fora da lista', () => {
    // O modo vem de um campo do formulário: é entrada do cliente, e o padrão
    // seguro é o caminho que não cria nada.
    expect(parseAuthMode('admin')).toBe('signin');
    expect(parseAuthMode('')).toBe('signin');
    expect(parseAuthMode(null)).toBe('signin');
  });
});

describe('schemas de auth', () => {
  it('exige 8 caracteres para criar conta', async () => {
    const { signUpSchema } = await import('../schemas');
    expect(signUpSchema.safeParse({ email: 'a@b.com', password: '1234567' }).success).toBe(false);
    expect(signUpSchema.safeParse({ email: 'a@b.com', password: '12345678' }).success).toBe(true);
  });

  it('não impõe tamanho ao entrar — a senha antiga pode ser mais curta', async () => {
    const { signInSchema } = await import('../schemas');
    expect(signInSchema.safeParse({ email: 'a@b.com', password: '123' }).success).toBe(true);
    expect(signInSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });

  it('normaliza o e-mail para minúsculas em todos os modos', async () => {
    const { signUpSchema, signInSchema, magicLinkSchema } = await import('../schemas');
    for (const schema of [signUpSchema, signInSchema]) {
      const parsed = schema.parse({ email: '  Aluno@Escola.COM.BR ', password: 'senha1234' });
      expect(parsed.email).toBe('aluno@escola.com.br');
    }
    expect(magicLinkSchema.parse({ email: ' A@B.com ' }).email).toBe('a@b.com');
  });

  it('barra a senha acima do teto do bcrypt em vez de truncar em silêncio', async () => {
    const { signUpSchema } = await import('../schemas');
    expect(signUpSchema.safeParse({ email: 'a@b.com', password: 'x'.repeat(73) }).success).toBe(
      false,
    );
  });
});
