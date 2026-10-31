import type { CapacitorConfig } from '@capacitor/cli';

/**
 * App Android do Nexa Study.
 *
 * O app carrega o Nexa publicado (o mesmo código do site) dentro de uma janela nativa — por isso as
 * telas, o banco, a IA e os planos são os de sempre, e uma correção no site chega ao app sem nova versão na loja.
 * `NEXA_APP_URL` aponta para o endereço do Nexa padrão; o aluno de escola entra pelo "Entrar pela escola"
 * (a janela navega para o endereço da escola, liberado em `allowNavigation`).
 *
 * `mobile/www` é só a tela de "sem conexão": o Capacitor exige uma pasta de arquivos locais.
 */
const url = process.env.NEXA_APP_URL ?? 'https://nexastudy.com.br';
const root = new URL(url).hostname.replace(/^www\./, '');

const config: CapacitorConfig = {
  appId: 'br.com.nexastudy.app',
  appName: 'Nexa Study',
  webDir: 'mobile/www',
  server: {
    url,
    cleartext: false,
    androidScheme: 'https',
    // O Nexa padrão e qualquer escola (anglomorumbi.nexastudy.com.br…). Links para outros sites abrem no navegador.
    allowNavigation: [root, `*.${root}`],
  },
  android: {
    allowMixedContent: false,
    // Em produção a janela não pode ser inspecionada por fora.
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, backgroundColor: '#7c3aed', showSpinner: false },
    StatusBar: { style: 'DARK', backgroundColor: '#7c3aed' },
  },
};

export default config;
