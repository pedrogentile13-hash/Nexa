'use client';

import { useActionState, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field, Select, SubmitButton, Toggle } from './form-parts';
import { DIFFICULTIES } from '../lib/labels';
import { GRADE_LEVELS } from '@/features/onboarding/schemas';
import { generateExamDraft, type GenerateExamDraftState } from '../server/ai-exam';

const INITIAL: GenerateExamDraftState = { status: 'idle' };

/**
 * Painel "Gerar com IA" — preenche o campo Código de `SimuladoImporter` com
 * o JSON que o Groq devolve, e nada além disso. A validação/prévia que já
 * existe roda em cima do resultado exatamente como rodaria pra um JSON
 * colado à mão: se vier algo errado, aparece como erro de validação normal,
 * nunca é publicado sozinho.
 *
 * Matéria e série vêm de listas fechadas (catálogo real de matérias,
 * `GRADE_LEVELS` já usado no onboarding) em vez de texto livre — o Groq
 * recebe sempre um nome reconhecível, nunca uma variação de digitação. A
 * matéria escolhida aqui também volta pro seletor "Matéria" de publicação
 * de `SimuladoImporter` (segundo argumento de `onGenerated`): antes disso,
 * gerar por IA nunca tocava naquele campo, e quem gerava só por essa via
 * podia publicar sem perceber que a matéria de destino não tinha relação
 * nenhuma com o que acabou de pedir à IA.
 */
export function AiExamGenerator({
  subjects,
  onGenerated,
}: {
  subjects: { id: string; name: string }[];
  onGenerated: (code: string, subjectId?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [state, formAction] = useActionState(generateExamDraft, INITIAL);

  useEffect(() => {
    if (state.status === 'ok') {
      onGenerated(state.code, subjectId || undefined);
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage à mudança de `state`; `subjectId` é lido no instante do sucesso, não deve reabrir o efeito
  }, [state, onGenerated]);

  const dialog = (
    <Dialog open={open} onClose={() => setOpen(false)} title="Gerar simulado com IA">
      <form action={formAction} className="space-y-3">
        <Field label="Matéria">
          <Select
            name="subjectName"
            required
            value={subjects.find((s) => s.id === subjectId)?.name ?? ''}
            onChange={(e) => {
              const match = subjects.find((s) => s.name === e.target.value);
              setSubjectId(match?.id ?? '');
            }}
          >
            <option value="" disabled>
              Escolha a matéria
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tema" hint="opcional">
          <Input name="topic" placeholder="Equações do 2º grau" />
        </Field>
        <Field label="Série/ano" hint="opcional">
          <Select name="gradeLevel" defaultValue="">
            <option value="">Sem série definida</option>
            {GRADE_LEVELS.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Dificuldade">
            <Select name="difficulty" defaultValue="medio">
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nº de questões">
            <Input name="questionCount" type="number" min={1} max={20} defaultValue={10} />
          </Field>
        </div>

        <Toggle
          name="includeEssay"
          label="Incluir redação"
          description="Gera um tema e um comando de redação relacionados ao assunto."
        />

        {state.status === 'error' && <p className="text-danger text-sm">{state.message}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <SubmitButton>
            <Sparkles aria-hidden />
            Gerar
          </SubmitButton>
        </div>

        <p className="text-subtle text-xs leading-relaxed">
          O resultado preenche o campo &ldquo;Código&rdquo; abaixo — passa pela mesma validação de
          sempre, e nada é publicado sozinho.
        </p>
      </form>
    </Dialog>
  );

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles aria-hidden />
        Gerar com IA
      </Button>

      {/* Portal pro body: `SimuladoImporter` já é um <form> inteiro (o
          importador em si) — aninhar este segundo <form> (o do painel de IA)
          dentro dele seria HTML inválido e imprevisível no submit. */}
      {open && createPortal(dialog, document.body)}
    </>
  );
}
