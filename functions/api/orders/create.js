/* POST /api/orders/create on Cloudflare Pages. See functions/_shim.js.
   The money path: the browser sends ids and quantities, create_order prices
   every line in the database. Nothing about that changes with the host. */
import handler from '../../../api/orders/create.mjs';
import { toPagesFunction } from '../../_shim.js';

export const onRequest = toPagesFunction(handler);
