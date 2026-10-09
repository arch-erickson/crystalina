/* POST /api/contact on Cloudflare Pages.
   The handler is unchanged; _shim.js adapts between the Node request and
   response style it is written in and the fetch style Pages speaks. */
import handler from '../../api/contact.mjs';
import { toPagesFunction } from '../_shim.js';

export const onRequest = toPagesFunction(handler);
