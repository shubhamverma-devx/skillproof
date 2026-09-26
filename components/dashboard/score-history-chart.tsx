'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDateTime } from '@/lib/utils';
import type { ScoreHistoryEntry } from '@/types/domain';

export function ScoreHistoryChart({ history }: { history: ScoreHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <p className="px-5 py-4 text-ui-sm text-muted">
        Your score history appears here after your first progress update.
      </p>
    );
  }

  const data = history.map((entry, index) => ({
    index: index + 1,
    score: entry.score,
    reason: entry.reason,
    at: formatDateTime(entry.created_at),
  }));

  return (
    <div className="px-2 py-4">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 6, right: 14, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="rgb(var(--ink) / 0.08)" vertical={false} />
          <XAxis
            dataKey="index"
            allowDecimals={false}
            tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }}
            stroke="rgb(var(--ink) / 0.15)"
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: 'rgb(var(--muted))', fontSize: 12 }}
            stroke="rgb(var(--ink) / 0.15)"
            tickLine={false}
            width={38}
          />
          <Tooltip
            contentStyle={{
              background: 'rgb(var(--surface))',
              border: '1px solid rgb(var(--ink) / 0.12)',
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
            stroke="rgb(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3, fill: 'rgb(var(--primary))', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {history.length === 1 ? (
        <p className="px-3 pb-1 text-ui-sm text-muted">
          One reading so far. Verify a skill or log progress to see the line move.
        </p>
      ) : null}
    </div>
  );
}
