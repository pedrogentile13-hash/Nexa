'use client';

import { useActionState, useRef, useState } from 'react';
import { Check, Copy, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { Field, Select, SubmitButton } from '@/features/admin/components/form-parts';
import { importSchoolAccounts, type ImportState } from '../server/actions';
import { resultsToTsv } from '../lib/csv';

const INITIAL: ImportState = { status: 'idle' };

const EXAMPLE = `nome;turma;login;tipo
Ana Clara da Silva;9A;;aluno
Bruno Costa;9B;;aluno
Marina Lopes;;marina.lopes;professor`;

/**
 * Importar uma planilha de contas.
 *
 * Funciona com o que a secretaria já tem: cole as linhas do Excel/Google
 * Planilhas ou envie o arquivo .csv. O resultado é uma lista de logins e
 * senhas para imprimir ou copiar — a senha só aparece aqui, uma vez.
 */
export function ImportPanel({
  schools,
  isGlobal,
}: {
  schools: { id: string; name: string }[];
  isGlobal: boolean;
}) {
  const [state, action] = useActionState(importSchoolAccounts, INITIAL);
  const [csv, setCsv] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setCsv(await file.text());
  }

  return (
    <section className="border-border bg-surface rounded-lg border p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <FileSpreadsheet className="size-4" aria-hidden />
        Importar planilha
      </h2>
      <p className="text-muted mt-1 text-xs">
        Colunas: <b>nome</b>, <b>turma</b>, <b>login</b> (opcional — sai do nome) e <b>tipo</b> (aluno ou
        professor). Até 200 linhas.
      </p>

      <form action={action} className="mt-3 space-y-3">
        {isGlobal && (
          <Field label="Escola">
            <Select name="schoolId" required defaultValue="">
              <option value="">Escolha…</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <textarea
          name="csv"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={6}
          placeholder={EXAMPLE}
          spellCheck={false}
          className="border-border bg-bg text-text focus-visible:ring-brand w-full rounded-md border p-3 font-mono text-xs focus-visible:ring-2 focus-visible:outline-none"
        />

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="border-border hover:bg-surface-2 h-11 rounded-md border px-4 text-sm font-medium"
          >
            Enviar arquivo .csv
          </button>
          <button
            type="button"
            onClick={() => setCsv(EXAMPLE)}
            className="text-muted hover:text-text h-11 px-2 text-xs underline"
          >
            Ver exemplo
          </button>
          <div className="ml-auto">
            <SubmitButton>Criar contas</SubmitButton>
          </div>
        </div>

        {state.status === 'error' && (
          <p role="alert" className="text-danger text-sm">
            {state.message}
          </p>
        )}
      </form>

      {state.status === 'done' && <ImportResult state={state} />}
    </section>
  );
}

function ImportResult({ state }: { state: Extract<ImportState, { status: 'done' }> }) {
  const [copied, setCopied] = useState(false);
  const tsv = resultsToTsv(state.created);

  async function copy() {
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão da área de transferência: use "Baixar planilha".
    }
  }

  function download() {
    const blob = new Blob([`﻿${tsv.replace(/\t/g, ';')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contas-da-escola.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-5 space-y-4" aria-live="polite">
      <div className="bg-brand-soft text-brand-text rounded-lg p-4">
        <p className="text-sm font-semibold">
          {state.created.length} {state.created.length === 1 ? 'conta criada' : 'contas criadas'}
          {state.failed.length > 0 ? ` · ${state.failed.length} com problema` : ''}
        </p>
        <p className="text-xs opacity-80">
          Endereço de entrada: <b>{state.address}</b>. Anote as senhas agora — elas aparecem só desta vez.
        </p>
        {state.created.length > 0 && (
          <div className="no-print mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? 'Copiado' : 'Copiar lista'}
            </button>
            <button type="button" onClick={download} className="border-brand/40 inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold">
              <Download className="size-4" aria-hidden />
              Baixar planilha
            </button>
            <button type="button" onClick={() => window.print()} className="border-brand/40 inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold">
              <Printer className="size-4" aria-hidden />
              Imprimir
            </button>
          </div>
        )}
      </div>

      {state.created.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted text-xs">
              <tr>
                <th className="py-2 pr-3 font-medium">Nome</th>
                <th className="py-2 pr-3 font-medium">Turma</th>
                <th className="py-2 pr-3 font-medium">Login</th>
                <th className="py-2 font-medium">Senha</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {state.created.map((a) => (
                <tr key={a.login}>
                  <td className="py-2 pr-3">{a.fullName}</td>
                  <td className="py-2 pr-3">{a.className ?? (a.role === 'teacher_admin' ? 'Professor' : '—')}</td>
                  <td className="py-2 pr-3 font-mono">{a.login}</td>
                  <td className="py-2 font-mono font-semibold">{a.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state.failed.length > 0 && (
        <div className="bg-danger-soft text-danger rounded-lg p-4 text-sm">
          <p className="font-semibold">Não foram criadas:</p>
          <ul className="mt-1 list-disc pl-5">
            {state.failed.map((f, i) => (
              <li key={`${f.line}-${i}`}>
                {f.line > 0 ? `Linha ${f.line}` : 'Planilha'}
                {f.name ? ` (${f.name})` : ''}: {f.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
