import type { StaffIdentity } from '@/features/escola/server/guard';
import type {
  ClassCard,
  HomeData,
  RosterStudent,
  TeacherCard,
} from '@/features/escola/server/queries';
import { DEMO_STAFF_ID } from './flags';

/** Painel Escola de demonstração: uma escola fictícia ("Colégio Modelo") com 186 alunos em 6 turmas. */
export const DEMO_SCHOOL_NAME = 'Colégio Modelo';

export const DEMO_STAFF_IDENTITY: StaffIdentity = {
  userId: DEMO_STAFF_ID,
  role: 'coordination',
  schoolId: 'demo-school',
  schoolName: DEMO_SCHOOL_NAME,
  fullName: 'Marina Souza',
  avatarUrl: null,
};

const CLASSES: ClassCard[] = [
  {
    id: 'demo-turma-9a',
    name: '9º ano A',
    students: 31,
    active7d: 27,
    neverActive: 1,
    avgXp: 2840,
    teachers: 'Ana Lima, Carlos Prado, Beatriz Nunes',
  },
  {
    id: 'demo-turma-9b',
    name: '9º ano B',
    students: 30,
    active7d: 26,
    neverActive: 2,
    avgXp: 2610,
    teachers: 'Ana Lima, Carlos Prado, Beatriz Nunes',
  },
  {
    id: 'demo-turma-1a',
    name: '1ª série EM A',
    students: 32,
    active7d: 29,
    neverActive: 0,
    avgXp: 4120,
    teachers: 'Rafael Dias, Helena Castro, Paulo Reis',
  },
  {
    id: 'demo-turma-1b',
    name: '1ª série EM B',
    students: 29,
    active7d: 24,
    neverActive: 2,
    avgXp: 3050,
    teachers: 'Rafael Dias, Helena Castro, Paulo Reis',
  },
  {
    id: 'demo-turma-2a',
    name: '2ª série EM A',
    students: 34,
    active7d: 30,
    neverActive: 1,
    avgXp: 4580,
    teachers: 'Camila Torres, Eduardo Melo',
  },
  {
    id: 'demo-turma-3a',
    name: '3ª série EM A',
    students: 30,
    active7d: 28,
    neverActive: 0,
    avgXp: 5230,
    teachers: 'Camila Torres, Eduardo Melo, Júlia Ramos',
  },
];

const FIRST = [
  'Lucas',
  'Mariana',
  'Pedro',
  'Isabela',
  'Gabriel',
  'Laura',
  'Rafael',
  'Beatriz',
  'Thiago',
  'Sofia',
  'Felipe',
  'Valentina',
  'Bruno',
  'Alice',
  'Guilherme',
  'Helena',
];
const LAST = [
  'Almeida',
  'Barbosa',
  'Cardoso',
  'Duarte',
  'Esteves',
  'Farias',
  'Gomes',
  'Honório',
  'Ibrahim',
  'Jardim',
  'Klein',
  'Lopes',
  'Macedo',
  'Nogueira',
  'Oliveira',
  'Pacheco',
];

function roster(): RosterStudent[] {
  const rows: RosterStudent[] = [];
  CLASSES.forEach((c, ci) => {
    for (let i = 0; i < 10; i++) {
      const n = ci * 10 + i;
      const isEnzo = c.id === 'demo-turma-1a' && i === 0;
      rows.push({
        id: isEnzo ? 'demo-aluno-enzo' : `demo-aluno-${n}`,
        name: isEnzo
          ? 'Enzo Martins'
          : `${FIRST[(n * 3) % FIRST.length]} ${LAST[(n * 7 + 2) % LAST.length]}`,
        avatarUrl: null,
        classId: c.id,
        className: c.name,
        login: isEnzo ? 'enzo.martins' : `aluno${String(n + 1).padStart(3, '0')}`,
        xp: isEnzo ? 6850 : 1200 + ((n * 373) % 5200),
        level: isEnzo ? 9 : 4 + ((n * 5) % 7),
        streak: isEnzo ? 65 : (n * 11) % 40,
        lastActive: isEnzo
          ? '2026-11-13T15:20:00-03:00'
          : `2026-11-${String(7 + (n % 7)).padStart(2, '0')}T${String(14 + (n % 8)).padStart(2, '0')}:10:00-03:00`,
        lastSignInAt: '2026-11-13T15:20:00-03:00',
        weekMinutes: isEnzo ? 410 : 60 + ((n * 47) % 360),
      });
    }
  });
  return rows;
}

