import { headers } from 'next/headers';

/** O pedido vem do app Android (o Capacitor acrescenta `NexaStudyApp` ao User-Agent — ver `capacitor.config.ts`). */
export async function isNativeAppRequest(): Promise<boolean> {
  return ((await headers()).get('user-agent') ?? '').includes('NexaStudyApp');
}
