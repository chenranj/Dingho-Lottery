/**
 * Durable Object: LotteryRoom
 * Holds all lottery state in memory. No database required.
 * Supports WebSocket for real-time updates.
 */

export interface Participant {
  id: string;
  nickname: string;
  email: string;
  joinedAt: number;
}

export interface LotteryState {
  title: string;
  winnerCount: number;
  participants: Participant[];
  winners: Participant[] | null;
  status: "closed" | "idle" | "drawing" | "finished";
}

type MessageFromClient =
  | { type: "join"; nickname: string; email: string }
  | { type: "admin:set"; title?: string; winnerCount?: number }
  | { type: "admin:start" }
  | { type: "admin:draw" }
  | { type: "admin:reset" }
  | { type: "admin:subscribe" }
  | { type: "subscribe" };

type MessageToClient =
  | { type: "state"; state: LotteryState }
  | { type: "drawing"; current: Participant }
  | { type: "finished"; winners: Participant[] };

export class LotteryRoom implements DurableObject {
  private state: LotteryState = {
    title: "顶好喜剧",
    winnerCount: 1,
    participants: [],
    winners: null,
    status: "closed",
  };

  private clients = new Set<WebSocket>();
  private adminClients = new Set<WebSocket>();

  constructor(private ctx: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/ws" && request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }
    if (url.pathname === "/api/state") {
      return Response.json(this.state);
    }
    if (url.pathname === "/api/join" && request.method === "POST") {
      return this.handleJoin(request);
    }
    if (url.pathname === "/api/admin" && request.method === "POST") {
      return this.handleAdmin(request);
    }
    return new Response("Not found", { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const url = new URL(request.url);
    const isAdmin = url.searchParams.get("admin") === "1";

    this.ctx.acceptWebSocket(server);
    if (isAdmin) {
      this.adminClients.add(server);
    } else {
      this.clients.add(server);
    }

    server.send(JSON.stringify({ type: "state", state: this.state }));

    server.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as MessageFromClient;
        this.handleMessage(msg, server, isAdmin);
      } catch {
        // ignore
      }
    });

    server.addEventListener("close", () => {
      if (isAdmin) {
        this.adminClients.delete(server);
      } else {
        this.clients.delete(server);
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleMessage(msg: MessageFromClient, ws: WebSocket, isAdmin: boolean): void {
    switch (msg.type) {
      case "join":
        if (this.state.status !== "idle") return;
        const participant: Participant = {
          id: crypto.randomUUID(),
          nickname: msg.nickname.trim().slice(0, 50),
          email: msg.email.trim().slice(0, 200),
          joinedAt: Date.now(),
        };
        if (participant.nickname && participant.email) {
          this.state.participants.push(participant);
          this.broadcast();
        }
        break;
      case "admin:set":
        if (!isAdmin) return;
        if (msg.title !== undefined) this.state.title = String(msg.title).slice(0, 100);
        if (msg.winnerCount !== undefined)
          this.state.winnerCount = Math.max(1, Math.min(100, Math.floor(msg.winnerCount)));
        this.broadcast();
        break;
      case "admin:start":
        if (!isAdmin) return;
        this.state.status = "idle";
        this.broadcast();
        break;
      case "admin:draw":
        if (!isAdmin) return;
        this.runDraw();
        break;
      case "admin:reset":
        if (!isAdmin) return;
        this.state = {
          title: this.state.title,
          winnerCount: this.state.winnerCount,
          participants: [],
          winners: null,
          status: "closed",
        };
        this.broadcast();
        break;
      case "admin:subscribe":
      case "subscribe":
        ws.send(JSON.stringify({ type: "state", state: this.state }));
        break;
    }
  }

  private async runDraw(): Promise<void> {
    if (this.state.status !== "idle" || this.state.participants.length === 0) return;
    this.state.status = "drawing";
    this.broadcast();

    const count = Math.min(this.state.winnerCount, this.state.participants.length);
    const pool = [...this.state.participants];
    const winners: Participant[] = [];

    for (let i = 0; i < count; i++) {
      await new Promise((r) => setTimeout(r, 800)); // Animation delay per winner
      const idx = Math.floor(Math.random() * pool.length);
      const [selected] = pool.splice(idx, 1);
      winners.push(selected);
      this.broadcast({ type: "drawing", current: selected });
    }

    this.state.winners = winners;
    this.state.status = "finished";
    this.broadcast({ type: "finished", winners });
  }

  private async handleJoin(request: Request): Promise<Response> {
    if (this.state.status === "closed") {
      return Response.json({ error: "抽奖暂未发起，请稍后" }, { status: 400 });
    }
    if (this.state.status !== "idle") {
      return Response.json({ error: "抽奖已开始或已结束" }, { status: 400 });
    }
    const body = await request.json() as { nickname?: string; email?: string };
    const nickname = String(body.nickname ?? "").trim().slice(0, 50);
    const email = String(body.email ?? "").trim().slice(0, 200);
    if (!nickname || !email) {
      return Response.json({ error: "昵称和邮箱不能为空" }, { status: 400 });
    }
    const participant: Participant = {
      id: crypto.randomUUID(),
      nickname,
      email,
      joinedAt: Date.now(),
    };
    this.state.participants.push(participant);
    this.broadcast();
    return Response.json({ ok: true });
  }

  private async handleAdmin(request: Request): Promise<Response> {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action as string;
    if (action === "set") {
      if (body.title !== undefined) this.state.title = String(body.title).slice(0, 100);
      if (body.winnerCount !== undefined)
        this.state.winnerCount = Math.max(1, Math.min(100, Math.floor(Number(body.winnerCount))));
    } else if (action === "start") {
      this.state.status = "idle";
    } else if (action === "draw") {
      void this.runDraw();
    } else if (action === "reset") {
      this.state = {
        title: this.state.title,
        winnerCount: this.state.winnerCount,
        participants: [],
        winners: null,
        status: "closed",
      };
    }
    this.broadcast();
    return Response.json({ ok: true, state: this.state });
  }

  private broadcast(extra?: MessageToClient): void {
    const msg = extra ?? { type: "state" as const, state: this.state };
    const data = JSON.stringify(msg);
    for (const ws of this.clients) {
      try {
        ws.send(data);
      } catch {
        this.clients.delete(ws);
      }
    }
    for (const ws of this.adminClients) {
      try {
        ws.send(data);
      } catch {
        this.adminClients.delete(ws);
      }
    }
  }
}
