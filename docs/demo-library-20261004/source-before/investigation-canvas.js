/* Spatial investigation model and DOM adapter; graph lines represent actual parent turns. */
(function (root) {
  "use strict";
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  function createModel() {
    const items = new Map();
    let view = { x: 0, y: 0, scale: 1 };
    const model = {
      items,
      get view() {
        return { ...view };
      },
      add(id, parent, metadata = {}) {
        if (items.has(id)) return items.get(id);
        const n = items.size;
        const origin = items.get(parent);
        const siblings = [...items.values()].filter(
          (i) => origin && i.parent === parent,
        ).length;
        const item = {
          id,
          parent: origin ? parent : null,
          ...metadata,
          x: origin ? origin.x + (n === 2 ? 540 : 440) : 84 + (n % 3) * 440,
          y: origin
            ? origin.y + (n === 2 ? 200 : 40) + siblings * 460
            : 175 + Math.floor(n / 3) * 480,
          width: 330,
          height: 420,
        };
        items.set(id, item);
        return item;
      },
      remove(id) {
        items.delete(id);
        for (const item of items.values())
          if (item.parent === id) item.parent = null;
      },
      move(id, x, y) {
        const item = items.get(id);
        if (item && Number.isFinite(x) && Number.isFinite(y))
          Object.assign(item, { x, y });
      },
      pan(dx, dy) {
        if (Number.isFinite(dx) && Number.isFinite(dy)) {
          view.x += dx;
          view.y += dy;
        }
      },
      zoom(scale, x, y) {
        if (![scale, x, y].every(Number.isFinite)) return;
        const next = clamp(scale, 0.1, 1.6);
        const ratio = next / view.scale;
        view = {
          x: x - (x - view.x) * ratio,
          y: y - (y - view.y) * ratio,
          scale: next,
        };
      },
      arrange(mode = "threads") {
        const ordered = [...items.values()];
        const rowHeight =
          Math.max(490, ...ordered.map((item) => item.height)) + 90;
        if (mode === "time")
          ordered.sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity));
        if (mode === "status")
          ordered.sort(
            (a, b) =>
              (({ ok: 0, partial: 1, no_result: 2, error: 3 })[a.status] ?? 4) -
              ({ ok: 0, partial: 1, no_result: 2, error: 3 }[b.status] ?? 4),
          );
        if (mode !== "threads") {
          ordered.forEach((item, n) => {
            item.x = 84 + (n % 3) * 440;
            item.y = 175 + Math.floor(n / 3) * rowHeight;
          });
        } else {
          const depths = new Map();
          const rows = new Map();
          ordered.forEach((item) => {
            const depth =
              item.parent && depths.has(item.parent)
                ? depths.get(item.parent) + 1
                : 0;
            const row = rows.get(depth) || 0;
            item.x = 84 + depth * 440 + (depth >= 2 ? 100 : 0);
            item.y = 175 + row * rowHeight + (depth >= 2 ? 240 : depth * 40);
            depths.set(item.id, depth);
            rows.set(depth, row + 1);
          });
        }
      },
      fit(width, height) {
        if (!items.size) {
          view = { x: 0, y: 0, scale: 1 };
          return;
        }
        const all = [...items.values()];
        const left = Math.min(...all.map((i) => i.x));
        const top = Math.min(...all.map((i) => i.y));
        const right = Math.max(...all.map((i) => i.x + i.width));
        const bottom = Math.max(...all.map((i) => i.y + i.height));
        const scale = clamp(
          Math.min(
            (width - 80) / (right - left),
            (height - (height < 850 ? 355 : 365)) / (bottom - top),
            1,
          ),
          0.1,
          1,
        );
        view = {
          scale,
          x: (width - (right - left) * scale) / 2 - left * scale,
          y: (height < 850 ? 120 : 175) - top * scale,
        };
      },
      clear() {
        items.clear();
        view = { x: 0, y: 0, scale: 1 };
      },
    };
    return model;
  }
  function start(callbacks) {
    const $ = (id) => document.getElementById(id);
    const viewport = $("chat-content");
    const plane = $("canvas-plane");
    const lines = $("canvas-links");
    const model = createModel();
    const records = new Map();
    let selected = null;
    let gesture = null;
    const size = () => ({
      width: viewport.clientWidth,
      height: viewport.clientHeight,
    });
    function draw() {
      const { x, y, scale } = model.view;
      plane.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
      for (const [id, item] of model.items) {
        const turn = records.get(id).turn;
        turn.style.left = `${item.x}px`;
        turn.style.top = `${item.y}px`;
        item.height = turn.offsetHeight;
        item.width = turn.offsetWidth;
      }
      $("zoom-reset").textContent = `${Math.round(scale * 100)}%`;
      $("arrange-canvas").disabled = model.items.size === 0;
      const { width, height } = size();
      const dpr = window.devicePixelRatio || 1;
      lines.width = width * dpr;
      lines.height = height * dpr;
      const ctx = lines.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      for (const item of model.items.values()) {
        const parent = model.items.get(item.parent);
        if (!parent) continue;
        const from = {
          x: parent.x + parent.width,
          y: parent.y + Math.min(parent.height / 2, 210),
        };
        const to = { x: item.x, y: item.y + Math.min(item.height / 2, 210) };
        const bend = Math.max(45, Math.abs(to.x - from.x) / 2);
        ctx.strokeStyle = item.id === selected ? "#ff702e" : "#8da7bd";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.bezierCurveTo(from.x + bend, from.y, to.x - bend, to.y, to.x, to.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(to.x - 7, to.y - 4);
        ctx.lineTo(to.x, to.y);
        ctx.lineTo(to.x - 7, to.y + 4);
        ctx.stroke();
      }
    }
    const cardObserver = new ResizeObserver(draw);
    function fit() {
      draw();
      const s = size();
      model.fit(s.width, s.height);
      draw();
    }
    function choose(id, focus = false) {
      const record = records.get(id);
      if (!record) return;
      selected = id;
      callbacks.select(record.query.response, record.history);
      $("composer-label").textContent = `继续追问：${record.query.question}`;
      $("clear-context").hidden = false;
      for (const [key, value] of records)
        value.select.setAttribute("aria-pressed", String(key === id));
      if (focus) $("question").focus();
      draw();
    }
    function clearScope() {
      selected = null;
      $("composer-label").textContent = "向 FrameSeek 提问";
      $("clear-context").hidden = true;
      for (const record of records.values()) {
        record.turn.classList.remove("selected");
        record.select.setAttribute("aria-pressed", "false");
      }
      draw();
    }
    function register(turn, query, history) {
      for (const [id, record] of records)
        if (!record.turn.isConnected) {
          cardObserver.unobserve(record.turn);
          records.delete(id);
          model.remove(id);
        }
      const parent = query.parentTurn || null;
      model.add(turn.id, parent, {
        time: query.response.events[0]?.start,
        status: query.response.status,
      });
      const header = document.createElement("div");
      header.className = "card-heading";
      const drag = document.createElement("button");
      drag.type = "button";
      drag.className = "card-drag";
      drag.textContent = `问题 ${turn.id.split("-")[1]}${parent ? " · 追问" : ""}`;
      drag.setAttribute(
        "aria-label",
        `移动卡片：${query.question}，方向键移动`,
      );
      const select = document.createElement("button");
      select.type = "button";
      select.className = "card-select";
      select.textContent = "选中";
      select.setAttribute("aria-label", `选中问题：${query.question}`);
      select.addEventListener("click", () => choose(turn.id));
      header.append(drag, select);
      turn.prepend(header);
      turn.dataset.status = query.response.status;
      const actions = document.createElement("div");
      actions.className = "response-actions";
      const follow = document.createElement("button");
      follow.type = "button";
      follow.className = "text-button card-followup";
      follow.textContent = "继续追问";
      follow.addEventListener("click", () => choose(turn.id, true));
      if (query.id === "center" || query.id === "right") {
        const suggested = document.createElement("button");
        suggested.type = "button";
        suggested.className = "text-button";
        suggested.textContent =
          query.id === "center" ? "那后来呢？" : "谁搬的？";
        suggested.addEventListener("click", () => {
          choose(turn.id);
          callbacks.ask(suggested.textContent);
        });
        actions.append(suggested);
      }
      actions.append(follow);
      turn.append(actions);
      records.set(turn.id, { turn, query, history, select });
      drag.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        drag.focus();
        drag.setPointerCapture(e.pointerId);
        const item = model.items.get(turn.id);
        gesture = {
          kind: "card",
          id: turn.id,
          pointer: e.pointerId,
          px: e.clientX,
          py: e.clientY,
          x: item.x,
          y: item.y,
          scale: model.view.scale,
        };
      });
      drag.addEventListener("pointermove", (e) => {
        if (gesture?.id !== turn.id || gesture.pointer !== e.pointerId) return;
        model.move(
          turn.id,
          gesture.x + (e.clientX - gesture.px) / gesture.scale,
          gesture.y + (e.clientY - gesture.py) / gesture.scale,
        );
        draw();
      });
      const end = () => {
        gesture = null;
      };
      drag.addEventListener("pointerup", end);
      drag.addEventListener("pointercancel", end);
      drag.addEventListener("keydown", (e) => {
        const steps = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
        if (!steps[e.key]) return;
        e.preventDefault();
        const item = model.items.get(turn.id),
          step = e.shiftKey ? 50 : 10;
        model.move(
          turn.id,
          item.x + steps[e.key][0] * step,
          item.y + steps[e.key][1] * step,
        );
        draw();
        callbacks.announce("卡片位置已更新。");
      });
      history.addEventListener("click", () => {
        choose(turn.id);
        reveal(turn.id);
      });
      turn.addEventListener("click", (e) => {
        if (!e.target.closest("button,summary,details")) choose(turn.id);
      });
      turn.addEventListener("toggle", draw, true);
      choose(turn.id);
      const viewportSize = size();
      if (viewportSize.height < 850) {
        model.zoom(
          Math.min(model.view.scale, 0.88),
          viewportSize.width / 2,
          viewportSize.height / 2,
        );
        reveal(turn.id);
      } else if (model.items.size === 3) fit();
      else if (model.items.size > 3) reveal(turn.id);
      else draw();
      cardObserver.observe(turn);
    }
    function reveal(id) {
      const item = model.items.get(id);
      if (!item) return;
      const v = model.view,
        s = size();
      const left = item.x * v.scale + v.x,
        top = item.y * v.scale + v.y;
      model.pan(
        s.width * 0.42 - left - (item.width * v.scale) / 2,
        Math.max(
          120,
          Math.min(175, (s.height - 260 - item.height * v.scale) / 2),
        ) - top,
      );
      draw();
    }
    viewport.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest(".turn,button,a")) return;
      viewport.setPointerCapture(e.pointerId);
      gesture = {
        kind: "pan",
        pointer: e.pointerId,
        px: e.clientX,
        py: e.clientY,
      };
      viewport.classList.add("panning");
    });
    viewport.addEventListener("pointermove", (e) => {
      if (gesture?.kind !== "pan" || gesture.pointer !== e.pointerId) return;
      model.pan(e.clientX - gesture.px, e.clientY - gesture.py);
      gesture.px = e.clientX;
      gesture.py = e.clientY;
      draw();
    });
    const stopPan = () => {
      if (gesture?.kind === "pan") gesture = null;
      viewport.classList.remove("panning");
    };
    viewport.addEventListener("pointerup", stopPan);
    viewport.addEventListener("pointercancel", stopPan);
    viewport.addEventListener(
      "wheel",
      (e) => {
        if (e.target.closest("details,textarea")) return;
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          const box = viewport.getBoundingClientRect();
          model.zoom(
            model.view.scale * Math.exp(-e.deltaY * 0.005),
            e.clientX - box.left,
            e.clientY - box.top,
          );
        } else model.pan(-e.deltaX, -e.deltaY);
        draw();
      },
      { passive: false },
    );
    viewport.addEventListener("keydown", (e) => {
      if (e.target !== viewport) return;
      const steps = {
        ArrowLeft: [50, 0],
        ArrowRight: [-50, 0],
        ArrowUp: [0, 50],
        ArrowDown: [0, -50],
      };
      if (steps[e.key]) {
        e.preventDefault();
        model.pan(...steps[e.key]);
        draw();
      }
    });
    $("zoom-in").addEventListener("click", () => {
      const s = size();
      model.zoom(model.view.scale * 1.15, s.width / 2, s.height / 2);
      draw();
    });
    $("zoom-out").addEventListener("click", () => {
      const s = size();
      model.zoom(model.view.scale / 1.15, s.width / 2, s.height / 2);
      draw();
    });
    $("zoom-reset").addEventListener("click", () => {
      const s = size();
      model.zoom(1, s.width / 2, s.height / 2);
      draw();
    });
    $("fit-canvas").addEventListener("click", fit);
    $("arrange-canvas").addEventListener("click", () => {
      callbacks.close();
      model.arrange($("arrange-mode").value);
      fit();
      callbacks.announce("已自动整理调查卡片。");
    });
    $("clear-context").addEventListener("click", () => {
      clearScope();
      $("question").focus();
    });
    $("rail-canvas").addEventListener("click", () => {
      callbacks.close();
      fit();
    });
    viewport.addEventListener("focusin", (e) => {
      const card = e.target.closest(".turn");
      if (!card) return;
      const rect = e.target.getBoundingClientRect(),
        bounds = viewport.getBoundingClientRect();
      if (
        rect.left < bounds.left ||
        rect.right > bounds.right ||
        rect.top < bounds.top + 120 ||
        rect.bottom > bounds.bottom - 45
      )
        reveal(card.id);
    });
    new ResizeObserver(draw).observe(viewport);
    return {
      register,
      choose,
      context: () => (selected ? records.get(selected) : null),
      clear: () => {
        cardObserver.disconnect();
        records.clear();
        model.clear();
        clearScope();
        draw();
      },
      source: (local) => {
        $("source-thumbnail").hidden = local;
        $("canvas-hint").textContent = local
          ? "当前文件仅供本地播放，尚未建立索引"
          : "拖动卡片整理 · 拖动空白处平移";
      },
      evidence: (query) => {
        $("evidence-question").textContent = query?.question || "素材预览";
      },
      fit,
    };
  }
  const api = { createModel, start };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FrameSeekCanvas = api;
})(typeof window !== "undefined" ? window : globalThis);
