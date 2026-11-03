/* Cloudflare Turnstile verification.
 *
 * Captcha has two halves and they are configured in different places: a
 * widget on the page, which needs the site key, and this check, which
 * needs the secret. Either one alone is useless, and one of the two
 * combinations is actively dangerous.
 *
 * Until 2026-11-03 this enforced as soon as the secret existed. No page
 * rendered a widget, so `window.turnstile?.getResponse?.()` was
 * undefined in all three callers and the moment anyone set
 * TURNSTILE_SECRET_KEY every contact message, every newsletter signup
 * and every order would have been refused. Setting a security key is
 * supposed to be the safe thing to do; it should not be able to take the
 * forms down.
 *
 * So enforcement now needs both keys. TURNSTILE_SITE_KEY is what the page
 * needs to render a widget at all, so its presence is the nearest honest
 * signal that there is a widget out there sending tokens. Secret alone is
 * treated as a half-finished setup: it logs loudly and lets the customer
 * through, because refusing real people is worse than letting a bot
 * through on a contact form.
 *
 * Both keys set and no token still fails, as it should: that is either a
 * bot or a broken widget, and by then there is a widget to be broken.
 */
export async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.TURNSTILE_SITE_KEY;

  /* Not provisioned. Nothing to check. */
  if (!secret && !siteKey) return { ok: true, skipped: 'not configured' };

  /* Half provisioned, in the direction that would refuse customers. */
  if (secret && !siteKey) {
    console.error(
      '[turnstile] TURNSTILE_SECRET_KEY is set but TURNSTILE_SITE_KEY is not, '
      + 'so no page can render a widget and no token can exist. Skipping '
      + 'verification rather than refusing every submission. Set the site key '
      + 'and put the widget on the forms, or unset the secret.',
    );
    return { ok: true, skipped: 'site key missing' };
  }

  /* Half provisioned, harmlessly: a widget may be rendering, but there is
     nothing to check it against. */
  if (!secret && siteKey) {
    console.warn('[turnstile] site key set without a secret, so tokens are not verified.');
    return { ok: true, skipped: 'secret missing' };
  }

  if (!token) return { ok: false, error: 'Complete the check below, then send again.' };

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
    });
    const data = await res.json();
    if (data.success) return { ok: true };
    console.warn('[turnstile] rejected:', (data['error-codes'] || []).join(', '));
    return { ok: false, error: 'The check did not pass. Try it once more.' };
  } catch (error) {
    /* Cloudflare unreachable. Refusing the customer because our captcha
       provider is down punishes the wrong person. */
    console.error('[turnstile] siteverify unreachable, allowing through', error);
    return { ok: true, skipped: 'verification unavailable' };
  }
}
