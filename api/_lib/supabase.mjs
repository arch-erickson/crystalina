/* Supabase access from the server boundary.
   The service-role key never leaves this process. */
const URL_BASE = () => process.env.SUPABASE_URL;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

/* Privileged REST call using the service-role key. Bypasses RLS by design,
   so every caller must have already authorised the request. */
export async function admin(path, { method = 'GET', body, headers = {} } = {}) {
  const key = required('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(`${required('SUPABASE_URL')}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json', ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || `Supabase ${res.status}`);
  return data;
}

/* Resolve the caller from their Supabase access token. Returns null when the
   token is absent, expired or invalid. */
export async function userFromToken(authHeader) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const res = await fetch(`${URL_BASE()}/auth/v1/user`, {
      headers: { apikey: required('SUPABASE_PUBLISHABLE_KEY'), Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id ? { id: user.id, email: user.email, token } : null;
  } catch { return null; }
}

/* Call a Postgres function as the signed-in user so RLS and auth.uid() apply. */
export async function rpcAsUser(fn, args, token) {
  const res = await fetch(`${URL_BASE()}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: required('SUPABASE_PUBLISHABLE_KEY'),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || `Supabase RPC ${res.status}`);
  return data;
}
