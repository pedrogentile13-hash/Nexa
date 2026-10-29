'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, Trash2, X } from 'lucide-react';
import { StaffChatPanel } from './staff-chat-panel';

const SUGGESTIONS = [
  'Monte um plano de aula de 50 minutos sobre…',
  'Escreva um comunicado curto para os responsáveis sobre…',
  'Crie 5 questões de múltipla escolha sobre…',
  'Como acompanho os alunos que estão com baixo desempenho?',
];

/** Balão da NexaAI nos painéis da equipe: chat rápido em qualquer tela (a página "IA" tem o completo). */
export function StaffChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [hasMessages, setHasMessages] = useState(false);
  const [clearSignal, setClearSignal] = useState(0);

  // Na página da IA o chat já é a tela inteira.
  if (pathname === '/escola/ia') return null;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="NexaAI do painel"
          className="border-border bg-surface fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+9.5rem)] z-50 flex h-[min(36rem,calc(100dvh-12rem))] w-[min(26rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border shadow-2xl md:bottom-24"
        >
          <header className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: 'var(--gradient-header)' }}>
            <Sparkles className="size-4" aria-hidden />
            <p className="flex-1 text-sm font-semibold">NexaAI do painel</p>
            {hasMessages && (
              <button type="button" onClick={() => setClearSignal((n) => n + 1)} aria-label="Nova conversa" className="grid size-8 place-items-center rounded-full hover:bg-white/15">
                <Trash2 className="size-4" aria-hidden />
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="grid size-8 place-items-center rounded-full hover:bg-white/15">
              <X className="size-4" aria-hidden />
            </button>
          </header>
          <StaffChatPanel
            className="flex-1"
            value={text}
            onChange={setText}
            suggestions={SUGGESTIONS}
            intro="Planejamento, materiais, simulados, comunicados e turmas. Sobre o que vamos falar?"
            onState={setHasMessages}
            clearSignal={clearSignal}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Fechar NexaAI' : 'Abrir NexaAI do painel'}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 grid size-14 place-items-center rounded-full text-white shadow-lg md:right-6 md:bottom-6"
        style={{ background: 'var(--gradient-header)' }}
      >
        <Sparkles className="size-6" aria-hidden />
      </button>
    </>
  );
}
