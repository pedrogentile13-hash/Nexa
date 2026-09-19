import {
  CircleHelp,
  ClipboardList,
  FileText,
  Headphones,
  Image as ImageIcon,
  Music,
  Play,
} from 'lucide-react';
import type { ResourceKind } from '@/types/database.types';

/** Um ícone por formato — usado no hub de estudo e na visão geral do admin. */
export const RESOURCE_KIND_ICON: Record<ResourceKind, typeof FileText> = {
  resumo: FileText,
  simulado: ClipboardList,
  quiz: CircleHelp,
  podcast: Headphones,
  video: Play,
  imagem: ImageIcon,
  musica: Music,
};

/** Uma cor por formato — não é a cor da matéria, é a identidade do FORMATO
 * (todo podcast é roxo, seja de qual matéria for). Reaproveita a mesma
 * paleta nomeada e acessível de `subjectColorVars`, que não é exclusiva de
 * matéria — é só "cor categórica com contraste garantido nos dois temas". */
export const RESOURCE_KIND_COLOR: Record<ResourceKind, string> = {
  resumo: 'green',
  simulado: 'orange',
  quiz: 'pink',
  podcast: 'violet',
  video: 'blue',
  imagem: 'amber',
  musica: 'teal',
};
