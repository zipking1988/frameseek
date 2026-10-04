import React, {
  useSyncExternalStore,
  useRef,
  useState,
  useEffect,
} from "react";
import { createRoot } from "react-dom/client";

const store = window.FrameSeekWorkbenchModel.createStore();
window.FrameSeekWorkbench = store;
const clock = window.FrameSeekWorkbenchModel.clock;
const useDesk = () => useSyncExternalStore(store.subscribe, store.getSnapshot);
const ui = () => window.FrameSeekUI;
const icon = (name) => (
  <img className="icon" src={`/static/icons/${name}.svg`} alt="" />
);
const labels = {
  ok: "画面可确认",
  partial: "仍有未确认项",
  no_result: "未找到画面",
  error: "未完成",
};

function ProjectTitle() {
  const state = useDesk();
  return (
    <div className="project-name">
      <span>工作区 /</span>
      <input
        aria-label="调查名称"
        value={state.title}
        onChange={(e) => store.rename(e.target.value)}
        onBlur={() =>
          !store.getSnapshot().title.trim() && store.rename("未命名调查")
        }
        maxLength={80}
      />
      <span className="session-label">本次会话</span>
    </div>
  );
}
function Outline() {
  const state = useDesk();
  return (
    <section className="investigation-outline">
      <div className="section-line">
        <h2>调查脉络</h2>
        <span>{state.records.length} 轮</span>
      </div>
      {state.records.length ? (
        <ol>
          {state.records.map((record, index) => (
            <li key={record.id}>
              <button
                className={record.id === state.selectedId ? "active" : ""}
                onClick={() => ui()?.select(record.id)}
              >
                <span className="outline-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{record.query.question}</span>
                <span
                  className={`outline-state ${record.query.response.status}`}
                />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted-text">
          每次追问会留在画布上。选中旧问题，可以从那里继续。
        </p>
      )}
      <p className="session-footnote">合成素材 · 预设对话 · 当前页面会话</p>
    </section>
  );
}
function Inspector() {
  const state = useDesk();
  const [tab, setTab] = useState("context");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setTab("context");
    setMessage("");
  }, [state.epoch]);
  const compare = useRef(null);
  const report = useRef(null);
  const [reportText, setReportText] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const drag = useRef(null);
  const skipClick = useRef(false);
  const selected = state.records.find((r) => r.id === state.selectedId);
  const frames = selected
    ? [
        ...new Map(
          selected.query.response.events
            .flatMap((event) => event.evidence)
            .map((frame) => [frame.uri, frame]),
        ).values(),
      ]
    : [];
  const pinnedFrames = state.pins.filter((p) => p.kind === "evidence");
  const action = (fn) => {
    const result = fn();
    setMessage(
      result
        ? "已加入关键发现，保留来源关联。"
        : "暂时无法保存，发现集合最多保留 8 项。",
    );
  };
  function exportNotes() {
    setReportText(store.markdown());
    setReportStatus("");
    report.current.showModal();
  }
  function downloadNotes() {
    const blob = new Blob([store.markdown()], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "FrameSeek-调查记录.md";
    anchor.click();
    URL.revokeObjectURL(url);
    setReportStatus("下载已发起。若浏览器未保存，可以复制这份记录。");
  }
  return (
    <>
      <div className="inspector-heading">
        <span>调查检查器</span>
        <button
          className="icon-button"
          aria-label="收起调查检查器"
          onClick={() => ui()?.toggleInspector()}
        >
          {icon("x")}
        </button>
      </div>
      <div
        className="inspector-tabs"
        role="tablist"
        aria-label="调查检查器内容"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
          event.preventDefault();
          const next = tab === "context" ? "findings" : "context";
          setTab(next);
          event.currentTarget
            .querySelector(`[data-inspector-tab="${next}"]`)
            .focus();
        }}
      >
        <button
          role="tab"
          data-inspector-tab="context"
          tabIndex={tab === "context" ? 0 : -1}
          aria-selected={tab === "context"}
          onClick={() => setTab("context")}
        >
          当前问题
        </button>
        <button
          role="tab"
          data-inspector-tab="findings"
          tabIndex={tab === "findings" ? 0 : -1}
          aria-selected={tab === "findings"}
          onClick={() => setTab("findings")}
        >
          发现 <span>{state.pins.length}</span>
        </button>
      </div>
      <div
        className="inspector-scroll"
        role="tabpanel"
        aria-label={tab === "context" ? "当前问题详情" : "已保存的发现"}
      >
        {tab === "context" ? (
          selected ? (
            <>
              <p className="inspector-kicker">
                QUESTION / {state.records.indexOf(selected) + 1}
              </p>
              <h2 className="inspector-question">{selected.query.question}</h2>
              <div className="basis-section">
                <h3>这轮依据</h3>
                <ol className="basis-steps">
                  <li>
                    <span>01</span>
                    <div>
                      查看范围<small>合成视频 · 00:00–00:18 · 无音轨</small>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      固定样例匹配
                      <small>
                        {selected.query.response.events.length} 段事件 ·{" "}
                        {frames.length} 张证据帧
                      </small>
                    </div>
                  </li>
                  <li>
                    <span>03</span>
                    <div>
                      {labels[selected.query.response.status]}
                      <small>未执行新的模型推理</small>
                    </div>
                  </li>
                </ol>
              </div>
              <div className="inspector-conclusion">
                <div className="section-line">
                  <h3>当前结论</h3>
                  {["ok", "partial"].includes(
                    selected.query.response.status,
                  ) && (
                    <button
                      aria-label="保存当前结论"
                      className="text-button"
                      onClick={() =>
                        action(() =>
                          ui()?.saveConclusion(selected.id, selected.query),
                        )
                      }
                    >
                      保存
                    </button>
                  )}
                </div>
                <p>{selected.query.response.answer}</p>
              </div>
              {!!selected.query.response.unresolved.length && (
                <div className="open-questions">
                  <h3>仍需核实</h3>
                  {selected.query.response.unresolved.map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                </div>
              )}
              {!!frames.length && (
                <section className="inspector-evidence">
                  <div className="section-line">
                    <h3>引用画面</h3>
                    <span>{frames.length}</span>
                  </div>
                  {frames.map((frame) => (
                    <div className="frame-row" key={frame.uri}>
                      <button
                        className="frame-preview"
                        draggable={false}
                        data-drag-evidence
                        title="拖到画布保存，或点击回看"
                        onPointerDown={(event) => {
                          if (event.button !== 0) return;
                          event.preventDefault();
                          event.currentTarget.focus();
                          event.currentTarget.setPointerCapture(
                            event.pointerId,
                          );
                          drag.current = {
                            x: event.clientX,
                            y: event.clientY,
                            moved: false,
                          };
                          skipClick.current = false;
                        }}
                        onPointerMove={(event) => {
                          if (!drag.current) return;
                          if (
                            Math.hypot(
                              event.clientX - drag.current.x,
                              event.clientY - drag.current.y,
                            ) > 8
                          )
                            drag.current.moved = true;
                          if (drag.current.moved)
                            document
                              .getElementById("chat-content")
                              .classList.add("drop-ready");
                        }}
                        onPointerUp={(event) => {
                          const gesture = drag.current;
                          drag.current = null;
                          document
                            .getElementById("chat-content")
                            .classList.remove("drop-ready");
                          if (!gesture?.moved) return;
                          skipClick.current = true;
                          const rect = document
                            .getElementById("chat-content")
                            .getBoundingClientRect();
                          if (
                            event.clientX >= rect.left &&
                            event.clientX < rect.right &&
                            event.clientY >= rect.top &&
                            event.clientY < rect.bottom
                          )
                            action(() =>
                              ui()?.saveEvidence(
                                selected.id,
                                selected.query,
                                frame,
                              ),
                            );
                        }}
                        onPointerCancel={() => {
                          drag.current = null;
                          document
                            .getElementById("chat-content")
                            .classList.remove("drop-ready");
                        }}
                        onClick={() => {
                          if (skipClick.current) {
                            skipClick.current = false;
                            return;
                          }
                          ui()?.seek(frame.t, selected.query);
                        }}
                        aria-label={`回看引用 ${clock(frame.t)}`}
                      >
                        <img src={frame.uri} alt={frame.caption} />
                        <span>{clock(frame.t)}</span>
                      </button>
                      <div>
                        <p>{frame.caption}</p>
                        <button
                          className="text-button"
                          onClick={() =>
                            action(() =>
                              ui()?.saveEvidence(
                                selected.id,
                                selected.query,
                                frame,
                              ),
                            )
                          }
                          aria-label={`保存证据 ${clock(frame.t)}`}
                        >
                          留在画布 {icon("plus")}
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </>
          ) : (
            <div className="inspector-empty">
              <p className="inspector-kicker">FOLLOW THE EVIDENCE</p>
              <h2>让结论有据可查。</h2>
              <p>选中画布中的问题，在这里查看它的依据、证据和未确认项。</p>
              <button className="outline-button" onClick={() => ui()?.demos()}>
                探索演示路径 {icon("arrow-right")}
              </button>
            </div>
          )
        ) : (
          <>
            <label className="inspector-kicker" htmlFor="finding-group">
              发现分组
            </label>
            <input
              id="finding-group"
              className="finding-group"
              value={state.groupTitle}
              onChange={(e) => store.group(e.target.value)}
              maxLength={60}
            />
            {state.pins.length ? (
              <div className="finding-list">
                {state.pins.map((pin) => (
                  <div className={`finding-row ${pin.kind}`} key={pin.id}>
                    <button onClick={() => ui()?.focusFinding(pin.id)}>
                      {pin.kind === "evidence" ? (
                        <img src={pin.frame.uri} alt={pin.frame.caption} />
                      ) : (
                        icon("chats-circle")
                      )}
                      <span>
                        <small>
                          {pin.kind === "evidence" ? "证据帧" : "结论"} /{" "}
                          {pin.kind === "evidence"
                            ? clock(pin.frame.t)
                            : labels[pin.query.response.status]}
                        </small>
                        {pin.kind === "evidence"
                          ? pin.frame.caption
                          : pin.query.response.answer}
                      </span>
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`移除${pin.title}`}
                      onClick={() => ui()?.removeFinding(pin.id)}
                    >
                      {icon("x")}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-text">
                把引用画面或当前结论保存到这里。它们会作为独立对象留在画布上。
              </p>
            )}
            <button
              className="outline-button compare-button"
              disabled={pinnedFrames.length < 2}
              onClick={() => compare.current.showModal()}
            >
              并排核对两帧{" "}
              <span>
                {pinnedFrames.length < 2
                  ? "需 2 张证据"
                  : `${pinnedFrames.length} 张可用`}
              </span>
            </button>
            <label
              className="section-line note-label"
              htmlFor="investigation-note"
            >
              调查笔记
            </label>
            <textarea
              id="investigation-note"
              placeholder="记录观察、疑问或下一步…"
              value={state.note}
              onChange={(e) => store.annotate(e.target.value)}
              maxLength={1200}
            />
            <p className="session-footnote">
              名称、发现和笔记保留在本次页面会话。
            </p>
            <button className="export-button" onClick={exportNotes}>
              导出调查记录 {icon("arrow-right")}
            </button>
          </>
        )}
        <p className="inspector-message" role="status">
          {message}
        </p>
      </div>
      <dialog
        className="compare-dialog"
        ref={compare}
        aria-labelledby="compare-title"
      >
        <header>
          <div>
            <p className="inspector-kicker">EVIDENCE / COMPARISON</p>
            <h2 id="compare-title">并排核对</h2>
          </div>
          <button
            className="icon-button"
            aria-label="关闭证据对照"
            onClick={() => compare.current.close()}
          >
            {icon("x")}
          </button>
        </header>
        <div className="compare-frames">
          {pinnedFrames.slice(0, 2).map((pin) => (
            <figure key={pin.id}>
              <img src={pin.frame.uri} alt={pin.frame.caption} />
              <figcaption>
                <strong>{clock(pin.frame.t)}</strong>
                <span>{pin.frame.caption}</span>
                <button
                  className="text-button"
                  onClick={() => {
                    compare.current.close();
                    ui()?.seek(pin.frame.t, pin.query);
                  }}
                >
                  回看此帧 {icon("play")}
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="muted-text">
          同一段合成视频的真实证据帧。静帧切换不能证明连续搬运动作。
        </p>
      </dialog>
      <dialog
        className="report-dialog compare-dialog"
        ref={report}
        aria-labelledby="report-title"
      >
        <header>
          <div>
            <p className="inspector-kicker">INVESTIGATION / RECORD</p>
            <h2 id="report-title">调查记录</h2>
          </div>
          <button
            className="icon-button"
            aria-label="关闭调查记录"
            onClick={() => report.current.close()}
          >
            {icon("x")}
          </button>
        </header>
        <textarea aria-label="调查记录 Markdown" value={reportText} readOnly />
        <div className="report-actions">
          <button
            className="outline-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(reportText);
                setReportStatus("Markdown 已复制。");
              } catch {
                setReportStatus("可在上方选择文字，使用浏览器复制。");
              }
            }}
          >
            复制 Markdown
          </button>
          <button className="outline-button" onClick={downloadNotes}>
            下载 .md
          </button>
        </div>
        <p className="muted-text" role="status">
          {reportStatus}
        </p>
      </dialog>
    </>
  );
}
createRoot(document.getElementById("project-title")).render(<ProjectTitle />);
createRoot(document.getElementById("investigation-outline")).render(
  <Outline />,
);
createRoot(document.getElementById("workbench-inspector")).render(
  <Inspector />,
);
