'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ListChecks, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Field, FormFeedback, Select, SubmitButton, Textarea, Toggle } from './form-parts';
import { MEDIA_KINDS, QUESTION_KINDS, RESOURCE_KINDS, DIFFICULTIES } from '../lib/labels';
import { BIMESTRES } from '@/lib/design/bimestre';
import { MediaUpload } from './media-upload';
import { deleteResource, saveResource, type AdminState } from '../server/actions';
import type { ResourceFormOptions } from '../server/queries';
import type { ResourceKind, ResourceRow } from '@/types/database.types';

/**
 * Editor de conteúdo.
 *
 * Um formulário para os sete formatos, e não sete formulários: o que muda entre
 * um resumo e um podcast é um campo, não a tela. O formato escolhido decide o
 * que aparece — quem cadastra um podcast nunca vê a caixa de texto do resumo,
 * e quem cadastra um simulado não vê nenhuma das duas, porque o conteúdo dele
 * são as questões, que têm tela própria.
 */

const INITIAL: AdminState = { status: 'idle' };

const ACCEPT: Partial<Record<ResourceKind, string>> = {
  podcast: 'audio/*',
  musica: 'audio/*',
  video: 'video/*',
  imagem: 'image/*',
};

type ResumoFormat = 'markdown' | 'pdf' | 'html';

