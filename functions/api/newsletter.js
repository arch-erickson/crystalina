/* POST /api/newsletter on Cloudflare Pages. See functions/_shim.js. */
import handler from '../../api/newsletter.mjs';
import { toPagesFunction } from '../_shim.js';

export const onRequest = toPagesFunction(handler);
