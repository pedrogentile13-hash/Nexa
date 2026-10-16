-- ============================================================================
-- Nexa Study — 0908 (1) · Categoria de trilha
--
-- Trilhas ganham seção própria na navegação (antes viviam só dentro da
-- matéria) e a listagem nova organiza por categoria, como no mockup. Default
-- 'reforco' porque a única trilha semeada hoje (Física) é exatamente isso —
-- reforço de conteúdo de uma matéria — e nenhuma trilha existente fica sem
-- categoria depois da migração.
-- ============================================================================

alter table public.tracks
  add column if not exists category text not null default 'reforco'
    check (category in ('enem', 'fundamental', 'reforco', 'carreiras', 'habilidades'));

create index if not exists tracks_category_idx on public.tracks (category);
