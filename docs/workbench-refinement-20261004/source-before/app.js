"use strict";
const $ = (id) => document.getElementById(id);
const player = $("player");
let demo = null;
let localUrl = null;
let localMode = false;
let mediaReady = false;
let mediaFailed = false;
let pendingSeek = null;
let pendingSeekTrigger = null;
let turns = 0;
let taskSequence = 0;
let lastQueryId = null;
let evidenceReturnFocus = null;
let investigation = null;

function showEvidence(open, trigger = document.activeElement) {
  if (investigation) {
    const viewer = $("evidence-canvas");
    const wasOpen = !viewer.hidden;
    if (open && trigger?.isConnected) evidenceReturnFocus = trigger;
    viewer.hidden = !open;
    $("toggle-evidence").setAttribute("aria-expanded", String(open));
    if (!open && wasOpen && evidenceReturnFocus?.isConnected)
      evidenceReturnFocus.focus({ preventScroll: true });
    return;
  }
  const shell = document.querySelector(".agent-shell");
  const wasOpen = shell.classList.contains("evidence-open");
  const mobile = window.innerWidth < 900;
  if (mobile && open && !wasOpen) evidenceReturnFocus = trigger;
  shell.classList.toggle("evidence-open", open);
  $("toggle-evidence").setAttribute("aria-expanded", String(open));
  $("toggle-evidence").firstChild.textContent = open
    ? "返回对话 "
    : "查看视频 ";
  if (mobile && open && !wasOpen) {
    $("toggle-evidence").focus({ preventScroll: true });
  } else if (mobile && !open && wasOpen) {
    const target = evidenceReturnFocus;
    evidenceReturnFocus = null;
    if (target?.isConnected !== false && target?.focus && !target.disabled) {
      target.focus({ preventScroll: true });
    } else {
      (localMode ? $("toggle-evidence") : $("question")).focus({
        preventScroll: true,
      });
    }
  }
}
function resetContext() {
  $("run-state").textContent = localMode ? "未建立索引" : "等待任务";
  updateMediaContext();
  $("result-step").textContent = localMode
    ? "尚未接入视频检索"
    : "从固定样例中匹配";
  $("result-step-state").textContent = localMode ? "不可用" : "待匹配";
  $("evidence-step").textContent = localMode
    ? "此文件没有检索证据"
    : "时间与画面关联";
  $("evidence-step-state").textContent = localMode ? "不可用" : "待选择";
  document.querySelectorAll(".run-steps li").forEach((item, index) => {
    if (index > 0) item.classList.remove("complete");
  });
}

function updateMediaContext() {
  $("source-step").textContent = mediaFailed
    ? "视频加载失败"
    : !mediaReady
      ? "正在加载视频"
      : localMode
        ? "仅浏览器内播放"
        : "合成视频已加载";
  $("source-step-state").textContent = mediaFailed
    ? "需重试"
    : !mediaReady
      ? "加载中"
      : localMode
        ? "未索引"
        : "已就绪";
  $("attached-source-state").textContent = mediaFailed
    ? "加载失败"
    : !mediaReady
      ? "正在加载"
      : localMode
        ? "仅本地播放 · 未索引"
        : "已加载 · 18 秒";
  document
    .querySelector(".run-steps li:first-child")
    .classList.toggle("complete", mediaReady && !mediaFailed && !localMode);
}
const stateLabels = {
  ok: "已提供证据",
  partial: "部分确认",
  no_result: "未找到相关画面",
  error: "查找未完成",
};
function selectTask(data, historyButton) {
  document.querySelectorAll(".history-task").forEach((item) => {
    const active = item === historyButton;
    item.classList.toggle("active", active);
    item.setAttribute("aria-current", active ? "true" : "false");
  });
  document.querySelectorAll(".turn").forEach((item) => {
    item.classList.toggle("selected", item.id === historyButton.dataset.turn);
  });
  $("run-state").textContent = stateLabels[data.status];
  $("result-step").textContent = "已匹配固定演示样例";
  $("result-step-state").textContent = "已匹配";
  document
    .querySelector(".run-steps li:nth-child(2)")
    .classList.add("complete");
  $("evidence-step").textContent = data.events.length
    ? `${data.events.length} 个事件可回看`
    : "该样例没有可定位的事件";
  $("evidence-step-state").textContent = data.events.length
    ? "待选择"
    : "无证据";
  document
    .querySelector(".run-steps li:last-child")
    .classList.remove("complete");
}

