# Nexa Study — app Android (Google Play)

O app é um **Capacitor**: uma janela nativa que abre o Nexa publicado (`https://nexastudy.com.br`). Telas, banco, IA e planos são os do site; uma correção no site chega ao app sem nova versão na loja.
Pacote: `br.com.nexastudy.app` (não muda depois de publicar). Android mínimo 7.0 (API 24), alvo API 36.

## O que já está pronto no repositório
- Projeto Android em `android/` (ícone, splash, nome, `allowBackup` desligado, sem tráfego sem HTTPS).
- `capacitor.config.ts`: endereço do app, navegação liberada só para `nexastudy.com.br` e `*.nexastudy.com.br` (escolas). Para apontar para outro ambiente: `NEXA_APP_URL=https://... npm run app:sync`.
- **Entrar pela escola** (`/entrar-pela-escola`): o aluno digita o código da escola (ex.: `anglomorumbi`) e o app abre o ambiente dela, sem anúncio e sem plano.
- No app: o banner do AdSense e o botão de assinar pelo Stripe **ficam escondidos** (regras da Play). Quem assina no site tem o plano valendo no app.
- `public/app-ads.txt` (exigido pelo AdMob).

## O que ainda NÃO está (próximas etapas)
1. **AdMob** (anúncios do plano grátis): plugin + ID do app + blocos. Mesma regra: nunca em prova/quiz/revisão e nunca em escola.
2. **Google Play Billing** para assinar dentro do app (RevenueCat recomendado: junta Play + Stripe e avisa o Nexa pelo webhook).
3. **Push nativo** (hoje o push é web-push, que não vale no app).

## Gerar o app (no seu computador)
Precisa do **Android Studio** (traz o Java e o SDK).
1. `npm install` e `npm run app:sync`
2. `npm run app:open` → abre no Android Studio. Espere o Gradle terminar.
3. Teste em um celular (USB, depuração ligada) ou no emulador: **Run ▶**.
4. **Chave de assinatura (guarde em lugar seguro, nunca no repositório):** Build → Generate Signed App Bundle → Android App Bundle → Create new keystore. Anote senha e alias. **Se perder esta chave, não dá para atualizar o app.** Ative o *Play App Signing* no Play Console (o Google guarda a chave final e você assina só o envio).
5. O arquivo gerado é `app-release.aab` — é ele que sobe na Play.
6. Em cada nova versão, aumente `versionCode` (e `versionName`) em `android/app/build.gradle`.

## Play Console — passo a passo
1. Criar app: nome "Nexa Study", idioma Português (Brasil), tipo App, gratuito.
2. **Conteúdo do app** (todas as declarações):
   - Política de privacidade: `https://nexastudy.com.br/politica-de-privacidade`
   - Público-alvo: **13 anos ou mais** (evita as regras de apps infantis/Families, que restringem anúncios e coleta).
   - Anúncios: **sim** (AdSense não, AdMob sim — declare quando ligar).
   - Segurança dos dados (formulário): coleta nome, e-mail, ID da conta, atividade no app (progresso, erros), conteúdo enviado pelo usuário (textos, fotos, PDFs), diagnóstico (erros). Dados criptografados em trânsito (HTTPS). Usuário pode pedir exclusão. Compartilhamento com provedores (hospedagem, IA, pagamento, anúncios).
   - Classificação de conteúdo: questionário (educacional, sem violência/sexo/jogo).
   - Conta de teste para a revisão: crie um aluno de teste e informe login/senha em "Acesso ao app".
3. **Teste interno** (até 100 pessoas, liberado em minutos): suba o `.aab` e convide e-mails.
4. **Teste fechado — obrigatório para conta pessoal nova:** **12 testadores por 14 dias seguidos** antes de pedir produção. Comece a juntar os testadores agora; eles precisam aceitar o convite e manter o app instalado.
5. **Produção:** depois dos 14 dias, "Solicitar acesso à produção" e publique. A primeira análise do Google pode levar alguns dias.

## Regras da loja que importam para o Nexa
- **Assinatura dentro do app = Google Play Billing.** Vender por fora (Stripe) dentro do app pode derrubar o app. Por isso a tela Nexa Pro do app só mostra o plano até o Play Billing entrar.
- **AdSense não é permitido em aplicativo**; no app o anúncio é o AdMob.
- O app precisa de função própria além de "abrir o site" (AdMob, push nativo e cobrança nativa cumprem isso).
- **Escola:** o app não tem anúncio nem cobrança no ambiente da escola. Mantenha assim.
