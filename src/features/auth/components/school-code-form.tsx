'use client';

import { useState, useTransition } from 'react';
import { Loader2, School } from 'lucide-react';
import { findSchoolByCode } from '../server/school-lookup';

export function SchoolCodeForm() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await findSchoolByCode(code);
      if (!r.ok) return setError(r.message);
      setFound(r.name);
      // Navega a janela inteira para o endereço da escola (no app, liberado em `allowNavigation`).
      window.location.href = r.url;
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium" htmlFor="school-code">Código da escola</label>
      <input
        id="school-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="anglomorumbi"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        className="border-border bg-surface h-12 w-full rounded-full border px-5 text-base outline-none focus:border-brand"
      />
      <p className="text-muted text-xs">É a primeira parte do endereço da escola, por exemplo <b>anglomorumbi</b> em anglomorumbi.nexastudy.com.br. Pergunte à coordenação.</p>
      {error && <p role="alert" className="text-danger text-sm">{error}</p>}
      {found && <p role="status" className="text-success text-sm">Abrindo {found}…</p>}
      <button type="submit" disabled={pending || !code.trim()} className="bg-brand text-brand-fg inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <School className="size-4" aria-hidden />} Continuar
      </button>
    </form>
  );
}
