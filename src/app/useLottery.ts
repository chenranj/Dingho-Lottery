import { useEffect, useState, useCallback } from "react";

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

const POLL_INTERVAL = 1500;

function getWsUrl(admin = false): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${proto}//${host}/ws${admin ? "?admin=1" : ""}`;
}

export function useLottery(admin = false) {
  const [state, setState] = useState<LotteryState | null>(null);
  const [drawingCurrent, setDrawingCurrent] = useState<Participant | null>(null);
  const [connected, setConnected] = useState(false);

  const fetchState = useCallback(async () => {
    const res = await fetch("/api/state");
    if (res.ok) {
      const data = await res.json();
      setState(data);
      if (data.status !== "drawing") setDrawingCurrent(null);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const timer = setInterval(fetchState, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchState]);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(getWsUrl(admin));
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "state") {
            setState(msg.state);
            setDrawingCurrent(null);
          }
          if (msg.type === "drawing") {
            setState((s) => (s ? { ...s, status: "drawing" } : null));
            setDrawingCurrent(msg.current);
          }
          if (msg.type === "finished") {
            setState((s) => (s ? { ...s, winners: msg.winners, status: "finished" } : null));
            setDrawingCurrent(null);
          }
        } catch {
          // ignore
        }
      };
    }
    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [admin]);

  const join = useCallback(async (nickname: string, email: string) => {
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "加入失败");
    }
    await fetchState();
  }, [fetchState]);

  const adminAction = useCallback(
    async (action: string, data?: Record<string, unknown>) => {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      });
      if (!res.ok) throw new Error("操作失败");
      const json = await res.json();
      if (json.state) setState(json.state);
    },
    []
  );

  return { state, connected, drawingCurrent, join, adminAction };
}
