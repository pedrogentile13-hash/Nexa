import { runChat } from '@/features/nexa-ia/server/chat-core';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Chat da NexaAI com a resposta chegando AOS POUCOS.
 *
 * Devolve linhas JSON: `{"t":"delta","x":"texto"}` enquanto a IA escreve e, no fim,
 * `{"t":"done",...}` com a mensagem salva (ou `{"t":"error","message":"..."}`).
 * Route Handler (não Server Action) porque só ele consegue transmitir a resposta.
 */
export async function POST(request: Request) {
  // Mesma proteção das outras rotas de escrita: só o próprio site chama.
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return new Response('Forbidden', { status: 403 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      try {
        const result = await runChat(formData, (x) => send({ t: 'delta', x }));
        send(result.ok ? { t: 'done', sessionId: result.sessionId, isNewSession: result.isNewSession, assistant: result.assistant } : { t: 'error', message: result.message });
      } catch {
        send({ t: 'error', message: 'Não consegui responder agora. Tente de novo.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  });
}
