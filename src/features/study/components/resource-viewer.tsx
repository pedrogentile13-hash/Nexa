import { ReaderView } from './reader-view';
import { QuizRunner } from './quiz-runner';
import { MediaPlayer } from './media-player';
import { ImageCard } from './image-card';
import type { ResourceDetail } from '../server/queries';

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
  options: { id: string; position: number; body: string }[];
}

export function ResourceViewer({
  resource,
  questions,
}: {
  resource: ResourceDetail;
  questions: QuizQuestion[];
}) {
  switch (resource.kind) {
    case 'resumo':
      return <ReaderView resource={resource} />;
    case 'quiz':
    case 'simulado':
      return <QuizRunner resource={resource} questions={questions} />;
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
