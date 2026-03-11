/**
 * Cloudflare Worker: Routes /api and /ws to Durable Object, serves assets with SPA fallback.
 */

import { LotteryRoom } from "./lottery";

export { LotteryRoom };

interface Env {
  LOTTERY: DurableObjectNamespace;
  ASSETS: Fetcher;
}

const LOTTERY_ID = "default";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API and WebSocket: forward to Durable Object
    if (url.pathname.startsWith("/api/") || url.pathname === "/ws") {
      const id = env.LOTTERY.idFromName(LOTTERY_ID);
      const stub = env.LOTTERY.get(id);
      return stub.fetch(request);
    }

    // Static assets; SPA fallback for / and /dingho
    let assetRequest = request;
    if (url.pathname === "/" || url.pathname === "/dingho") {
      assetRequest = new Request(new URL("/index.html", url.origin));
    }
    const res = await env.ASSETS.fetch(assetRequest);
    if (res.status !== 404) return res;
    return new Response("Not found", { status: 404 });
  },
};
