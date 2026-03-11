import { useState, useEffect } from "react";
import { useLottery } from "./useLottery";

export function AdminPage() {
  const { state, connected, drawingCurrent, adminAction } = useLottery(true);
  const [title, setTitle] = useState("");
  const [winnerCount, setWinnerCount] = useState(1);

  useEffect(() => {
    if (state) {
      setTitle(state.title);
      setWinnerCount(state.winnerCount);
    }
  }, [state?.title, state?.winnerCount]);

  const canEdit = state?.status === "closed";
  const canLaunch = state?.status === "closed";
  const canDraw = state?.status === "idle";
  const hasParticipants = (state?.participants.length ?? 0) > 0;
  const canReset = state?.status === "idle" || state?.status === "finished";
  const isDrawing = state?.status === "drawing";

  async function handleSave() {
    await adminAction("set", { title, winnerCount });
  }

  async function handleLaunch() {
    await adminAction("start");
  }

  async function handleDraw() {
    await adminAction("draw");
  }

  async function handleReset() {
    await adminAction("reset");
  }

  if (!state) {
    return (
      <div className="page">
        <div className="card admin-card">
          <p className="text-muted">{connected ? "加载中…" : "连接中…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card admin-card">
        <h1 className="title">管理后台</h1>

        <div className="admin-section">
          <h3>抽奖设置</h3>
          <div className="form-row">
            <label>
              <span>标题</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                className="input"
                disabled={!canEdit}
              />
            </label>
            <label>
              <span>中奖人数</span>
              <input
                type="number"
                min={1}
                max={100}
                value={winnerCount}
                onChange={(e) => setWinnerCount(Number(e.target.value))}
                onBlur={handleSave}
                className="input"
                disabled={!canEdit}
              />
            </label>
          </div>
        </div>

        <div className="admin-section">
          <h3>操作</h3>
          <div className="btn-row">
            {canLaunch && !isDrawing && (
              <button className="btn btn-primary" onClick={handleLaunch}>
                发起抽奖
              </button>
            )}
            {canDraw && !isDrawing && (
              <button
                className="btn btn-accent"
                onClick={handleDraw}
                disabled={!hasParticipants}
                title={!hasParticipants ? "请等待用户加入" : undefined}
              >
                开始抽奖
              </button>
            )}
            {canReset && !isDrawing && (
              <button className="btn btn-ghost" onClick={handleReset}>
                重新开始
              </button>
            )}
          </div>
        </div>

        {state.status === "drawing" && (
          <div className="drawing-animation">
            <p>抽奖中…</p>
            {drawingCurrent && (
              <p className="drawing-current">🎉 {drawingCurrent.nickname}</p>
            )}
          </div>
        )}

        {state.status === "finished" && state.winners && (
          <div className="admin-winners">
            <h3>中奖名单（含邮箱）</h3>
            <ul>
              {state.winners.map((w) => (
                <li key={w.id}>
                  <strong>{w.nickname}</strong> — {w.email}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="admin-participants">
          <h3>已加入 ({state.participants.length})</h3>
          <ul>
            {state.participants.map((p) => (
              <li key={p.id}>
                {p.nickname} — {p.email}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
