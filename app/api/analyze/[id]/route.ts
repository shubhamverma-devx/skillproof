import { runAnalysis } from '@/lib/agent/analyze';
import type { AnalyzeStreamEvent } from '@/types/api';

export const dynamic = 'force-dynamic';

/**
 * Streams the agent's steps as they happen with Server Sent Events, so the
 * analysis screen shows real progress instead of a spinner over a long request.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AnalyzeStreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

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
