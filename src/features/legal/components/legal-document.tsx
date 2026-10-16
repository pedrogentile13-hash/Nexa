/**
 * Renderiza um documento legal (Política de Privacidade, Termos de Uso).
 *
 * Um componente só para os dois: mesma estrutura (título, data, seções
 * numeradas, aviso de minuta), conteúdo diferente — texto fiel às minutas
 * enviadas pelo usuário, não composição jurídica própria.
 */
export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export function LegalDocument({
  title,
  lastUpdated,
  intro,
  sections,
  closing,
}: {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  closing: string;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-subtle mt-1 text-sm">Última atualização: {lastUpdated}</p>
      <p className="text-muted mt-4 text-sm leading-relaxed">{intro}</p>

      <div className="mt-8 space-y-7">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-base font-semibold tracking-tight">{section.heading}</h2>
            <div className="mt-2 space-y-3">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-muted text-sm leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-muted mt-8 text-sm leading-relaxed">{closing}</p>

      <p className="border-border text-subtle mt-8 border-t pt-4 text-xs leading-relaxed">
        Minuta inicial. Recomenda-se revisão jurídica antes da publicação oficial, especialmente
        por envolver ambiente educacional, estudantes menores de idade, dados pessoais e recursos
        de inteligência artificial.
      </p>
    </main>
  );
}
