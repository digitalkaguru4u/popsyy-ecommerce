const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body, opts = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers: isForm || body === undefined ? { Accept: 'application/json' } : { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    signal: opts.signal,
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!res.ok) throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.details);
  return data;
}

export const api = {
  get: (p, o) => request('GET', p, undefined, o),
  post: (p, b, o) => request('POST', p, b ?? {}, o),
  put: (p, b, o) => request('PUT', p, b ?? {}, o),
  patch: (p, b, o) => request('PATCH', p, b ?? {}, o),
  del: (p, o) => request('DELETE', p, undefined, o),
};

export const apiUrl = (p) => `${BASE}/api${p}`;
export const assetUrl = (u) => (!u ? '' : /^https?:|^data:/.test(u) ? u : u.startsWith('/uploads') ? `${BASE}${u}` : u);

export const qs = (obj) => {
  const s = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== false) s.set(k, Array.isArray(v) ? v.join(',') : v); });
  const str = s.toString();
  return str ? `?${str}` : '';
};
