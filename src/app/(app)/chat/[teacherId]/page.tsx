import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { TeacherChat } from '@/features/school-chat/components/teacher-chat';
import { getConversation, listMyTeachers } from '@/features/school-chat/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Chat com o professor' };

export const dynamic = 'force-dynamic';

export default async function TeacherChatPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { teacherId } = await params;
  const teacher = (await listMyTeachers()).find((t) => t.teacherId === teacherId);
  if (!teacher) notFound();

  const messages = await getConversation(teacherId);

  return (
    <>
      <AppHeader title={teacher.fullName} subtitle={teacher.subjects} />
      <PageMain className="pt-4 md:pt-6">
        <TeacherChat teacherId={teacherId} teacherName={teacher.fullName} messages={messages} />
      </PageMain>
    </>
  );
}
