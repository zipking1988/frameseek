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

function WorkspaceNavigation() {
  const state = useDesk();
  useEffect(() => {
    const count = document.getElementById("rail-findings-count");
    count.textContent = state.pins.length;
    count.hidden = !state.pins.length;
  }, [state.pins.length]);
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (!open) return;
    root.current.querySelector(".workspace-menu button").focus();
    const dismiss = (event) => {
      if (!root.current.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      trigger.current.focus();
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const run = (action) => {
    setOpen(false);
    trigger.current.focus();
    action();
  };
  return (
    <div ref={root} className="workspace-navigation">
      <button
        ref={trigger}
        className="rail-button menu-trigger"
        aria-label="工作区菜单"
        aria-expanded={open}
        aria-controls="workspace-menu"
        title={open ? "收起工作区菜单" : "展开工作区菜单"}
        onClick={() => setOpen(!open)}
      >
        {icon("list")}
        <span>菜单</span>
      </button>
      {open && (
        <section
          id="workspace-menu"
          className="workspace-menu"
          role="dialog"
          aria-label="工作区菜单"
        >
          <div className="workspace-menu-heading">
            <div>
              <span>本次调查</span>
              <strong>{state.title || "未命名调查"}</strong>
            </div>
            <button
              className="icon-button"
              aria-label="关闭工作区菜单"
              onClick={() => run(() => {})}
            >
              {icon("x")}
            </button>
          </div>
          <p className="workspace-summary">
            {state.records.length} 轮问题 · {state.pins.length} 项发现
          </p>
          <p className="menu-section-label">工作区</p>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.canvas())}
          >
            {icon("chats-circle")}
            <span>
              调查画布<small>回到当前调查</small>
            </span>
            {icon("arrow-right")}
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.toggleSource())}
          >
            {icon("folder-open")}
            <span>
              素材与视频<small>展开或收起素材面板</small>
            </span>
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.openInspector("findings"))}
          >
            {icon("stack")}
            <span>
              发现集合<small>证据、结论与调查笔记</small>
            </span>
            <span className="menu-count">{state.pins.length}</span>
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.openInspector("context"))}
          >
            {icon("paperclip")}
            <span>
              问题详情<small>查看所选问题的依据</small>
            </span>
          </button>
          <p className="menu-section-label">调查操作</p>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.newTask())}
          >
            {icon("plus")}
            <span>
              新调查<small>清空当前画布，重新开始</small>
            </span>
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.demos())}
          >
            {icon("play")}
            <span>
              演示库<small>探索 6 条预设调查路径</small>
            </span>
          </button>
          <button
            className="workspace-menu-item"
            onClick={() => run(() => ui()?.openLocal())}
          >
            {icon("folder-open")}
            <span>
              上传视频<small>保存素材并检查可分析状态</small>
            </span>
          </button>
          <button className="workspace-menu-item" onClick={() => run(() => window.FrameSeekPersistence?.library())}>{icon("chats-circle")}<span>调查库<small>恢复、切换与管理调查</small></span></button>
          <button className="workspace-menu-item" onClick={() => run(() => window.FrameSeekPersistence?.library("videos"))}>{icon("folder-open")}<span>素材库<small>上传、分析与管理视频</small></span></button>
          <a
            className="workspace-menu-item"
            href="/docs"
            target="_blank"
            rel="noopener"
            onClick={() => setOpen(false)}
          >
            {icon("code")}
            <span>API 文档</span>
            {icon("arrow-right")}
          </a>
          <div className="menu-footnote">
            保存在本机<small>默认保留 24 小时 · 可恢复调查</small>
          </div>
        </section>
      )}
    </div>
  );
}

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
      <span className="session-label">自动保存</span>
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
      <p className="session-footnote">素材与问题独立保存 · 可继续上次调查</p>
    </section>
  );
}
function Inspector() {
  const state = useDesk();
  const tab = state.inspectorTab;
  const setTab = store.showPanel;
  const [filter, setFilter] = useState("all");
  const [order, setOrder] = useState("saved");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setMessage("");
    setFilter("all");
    setOrder("saved");
  }, [state.epoch]);
  const scroll = useRef(null);
  useEffect(() => {
    scroll.current.scrollTop = 0;
    setMessage("");
  }, [state.selectedId, tab]);
  const compare = useRef(null);
  const report = useRef(null);
  const [reportText, setReportText] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportData, setReportData] = useState(null);
  const [includeImages, setIncludeImages] = useState(true);
  const [exporting, setExporting] = useState(false);
  const exportController = useRef(null);
  useEffect(() => () => exportController.current?.abort(), []);
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
  const visiblePins = window.FrameSeekWorkbenchModel.visiblePins(
    state.pins,
    filter,
    order,
  );
  const action = (fn) => {
    const result = fn();
    setMessage(
      result
        ? "已加入关键发现，保留来源关联。"
        : "暂时无法保存，发现集合最多保留 8 项。",
    );
  };
  function exportNotes() {
    const captured = window.FrameSeekReport.create(window.FrameSeekSessionUI.snapshot());
    setReportData(captured);
    setReportText(window.FrameSeekReport.markdown(captured));
    setReportStatus("");
    report.current.showModal();
  }
  function downloadFile(content, extension, type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `FrameSeek-调查报告.${extension}`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function downloadReport(format) {
    if (!reportData || exporting) return;
    if (format === "md") downloadFile(reportText, "md", "text/markdown;charset=utf-8");
    else if (format === "json") downloadFile(JSON.stringify(reportData, null, 2), "json", "application/json");
    else {
      const controller = new AbortController();
      exportController.current = controller;
      setExporting(true);
      const images = {};
      let bytes = 0;
      try {
        if (includeImages) for (const frame of reportData.evidence.slice(0, 24)) {
          if (!window.FrameSeekReport.safeFrameUri(reportData.source.id, frame.uri)) continue;
          setReportStatus(`正在收集证据画面 ${Object.keys(images).length} / ${reportData.evidence.length}…`);
          try {
            const response = await fetch(frame.uri, {credentials: "same-origin", signal: controller.signal});
            if (!response.ok) continue;
            const reader = response.body.getReader();
            const chunks = []; let length = 0;
            while (true) {
              const {done, value} = await reader.read();
              if (done) break;
              length += value.byteLength;
              if (length > 2 * 1024 * 1024 || bytes + length > 16 * 1024 * 1024) {
                await reader.cancel(); break;
              }
              chunks.push(value);
            }
            const mime = response.headers.get("content-type")?.split(";")[0];
            if (length > 2 * 1024 * 1024 || bytes + length > 16 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(mime)) continue;
            const blob = new Blob(chunks, {type:mime});
            images[frame.id] = await new Promise((resolve, reject) => {
              const fileReader = new FileReader();
              fileReader.onload = () => resolve(fileReader.result);
              fileReader.onerror = reject;
              fileReader.readAsDataURL(blob);
            });
            bytes += length;
          } catch (error) { if (controller.signal.aborted) throw error; }
        }
        if (controller.signal.aborted) return;
        downloadFile(window.FrameSeekReport.html(reportData, images), "html", "text/html;charset=utf-8");
        setReportStatus(`HTML 已导出，内嵌 ${Object.keys(images).length} / ${reportData.evidence.length} 张画面。未内嵌项保留说明；文件可离线打开或打印为 PDF。`);
      } finally { setExporting(false); exportController.current = null; }
      return;
    }
    setReportStatus("下载已发起。这份报告保留打开导出窗口时的调查快照。");
  }
  return (
    <>
      <div className="inspector-heading">
        <span>
          调查检查器<small>从结论回到证据</small>
        </span>
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
          id="inspector-context-tab"
          role="tab"
          aria-controls="inspector-panel"
          data-inspector-tab="context"
          tabIndex={tab === "context" ? 0 : -1}
          aria-selected={tab === "context"}
          onClick={() => setTab("context")}
        >
          当前问题
        </button>
        <button
          id="inspector-findings-tab"
          role="tab"
          aria-controls="inspector-panel"
          data-inspector-tab="findings"
          tabIndex={tab === "findings" ? 0 : -1}
          aria-selected={tab === "findings"}
          onClick={() => setTab("findings")}
        >
          发现 <span>{state.pins.length}</span>
        </button>
      </div>
      <div
        id="inspector-panel"
        ref={scroll}
        className="inspector-scroll"
        role="tabpanel"
        aria-label={tab === "context" ? "当前问题详情" : "已保存的发现"}
        aria-labelledby={
          tab === "context" ? "inspector-context-tab" : "inspector-findings-tab"
        }
      >
        {tab === "context" ? (
          selected ? (
            <>
              <div className="inspector-context-line">
                <p className="inspector-kicker">
                  问题{" "}
                  {String(state.records.indexOf(selected) + 1).padStart(2, "0")}
                </p>
                <span
                  className={`result-pill ${selected.query.response.status}`}
                >
                  {labels[selected.query.response.status]}
                </span>
              </div>
              <h2 className="inspector-question">{selected.query.question}</h2>
              <div className="inspector-primary-actions">
                <button
                  className="outline-button"
                  disabled={state.local}
                  onClick={() => ui()?.continueFrom(selected.id)}
                >
                  继续追问 {icon("arrow-right")}
                </button>
                <button
                  className="text-button"
                  onClick={() => ui()?.select(selected.id)}
                >
                  定位画布
                </button>
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
                      保存结论
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
              <details className="basis-section">
                <summary>
                  这轮依据<span>{frames.length} 张证据 · {selected.query.mode === "real" ? "模型回看" : "预设匹配"}</span>
                </summary>
                <ol className="basis-steps">
                  <li>
                    <span>01</span>
                    <div>
                      查看范围<small>{state.sourceInfo?.name || "合成视频"} · 00:00–{clock(state.sourceInfo?.metadata?.duration || 18)}</small>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      {selected.query.mode === "real" ? "检索与模型回看" : "固定样例匹配"}
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
                      <small>{selected.query.mode === "real" ? `${selected.query.response.trace.visible.segments_reviewed} 个片段已回看` : "未执行新的模型推理"}</small>
                    </div>
                  </li>
                </ol>
              </details>
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
            <div className="collection-summary">
              <span>{state.pins.length} / 8 项已保存</span>
              <span>
                {pinnedFrames.length} 张证据 ·{" "}
                {state.pins.length - pinnedFrames.length} 个结论
              </span>
            </div>
            <div className="finding-controls">
              <div
                className="finding-filters"
                role="group"
                aria-label="发现类型筛选"
              >
                {[
                  ["all", "全部"],
                  ["evidence", "证据"],
                  ["conclusion", "结论"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-label={`筛选${label}发现`}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                    <span>
                      {value === "all"
                        ? state.pins.length
                        : state.pins.filter((p) => p.kind === value).length}
                    </span>
                  </button>
                ))}
              </div>
              <label className="sr-only" htmlFor="finding-order">
                发现排序
              </label>
              <select
                id="finding-order"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              >
                <option value="saved">保存顺序</option>
                <option value="time">视频时间</option>
              </select>
            </div>
            {visiblePins.length ? (
              <div className="finding-list">
                {visiblePins.map((pin) => (
                  <div className={`finding-row ${pin.kind}`} key={pin.id}>
                    <button
                      className="finding-main"
                      aria-label={`定位发现：${pin.title}`}
                      onClick={() => ui()?.focusFinding(pin.id)}
                    >
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
                        <span className="finding-caption">
                          {pin.kind === "evidence"
                            ? pin.frame.caption
                            : pin.query.response.answer}
                        </span>
                      </span>
                    </button>
                    <div className="finding-provenance">
                      <button
                        className="text-button"
                        aria-label={`查看发现来源：${pin.title}`}
                        disabled={
                          !state.records.some(
                            (record) => record.id === pin.turnId,
                          )
                        }
                        onClick={() => {
                          ui()?.select(pin.turnId);
                          setTab("context");
                          document
                            .getElementById("inspector-context-tab")
                            .focus();
                        }}
                      >
                        来源：{pin.query.question}
                      </button>
                      {pin.kind === "evidence" && (
                        <button
                          className="text-button"
                          aria-label={`回看已保存证据 ${clock(pin.frame.t)}`}
                          onClick={() => ui()?.seek(pin.frame.t, pin.query)}
                        >
                          {icon("play")}回看
                        </button>
                      )}
                    </div>
                    <button
                      className="icon-button remove-finding"
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
                {state.pins.length
                  ? "这个分类还没有发现。切换到全部可查看已保存内容。"
                  : "把引用画面或当前结论保存到这里。它们会作为独立对象留在画布上。"}
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
              调查笔记 <span>{state.note.length} / 1200</span>
            </label>
            <textarea
              id="investigation-note"
              aria-label="调查笔记"
              placeholder="记录观察、疑问或下一步…"
              value={state.note}
              onChange={(e) => store.annotate(e.target.value)}
              maxLength={1200}
            />
            <p className="session-footnote">
              名称、发现和笔记自动保存在本机，刷新后可继续。
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
          同一素材的证据帧。可见位置变化不等于已确认连续移动。
        </p>
      </dialog>
      <dialog
        className="report-dialog compare-dialog"
        ref={report}
        aria-labelledby="report-title"
        onClose={() => exportController.current?.abort()}
      >
        <header>
          <div>
            <p className="inspector-kicker">INVESTIGATION / RECORD</p>
            <h2 id="report-title">调查报告</h2>
          </div>
          <button
            className="icon-button"
            aria-label="关闭调查记录"
            onClick={() => report.current.close()}
          >
            {icon("x")}
          </button>
        </header>
        <p className="report-summary">{reportData?.questions.length || 0} 个问题 · {reportData?.findings.length || 0} 项发现 · {reportData?.evidence.length || 0} 张证据画面。包含当前保留的对话与发现来源；未确认项单独列出。</p>
        <textarea aria-label="调查记录 Markdown" value={reportText} readOnly />
        <label className="report-image-option"><input type="checkbox" checked={includeImages} onChange={e => setIncludeImages(e.target.checked)} disabled={exporting} /> HTML 内嵌证据画面（最多 24 张、16 MB，形成可分享的本地副本）</label>
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
          <button className="outline-button" disabled={exporting} onClick={() => downloadReport("md")}>下载 Markdown</button>
          <button className="outline-button" disabled={exporting} onClick={() => downloadReport("json")}>下载 JSON</button>
          <button className="outline-button" disabled={exporting} onClick={() => downloadReport("html").catch(() => setReportStatus("导出已取消或失败，请重试。"))}>{exporting ? "收集画面…" : "下载 HTML"}</button>
        </div>
        <p className="muted-text" role="status">
          {reportStatus}
        </p>
      </dialog>
    </>
  );
}
createRoot(document.getElementById("workspace-navigation")).render(
  <WorkspaceNavigation />,
);
createRoot(document.getElementById("project-title")).render(<ProjectTitle />);
createRoot(document.getElementById("investigation-outline")).render(
  <Outline />,
);
createRoot(document.getElementById("workbench-inspector")).render(
  <Inspector />,
);
