import { getStore } from '@/lib/db';
import type { AgentLogLevel } from '@/types/domain';
import type { StepLogger } from '@/lib/llm/types';

export type TraceListener = (entry: {
  step: string;
  detail: string;
  level: AgentLogLevel;
}) => void;

/**
 * Writes one agent step to the database and, when the analyse route is
 * streaming, pushes the same step to the connected client.
 */
export class Tracer implements StepLogger {
  constructor(
    private readonly profileId: string,
    private readonly listener?: TraceListener,
  ) {}

  info(step: string, detail: string) {
    return this.log(step, detail, 'info');
  }

  warn(step: string, detail: string) {
    return this.log(step, detail, 'warn');
  }

  error(step: string, detail: string) {
    return this.log(step, detail, 'error');
  }

  private async log(step: string, detail: string, level: AgentLogLevel): Promise<void> {
    this.listener?.({ step, detail, level });
    try {
      await getStore().addLog(this.profileId, step, detail, level);
    } catch (error) {
      // The trace is an observability aid; losing a row must not fail the run.
      console.warn('trace write failed', error instanceof Error ? error.message : error);
    }
  }
}
