'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { NotificationSettings } from '@/types/database.types';
import { updateNotificationSettings } from '../server/actions';

const ITEMS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  {
    key: 'dailyReminder',
    label: 'Lembrete diário',
    description: 'Um aviso para não perder a sequência de estudo do dia.',
  },
  {
    key: 'revisionReminder',
    label: 'Revisões',
    description: 'Quando uma questão ou conteúdo está pronto para ser revisado.',
  },
  {
    key: 'achievementsAndGoals',
    label: 'Conquistas e metas',
    description: 'Selos desbloqueados e progresso das suas metas.',
  },
  {
    key: 'newsUpdates',
    label: 'Novidades',
    description: 'Anúncios de novos recursos da plataforma.',
  },
];

/**
 * Cada troca já salva sozinha (sem botão de "salvar") — é um toggle, o
 * estado esperado é otimista com reversão silenciosa se a gravação falhar.
 */
export function NotificationSettingsForm({ initial }: { initial: NotificationSettings }) {
  const [settings, setSettings] = useState(initial);
  const [savedAt, setSavedAt] = useState<keyof NotificationSettings | null>(null);
  const [, startTransition] = useTransition();

  function toggle(key: keyof NotificationSettings, checked: boolean) {
    const next = { ...settings, [key]: checked };
    setSettings(next);
    setSavedAt(null);
    startTransition(async () => {
      const result = await updateNotificationSettings(next);
      if (!result.ok) {
        setSettings(settings);
        return;
      }
      setSavedAt(key);
    });
  }

  return (
    <ul className="divide-border divide-y">
      {ITEMS.map((item) => (
        <li key={item.key} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-muted text-xs">{item.description}</p>
          </div>
          {savedAt === item.key && (
            <Check className="text-success size-4 shrink-0" aria-hidden />
          )}
          <Switch
            checked={settings[item.key]}
            onChange={(checked) => toggle(item.key, checked)}
            label={item.label}
          />
        </li>
      ))}
    </ul>
  );
}
