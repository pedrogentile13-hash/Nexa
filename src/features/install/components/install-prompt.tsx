'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Plus, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DISMISS_COUNT_KEY,
  DISMISS_KEY,
  detectPlatform,
  shouldOffer,
  type InstallPlatform,
} from '../lib/platform';

/**
 * Convite para instalar o Nexa na tela inicial.
 *
 * Existe porque não há APK: enquanto o app não estiver nas lojas, o PWA É a
 * instalação — e uma instalação que ninguém descobre sozinho não acontece. O
 * aluno que só abre o site no navegador nunca tem o ícone, nunca abre em tela
 * cheia e nunca trata o Nexa como app.
 *
 * O que o navegador permite muda tudo:
 *
 *   • Chrome/Android — `beforeinstallprompt` dá um instalador nativo de um
 *     toque. O evento é guardado assim que chega, porque ele só pode ser
 *     disparado dentro de um gesto do usuário depois.
 *   • Safari/iOS — não existe evento nem API. A ÚNICA forma é Compartilhar →
 *     Adicionar à Tela de Início, então aqui se ensina o caminho, com os
 *     mesmos ícones que estão na tela do aparelho.
 *
 * Aparece depois de um tempo de uso, não na primeira tela: pedir instalação a
 * quem ainda não sabe o que o app faz é como pedir o telefone antes do "oi".
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Espera antes de convidar: tempo de o aluno ver o app funcionando. */
const DELAY_MS = 20_000;

export function InstallPrompt() {
  const [platform, setPlatform] = useState<InstallPlatform>('unsupported');
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosSteps, setShowIosSteps] = useState(false);

  const evaluate = useCallback((hasNativePrompt: boolean) => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS não implementa display-mode: standalone; usa esta propriedade.
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    return detectPlatform({
      userAgent: window.navigator.userAgent,
      isStandalone: standalone,
      hasNativePrompt,
    });
  }, []);

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      // Sem isto o Chrome mostra a própria barra e o convite vira dois convites.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setPlatform(evaluate(true));
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    setPlatform(evaluate(false));

    // Instalou por fora (menu do navegador): o convite some na hora.
    function onInstalled() {
      setVisible(false);
      setPlatform('installed');
    }
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [evaluate]);

  useEffect(() => {
    if (platform !== 'prompt' && platform !== 'ios') return;

    let dismissedAt: string | null = null;
    let count = 0;
    try {
      dismissedAt = window.localStorage.getItem(DISMISS_KEY);
      count = Number(window.localStorage.getItem(DISMISS_COUNT_KEY) ?? 0);
    } catch {
      // Armazenamento bloqueado: convida uma vez por sessão, que é o
      // comportamento menos irritante possível sem memória.
    }

    if (!shouldOffer(dismissedAt, count)) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [platform]);

  function dismiss() {
    setVisible(false);
    setShowIosSteps(false);
    try {
      const count = Number(window.localStorage.getItem(DISMISS_COUNT_KEY) ?? 0) + 1;
      window.localStorage.setItem(DISMISS_KEY, new Date().toISOString());
      window.localStorage.setItem(DISMISS_COUNT_KEY, String(count));
    } catch {
      // Sem persistência o convite volta na próxima sessão. Aceitável; o que
      // não seria aceitável é quebrar a tela por causa disso.
    }
  }

  async function install() {
    if (platform === 'ios') {
      setShowIosSteps(true);
      return;
    }
    if (!deferred) return;

    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === 'accepted') setVisible(false);
    else dismiss();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar o Nexa"
      className={cn(
        'pb-safe fixed inset-x-0 bottom-0 z-50 px-4 pb-4',
        // Sobe acima da barra de navegação no celular; no desktop encosta num
        // canto, onde não cobre conteúdo.
        'md:right-4 md:bottom-4 md:left-auto md:w-96 md:px-0',
      )}
      style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + 4rem)' }}
    >
      <div className="border-border bg-surface mx-auto max-w-md rounded-2xl border p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="bg-brand text-brand-fg grid size-11 shrink-0 place-items-center rounded-xl text-lg font-bold"
          >
            N
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Instalar o Nexa no seu celular</p>
            <p className="text-muted mt-0.5 text-sm leading-relaxed">
              {showIosSteps
                ? 'São dois toques, pelo menu de compartilhar do Safari.'
                : 'Abre em tela cheia, direto do ícone — sem passar pelo navegador.'}
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Fechar convite de instalação"
            className="text-muted hover:bg-surface-2 hover:text-text -mt-1 -mr-1 grid size-11 shrink-0 place-items-center rounded-full"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {showIosSteps ? (
          <ol className="mt-3 space-y-2">
            <li className="text-muted flex items-center gap-2.5 text-sm">
              <span className="bg-surface-2 text-text grid size-8 shrink-0 place-items-center rounded-lg">
                <Share className="size-4" aria-hidden />
              </span>
              Toque em <strong className="text-text font-medium">Compartilhar</strong>, na barra de
              baixo
            </li>
            <li className="text-muted flex items-center gap-2.5 text-sm">
              <span className="bg-surface-2 text-text grid size-8 shrink-0 place-items-center rounded-lg">
                <Plus className="size-4" aria-hidden />
              </span>
              Escolha <strong className="text-text font-medium">Adicionar à Tela de Início</strong>
            </li>
          </ol>
        ) : (
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={dismiss}>
              Agora não
            </Button>
            <Button className="flex-1" onClick={() => void install()}>
              <Download aria-hidden />
              Instalar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
