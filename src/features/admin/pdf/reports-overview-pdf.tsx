import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { kindLabel } from '../lib/labels';
import type { AdminReportsOverview } from '../server/queries';

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
  table: { width: '100%' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #e5e5e5', paddingVertical: 4 },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #1a1a1a',
    paddingBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  cellSchool: { flex: 2 },
  cell: { flex: 1, textAlign: 'right' },
  empty: { color: '#666666', fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 24, left: 32, right: 32, fontSize: 8, color: '#999999' },
});

function studyHoursOf(seconds: number): string {
  return (Math.round((seconds / 3600) * 10) / 10).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  });
}

export function ReportsOverviewPdf({ data }: { data: AdminReportsOverview }) {
  const { bySchool, contentOverview } = data;
  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório geral</Text>
        <Text style={styles.subtitle}>gerado em {generatedAt}</Text>

        <Text style={styles.sectionTitle}>Engajamento por escola</Text>
        {bySchool.length === 0 ? (
          <Text style={styles.empty}>Nenhum aluno ainda.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.cellSchool}>Escola</Text>
              <Text style={styles.cell}>Alunos</Text>
              <Text style={styles.cell}>Ativos (7d)</Text>
              <Text style={styles.cell}>Horas de estudo</Text>
              <Text style={styles.cell}>Sequência média</Text>
              <Text style={styles.cell}>Quizzes (30d)</Text>
              <Text style={styles.cell}>Simulados (30d)</Text>
            </View>
            {bySchool.map((school) => (
              <View key={school.schoolId ?? 'todas'} style={styles.tableRow}>
                <Text style={styles.cellSchool}>{school.schoolName}</Text>
                <Text style={styles.cell}>{school.studentCount}</Text>
                <Text style={styles.cell}>{school.activeLast7dCount}</Text>
                <Text style={styles.cell}>{studyHoursOf(school.totalStudySeconds)}</Text>
                <Text style={styles.cell}>
                  {school.avgCurrentStreak.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                </Text>
                <Text style={styles.cell}>{school.quizzesDone30d}</Text>
                <Text style={styles.cell}>{school.simuladosDone30d}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Acervo</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.cellSchool}>Escolas</Text>
            <Text style={styles.cell}>{contentOverview.schoolCount}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellSchool}>Matérias</Text>
            <Text style={styles.cell}>{contentOverview.subjectCount}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellSchool}>Trilhas</Text>
            <Text style={styles.cell}>{contentOverview.trackCount}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellSchool}>Rascunhos</Text>
            <Text style={styles.cell}>{contentOverview.draftCount}</Text>
          </View>
          {contentOverview.publishedByKind.map(({ kind, count }) => (
            <View key={kind} style={styles.tableRow}>
              <Text style={styles.cellSchool}>{kindLabel(kind)} publicados</Text>
              <Text style={styles.cell}>{count}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer} fixed>
          Nexa Study · relatório geral · gerado automaticamente
        </Text>
      </Page>
    </Document>
  );
}
