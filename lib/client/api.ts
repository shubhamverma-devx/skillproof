import type { ApiResult } from '@/lib/api-response';

/** Client side wrapper that keeps the `{ data } | { error }` contract intact. */
export async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function patchJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function postForm<T>(url: string, form: FormData): Promise<ApiResult<T>> {
  return request<T>(url, { method: 'POST', body: form });
}

async function request<T>(url: string, init: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, init);
    const payload: unknown = await response.json();
    if (typeof payload === 'object' && payload !== null) {
      if ('data' in payload || 'error' in payload) return payload as ApiResult<T>;
    }
    return { error: `Unexpected response from the server (${response.status}).` };
  } catch {
    return { error: 'Could not reach the server. Check your connection and try again.' };
  }
}
