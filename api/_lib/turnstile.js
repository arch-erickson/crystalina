/* Cloudflare Turnstile verification.
   When TURNSTILE_SECRET_KEY is unset, verification is skipped so the
   endpoints stay usable before bot protection is provisioned. Set the key in
   Vercel to enforce it. */
export async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, error: 'Captcha missing.' };
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) })
    });
    const data = await res.json();
    return data.success ? { ok: true } : { ok: false, error: 'Captcha failed.' };
  } catch {
    return { ok: false, error: 'Captcha verification unavailable.' };
  }
}
