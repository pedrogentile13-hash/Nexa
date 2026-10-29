import { runStaffChat } from '@/features/staff-ia/server/staff-chat';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Chat da NexaAI dos painéis da equipe, com a resposta chegando aos poucos (mesmo formato da rota do aluno). */
export async function POST(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return new Response('Forbidden', { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      try {
        const result = await runStaffChat(body, (x) => send({ t: 'delta', x }));
        send(result.ok ? { t: 'done', text: result.text } : { t: 'error', message: result.message });
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
