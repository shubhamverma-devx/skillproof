-- Per client fixed window counters for the routes that cost money to serve.
-- The counter lives in Postgres rather than in process memory because a
-- serverless deployment runs many instances and an in memory counter would
-- reset on every cold start.

create table if not exists rate_limits (
  bucket text primary key,
  hits integer not null default 0,
  expires_at timestamptz not null
);

create index if not exists rate_limits_expires_idx on rate_limits (expires_at);

-- Returns the caller's hit count inside the current window. One statement, so
-- concurrent requests from the same client cannot both read a stale count.
create or replace function consume_rate_limit(p_bucket text, p_window_seconds integer)
returns integer
language plpgsql
as $$
declare
  v_hits integer;
begin
  insert into rate_limits (bucket, hits, expires_at)
  values (p_bucket, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (bucket) do update
    set hits = case
          when rate_limits.expires_at < now() then 1
          else rate_limits.hits + 1
        end,
        expires_at = case
          when rate_limits.expires_at < now()
            then now() + make_interval(secs => p_window_seconds)
          else rate_limits.expires_at
        end
  returning hits into v_hits;

  -- Opportunistic cleanup: cheap, and it keeps the table from growing forever
  -- without needing a scheduled job.
  if random() < 0.01 then
    delete from rate_limits where expires_at < now() - interval '1 hour';
  end if;

  return v_hits;
end;
$$;
