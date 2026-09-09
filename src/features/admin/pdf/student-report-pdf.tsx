import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatGrade } from '@/lib/format/grade';
import { levelForXp } from '@/features/performance/lib/level';
import type { AdminStudentReport } from '../server/queries';

/**
 * PDF do relatório individual — mesmos dados que `StudentReport` já
 * renderiza na tela, nunca uma consulta separada. `@react-pdf/renderer` usa
 * primitivas próprias (View/Text/StyleSheet), não HTML/CSS — não dá pra
 * reaproveitar o componente de tela diretamente.
 */

const ROLE_LABEL: Record<string, string> = {
  student: 'Aluno',
  school_admin: 'Admin da escola',
  admin: 'Admin geral',
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#666666', marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 8,
    borderBottom: '1px solid #e5e5e5',
    paddingBottom: 4,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  statBox: {
    flex: 1,
    border: '1px solid #e5e5e5',
    borderRadius: 4,
    padding: 8,
  },
  statValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  statLabel: { fontSize: 8, color: '#666666', marginTop: 2 },
  table: { width: '100%' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e5e5e5', paddingVertical: 4 },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #1a1a1a',
    paddingBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  cellSubject: { flex: 2 },
  cell: { flex: 1, textAlign: 'right' },
  empty: { color: '#666666', fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 24, left: 32, right: 32, fontSize: 8, color: '#999999' },
});

export function StudentReportPdf({ report }: { report: AdminStudentReport }) {
  const { person, stats, subjectScores, simuladoHistory, studyWeeks } = report;
  const gradedSubjects = subjectScores.filter((s) => s.blendedScore !== null);
  const overallScore =
    gradedSubjects.length > 0
      ? gradedSubjects.reduce((sum, s) => sum + (s.blendedScore ?? 0), 0) / gradedSubjects.length
      : null;
  const studyHours = stats ? Math.round((stats.totalStudySeconds / 3600) * 10) / 10 : 0;
  const level = stats ? levelForXp(stats.xp) : 1;
  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{person.fullName ?? 'Sem nome'}</Text>
        <Text style={styles.subtitle}>
          {ROLE_LABEL[person.role] ?? person.role}
          {person.schoolName ? ` · ${person.schoolName}` : ''} · gerado em {generatedAt}
        </Text>

        {!stats ? (
          <Text style={styles.empty}>Este aluno ainda não estudou nada.</Text>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatGrade(overallScore, 1)}</Text>
                <Text style={styles.statLabel}>Nota geral</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Sequência atual</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.longestStreak}</Text>
                <Text style={styles.statLabel}>Maior sequência</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {studyHours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                </Text>
                <Text style={styles.statLabel}>Horas de estudo</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  Nível {level} · {stats.xp.toLocaleString('pt-BR')} XP
                </Text>
                <Text style={styles.statLabel}>Progressão</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Nota por matéria</Text>
            {gradedSubjects.length === 0 ? (
              <Text style={styles.empty}>Nenhuma matéria com nota ainda.</Text>
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={styles.cellSubject}>Matéria</Text>
                  <Text style={styles.cell}>Nota</Text>
                  <Text style={styles.cell}>Quizzes</Text>
                  <Text style={styles.cell}>Simulados</Text>
                  <Text style={styles.cell}>Conteúdo concluído</Text>
                </View>
                {gradedSubjects.map((subject) => (
                  <View key={subject.subjectId} style={styles.tableRow}>
                    <Text style={styles.cellSubject}>{subject.subjectName}</Text>
                    <Text style={styles.cell}>{formatGrade(subject.blendedScore, 1)}</Text>
                    <Text style={styles.cell}>{subject.quizzesDone}</Text>
                    <Text style={styles.cell}>{subject.simuladosDone}</Text>
                    <Text style={styles.cell}>{subject.contentCompleted}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Tempo de estudo por semana</Text>
            {studyWeeks.length === 0 ? (
              <Text style={styles.empty}>Ainda sem semanas registradas.</Text>
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={styles.cellSubject}>Semana</Text>
                  <Text style={styles.cell}>Minutos</Text>
                </View>
                {studyWeeks.map((week) => (
                  <View key={week.weekStart} style={styles.tableRow}>
                    <Text style={styles.cellSubject}>{week.label}</Text>
                    <Text style={styles.cell}>{week.minutes}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Histórico de simulados</Text>
            {simuladoHistory.length === 0 ? (
              <Text style={styles.empty}>Nenhum simulado feito ainda.</Text>
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={styles.cellSubject}>Simulado</Text>
                  <Text style={styles.cell}>Acertos</Text>
                  <Text style={styles.cell}>%</Text>
                </View>
                {simuladoHistory.map((attempt) => (
                  <View key={attempt.attemptId} style={styles.tableRow}>
                    <Text style={styles.cellSubject}>{attempt.resourceTitle}</Text>
                    <Text style={styles.cell}>
                      {attempt.correctCount}/{attempt.totalCount}
                    </Text>
                    <Text style={styles.cell}>{Math.round(attempt.percent)}%</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <Text style={styles.footer} fixed>
          Nexa Study · relatório individual · gerado automaticamente
        </Text>
      </Page>
    </Document>
  );
}
