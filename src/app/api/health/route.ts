export const dynamic = 'force-dynamic';

/** Resposta mínima, sem banco: serve para um monitor (UptimeRobot etc.) manter o servidor acordado e avisar se cair. */
export function GET() {
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
