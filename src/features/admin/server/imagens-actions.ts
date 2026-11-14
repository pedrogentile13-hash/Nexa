'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { uuidV5 } from '@/features/content/lib/study-seed';
import { IMAGENS_APOIO } from '@/features/content/seed/imagens';
import { requireAccess } from './guard';
import type { StudySeedState } from './study-seed-actions';

/**
 * Publica as imagens de apoio (mapas mentais e espinhas de peixe) para TODAS as escolas, uma vez só.
 * O arquivo fica em public/conteudo, então não gasta armazenamento do banco. Clicar de novo não duplica.
 */
export async function publicarImagensApoio(): Promise<StudySeedState> {
  const identity = await requireAccess('/admin/conteudo');
  const supabase = await createClient();
  const slugs = [...new Set(IMAGENS_APOIO.map((i) => i.subject))];
  const { data: subjects } = await supabase
    .from('subject_catalog')
    .select('id, slug')
    .in('slug', slugs);
  const subjectId = new Map((subjects ?? []).map((s) => [s.slug, s.id]));
  const faltam = slugs.filter((s) => !subjectId.has(s));
  if (faltam.length)
    return { status: 'error', message: `Matéria ausente no catálogo: ${faltam.join(', ')}.` };

  const now = new Date().toISOString();
  const { error, data } = await supabase
    .from('resources')
    .upsert(
      IMAGENS_APOIO.map((i, index) => ({
        id: uuidV5(`imagem-apoio/${i.slug}`),
        school_id: null,
        subject_catalog_id: subjectId.get(i.subject),
        kind: 'imagem',
        context: 'school',
        title: i.title,
        subtitle: i.subtitle,
        description: i.subtitle,
        body: i.body,
        external_url: i.arquivo,
        difficulty: 'medio',
        grade_levels: [i.grade],
        tags: ['imagens-de-apoio', i.subject],
        xp_reward: 10,
        sort_order: 990 + index,
        is_published: true,
        published_at: now,
        created_by: identity.userId,
      })) as never,
      { onConflict: 'id', ignoreDuplicates: true },
    )
    .select('id');
  if (error) return { status: 'error', message: `Não consegui publicar: ${error.message}` };
  revalidatePath('/admin/conteudo');
  return {
    status: 'done',
    message: `Publicadas ${data?.length ?? 0} imagens de apoio, para todas as escolas.`,
  };
}
