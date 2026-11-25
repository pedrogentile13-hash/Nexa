'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { StudyTopBar } from './study-top-bar';
import { saveProgress } from '../server/actions';
import { useContentTimeTracking } from '../hooks/use-content-time-tracking';
import type { ResourceDetail } from '../server/queries';

/**
 * Leitor de resumo interativo (HTML incorporado pelo admin).
 *
 * O HTML nunca entra no documento principal via `dangerouslySetInnerHTML` —
 * isso rodaria com acesso total a cookies, `localStorage` e ao DOM do resto
 * do app. Em vez disso, um `<iframe sandbox="allow-scripts" srcDoc={...}>`:
 * sem `allow-same-origin`, o conteúdo roda numa origem opaca única — mesmo
 * que tenha JavaScript, não lê cookies/armazenamento do Nexa, não alcança
 * `window.parent` (bloqueado por cross-origin) e não navega a janela
 * principal nem abre popups (nenhum dos dois liberado no `sandbox`). Mesmo
 * padrão usado por CodePen/JSFiddle para embutir HTML de terceiros com
 * segurança.
 *
 * A altura é ajustável via `postMessage` do conteúdo interno — mas isso
 * depende do HTML implementar isso, o que não é garantido (é admin-autoral,
 * não um formato controlado); por isso o fallback é uma altura generosa fixa.
 */
const FALLBACK_HEIGHT = 720;

export function InteractiveReader({ resource }: { resource: ResourceDetail }) {
  useContentTimeTracking(resource.id);
  const [isDone, setIsDone] = useState(Boolean(resource.completedAt));
  const [height, setHeight] = useState(FALLBACK_HEIGHT);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as unknown;
      if (
        data &&
        typeof data === 'object' &&
        'nexaResize' in data &&
        typeof (data as { nexaResize: unknown }).nexaResize === 'number'
      ) {
        setHeight(Math.max(200, Math.round((data as { nexaResize: number }).nexaResize)));
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  function onMarkDone() {
    setIsDone(true);
    void saveProgress(resource.id, 100, null, true);
  }

  return (
    <div style={subjectColorVars(resource.subjectColor)} className="pb-8">
      <StudyTopBar title={resource.subjectName} subtitle={resource.subtitle ?? resource.topicName} />

      <div className="mx-auto max-w-2xl px-5 pt-4">
        <h1 className="text-2xl leading-tight font-semibold tracking-tight">{resource.title}</h1>
        {resource.description && (
          <p className="text-muted mt-2 text-sm leading-relaxed">{resource.description}</p>
        )}

        <iframe
          ref={iframeRef}
          title={resource.title}
          srcDoc={resource.body ?? ''}
          sandbox="allow-scripts"
          className="border-border mt-6 w-full rounded-2xl border"
          style={{ height }}
        />

        <div className="mt-6">
          {isDone ? (
            <p className="bg-success-soft text-success flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium">
              <Check className="size-4" aria-hidden />
              Concluído
            </p>
          ) : (
            <Button size="lg" className="w-full" onClick={onMarkDone}>
              <Check aria-hidden />
              Marcar como concluído
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
