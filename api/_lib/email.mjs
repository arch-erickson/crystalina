/* Transactional email through Resend.
   No-ops with a warning when RESEND_API_KEY is absent, so form submissions are
   still stored rather than lost while email is being provisioned. */
export async function sendEmail({ to, subject, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Crystalina <noreply@crystalina.org>';
  if (!key) { console.warn('[Crystalina] RESEND_API_KEY unset; skipped email:', subject); return { skipped: true }; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) })
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

/* Escape interpolated values so email HTML cannot be injected. */
export const esc = value => String(value ?? '')
  .replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
