'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Bot, Clock, Loader2, Send, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { askTeacherBot, type AskState } from '../server/actions';
import type { ChatMessage } from '../server/queries';

const INITIAL: AskState = { status: 'idle' };

const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="shrink-0">
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
      <span className="sr-only">Enviar</span>
    </Button>
  );
}

/**
 * Conversa do aluno com o bot de UM professor.
 *
 * Deixa claro de onde vem cada resposta: "resposta cadastrada pelo professor"
 * (o bot só repete o que ele escreveu), "o professor respondeu" ou "aguardando
 * o professor". Nunca finge ser uma inteligência artificial que sabe tudo.
 */
export function TeacherChat({
  teacherId,
  teacherName,
  messages,
}: {
  teacherId: string;
  teacherName: string;
  messages: ChatMessage[];
}) {
  const [state, action] = useActionState(askTeacherBot, INITIAL);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    if (state.status === 'sent' && inputRef.current) inputRef.current.value = '';
  }, [state]);

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex-1 space-y-3 pb-4">
        <div className="bg-brand-soft text-brand-text rounded-2xl p-4 text-sm">
          <p className="font-semibold">Assistente de {teacherName}</p>
          <p className="mt-0.5 text-xs opacity-80">
            Responde com o que o professor já cadastrou (datas, regras, materiais). Se não souber, avisa o
            professor e a resposta chega aqui.
          </p>
        </div>

        {messages.map((m) => (
          <Bubble key={m.id} message={m} teacherName={teacherName} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form action={action} className="border-border bg-bg/90 pb-safe sticky bottom-0 border-t pt-3">
        <input type="hidden" name="teacherId" value={teacherId} />
        {state.status === 'error' && (
          <p role="alert" className="text-danger mb-2 text-sm">
            {state.message}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            name="question"
            placeholder="Pergunte sobre a matéria, prazos, provas…"
            autoComplete="off"
            required
            maxLength={1000}
          />
          <SendButton />
        </div>
      </form>
    </div>
  );
}

function Bubble({ message, teacherName }: { message: ChatMessage; teacherName: string }) {
  const mine = message.sender === 'student';
  const waiting = message.sender === 'bot' && message.status === 'unanswered';

  return (
    <div className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      {!mine && (
        <span className="text-subtle mb-0.5 flex items-center gap-1 px-1 text-[11px] font-medium">
          {message.sender === 'teacher' ? (
            <>
              <UserRound className="size-3" aria-hidden /> {teacherName} respondeu
            </>
          ) : waiting ? (
            <>
              <Clock className="size-3" aria-hidden /> Aguardando o professor
            </>
          ) : (
            <>
              <Bot className="size-3" aria-hidden /> Resposta cadastrada pelo professor
            </>
          )}
        </span>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          mine
            ? 'bg-brand text-brand-fg rounded-br-sm'
            : message.sender === 'teacher'
              ? 'bg-success-soft text-text rounded-bl-sm'
              : 'bg-surface-2 text-text rounded-bl-sm',
        )}
      >
        {message.content}
      </div>
      <span className="text-subtle mt-0.5 px-1 text-[10px]">{timeFmt.format(new Date(message.createdAt))}</span>
    </div>
  );
}
