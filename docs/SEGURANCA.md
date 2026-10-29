# Segurança do Nexa — resumo para a escola

Documento de apoio à apresentação. O que o app faz hoje, o que falta confirmar do lado da hospedagem e do Supabase, e o que dizer à escola.

## 1. O que já está protegido (no código)

**Contas e acesso**
- Aluno e professor do endereço da escola entram **só com login e senha criados pela coordenação** (sem Google, sem e-mail, sem "esqueci a senha").
- Quem não foi criado pelo painel da escola **não entra** no endereço dela, e não consegue se colocar sozinho numa escola com endereço próprio.
- **Freio de tentativas** no login: 8 erros por pessoa e aparelho a cada 10 minutos, depois espera.
- Senhas das contas da escola ficam **cifradas** (AES-256-GCM); só direção, coordenação e admin as veem, e só da própria escola. A senha da coordenação/direção só o admin geral vê.

**Dados (Supabase)**
- **Todas as tabelas têm RLS** (cada pessoa só lê o que é dela ou do que a regra permite). Conferido por teste.
- **XP e notificações não podem ser forjados:** dar XP, avisar outra pessoa e ler a fila de revisão ou os tipos de erro de OUTRO aluno estavam abertos a qualquer aluno logado; agora só o próprio app (com tetos) e quem tem permissão sobre o aluno.
- Funções do banco **só executam para quem está logado**; visitante sem login só descobre a qual escola um endereço pertence.
- Direção, coordenação e professores **não leem** os resumos e simulados que um aluno criou com a IA. Só o dono; para a escola ver, a coordenação aprova a publicação.
- Material de estudo do aluno (PDFs, fotos, textos) é **privado do aluno**.
- Apagar conta e exportar os próprios dados existem (LGPD).

**Navegação**
- Cabeçalhos de segurança em todas as páginas: não pode ser embutido em outro site, tipo de arquivo travado, só HTTPS, câmera/microfone/GPS desligados.
- Política de conteúdo (CSP): parte obrigatória ligada; a parte que restringe scripts e conexões está em modo "só relatar" até validar sem violações.
- Dependências atualizadas (Next.js 15.5.28 sem falha crítica conhecida; zod corrigido).

**IA**
- Limite diário de uso por aluno e recurso. Arquivos limitados a PDF/imagem/texto, até 6 MB cada.
- A IA do material responde só com o que está no material; dicas de simulado não entregam a resposta.

## 2. O que VOCÊ precisa conferir (fora do código)

**Supabase (Authentication)**
- [ ] *Leaked password protection* ligado (Auth → Policies).
- [ ] Senha mínima de 8+ caracteres.
- [ ] **Rate limits** de Auth no padrão ou mais baixo.
- [ ] Confirmação de e-mail ligada para cadastros comuns.
- [ ] URLs de redirecionamento só com os seus domínios (`nexastudy.com.br` e `*.nexastudy.com.br`).
- [ ] **Backups** diários ligados (plano Pro) ou export semanal manual.
- [ ] Sua conta de admin com **verificação em duas etapas** (Supabase, GitHub, Hostinger, Gemini).

**Hostinger / domínio**
- [ ] HTTPS forçado no domínio e nos subdomínios.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` só no servidor (nunca em chat, nunca no repositório).
- [ ] Chave do Gemini **girada** (a que foi colada no chat antes).
- [ ] Cloudflare na frente (já usa DNS): ligar "Bot Fight Mode" e uma regra de limite de requisições em `/login`.

**LGPD (menores de idade)**
- [ ] Contrato/termo com a escola: a **escola é a controladora** dos dados dos alunos; o Nexa é operador.
- [ ] Política de privacidade e termos de uso revisados por alguém jurídico antes de abrir a todos.
- [ ] Decidir o consentimento do responsável no cadastro das contas da escola (hoje é opcional).

## 3. Pontos honestos para a apresentação
- É um piloto: o SQL de segurança precisa estar aplicado e o deploy atualizado antes de apresentar.
- A política de conteúdo completa ainda está em "relatar"; vira obrigatória depois de uma rodada de testes sem violações.
- Senhas visíveis para a coordenação são uma escolha de usabilidade da escola (repassar ao aluno); alternativa mais rígida é só "gerar nova senha".
