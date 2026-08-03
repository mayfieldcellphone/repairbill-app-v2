const TOKEN_KEY = 'rb_business_token';
const BUSINESS_KEY = 'rb_business_profile';

export function getBusinessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setBusinessSession(token: string, business: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(BUSINESS_KEY, JSON.stringify(business));
}

export function getBusinessProfile(): any | null {
  try {
    const raw = localStorage.getItem(BUSINESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearBusinessSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(BUSINESS_KEY);
}

export async function bootstrapBusinessSession(uid: string, name?: string, apiKey?: string) {
  const res = await fetch('/api/auth/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, name, apiKey })
  });
  if (!res.ok) throw new Error('Failed to bootstrap business session');
  const data = await res.json();
  setBusinessSession(data.token, data.business);
  return data.business;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getBusinessToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) {
    clearBusinessSession();
  }
  return res;
}