export function enzoSchoolRoster(classId?: string, search?: string): RosterStudent[] {
  const q = search?.trim().toLowerCase();
  return roster().filter(
    (r) => (!classId || r.classId === classId) && (!q || r.name.toLowerCase().includes(q)),
  );
}

export const enzoSchoolClasses = (): ClassCard[] => CLASSES;

export const enzoSchoolUnassigned = () => [
  { id: 'demo-sem-1', name: 'Davi Fontes', login: 'davi.fontes' },
  { id: 'demo-sem-2', name: 'Yasmin Rocha', login: 'yasmin.rocha' },
  { id: 'demo-sem-3', name: 'Caio Brandão', login: 'caio.brandao' },
];

export function enzoSchoolTeachers(): TeacherCard[] {
  const t = (
    id: string,
    name: string,
    faq: number,
    pending: number,
    a: [string, string][],
  ): TeacherCard => ({
    id,
    name,
    faqCount: faq,
    pending,
    assignments: a.map(([subject, className], i) => ({ id: `${id}-${i}`, subject, className })),
  });
  return [
    t('demo-prof-1', 'Ana Lima', 24, 1, [
      ['Português', '9º ano A'],
      ['Português', '9º ano B'],
    ]),
    t('demo-prof-2', 'Carlos Prado', 31, 0, [
      ['Matemática', '9º ano A'],
      ['Matemática', '9º ano B'],
    ]),
    t('demo-prof-3', 'Beatriz Nunes', 12, 2, [
      ['Biologia', '9º ano A'],
      ['Biologia', '9º ano B'],
    ]),
    t('demo-prof-4', 'Rafael Dias', 28, 0, [
      ['Matemática', '1ª série EM A'],
      ['Matemática', '1ª série EM B'],
    ]),
    t('demo-prof-5', 'Helena Castro', 19, 1, [
      ['Física', '1ª série EM A'],
      ['Física', '1ª série EM B'],
    ]),
    t('demo-prof-6', 'Camila Torres', 36, 0, [
      ['Português', '2ª série EM A'],
      ['Português', '3ª série EM A'],
    ]),
    t('demo-prof-7', 'Eduardo Melo', 22, 0, [
      ['História', '2ª série EM A'],
      ['História', '3ª série EM A'],
    ]),
  ];
}

export const enzoSchoolSubjects = () => [
  { id: 'demo-mat', name: 'Matemática' },
  { id: 'demo-por', name: 'Português' },
  { id: 'demo-bio', name: 'Biologia' },
  { id: 'demo-fis', name: 'Física' },
  { id: 'demo-his', name: 'História' },
  { id: 'demo-qui', name: 'Química' },
];

export function enzoSchoolHome(): HomeData {
  return {
    overview: {
      overview: {
        students: 186,
        teachers: 14,
        managedAccounts: 186,
        studentsWithoutClass: 3,
        activeLast7Days: 164,
        neverEntered: 6,
        pendingQuestions: 4,
        upcomingEvents: 5,
        aiUsesToday: 87,
      },
      teachers: enzoSchoolTeachers().map((t) => ({
        teacherId: t.id,
        fullName: t.name,
        classes: t.assignments.map((a) => a.className).join(', '),
        faqCount: t.faqCount,
        pendingCount: t.pending,
      })),
    },
    classes: CLASSES,
    pendingQuestions: 0,
    pendingPublications: 3,
    recentNotices: [
      {
        id: 'demo-aviso-1',
        title: 'Simulado bimestral na próxima semana',
        className: null,
        createdAt: '2026-11-12T09:00:00-03:00',
        readCount: 142,
        audience: 186,
        eventDate: '2026-11-19',
      },
      {
        id: 'demo-aviso-2',
        title: 'Reunião de pais: 1ª série EM',
        className: '1ª série EM A',
        createdAt: '2026-11-10T14:30:00-03:00',
        readCount: 24,
        audience: 32,
        eventDate: '2026-11-21',
      },
      {
        id: 'demo-aviso-3',
        title: 'Entrega da redação do 3º bimestre',
        className: '3ª série EM A',
        createdAt: '2026-11-09T11:00:00-03:00',
        readCount: 27,
        audience: 30,
        eventDate: null,
      },
    ],
  };
}
