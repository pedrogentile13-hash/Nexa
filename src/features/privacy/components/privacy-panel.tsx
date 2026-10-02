'use client';

import { useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { Check, Download, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteMyAccount, exportMyData, saveConsent, type ConsentState } from '../server/actions';
import { LEGAL_DOCUMENT_VERSION, needsGuardianConsent } from '../lib/versions';
import type { ConsentRecord } from '../server/queries';

/**
 * Privacidade e dados — consentimento, acesso e eliminação (LGPD arts. 14 e 18).
 *
 * Os campos do responsável aparecem conforme a data de nascimento digitada,
 * não atrás de uma pergunta "você é menor de idade?". Perguntar a idade em
 * texto convida a mentir; a data é um dado que a pessoa preenche sem pensar
 * no que ele desbloqueia — e é a mesma data que o servidor usa pra decidir,
 * então marcar errado não muda o que é exigido.
 */

const INITIAL: ConsentState = { status: 'idle' };

export function PrivacyPanel({
  consent,
  birthDate,
  isAdmin,
}: {
  consent: ConsentRecord | null;
  birthDate: string | null;
  isAdmin: boolean;
}) {
  const [state, formAction, isPending] = useActionState(saveConsent, INITIAL);
  const [birth, setBirth] = useState(birthDate ?? '');
  const minor = birth ? needsGuardianConsent(birth) : false;

  const outdated = consent !== null && consent.documentVersion !== LEGAL_DOCUMENT_VERSION;

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------- consentimento */}
      <section className="space-y-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4" aria-hidden />
            Consentimento
          </h3>
          <p className="text-muted text-sm leading-snug">
            O Nexa guarda nome, escola, turma e seu desempenho. Para menores de 18 anos, a lei
            exige o consentimento de um responsável.
          </p>
        </div>

        {consent && !outdated && (
          <p className="bg-success-soft text-success flex items-start gap-2 rounded-2xl p-3 text-sm">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {consent.kind === 'guardian'
                ? `Consentimento registrado por ${consent.guardianName} em ${new Date(consent.acceptedAt).toLocaleDateString('pt-BR')}.`
                : `Você aceitou em ${new Date(consent.acceptedAt).toLocaleDateString('pt-BR')}.`}
            </span>
          </p>
        )}

        {outdated && (
          <p className="bg-warning-soft text-warning flex items-start gap-2 rounded-2xl p-3 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Os Termos mudaram desde o seu aceite. Confirme de novo para continuar com tudo em
              ordem.
            </span>
          </p>
        )}

        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de nascimento</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              required
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
            />
          </div>

          {minor && (
            <div className="border-border space-y-3 rounded-2xl border p-3">
              <p className="text-muted text-sm leading-snug">
                Como você tem menos de 18 anos, precisamos dos dados de quem autoriza.
              </p>
              <div className="space-y-2">
                <Label htmlFor="guardianName">Nome do responsável</Label>
                <Input id="guardianName" name="guardianName" required={minor} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianEmail">E-mail do responsável</Label>
                <Input id="guardianEmail" name="guardianEmail" type="email" required={minor} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianRelationship">Parentesco (opcional)</Label>
                <Input id="guardianRelationship" name="guardianRelationship" placeholder="mãe, pai, responsável…" />
              </div>
            </div>
          )}

          <label className="flex items-start gap-2.5 text-sm leading-snug">
            <input
              type="checkbox"
              name="accepted"
              required
              className="accent-brand mt-0.5 size-4 shrink-0"
            />
            <span>
              {minor ? 'O responsável acima concorda' : 'Eu concordo'} com os{' '}
              <Link href="/termos-de-uso" className="text-brand-text underline underline-offset-2">
                Termos de Uso
              </Link>{' '}
              e com a{' '}
              <Link
                href="/politica-de-privacidade"
                className="text-brand-text underline underline-offset-2"
              >
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          {state.status === 'error' && (
            <p role="alert" className="text-danger text-sm">
              {state.message}
            </p>
          )}
          {state.status === 'ok' && <p className="text-success text-sm">Consentimento registrado.</p>}

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {consent ? 'Atualizar consentimento' : 'Registrar consentimento'}
          </Button>
        </form>
      </section>

      <ExportSection />
      {!isAdmin && <DeleteSection />}
    </div>
  );
}

function ExportSection() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function download() {
    setError(null);
    start(async () => {
      const result = await exportMyData();
      if (result.status === 'error') {
        setError(result.message);
        return;
      }
      // Monta o arquivo no navegador: o JSON já veio na resposta da action, e
      // uma rota de download separada seria um segundo caminho autenticado
      // pros mesmos dados — mais superfície, nenhum ganho.
      const blob = new Blob([result.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexa-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <section className="border-border space-y-2 border-t pt-4">
      <h3 className="text-sm font-semibold">Baixar meus dados</h3>
      <p className="text-muted text-sm leading-snug">
        Um arquivo com o que o Nexa guarda sobre você: perfil, matérias, tarefas, tempo de estudo,
        tentativas e conquistas.
      </p>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      <Button variant="outline" onClick={download} disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4" aria-hidden />
        )}
        Baixar em JSON
      </Button>
    </section>
  );
}

function DeleteSection() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState('');

  function confirmDelete() {
    setError(null);
    start(async () => {
      // Em caso de sucesso a action redireciona e nada aqui continua rodando.
      const result = await deleteMyAccount();
      if (result?.status === 'error') setError(result.message);
    });
  }

  return (
    <section className="border-border space-y-2 border-t pt-4">
      <h3 className="text-danger text-sm font-semibold">Excluir minha conta</h3>
      <p className="text-muted text-sm leading-snug">
        Apaga a conta e tudo que está ligado a ela — matérias, tarefas, tentativas, sequência e
        conquistas. Não dá para desfazer.
      </p>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Excluir minha conta
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Excluir a conta?">
        <div className="space-y-4">
          <p className="text-muted text-sm leading-snug">
            Isso é definitivo. Se quiser guardar seu histórico, baixe seus dados antes.
          </p>
          <div className="space-y-2">
            {/* Digitar a palavra em vez de um segundo "tem certeza?": duas
                perguntas iguais viram dois cliques automáticos. */}
            <Label htmlFor="confirm">
              Para confirmar, digite <strong>EXCLUIR</strong>
            </Label>
            <Input
              id="confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
          </div>

          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={typed !== 'EXCLUIR' || pending}
              onClick={confirmDelete}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Excluir
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
