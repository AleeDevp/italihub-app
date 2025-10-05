import { requireUser } from '@/lib/auth';
import { notificationBroker } from '@/lib/sse/notification-broker';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireUser();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const encoder = new TextEncoder();

  const send: (event: string, data: any) => void = (event, data) => {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const sse = `event: ${event}\n` + `data: ${payload}\n\n`;
    writer.write(encoder.encode(sse));
  };

  // Initial ping
  send('ping', { t: Date.now() });

  const conn = {
    id: Math.random().toString(36).slice(2),
    userId: user.id,
    send,
    close: () => writer.close(),
  };
  notificationBroker.addConnection(conn);

  const heartbeat = setInterval(() => send('ping', { t: Date.now() }), 30000);

  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });

  const cleanup = () => {
    clearInterval(heartbeat);
    notificationBroker.removeConnection(conn);
    try {
      writer.close();
    } catch {}
  };

  // Cleanup on client abort (tab closed, nav away)
  // In Next.js, the request signal aborts when client disconnects
  req.signal.addEventListener('abort', cleanup);

  return response;
}