export function ResourceForm({
  options,
  resource,
  canChooseSchool,
  basePath = '/admin/conteudo',
}: {
  options: ResourceFormOptions;
  resource?: ResourceRow | null;
  canChooseSchool: boolean;
  /** O professor reaproveita este MESMO formulário em `/professor/conteudo`. */
  basePath?: '/admin/conteudo' | '/professor/conteudo';
}) {
  const [state, formAction] = useActionState(saveResource, INITIAL);
  const [kind, setKind] = useState<ResourceKind>(resource?.kind ?? 'resumo');
  const [subjectId, setSubjectId] = useState(
    resource?.subject_catalog_id ?? options.subjects[0]?.id ?? '',
  );
  const [resumoFormat, setResumoFormat] = useState<ResumoFormat>(
    resource?.content_format === 'pdf' || resource?.content_format === 'html'
      ? resource.content_format
      : 'markdown',
  );

  const isMedia = MEDIA_KINDS.includes(kind);
  const isQuestions = QUESTION_KINDS.includes(kind);
  const topics = options.topics.filter((t) => t.subjectId === subjectId);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-5">
        {resource && <input type="hidden" name="id" value={resource.id} />}

        <section className="border-border bg-surface space-y-4 rounded-lg border p-4">
          <Field label="Formato">
            <Select
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ResourceKind)}
            >
              {RESOURCE_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label} — {k.hint}
                </option>
              ))}
            </Select>
            {resource && (
              <p className="text-subtle mt-1.5 text-xs">
                Trocar o formato não apaga o que já foi cadastrado no formato antigo (questões,
                texto extraído do PDF etc.) — esse conteúdo antigo só deixa de aparecer aqui.
              </p>
            )}
          </Field>

          <Field label="Título">
            <Input
              name="title"
              defaultValue={resource?.title ?? ''}
              required
              placeholder="Cinemática: movimento uniforme e uniformemente variado"
            />
          </Field>

          <Field label="Linha de apoio" hint="opcional">
            <Input
              name="subtitle"
              defaultValue={resource?.subtitle ?? ''}
              placeholder="Física · 7 min de leitura"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Matéria">
              <Select
                name="subjectId"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              >
                {options.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Assunto" hint="liga o erro ao material certo">
              <Select name="topicId" defaultValue={resource?.topic_id ?? ''}>
                <option value="">Sem assunto</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {canChooseSchool && (
            <Field label="Quem enxerga" hint="define o alcance deste item">
              <Select name="schoolId" defaultValue={resource?.school_id ?? 'global'}>
                <option value="global">Todas as escolas</option>
                {options.schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    Só {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Descrição" hint="aparece no card">
            <Textarea
              name="description"
              rows={2}
              defaultValue={resource?.description ?? ''}
              placeholder="A base de tudo que cai na primeira prova do bimestre."
            />
          </Field>
        </section>

        {/* --------------------------------------------------- conteúdo -- */}
        {kind === 'resumo' && (
          <section className="border-border bg-surface space-y-4 rounded-lg border p-4">
            <input type="hidden" name="contentFormat" value={resumoFormat} />

            <Field label="Como este resumo chega">
              <div className="flex gap-2">
                {(
                  [
                    { value: 'markdown', label: 'Escrever texto' },
                    { value: 'pdf', label: 'Enviar PDF' },
                    { value: 'html', label: 'HTML interativo' },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setResumoFormat(option.value)}
                    aria-pressed={resumoFormat === option.value}
                    className={cn(
                      'h-11 flex-1 rounded-md border text-sm font-medium transition-colors',
                      resumoFormat === option.value
                        ? 'border-brand bg-brand-soft text-brand-text'
                        : 'border-border bg-surface text-muted hover:bg-surface-2',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>

            {resumoFormat === 'markdown' && (
              <Field
                label="Texto do resumo"
                hint="markdown: ## título, **negrito**, - lista, > destaque"
              >
                <Textarea
                  name="body"
                  rows={16}
                  defaultValue={resource?.content_format === 'markdown' ? (resource?.body ?? '') : ''}
                  className="font-mono text-sm leading-relaxed"
                  placeholder={
                    'No **movimento uniforme** a velocidade não muda...\n\n### Equações que caem na prova\n\n- v = v₀ + a·t'
                  }
                />
              </Field>
            )}

            {resumoFormat === 'pdf' && (
              <>
                <MediaUpload
                  name="storagePath"
                  accept="application/pdf"
                  defaultPath={resource?.content_format === 'pdf' ? resource.storage_path : null}
                  label="Arquivo PDF"
                  hint="fica no bucket nexa-content"
                />
                <p className="text-subtle text-xs leading-relaxed">
                  Ao salvar, o Nexa lê o arquivo para contar páginas e estimar o tempo de leitura —
                  isso acontece na hora, então o envio pode levar alguns segundos a mais num PDF
                  grande.
                </p>
                {resource?.content_format === 'pdf' && resource.pdf_page_count && (
                  <p className="text-muted text-xs">
                    Processado da última vez: {resource.pdf_page_count} página
                    {resource.pdf_page_count === 1 ? '' : 's'}.
                  </p>
                )}
                {resource?.content_format === 'pdf' && resource.pdf_status === 'erro' && (
                  <p className="bg-warning-soft text-warning rounded-md px-3 py-2 text-xs leading-relaxed">
                    Não consegui processar o texto deste PDF automaticamente — o aluno já consegue
                    abrir e ler normalmente, mas o tempo de leitura estimado pode ficar impreciso.
                    Enviar o arquivo de novo tenta o processamento outra vez.
                  </p>
                )}
              </>
            )}

            {resumoFormat === 'html' && (
              <Field label="Código HTML" hint="exibido isolado (sandbox), sem CSS/JS do resto do site">
                <Textarea
                  name="body"
                  rows={16}
                  defaultValue={resource?.content_format === 'html' ? (resource?.body ?? '') : ''}
                  className="font-mono text-sm leading-relaxed"
                  placeholder={'<h2>Linha do tempo</h2>\n<div class="linha">...</div>\n<style>...</style>'}
                />
                <p className="bg-warning-soft text-warning mt-2 rounded-md px-3 py-2 text-xs leading-relaxed">
                  Este HTML é exibido isolado num sandbox — sem acesso a cookies, dados de outros
                  alunos ou ao resto do app, mesmo que contenha JavaScript. Ainda assim, só cole
                  conteúdo de confiança: ele pode fazer requisições próprias de rede.
                </p>
              </Field>
            )}
          </section>
        )}

        {isMedia && (
          <section className="border-border bg-surface space-y-4 rounded-lg border p-4">
            <MediaUpload
              name="storagePath"
              accept={ACCEPT[kind] ?? '*/*'}
              defaultPath={resource?.storage_path}
              label="Arquivo"
              hint="fica no bucket nexa-content"
            />

            <Field label="Ou um link externo" hint="YouTube, RSS, Drive público">
              <Input
                name="externalUrl"
                type="url"
                defaultValue={resource?.external_url ?? ''}
                placeholder="https://..."
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Capa" hint="link da imagem">
                <Input
                  name="thumbnailUrl"
                  type="url"
                  defaultValue={resource?.thumbnail_url ?? ''}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Duração" hint="em segundos">
                <Input
                  name="durationSeconds"
                  type="number"
                  min={0}
                  defaultValue={resource?.duration_seconds ?? ''}
                  placeholder="1200"
                />
              </Field>
            </div>

            {kind === 'imagem' && (
              <Field label="Explicação do verso" hint="modo flashcard">
                <Textarea
                  name="body"
                  rows={4}
                  defaultValue={resource?.body ?? ''}
                  placeholder="O carbono circula entre atmosfera, seres vivos, solo e oceano..."
                />
              </Field>
            )}
          </section>
        )}

        {isQuestions && (
          <section className="border-border bg-surface space-y-4 rounded-lg border p-4">
            <p className="text-muted text-sm">
              As questões deste {kind === 'quiz' ? 'quiz' : 'simulado'} têm tela própria — é lá que
              o gabarito é cadastrado.
            </p>

            {resource && (
              <Button asChild variant="secondary">
                <Link href={`${basePath}/${resource.id}/questoes`}>
                  <ListChecks aria-hidden />
                  Cadastrar questões
                </Link>
              </Button>
            )}

            {kind === 'simulado' && (
              <Field label="Tempo de prova" hint="em segundos · 0 = sem limite">
                <Input
                  name="timeLimitSeconds"
                  type="number"
                  min={0}
                  defaultValue={resource?.time_limit_seconds ?? 1200}
                />
              </Field>
            )}
          </section>
        )}

        {/* ---------------------------------------------- classificação -- */}
        <section className="border-border bg-surface space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dificuldade">
              <Select name="difficulty" defaultValue={resource?.difficulty ?? 'medio'}>
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="XP ao concluir" hint="0 a 1000">
              <Input
                name="xpReward"
                type="number"
                min={0}
                max={1000}
                defaultValue={resource?.xp_reward ?? (isQuestions ? 100 : 20)}
              />
            </Field>
          </div>

          <Field label="Etiquetas" hint="separadas por vírgula">
            <Input
              name="tags"
              defaultValue={resource?.tags?.join(', ') ?? ''}
              placeholder="prova, revisão, enem"
            />
          </Field>

          <Field label="Bimestre" hint="opcional — filtro da Biblioteca">
            <Select name="bimestre" defaultValue={resource?.bimestre?.toString() ?? ''}>
              <option value="">Sem bimestre</option>
              {BIMESTRES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </Select>
          </Field>

          <Toggle
            name="isPublished"
            defaultChecked={resource?.is_published ?? false}
            label="Publicado"
            description="Enquanto estiver desligado, nenhum aluno enxerga este item."
          />
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton>{resource ? 'Salvar alterações' : 'Criar conteúdo'}</SubmitButton>
          <FormFeedback state={state} />
        </div>
      </form>

      {resource && (
        <form action={deleteResource} className="border-border border-t pt-4">
          <input type="hidden" name="id" value={resource.id} />
          <Button type="submit" variant="ghost" className="text-danger hover:bg-danger-soft">
            <Trash2 aria-hidden />
            Excluir este conteúdo
          </Button>
          <p className="text-subtle mt-1.5 text-xs">
            Apaga também as questões, os capítulos e o progresso que os alunos tinham nele.
          </p>
        </form>
      )}
    </div>
  );
}
