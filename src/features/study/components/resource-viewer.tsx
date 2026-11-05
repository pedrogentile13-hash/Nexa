import { ReaderView } from './reader-view';
import { PdfReader } from './pdf-reader';
import { InteractiveReader } from './interactive-reader';
import { QuizRunner } from './quiz-runner';
import { MediaPlayer } from './media-player';
import { ImageCard } from './image-card';
import type { ResourceDetail, StudyWritingTask } from '../server/queries';

/**
 * Uma rota, sete telas.
 *
 * `/estudar/[id]` decide pelo formato qual visualizador abrir. A alternativa —
 * uma rota por formato — obrigaria quem cria um link a saber o tipo do item
 * antes de montar a URL, e o mesmo id passaria a ter sete endereços possíveis.
 */
export interface QuizQuestion {
  question_id: string;
  question_position: number;
  statement: string;
  difficulty: string;
  points: number;
  topic_name: string | null;
  subject_name: string;
  group_id: string | null;
  resource_refs: string[];
  subtopic: string | null;
  skills: string[];
  options: { id: string; position: number; body: string }[];
}

export function ResourceViewer({
  resource,
  questions,
  writingTasks = [],
}: {
  resource: ResourceDetail;
  questions: QuizQuestion[];
  writingTasks?: StudyWritingTask[];
}) {
  switch (resource.kind) {
    case 'resumo':
      if (resource.contentFormat === 'pdf') return <PdfReader resource={resource} />;
      if (resource.contentFormat === 'html') return <InteractiveReader resource={resource} />;
      return <ReaderView resource={resource} />;
    case 'quiz':
    case 'simulado':
      return <QuizRunner resource={resource} questions={questions} writingTasks={writingTasks} />;
    case 'podcast':
    case 'musica':
    case 'video':
      return <MediaPlayer resource={resource} />;
    case 'imagem':
      return <ImageCard resource={resource} />;
    default:
      return <ReaderView resource={resource} />;
  }
}
