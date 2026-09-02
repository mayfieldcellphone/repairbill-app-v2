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

// Two, and only two, ways to bootstrap a dashboard session:
//  - { sandbox: true } -> always resolves server-side to the single shared, seeded
//    demo business. No identity is trusted from the client on this path.
//  - { idToken } -> a real Firebase ID token for the signed-in user; the server
//    verifies it and derives the business from the token's own verified email.
// There is intentionally no way to pass an arbitrary business id from here -- that
// was the bug. Do not add a `uid` parameter back to this function.
export async function bootstrapBusinessSession(
  name?: string,
  opts: { sandbox?: boolean; idToken?: string; apiKey?: string } = {}
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.idToken) headers['Authorization'] = `Bearer ${opts.idToken}`;

  const res = await fetch('/api/auth/bootstrap', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sandbox: !!opts.sandbox, name, apiKey: opts.apiKey })
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
