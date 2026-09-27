'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatClock, formatDateTime, formatDay } from '@/lib/utils';
import type { ScoreHistoryEntry } from '@/types/domain';

/** Every recalculation, with the reason it happened. No gridline noise. */
export function ScoreHistoryChart({ history }: { history: ScoreHistoryEntry[] }) {
  if (history.length < 2) {
    return (
      <p className="px-5 pb-5 text-sm text-ink-muted">
        Your score appears here as a line once you have logged something. Right now there is only
        one reading.
      </p>
    );
  }

  // Several readings in one sitting all carry the same date, so the tick shows
  // the clock instead whenever the whole history fits inside a single day.
  const days = new Set(history.map((entry) => formatDay(entry.created_at)));
  const tickOf = (iso: string) => (days.size > 1 ? formatDay(iso) : formatClock(iso).slice(0, 5));

  const data = history.map((entry) => ({
    day: tickOf(entry.created_at),
    score: entry.score,
    reason: entry.reason,
    at: formatDateTime(entry.created_at),
  }));

  return (
    <div className="px-2 pb-4">
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="day"
            interval="preserveStartEnd"
            minTickGap={28}
            tick={{ fill: 'rgb(var(--ink-faint))', fontSize: 11 }}
            axisLine={{ stroke: 'rgb(var(--line))' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={(value: number) => String(value)}
            tick={{ fill: 'rgb(var(--ink-faint))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <Tooltip
            cursor={{ stroke: 'rgb(var(--line))' }}
            contentStyle={{
              background: 'rgb(var(--surface-raised))',
              border: '1px solid rgb(var(--line))',
              borderRadius: 8,
              fontSize: 13,
              color: 'rgb(var(--ink))',
            }}
            labelFormatter={(_label, payload) => String(payload[0]?.payload?.at ?? '')}
            formatter={(value, _name, item) => [
              `${String(value)} out of 100`,
              String(item?.payload?.reason ?? 'Score update'),
            ]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="rgb(var(--accent))"
            strokeWidth={2}
            dot={{ r: 2.5, fill: 'rgb(var(--accent))', strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
