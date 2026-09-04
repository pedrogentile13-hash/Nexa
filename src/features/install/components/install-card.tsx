'use client';

import { useEffect, useState } from 'react';
import { Download, Share, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { detectPlatform, type InstallPlatform } from '../lib/platform';

/**
 * A mesma instalação, oferecida de propósito no Perfil.
 *
 * O banner aparece uma vez e some. Quem recusou naquele momento — e depois
 * quis — precisa de um lugar previsível para procurar, e "Perfil" é onde as
 * pessoas procuram. Sem isto, recusar o banner seria uma porta que se fecha
 * para sempre.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallCard() {
  const [platform, setPlatform] = useState<InstallPlatform>('unsupported');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    function check(hasNativePrompt: boolean) {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setPlatform(
        detectPlatform({
          userAgent: window.navigator.userAgent,
          isStandalone: standalone,
          hasNativePrompt,
        }),
      );
    }

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      check(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    check(false);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (platform === 'installed') {
    return (
      <p className="text-muted flex items-center gap-2 px-1 text-sm">
        <Smartphone className="size-4 shrink-0" aria-hidden />O Nexa já está instalado neste
        aparelho.
      </p>
    );
  }

  if (platform === 'unsupported') return null;

  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <p className="text-sm font-semibold">Instalar no aparelho</p>
      <p className="text-muted mt-0.5 text-sm leading-relaxed">
        Abre em tela cheia, com ícone próprio — sem barra de navegador ocupando o topo.
      </p>

      {platform === 'ios' && showSteps ? (
        <ol className="mt-3 space-y-2">
          <li className="text-muted flex items-center gap-2.5 text-sm">
            <span className="bg-surface-2 text-text grid size-8 shrink-0 place-items-center rounded-lg">
              <Share className="size-4" aria-hidden />
            </span>
            Toque em <strong className="text-text font-medium">Compartilhar</strong>
          </li>
          <li className="text-muted flex items-center gap-2.5 text-sm">
            <span className="bg-surface-2 text-text grid size-8 shrink-0 place-items-center rounded-lg">
              <Plus className="size-4" aria-hidden />
            </span>
            Escolha <strong className="text-text font-medium">Adicionar à Tela de Início</strong>
          </li>
        </ol>
      ) : (
        <Button
          className="mt-3"
          onClick={() => {
            if (platform === 'ios') {
              setShowSteps(true);
              return;
            }
            void (async () => {
              if (!deferred) return;
              await deferred.prompt();
              await deferred.userChoice;
              setDeferred(null);
            })();
          }}
        >
          <Download aria-hidden />
          {platform === 'ios' ? 'Ver como instalar' : 'Instalar o Nexa'}
        </Button>
      )}
    </div>
  );
}
