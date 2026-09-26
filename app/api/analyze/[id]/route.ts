import { runAnalysis } from '@/lib/agent/analyze';
import { getStore } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import type { AnalyzeStreamEvent } from '@/types/api';

export const dynamic = 'force-dynamic';
// The model SDKs, the Supabase client and the resume parser all need Node APIs.
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Streams the agent's steps as they happen with Server Sent Events, so the
 * analysis screen shows real progress instead of a spinner over a long request.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  // A demo profile replays a recorded scan and recorded model replies, so it
  // costs nothing to serve and is left alone.
  const profile = await getStore().getProfile(params.id);
  if (!profile?.is_demo) {
    const limited = await rateLimit('analyze', request);
    if (limited) return limited;
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AnalyzeStreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      // The first byte goes out before any work starts, so a proxy never sees an
      // idle connection while the resume is being read.
      send({
        type: 'step',
        step: 'Agent started',
        detail: 'Reading your profile before touching any external service',
        level: 'info',
      });

      // Model calls can sit for up to 20 seconds each; a comment line keeps the
      // connection alive without confusing the client parser.
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 15_000);

      try {
        const result = await runAnalysis(params.id, (entry) => send({ type: 'step', ...entry }));
        if (result.github_warning) {
          send({
            type: 'step',
            step: 'Continuing without GitHub',
            detail: result.github_warning,
            level: 'warn',
          });
        }
        send({ type: 'done', score: result.score });
      } catch (error) {
        send({
          type: 'error',
          message: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
        });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