const clock = (seconds) => {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
function announce(message) {
  $("announcement").textContent = message;
}
function notice(message) {
  $("form-notice").textContent = message;
  $("form-notice").hidden = !message;
}
function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function button(label, className, action) {
  const element = node("button", className, label);
  element.type = "button";
  element.addEventListener("click", action);
  return element;
}
function updateSend() {
  $("send-question").disabled =
    !demo || localMode || !$("question").value.trim();
}
function seek(seconds, trigger = document.activeElement) {
  if (localMode) return;
  if (mediaFailed) {
    announce("视频无法定位，请先重新加载视频。");
    $("seek-status").textContent = "视频无法定位，请先重新加载视频。";
    return;
  }
  if (!mediaReady) {
    pendingSeek = seconds;
    pendingSeekTrigger = trigger;
    announce("视频仍在加载，加载后将定位到对应画面。");
    return;
  }
  const wasPaused = player.paused;
  player.currentTime = seconds;
  if (wasPaused) player.pause();
  if (investigation) {
    if (!trigger?.closest?.(".turn")) investigation.evidence(null);
    showEvidence(true, trigger);
  }
  if (!investigation && window.innerWidth < 900) {
    showEvidence(true, trigger);
    player.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  $("seek-status").textContent =
    `已定位 ${clock(seconds)} · ${wasPaused ? "保持暂停" : "继续播放"}`;
  announce($("seek-status").textContent);
  $("evidence-step").textContent = `已定位到 ${clock(seconds)}`;
  $("evidence-step-state").textContent = "已定位";
  document.querySelector(".run-steps li:last-child").classList.add("complete");
}
function updateTime() {
  if (investigation && mediaReady)
    $("seek-status").textContent =
      `当前 ${clock(player.currentTime)} · ${player.paused ? "已暂停" : "播放中"}`;
  $("playback-time").textContent =
    `${clock(player.currentTime)} / ${clock(player.duration)}`;
  const percent = player.duration
    ? (player.currentTime / player.duration) * 100
    : 0;
  $("playhead").style.transform = `scaleX(${Math.min(percent, 100) / 100})`;
  const start = player.currentTime < 5 ? 0 : player.currentTime < 11 ? 5 : 11;
  document.querySelectorAll(".chapter,.segment").forEach((element) => {
    const activeTime = element.classList.contains("segment")
      ? start === 5
        ? 6
        : start === 11
          ? 13
          : 0
      : start;
    const active = !localMode && Number(element.dataset.time) === activeTime;
    element.classList.toggle("active", active);
    element.setAttribute("aria-current", active ? "time" : "false");
  });
}
function renderAnswer(query) {
  if (localMode || !demo) return;
  if (++turns > 12) {
    const oldestId = $("messages").firstElementChild?.id;
    if (oldestId) document.querySelector(`[data-turn="${oldestId}"]`)?.remove();
    $("messages").firstElementChild?.remove();
  }
  const data = query.response;
  $("suggestions").hidden = true;
  const more = node("details", "response-details");
  more.append(node("summary", "", "更多证据与引用"));
  const turn = node("article", "turn");
  turn.id = `task-${++taskSequence}`;
  turn.append(node("p", "question-bubble", query.question));
  const label = node("div", "answer-label", "FrameSeek");
  label.append(
    node(
      "span",
      "fixture-tag",
      query.usedContext ? "预设追问 · 承接前文" : "预设演示 · 未调用模型",
    ),
  );
  turn.append(label, node("p", "answer-text", data.answer));
  turn.append(
    node("span", `answer-status ${data.status}`, stateLabels[data.status]),
  );
  const eventCluster =
    data.events.length > 1 ? node("div", "event-cluster") : turn;
  if (eventCluster !== turn) turn.append(eventCluster);
  data.events.forEach((event) => {
    const row = node("section", "event");
    row.append(node("h3", "event-heading", event.action));
    const toolbar = node("div", "event-toolbar");
    toolbar.append(
      button(
        `${clock(event.start)}–${clock(event.end)}`,
        "seek-button",
        (clickEvent) => {
          selectTask(data, historyButton);
          investigation?.choose(turn.id);
          investigation?.evidence(query);
          seek(event.start, clickEvent.currentTarget);
        },
      ),
      node("span", "support-label", "固定样例 · 画面直接支持"),
    );
    row.append(toolbar);
    const evidence = node("div", "evidence-grid");
    event.evidence.forEach((frame, index) => {
      const frameButton = button("", "evidence-button", () => {
        selectTask(data, historyButton);
        investigation?.choose(turn.id);
        investigation?.evidence(query);
        document.querySelectorAll(".evidence-button").forEach((item) => {
          const selected = item === frameButton;
          item.classList.toggle("selected", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
        seek(frame.t, frameButton);
      });
      frameButton.setAttribute("aria-pressed", "false");
      frameButton.setAttribute("aria-label", `定位证据帧 ${clock(frame.t)}`);
      const image = document.createElement("img");
      image.src = frame.uri;
      image.alt = frame.caption;
      image.loading = "lazy";
      const caption = node("span", "evidence-caption", clock(frame.t));
      caption.append(node("span", "", "查看此帧 ↗"));
      frameButton.append(image, caption);
      if (
        index === 0 ||
        ["objects", "tape", "lighting", "offscreen"].includes(query.id)
      )
        evidence.append(frameButton);
      else more.append(frameButton);
    });
    row.append(evidence, node("p", "event-summary", event.summary));
    more.append(
      button("复制时间引用", "text-button", async (eventClick) => {
        const trigger = eventClick.currentTarget;
        try {
          await navigator.clipboard.writeText(
            `合成演示：${demo.video.title} ${clock(event.start)}–${clock(event.end)} — ${event.action}`,
          );
          trigger.textContent = "已复制";
          announce("已复制演示素材的时间引用。");
        } catch {
          notice("浏览器不允许复制。可在结构化结果中选择并复制时间。 ");
        }
      }),
    );
    eventCluster.append(row);
  });
  if (data.unresolved.length) {
    const unresolved = node("div", "unresolved");
    unresolved.append(node("strong", "", "仍未确认"));
    data.unresolved.forEach((text) => unresolved.append(node("p", "", text)));
    (investigation ? more : turn).append(unresolved);
  }
  if (data.errors.length) {
    turn.append(
      node("p", "trace-note", data.errors[0].message),
      button("选择其他示例问题", "text-button", () => {
        $("question").focus();
        notice("可以尝试：包裹什么时候出现在中央？");
      }),
    );
  } else {
    turn.append(
      node(
        "p",
        "trace-note",
        "演示检查范围：00:00–00:18 · 无音轨 · 非真实模型评测",
      ),
    );
  }
  const details = node("details", "response-details");
  details.append(
    node("summary", "", "查看结构化结果"),
    node("pre", "", JSON.stringify(data, null, 2)),
  );
  more.append(details);
  const actions = node("div", "response-actions");
  data.followups.forEach((question) =>
    actions.append(
      button(question, "text-button", () => {
        investigation?.choose(turn.id);
        ask(question);
      }),
    ),
  );
  more.append(actions);
  turn.append(more);
  $("empty-state").hidden = true;
  $("messages").append(turn);
  const historyButton = button(query.question, "history-task", () => {
    if (!investigation)
      turn.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    selectTask(data, historyButton);
  });
  historyButton.dataset.turn = turn.id;
  historyButton.title = query.question;
  $("task-list").prepend(historyButton);
  $("history-empty").hidden = true;
  $("task-count").textContent = $("messages").children.length;
  selectTask(data, historyButton);
  const chatContent = $("chat-content");
  if (!investigation) chatContent.scrollTop = chatContent.scrollHeight;
  investigation?.register(turn, query, historyButton);
  announce(`演示回答：${stateLabels[data.status]}。${data.answer}`);
}
function ask(question) {
  if (localMode) return;
  const scoped = investigation?.context();
  const contextId = investigation ? scoped?.query.id || null : lastQueryId;
  const normalized = (value) => value.replace(/[\s？?。！!]/g, "");
  const resolved = window.FrameSeekDemoConversation
    ? window.FrameSeekDemoConversation.resolve(
        question,
        demo?.queries || [],
        contextId,
      )
    : {
        query: demo?.queries.find(
          (item) => normalized(item.question) === normalized(question),
        ),
        usedContext: false,
      };
  if (!resolved.query) {
    const parcelContext = ["center", "right", "person"].includes(contextId);
    const supported = scoped?.query.suggested_replies || [];
    notice(
      supported.length
        ? `当前话题支持${supported.map((label) => `「${label}」`).join("、")}。输入已保留。`
        : parcelContext
          ? "这个追问暂未接入。演示支持「那后来呢？」「谁搬的？」或完整示例问题；输入已保留。"
          : contextId
            ? "当前话题不支持这个追问。请改问完整示例问题，例如「包裹什么时候出现在中央？」。输入已保留。"
            : "先从完整示例问题开始，例如「包裹什么时候出现在中央？」。回答后可继续追问。输入已保留。",
    );
    announce("此问题不属于演示样例，未调用模型。");
    return;
  }
  notice("");
  lastQueryId = resolved.query.id;
  renderAnswer({
    ...resolved.query,
    question,
    usedContext: resolved.usedContext,
    parentTurn: scoped?.turn.id || null,
  });
  $("question").value = "";
  updateSend();
  $("question").focus();
}
function clearChat() {
  evidenceReturnFocus = null;
  investigation?.clear();
  $("messages").replaceChildren();
  $("empty-state").hidden = false;
  $("question").value = "";
  turns = 0;
  taskSequence = 0;
  $("demo-current").hidden = true;
  lastQueryId = null;
  $("task-list").replaceChildren();
  $("task-count").textContent = "0";
  $("history-empty").hidden = false;
  $("suggestions").hidden = localMode;
  resetContext();
  notice("");
  updateSend();
}
function openDemoLibrary() {
  if (demo?.scenarios?.length) $("demo-library").showModal();
}
function startScenario(id) {
  const scenario = demo?.scenarios?.find((item) => item.id === id);
  let seeds;
  try {
    seeds = window.FrameSeekDemoConversation.materialize(
      scenario,
      demo.queries,
    );
  } catch {
    announce("这条演示无法载入，请选择其他调查路径。");
    return;
  }
  if (localMode) $("restore-demo").click();
  $("demo-library").close();
  player.pause();
  pendingSeek = null;
  pendingSeekTrigger = null;
  if (mediaReady) player.currentTime = 0;
  showEvidence(false);
  clearChat();
  const turnIds = [];
  for (const seed of seeds) {
    renderAnswer({
      ...seed,
      parentTurn: seed.parentIndex === null ? null : turnIds[seed.parentIndex],
    });
    turnIds.push(`task-${taskSequence}`);
    lastQueryId = seed.id;
  }
  investigation?.arrange(scenario.layout || "threads");
  $("demo-current").textContent = `${scenario.title} · ${seeds.length} 轮预设`;
  $("demo-current").hidden = false;
  $("question").focus();
  announce(
    `已载入${scenario.title}，${seeds.length}轮预设演示。可选择卡片继续追问。`,
  );
}
function renderScenarios() {
  if (!demo.scenarios?.length) return;
  const list = $("demo-scenarios");
  list.replaceChildren();
  demo.scenarios.forEach((scenario, index) => {
    const entry = button("", "demo-scenario", () => startScenario(scenario.id));
    entry.setAttribute("aria-label", `载入演示：${scenario.title}`);
    entry.append(
      node("span", "demo-scenario-number", String(index + 1).padStart(2, "0")),
      node("strong", "", scenario.title),
      node("p", "", scenario.description),
      node(
        "span",
        "demo-scenario-focus",
        `${scenario.focus} · ${scenario.steps.length} 轮`,
      ),
    );
    list.append(entry);
  });
  $("open-demos").disabled = false;
  $("demo-library-empty").disabled = false;
}
$("open-demos").addEventListener("click", openDemoLibrary);
$("demo-library-empty").addEventListener("click", openDemoLibrary);
$("close-demos").addEventListener("click", () => $("demo-library").close());
function setLocalMode(enabled) {
  localMode = enabled;
  investigation?.source(enabled);
  $("mode-label").textContent = enabled ? "本地播放" : "演示模式";
  $("demo-notice-text").textContent = enabled
    ? "本地播放模式。文件只在此浏览器中打开，未上传、未建立索引，也未发送给模型。"
    : "正在体验固定演示。视频为合成素材，回答与上下文追问为预设样例；不会上传文件或调用模型。";
  $("restore-demo").hidden = !enabled;
  $("suggestions").hidden = enabled;
  $("composer-mode-text").textContent = enabled
    ? "仅本地播放 · 未建立索引"
    : "预设演示 · 未调用模型";
  $("demo-timeline").hidden = enabled;
  $("segments").hidden = enabled;
  $("frame-heading").hidden = enabled;
  $("empty-eyebrow").textContent = enabled ? "仅本地播放" : "已加载演示视频";
  $("local-note").hidden = !enabled;
  $("video-watermark").hidden = enabled;
  $("question").disabled = enabled;
  $("question").placeholder = enabled
    ? "当前视频未建立索引，暂时不能提问。"
    : "继续追问，或提出新的问题…";
  document.querySelectorAll("[data-query]").forEach((element) => {
    element.disabled = enabled || !demo;
  });
  $("video-state").textContent = enabled ? "仅本地播放" : "演示素材";
  document.querySelector(".source-item span").textContent = enabled
    ? "本地视频 · 未索引"
    : "包裹移动演示";
  $("attached-source-state").textContent = enabled
    ? "仅本地播放 · 未索引"
    : "已加载 · 18 秒";
  $("empty-state").querySelector(investigation ? "h1" : "h2").textContent =
    enabled
      ? "素材已打开，尚未建立索引。"
      : investigation
        ? "从一个问题，展开调查。"
        : "想找哪个画面？";
  $("empty-state").querySelector(".task-intro > p").textContent = enabled
    ? "你可以在视频工作区中播放文件，或返回演示体验预设对话。"
    : investigation
      ? "找到的画面会留在这里。继续追问，把发现连起来。"
      : "先问包裹的位置，再继续追问。";
  $("video-state").title = enabled ? "未上传、未分析" : "公开合成素材";
  $("seek-status").textContent = enabled
    ? "未上传 · 未分析 · 文件只在浏览器内播放"
    : "点击时间或证据帧，定位到对应画面";
  clearChat();
  if (enabled) {
    notice("已打开本地视频。真实索引和问答尚未接入，可返回演示体验证据跳转。");
  }
}
$("question-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!$("send-question").disabled) ask($("question").value.trim());
});
$("question").addEventListener("input", updateSend);
$("question").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    $("question-form").requestSubmit();
  }
});
document.querySelectorAll("[data-query]").forEach((element) =>
  element.addEventListener("click", () => {
    const query = demo?.queries.find(
      (item) => item.id === element.dataset.query,
    );
    if (query) ask(query.question);
  }),
);
document
  .querySelectorAll("[data-time]")
  .forEach((element) =>
    element.addEventListener("click", () => seek(Number(element.dataset.time))),
  );
function newTask() {
  clearChat();
  if (localMode) {
    notice("当前视频仅供本地播放，返回演示后可提问。");
  }
  showEvidence(false);
  if (!localMode) $("question").focus();
  announce("演示对话已重置。");
}
$("reset-chat").addEventListener("click", newTask);
$("mobile-reset").addEventListener("click", newTask);
$("toggle-evidence").addEventListener("click", () => {
  const open = $("toggle-evidence").getAttribute("aria-expanded") !== "true";
  showEvidence(open);
  if (!open) $("question").scrollIntoView({ block: "center" });
});
["open-local", "attach-local", "rail-source"].forEach((id) => {
  $(id).addEventListener("click", () => $("file-input").click());
});
$("rail-video").addEventListener("click", () => {
  investigation?.evidence(null);
  showEvidence(true);
  player.focus();
});
$("file-input").addEventListener("change", () => {
  const file = $("file-input").files[0];
  if (!file) return;
  if (!file.type.startsWith("video/") || file.size > 500 * 1024 * 1024) {
    notice("请选择不超过 500 MB 的视频文件用于本地播放。");
    $("file-input").value = "";
    return;
  }
  player.pause();
  if (localUrl) URL.revokeObjectURL(localUrl);
  localUrl = URL.createObjectURL(file);
  player.preload = "metadata";
  mediaReady = false;
  mediaFailed = false;
  pendingSeek = null;
  player.removeAttribute("poster");
  player.src = localUrl;
  player.load();
  setLocalMode(true);
  $("video-heading").textContent = file.name;
  $("attached-source-name").textContent = file.name;
  $("video-meta").textContent = "正在读取本地视频信息…";
  if (investigation || window.innerWidth < 900)
    showEvidence(true, $("attach-local"));
  investigation?.evidence(null);
  announce("本地视频已打开，未上传、未建立索引。");
});
$("restore-demo").addEventListener("click", () => {
  player.pause();
  if (localUrl) URL.revokeObjectURL(localUrl);
  localUrl = null;
  mediaReady = false;
  mediaFailed = false;
  pendingSeek = null;
  player.src = "/demo/video";
  player.preload = "auto";
  player.poster = "/media/demo_parcel/frames/0.jpg";
  player.load();
  setLocalMode(false);
  $("video-heading").textContent = "包裹移动 · 合成演示";
  $("attached-source-name").textContent = "包裹移动演示.mp4";
  $("video-meta").textContent = "18 秒 · 1600 × 900 · 无音轨";
  $("file-input").value = "";
  showEvidence(false);
  announce("已返回固定演示，原本地文件没有上传。");
});
function mediaLoaded() {
  mediaReady = true;
  mediaFailed = false;
  $("reload-video").hidden = true;
  updateMediaContext();
  if (localMode)
    $("video-meta").textContent =
      `${clock(player.duration)} · ${player.videoWidth} × ${player.videoHeight} · 未建立索引`;
  if (pendingSeek !== null) {
    const seconds = pendingSeek;
    const trigger = pendingSeekTrigger;
    pendingSeek = null;
    pendingSeekTrigger = null;
    seek(seconds, trigger);
  }
  updateTime();
}
player.addEventListener("loadedmetadata", mediaLoaded);
if (player.readyState >= 1) mediaLoaded();
else updateMediaContext();
player.addEventListener("error", () => {
  mediaReady = false;
  mediaFailed = true;
  updateMediaContext();
  pendingSeek = null;
  $("seek-status").textContent =
    "视频无法播放，请重新加载或选择浏览器支持的格式。";
  $("reload-video").hidden = false;
  announce($("seek-status").textContent);
});
$("reload-video").addEventListener("click", () => {
  mediaFailed = false;
  mediaReady = false;
  updateMediaContext();
  player.load();
  $("seek-status").textContent = "正在重新加载视频…";
});
player.addEventListener("timeupdate", updateTime);
player.addEventListener("play", updateTime);
player.addEventListener("pause", updateTime);
window.addEventListener("beforeunload", () => {
  if (localUrl) URL.revokeObjectURL(localUrl);
});
document.querySelectorAll("[data-query]").forEach((element) => {
  element.disabled = true;
});
if (window.FrameSeekCanvas)
  investigation = window.FrameSeekCanvas.start({
    select: selectTask,
    ask,
    announce,
    close: () => showEvidence(false),
  });
fetch("/demo/catalog")
  .then((response) => {
    if (!response.ok) throw new Error("catalog");
    return response.json();
  })
  .then((data) => {
    demo = data;
    renderScenarios();
    document.querySelectorAll("[data-query]").forEach((element) => {
      element.disabled = localMode;
    });
    updateSend();
  })
  .catch(() => {
    notice("演示数据暂时无法加载，请刷新页面重试。");
    announce("演示数据加载失败。");
  });
