'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ChevronRight, FileText, HelpCircle, LogOut, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { InstallCard } from '@/features/install/components/install-card';
import { signOut } from '@/features/auth/server/actions';
import type { NotificationSettings } from '@/types/database.types';
import { NotificationSettingsForm } from './notification-settings-form';
import { PushSelfTest } from '@/features/notifications/components/push-self-test';
import { ProfileForm } from './profile-form';
import { SchoolPicker, type CurrentSchool } from './school-picker';
import { ClassPicker } from './class-picker';
import type { ClassOption } from '@/features/classes/server/queries';

type Tab = 'conta' | 'notificacoes' | 'aparencia' | 'privacidade';

const TABS: { value: Tab; label: string }[] = [
  { value: 'conta', label: 'Conta' },
  { value: 'notificacoes', label: 'Notificações' },
  { value: 'aparencia', label: 'Aparência' },
  { value: 'privacidade', label: 'Privacidade' },
];

export function ProfileTabs({
  email,
  fullName,
  gradeLevel,
  dailyGoal,
  weeklyGoal,
  currentSchool,
  currentClassId,
  currentClassName,
  schoolClasses,
  notificationSettings,
}: {
  email?: string | null;
  fullName: string;
  gradeLevel: string | null;
  dailyGoal: number;
  weeklyGoal: number;
  currentSchool: CurrentSchool | null;
  currentClassId: string | null;
  currentClassName: string | null;
  schoolClasses: ClassOption[];
  notificationSettings: NotificationSettings;
}) {
  const [tab, setTab] = useState<Tab>('conta');

  return (
    <div className="min-w-0 lg:col-span-2">
      <UnderlineTabs
        label="Seções do perfil"
        value={tab}
        onChange={setTab}
        className="mb-4"
        options={TABS}
      />

      {tab === 'conta' && (
        <Card>
          <CardHeader>
            <CardTitle>Seus dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="divide-border divide-y text-sm">
              <Row label="E-mail" value={email} />
            </dl>

            <div className="border-border space-y-3 border-t pt-4">
              <h3 className="text-muted text-xs font-semibold tracking-wide uppercase">Escola</h3>
              <SchoolPicker currentSchool={currentSchool} />
            </div>

            <div className="border-border space-y-3 border-t pt-4">
              <h3 className="text-muted text-xs font-semibold tracking-wide uppercase">Turma</h3>
              <ClassPicker
                currentSchoolId={currentSchool?.id ?? null}
                currentClassId={currentClassId}
                currentClassName={currentClassName}
                classes={schoolClasses}
              />
            </div>

            <div className="border-border border-t pt-4">
              <ProfileForm
                fullName={fullName}
                gradeLevel={gradeLevel}
                dailyGoal={dailyGoal}
                weeklyGoal={weeklyGoal}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'notificacoes' && (
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationSettingsForm initial={notificationSettings} />
            <PushSelfTest />
          </CardContent>
        </Card>
      )}

      {tab === 'aparencia' && (
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm">Tema</span>
              <ThemeToggle />
            </div>
            {/* O banner de instalação aparece uma vez e some. Quem recusou
                naquele momento e depois mudou de ideia precisa de um lugar
                previsível para procurar — e é aqui que as pessoas procuram. */}
            <InstallCard />
          </CardContent>
        </Card>
      )}

      {tab === 'privacidade' && (
        <Card>
          <CardContent className="divide-border divide-y p-0">
            <PrivacyRow
              icon={<ShieldCheck className="size-4" aria-hidden />}
              label="Conta e privacidade"
              comingSoon
            />
            <PrivacyRow
              icon={<HelpCircle className="size-4" aria-hidden />}
              label="Ajuda e suporte"
              comingSoon
            />
            <PrivacyRow
              icon={<ShieldCheck className="size-4" aria-hidden />}
              label="Política de Privacidade"
              href="/politica-de-privacidade"
            />
            <PrivacyRow
              icon={<FileText className="size-4" aria-hidden />}
              label="Termos de Uso"
              href="/termos-de-uso"
            />
            <form action={signOut}>
              <button
                type="submit"
                className="text-danger flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium"
              >
                <LogOut className="size-4" aria-hidden />
                Sair da conta
              </button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{value ?? '—'}</dd>
    </div>
  );
}

/**
 * "Conta e privacidade" e "Ajuda e suporte" não têm tela nem conteúdo hoje —
 * ficam visíveis (é assim que o produto vai crescer) mas desabilitadas, em
 * vez de linkar para algo que não existe. Política de Privacidade e Termos de
 * Uso já têm página real (`(legal)`), então essas linkam de verdade.
 */
function PrivacyRow({
  icon,
  label,
  comingSoon,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  comingSoon?: boolean;
  href?: Route;
}) {
  const content = (
    <>
      {icon}
      <span className="flex-1">{label}</span>
      {comingSoon ? (
        <Badge variant="neutral">Em breve</Badge>
      ) : (
        <ChevronRight className="text-subtle size-4" aria-hidden />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3.5 text-sm font-medium"
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={
        comingSoon
          ? 'text-subtle flex items-center gap-3 px-4 py-3.5 text-sm font-medium'
          : 'flex items-center gap-3 px-4 py-3.5 text-sm font-medium'
      }
    >
      {content}
    </div>
  );
}
