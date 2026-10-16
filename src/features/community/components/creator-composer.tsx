'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Segmented } from '@/components/ui/segmented';
import { generateAndSaveCreatorQuiz, generateAndSaveCreatorSummary } from '../server/creator-actions';
import type { CreatorGenerateState } from '../server/creator-actions';
import type { CreatorSubjectOption } from '../server/creator-queries';

const INITIAL: CreatorGenerateState = { status: 'idle' };

function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          Gerando…
        </>
      ) : (
        <>
          <Sparkles aria-hidden />
          Gerar com IA
        </>
      )}
    </Button>
  );
}

function SubjectSelect({ subjects }: { subjects: CreatorSubjectOption[] }) {
  return (
    <div>
      <Label htmlFor="subjectCatalogId">Matéria</Label>
      <select
        id="subjectCatalogId"
        name="subjectCatalogId"
        required
        defaultValue=""
        className="border-border bg-surface text-text h-11 w-full rounded-md border px-3 text-sm outline-none"
      >
        <option value="" disabled>
          Escolha a matéria
        </option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Gera E já salva de uma vez (fica privado até o aluno compartilhar) — ver o
 * porquê no cabeçalho de `creator-actions.ts`. As duas Server Actions
 * (quiz/resumo) usam `useActionState` separados porque têm campos diferentes;
 * qual formulário está visível é só estado local (`kind`).
 */
export function CreatorComposer({
  subjects,
  onCreated,
}: {
  subjects: CreatorSubjectOption[];
  onCreated: () => void;
}) {
  const [kind, setKind] = useState<'quiz' | 'resumo'>('quiz');
  const [quizState, quizAction] = useActionState(generateAndSaveCreatorQuiz, INITIAL);
  const [summaryState, summaryAction] = useActionState(generateAndSaveCreatorSummary, INITIAL);

  const state = kind === 'quiz' ? quizState : summaryState;

  useEffect(() => {
    if (state.status === 'ok') onCreated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="border-border bg-surface space-y-4 rounded-2xl border p-4">
      <div>
        <h2 className="text-base font-semibold">Criar com IA</h2>
        <p className="text-muted text-sm">
          Peça um quiz ou um resumo sobre qualquer tema. Nasce só seu — você decide depois se
          compartilha.
        </p>
      </div>

      <Segmented
        label="Tipo de conteúdo"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'quiz', label: 'Quiz' },
          { value: 'resumo', label: 'Resumo' },
        ]}
      />

      {kind === 'quiz' ? (
        <form action={quizAction} className="space-y-3">
          <SubjectSelect subjects={subjects} />
          <div>
            <Label htmlFor="topic">Tema</Label>
            <Input id="topic" name="topic" placeholder="Ex.: Frações, Segunda Guerra..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="difficulty">Dificuldade</Label>
              <select
                id="difficulty"
                name="difficulty"
                defaultValue="medio"
                className="border-border bg-surface text-text h-11 w-full rounded-md border px-3 text-sm outline-none"
              >
                <option value="facil">Fácil</option>
                <option value="medio">Média</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
            <div>
              <Label htmlFor="questionCount">Questões</Label>
              <Input
                id="questionCount"
                name="questionCount"
                type="number"
                min={1}
                max={10}
                defaultValue={5}
                required
              />
            </div>
          </div>
          {quizState.status === 'error' && (
            <p role="alert" className="text-danger text-sm leading-relaxed">
              {quizState.message}
            </p>
          )}
          <GenerateButton />
        </form>
      ) : (
        <form action={summaryAction} className="space-y-3">
          <SubjectSelect subjects={subjects} />
          <div>
            <Label htmlFor="topic">Tema</Label>
            <Input id="topic" name="topic" placeholder="Ex.: Fotossíntese, Revolução Francesa..." required />
          </div>
          {summaryState.status === 'error' && (
            <p role="alert" className="text-danger text-sm leading-relaxed">
              {summaryState.message}
            </p>
          )}
          <GenerateButton />
        </form>
      )}
    </div>
  );
}
