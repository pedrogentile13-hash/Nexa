import type { ChatMessage } from '../server/queries';

export type StreamEnd =
  | { t: 'done'; sessionId: string; isNewSession: boolean; assistant: ChatMessage }
  | { t: 'error'; message: string };

/** Lê a resposta em linhas JSON da rota de streaming; chama `onDelta` a cada pedaço de texto. */
export async function streamChat(
  formData: FormData,
  onDelta: (text: string) => void,
): Promise<StreamEnd> {
  let response: Response;
  try {
    response = await fetch('/api/nexa-ia/stream', { method: 'POST', body: formData });
  } catch {
    return { t: 'error', message: 'Sem conexão. Tente de novo.' };
  }
  if (!response.ok || !response.body)
    return { t: 'error', message: 'Não consegui responder agora. Tente de novo.' };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let end: StreamEnd | null = null;

  const handle = (line: string) => {
    if (!line.trim()) return;
    try {
      const event = JSON.parse(line) as { t: string; x?: string };
      if (event.t === 'delta' && event.x) onDelta(event.x);
      else if (event.t === 'done' || event.t === 'error') end = event as unknown as StreamEnd;
    } catch {
      // linha quebrada: ignora
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(handle);
  }
  handle(buffer);

  return end ?? { t: 'error', message: 'A resposta foi interrompida. Tente de novo.' };
}
