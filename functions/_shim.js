/* Run the existing /api handlers on Cloudflare Pages Functions.
 *
 * The three handlers in /api are written in the Node request and response
 * style that Vercel uses. Pages Functions are given a fetch Request and
 * return a fetch Response. Rather than rewrite three working, tested
 * handlers, this adapts between the two shapes in one place (AD2).
 *
 * The surface the handlers actually use is small, which is why this is
 * twenty lines of adapter rather than a framework:
 *
 *   req.method, req.headers, req.body, req.socket.remoteAddress,
 *   async iteration over req for the raw body
 *   res.setHeader, res.status, res.send
 *
 * Needs the nodejs_compat flag, for Buffer and for node:crypto, which
 * api/contact.mjs uses to hash. See wrangler.toml.
 */

/* Pages passes bindings and environment variables as `env`. The handlers and
   their libraries read process.env, so put them there. Every request in an
   isolate sees the same env, so writing the same values repeatedly is safe. */
function installEnv(env) {
  if (!globalThis.process) globalThis.process = { env: {} };
  if (!globalThis.process.env) globalThis.process.env = {};
  for (const [key, value] of Object.entries(env || {})) {
    if (typeof value === 'string') globalThis.process.env[key] = value;
  }
}

function nodeRequest(request, bodyBytes) {
  const headers = {};
  for (const [key, value] of request.headers) headers[key.toLowerCase()] = value;

  return {
    method: request.method,
    url: new URL(request.url).pathname,
    headers,
    /* Cloudflare always sets cf-connecting-ip, and sets x-forwarded-for too.
       clientIp() prefers the forwarded header and falls back to this. */
    socket: { remoteAddress: request.headers.get('cf-connecting-ip') || 'unknown' },
    /* Left undefined on purpose: readJson() returns req.body when it is
       already an object, and we want it to parse the raw bytes so that
       invalid JSON still throws the way the handlers expect. */
    body: undefined,
    async* [Symbol.asyncIterator]() {
      if (bodyBytes && bodyBytes.byteLength) yield Buffer.from(bodyBytes);
    },
  };
}

function nodeResponse() {
  const headers = new Headers();
  let status = 200;
  let payload = null;
  let sent = false;

  const res = {
    setHeader(key, value) { headers.set(key, String(value)); return res; },
    getHeader(key) { return headers.get(key); },
    removeHeader(key) { headers.delete(key); return res; },
    status(code) { status = code; return res; },
    send(body) { payload = body; sent = true; return res; },
    end(body) { if (body !== undefined) payload = body; sent = true; return res; },
    json(body) { headers.set('Content-Type', 'application/json; charset=utf-8'); payload = JSON.stringify(body); sent = true; return res; },
  };

  return {
    res,
    toResponse() {
      if (!sent) {
        /* A handler that returned without answering is a bug, and a silent
           200 would hide it. */
        return new Response(JSON.stringify({ error: 'The request was not answered.' }), {
          status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
      return new Response(payload, { status, headers });
    },
  };
}

export function toPagesFunction(handler) {
  return async function onRequest(context) {
    installEnv(context.env);

    let bodyBytes = null;
    if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
      bodyBytes = await context.request.arrayBuffer();
    }

    const req = nodeRequest(context.request, bodyBytes);
    const { res, toResponse } = nodeResponse();

    try {
      await handler(req, res);
    } catch (error) {
      /* Never leak an internal message to the caller, and never swallow it
         either: it belongs in the Pages log. */
      console.error('Unhandled error in', req.url, error && error.stack ? error.stack : error);
      return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
        status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    return toResponse();
  };
}
