'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowUpRight, Sparkles, Trash2 } from 'lucide-react';
import type { QuickAction } from '../lib/quick-actions';
import { StaffChatPanel } from './staff-chat-panel';

/** Página "IA" do portal: atalhos do perfil à esquerda, conversa à direita (embaixo no celular). */
export function IaWorkspace({ actions, intro }: { actions: QuickAction[]; intro: string }) {
  const [text, setText] = useState('');
  const [hasMessages, setHasMessages] = useState(false);
  const [clearSignal, setClearSignal] = useState(0);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <section aria-label="Atalhos" className="order-2 lg:order-1">
        <h2 className="mb-3 text-base font-semibold tracking-tight">Atalhos para o seu trabalho</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {actions.map((a) => (
            <li key={a.id} className="bg-surface border-border flex flex-col rounded-3xl border p-4 shadow-sm">
              <button type="button" onClick={() => setText(a.prompt)} className="text-left">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="text-brand size-4 shrink-0" aria-hidden /> {a.title}
                </span>
                <span className="text-muted mt-1 block text-xs">{a.hint}</span>
              </button>
              {a.tool && (
                <Link href={a.tool.href as Route} className="text-brand-text mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                  {a.tool.label} <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Conversa" className="bg-surface border-border order-1 flex h-[min(38rem,calc(100dvh-14rem))] min-h-[28rem] flex-col overflow-hidden rounded-3xl border shadow-sm lg:sticky lg:top-6 lg:order-2">
        <header className="flex items-center gap-2 px-5 py-3 text-white" style={{ background: 'var(--gradient-header)' }}>
          <Sparkles className="size-4" aria-hidden />
          <p className="flex-1 text-sm font-semibold">Conversa</p>
          {hasMessages && (
            <button type="button" onClick={() => setClearSignal((n) => n + 1)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-white/15">
              <Trash2 className="size-3.5" aria-hidden /> Nova conversa
            </button>
          )}
        </header>
        <StaffChatPanel className="flex-1" value={text} onChange={setText} suggestions={[]} intro={intro} onState={setHasMessages} clearSignal={clearSignal} />
      </section>
    </div>
  );
}
