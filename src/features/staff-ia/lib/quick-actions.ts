import type { StaffRole } from '@/features/escola/lib/access';

/** Atalhos da página "IA" do portal: cada perfil vê os que fazem sentido para o trabalho dele. */

export interface QuickAction {
  id: string;
  title: string;
  hint: string;
  /** Texto que vai para a caixa de mensagem; o "…" é onde a pessoa completa. */
  prompt: string;
  /** Ferramenta pronta do portal que faz o mesmo de ponta a ponta (opcional). */
  tool?: { href: string; label: string };
}

const COMUNICADO: QuickAction = {
  id: 'comunicado',
  title: 'Escrever um comunicado',
  hint: 'Claro, curto e com tom certo para famílias e alunos.',
  prompt: 'Escreva um comunicado para os responsáveis e alunos sobre… Inclua o quê, quando e onde, em tom cordial e objetivo.',
  tool: { href: '/escola/comunicar', label: 'Publicar em Comunicar' },
};

const DIRECTION: QuickAction[] = [
  COMUNICADO,
  {
    id: 'reuniao-pais',
    title: 'Roteiro de reunião de pais',
    hint: 'Pauta, tempos e pontos de atenção.',
    prompt: 'Monte o roteiro de uma reunião de pais de… com duração de 60 minutos: pauta, tempo de cada item e como lidar com perguntas difíceis.',
  },
  {
    id: 'engajamento',
    title: 'Plano para aumentar o uso do Nexa',
    hint: 'Ideias práticas para turmas que não entram.',
    prompt: 'Tenho turmas em que poucos alunos usam o Nexa Study. Proponha um plano de 4 semanas para aumentar o uso, com ações para professores, coordenação e alunos.',
    tool: { href: '/escola/turmas', label: 'Ver as turmas' },
  },
  {
    id: 'relatorio',
    title: 'Transformar números em relato',
    hint: 'Cole os dados e receba um resumo para a mantenedora.',
    prompt: 'Com base nestes números, escreva um resumo executivo para a mantenedora, com destaques e pontos de atenção:\n\n',
  },
  {
    id: 'regra',
    title: 'Redigir regra ou orientação interna',
    hint: 'Uso de celular, prazos, avaliações…',
    prompt: 'Redija uma orientação interna sobre… para professores e alunos, em linguagem simples, com justificativa e exemplos.',
  },
  {
    id: 'formacao',
    title: 'Pauta de formação de professores',
    hint: 'Encontro curto sobre uso pedagógico de tecnologia.',
    prompt: 'Monte uma pauta de formação de 45 minutos para professores sobre… com atividade prática.',
  },
];

const COORDINATION: QuickAction[] = [
  {
    id: 'reuniao-pedagogica',
    title: 'Pauta de reunião pedagógica',
    hint: 'Encontros objetivos com os professores.',
    prompt: 'Monte a pauta de uma reunião pedagógica de 50 minutos sobre… com encaminhamentos ao final.',
  },
  {
    id: 'recuperacao',
    title: 'Plano de recuperação',
    hint: 'Para turmas ou alunos abaixo da média.',
    prompt: 'Crie um plano de recuperação de 3 semanas para a turma… em…, com atividades e como acompanhar a evolução.',
    tool: { href: '/escola/alunos', label: 'Ver os alunos' },
  },
  {
    id: 'feedback-prof',
    title: 'Feedback para professor',
    hint: 'Conversa construtiva, com pontos fortes e próximos passos.',
    prompt: 'Ajude-me a preparar um feedback construtivo para um professor que… Estruture em pontos fortes, pontos a melhorar e combinados.',
  },
  {
    id: 'calendario',
    title: 'Organizar calendário de avaliações',
    hint: 'Evite provas acumuladas na mesma semana.',
    prompt: 'Sugira como distribuir as avaliações do bimestre para as turmas… evitando mais de duas provas por semana por turma.',
  },
  COMUNICADO,
  {
    id: 'simulado',
    title: 'Criar simulado ou resumo',
    hint: 'Feito a partir do conteúdo, vira rascunho para revisar.',
    prompt: 'Crie 8 questões de múltipla escolha, com gabarito comentado, sobre… para o…º ano.',
    tool: { href: '/escola/conteudo/novo', label: 'Criar em Conteúdo' },
  },
];

const TEACHER: QuickAction[] = [
  {
    id: 'plano-aula',
    title: 'Plano de aula',
    hint: 'Objetivos, passo a passo e avaliação.',
    prompt: 'Monte um plano de aula de 50 minutos sobre… para o…º ano, com objetivos, atividade principal e como avaliar.',
    tool: { href: '/escola/planejamento', label: 'Guardar em Planejamento' },
  },
  {
    id: 'questoes',
    title: 'Questões e gabarito',
    hint: 'Múltipla escolha com explicação de cada alternativa.',
    prompt: 'Crie 6 questões de múltipla escolha, com gabarito comentado, sobre… no estilo de prova do…º ano.',
    tool: { href: '/escola/conteudo/novo', label: 'Criar em Conteúdo' },
  },
  {
    id: 'resumo',
    title: 'Resumo do conteúdo',
    hint: 'Texto claro para o aluno revisar.',
    prompt: 'Escreva um resumo de uma página sobre… para alunos do…º ano, com exemplos e uma dica para memorizar.',
    tool: { href: '/escola/conteudo/novo', label: 'Criar em Conteúdo' },
  },
  {
    id: 'exemplos',
    title: 'Explicar de outro jeito',
    hint: 'Analogias e exemplos do dia a dia.',
    prompt: 'Preciso explicar… de outro jeito. Dê 3 analogias do cotidiano de adolescentes e uma pergunta para checar a compreensão.',
  },
  {
    id: 'feedback-aluno',
    title: 'Feedback para um aluno',
    hint: 'Elogia o que está bom e indica o próximo passo.',
    prompt: 'Escreva um feedback gentil e específico para um aluno que… sobre sua entrega de… Termine com um próximo passo.',
  },
  {
    id: 'faq',
    title: 'Respostas para o chat da turma',
    hint: 'Perguntas que os alunos mais fazem.',
    prompt: 'Liste as 8 dúvidas mais comuns de alunos do…º ano sobre… e uma resposta curta e correta para cada.',
    tool: { href: '/escola/chat', label: 'Cadastrar no Chat da turma' },
  },
  COMUNICADO,
];

export function quickActionsFor(role: StaffRole): QuickAction[] {
  if (role === 'teacher') return TEACHER;
  if (role === 'coordination') return COORDINATION;
  return DIRECTION;
}

export const IA_INTRO: Record<StaffRole, string> = {
  teacher: 'Ajudo com aulas, questões, resumos e feedback. Escolha um atalho ou escreva o que precisa.',
  coordination: 'Ajudo com reuniões, recuperação, calendário e comunicação. Escolha um atalho ou escreva o que precisa.',
  direction: 'Ajudo com comunicados, reuniões, regras e relatórios. Escolha um atalho ou escreva o que precisa.',
  platform: 'Ajudo com comunicados, reuniões, regras e relatórios. Escolha um atalho ou escreva o que precisa.',
};
