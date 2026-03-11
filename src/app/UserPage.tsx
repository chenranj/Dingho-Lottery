import { useState, useEffect, useRef } from "react";
import { useLottery } from "./useLottery";
import { ConfettiEffect } from "./components/ConfettiEffect";
import { HyperText } from "./components/HyperText";
import { Ripple } from "./components/Ripple";

export function UserPage() {
  const { state, connected, join, drawingCurrent } = useLottery(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const prevFinished = useRef(false);

  useEffect(() => {
    if (state?.status === "finished" && !prevFinished.current) {
      prevFinished.current = true;
      setConfettiTrigger(true);
    } else if (state?.status !== "finished") {
      prevFinished.current = false;
      setConfettiTrigger(false);
    }
  }, [state?.status]);

  useEffect(() => {
    if (state?.status === "closed") {
      setSubmitted(false);
    }
  }, [state?.status]);

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canJoin = state?.status === "idle" && nickname.trim() && email.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!canJoin) return;
    try {
      await join(nickname.trim(), email.trim());
      setSubmitted(true);
      setNickname("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "加入失败");
    }
  }

  if (!state) {
    return (
      <div className="page">
        <div className="card">
          <p className="text-muted">{connected ? "加载中…" : "连接中…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <ConfettiEffect trigger={confettiTrigger} />
      <div className="card">
        <img src="/logo.png" alt="Logo" className="logo" />
        <h1 className="title">{state.title}</h1>

        {state.status === "closed" && (
          <p className="waiting-msg">抽奖暂未发起，请稍后</p>
        )}

        {state.status === "idle" && (
          <form onSubmit={handleSubmit} className="form">
            <input
              type="text"
              placeholder="昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input"
              maxLength={50}
            />
            <input
              type="email"
              placeholder="Luma 邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              maxLength={200}
            />
            {error && <p className="error">{error}</p>}
            {submitted && <p className="success">已加入抽奖！</p>}
            <button type="submit" className="btn btn-primary" disabled={!canJoin}>
              加入抽奖
            </button>
          </form>
        )}

        {state.status === "drawing" && (
          <div className="drawing-animation">
            <p>抽奖中…</p>
            {drawingCurrent && (
              <p className="drawing-current">🎉 {drawingCurrent.nickname}</p>
            )}
          </div>
        )}

        {state.status === "finished" && state.winners && (
          <div className="winners">
            <Ripple mainCircleSize={160} mainCircleOpacity={0.18} numCircles={6} />
            <h2>🎉 中奖名单</h2>
            <ul>
              {state.winners.map((w, i) => (
                <li key={w.id}>
                  <HyperText duration={700} delay={i * 150} startOnView={true}>
                    {w.nickname}
                  </HyperText>
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.status === "idle" && (
          <div className="participants">
            <h3>已加入 ({state.participants.length})</h3>
            <ul className="participant-list">
              {state.participants.map((p) => (
                <li key={p.id}>{p.nickname}</li>
              ))}
            </ul>
          </div>
        )}

        {state.status === "finished" && (
          <div className="participants">
            <h3>已加入 ({state.participants.length})</h3>
            <ul className="participant-list">
              {state.participants.map((p) => (
                <li key={p.id}>{p.nickname}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
