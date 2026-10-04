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
      snap(id, x, y, tolerance = 8) {
        const item = items.get(id);
        if (!item || ![x, y, tolerance].every(Number.isFinite))
          return { x, y, guides: [] };
        const guides = [];
        const result = { x, y };
        for (const [axis, dimension] of [
          ["x", "width"],
          ["y", "height"],
        ]) {
          let best = tolerance + 1;
          let guide = null;
          for (const other of items.values()) {
            if (other.id === id) continue;
            for (const factor of [0, 0.5, 1]) {
              const target = other[axis] + other[dimension] * factor;
              const delta = target - (result[axis] + item[dimension] * factor);
              if (Math.abs(delta) < best && Math.abs(delta) <= tolerance) {
                best = Math.abs(delta);
                guide = { axis, at: target, delta };
              }
            }
          }
          if (guide) {
            result[axis] += guide.delta;
            guides.push({ axis, at: guide.at });
          }
        }
        return { ...result, guides };
      },
      related(id) {
        const related = new Set();
        if (!items.has(id)) return related;
        let current = items.get(id);
        while (current && !related.has(current.id)) {
          related.add(current.id);
          current = items.get(current.parent);
        }
        const descendants = [id];
        const visited = new Set();
        while (descendants.length) {
          const parent = descendants.pop();
          if (visited.has(parent)) continue;
          visited.add(parent);
          for (const item of items.values())
            if (item.parent === parent) {
              related.add(item.id);
              descendants.push(item.id);
            }
        }
        return related;
      },
      overview(width, height, mapWidth = 184, mapHeight = 106) {
        const visible = {
          x: -view.x / view.scale,
          y: -view.y / view.scale,
          width: width / view.scale,
          height: height / view.scale,
        };
        const all = [...items.values(), visible];
        const left = Math.min(...all.map((item) => item.x)) - 40;
        const top = Math.min(...all.map((item) => item.y)) - 40;
        const right = Math.max(...all.map((item) => item.x + item.width)) + 40;
        const bottom =
          Math.max(...all.map((item) => item.y + item.height)) + 40;
        const scale = Math.min(
          mapWidth / (right - left),
          mapHeight / (bottom - top),
        );
        const ox = (mapWidth - (right - left) * scale) / 2;
        const oy = (mapHeight - (bottom - top) * scale) / 2;
        const project = (item) => ({
          id: item.id,
          kind: item.kind,
          x: ox + (item.x - left) * scale,
          y: oy + (item.y - top) * scale,
          width: item.width * scale,
          height: item.height * scale,
        });
        return {
          nodes: [...items.values()].map(project),
          viewport: project(visible),
        };
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
        if (mode === "workspace") {
          const questions = ordered.filter((item) => !item.kind);
          const findings = ordered.filter((item) => item.kind);
          questions.forEach((item, n) => {
            item.x = 84 + (n % 3) * 420;
            item.y = 175 + Math.floor(n / 3) * rowHeight;
          });
          const findingsTop = questions.length
            ? Math.max(...questions.map((item) => item.y + item.height)) + 120
            : 175;
          const findingRow =
            Math.max(360, ...findings.map((item) => item.height)) + 80;
          findings.forEach((item, n) => {
            item.x = 84 + (n % 3) * 420;
            item.y = findingsTop + Math.floor(n / 3) * findingRow;
          });
        } else if (mode !== "threads") {
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
      fit(width, height, options = null) {
        if (!items.size) {
          view = { x: 0, y: 0, scale: 1 };
          return;
        }
        const all = [...items.values()];
        const left = Math.min(...all.map((i) => i.x));
        const top = Math.min(...all.map((i) => i.y));
        const right = Math.max(...all.map((i) => i.x + i.width));
        const bottom = Math.max(...all.map((i) => i.y + i.height));
        const insetTop = options?.top ?? (height < 850 ? 120 : 175);
        const availableHeight = options
          ? height - insetTop - options.bottom
          : height - (height < 850 ? 355 : 365);
        const scale = clamp(
          Math.min(
            (width - 80) / (right - left),
            availableHeight / (bottom - top),
            1,
          ),
          0.1,
          1,
        );
        view = {
          scale,
          x: (width - (right - left) * scale) / 2 - left * scale,
          y: insetTop - top * scale,
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
    let guides = [];
    let minimapPreference = null;
    const minimapButtons = new Map();
    const size = () => ({
      width: viewport.clientWidth,
      height: viewport.clientHeight,
    });
    let pendingDraw = null;
    function scheduleDraw() {
      if (pendingDraw !== null) return;
      pendingDraw = requestAnimationFrame(() => {
        pendingDraw = null;
        draw();
      });
    }
    function draw() {
      const { x, y, scale } = model.view;
      const related = model.related(selected);
      plane.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
      for (const [id, item] of model.items) {
        const turn = records.get(id).turn;
        turn.style.left = `${item.x}px`;
        turn.style.top = `${item.y}px`;
        item.height = turn.offsetHeight;
        item.width = turn.offsetWidth;
        turn.classList.toggle("selected", id === selected);
        turn.classList.toggle("connected", id !== selected && related.has(id));
        turn.classList.toggle(
          "unrelated",
          Boolean(selected) && !related.has(id),
        );
        const select = records.get(id).select;
        select.textContent = id === selected ? "已选中" : "选中";
      }
      $("zoom-reset").textContent = `${Math.round(scale * 100)}%`;
      $("arrange-canvas").disabled = model.items.size === 0;
      const group = $("finding-group-region");
      if (group) {
        const artifacts = [...model.items.values()].filter((item) => item.kind);
        group.hidden = !artifacts.length;
        if (artifacts.length) {
          const left = Math.min(...artifacts.map((item) => item.x)) - 18;
          const top = Math.min(...artifacts.map((item) => item.y)) - 46;
          group.style.left = `${left}px`;
          group.style.top = `${top}px`;
          group.style.width = `${Math.max(...artifacts.map((item) => item.x + item.width)) - left + 18}px`;
          group.style.height = `${Math.max(...artifacts.map((item) => item.y + item.height)) - top + 18}px`;
          $("finding-group-label").textContent =
            window.FrameSeekWorkbench?.getSnapshot().groupTitle || "关键发现";
        }
      }
      const { width, height } = size();
      const dpr = window.devicePixelRatio || 1;
      lines.width = width * dpr;
      lines.height = height * dpr;
      const ctx = lines.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);
      if (window.FrameSeekWorkbench && model.items.size) {
        const grid = 32 * scale;
        if (grid >= 10) {
          ctx.fillStyle = "#45607838";
          for (let gx = ((x % grid) + grid) % grid; gx < width; gx += grid)
            for (let gy = ((y % grid) + grid) % grid; gy < height; gy += grid)
              ctx.fillRect(gx, gy, 1, 1);
        }
      }
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      for (const item of model.items.values()) {
        const parent = model.items.get(item.parent);
        if (!parent) continue;
        const vertical = item.y >= parent.y + parent.height + 40;
        const from = {
          x: vertical ? parent.x + parent.width / 2 : parent.x + parent.width,
          y: vertical
            ? parent.y + parent.height
            : parent.y + Math.min(parent.height / 2, 210),
        };
        const to = {
          x: vertical ? item.x + item.width / 2 : item.x,
          y: vertical ? item.y : item.y + Math.min(item.height / 2, 210),
        };
        const bend = Math.max(45, Math.abs(to.x - from.x) / 2);
        const active = item.id === selected || item.parent === selected;
        const connected = related.has(item.id) && related.has(parent.id);
        ctx.strokeStyle = active
          ? "#ff884b"
          : connected
            ? "#7896ae"
            : "#3e566b";
        ctx.lineWidth = (active ? 1.8 : 1.15) / scale;
        ctx.setLineDash(item.kind === "evidence" ? [5 / scale, 5 / scale] : []);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        const crossesCard = [...model.items.values()].some(
          (other) =>
            other !== parent &&
            other !== item &&
            other.x > from.x &&
            other.x < to.x &&
            Math.abs(other.y - item.y) < 40,
        );
        if (vertical) {
          const gap = (to.y - from.y) / 2;
          ctx.bezierCurveTo(from.x, from.y + gap, to.x, to.y - gap, to.x, to.y);
        } else if (crossesCard) {
          const lane = Math.min(parent.y, item.y) - 35;
          ctx.bezierCurveTo(
            from.x + 35,
            from.y,
            from.x + 35,
            lane,
            from.x + 55,
            lane,
          );
          ctx.lineTo(to.x - 55, lane);
          ctx.bezierCurveTo(to.x - 35, lane, to.x - 35, to.y, to.x, to.y);
        } else {
          ctx.bezierCurveTo(
            from.x + bend,
            from.y,
            to.x - bend,
            to.y,
            to.x,
            to.y,
          );
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(to.x - (vertical ? 4 : 7), to.y - (vertical ? 7 : 4));
        ctx.lineTo(to.x, to.y);
        ctx.lineTo(to.x + (vertical ? 4 : -7), to.y + (vertical ? -7 : 4));
        ctx.stroke();
        for (const port of [from, to]) {
          ctx.beginPath();
          ctx.arc(port.x, port.y, 2.5 / scale, 0, Math.PI * 2);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      }
      ctx.setLineDash([4 / scale, 4 / scale]);
      ctx.strokeStyle = "#a3ced9";
      ctx.lineWidth = 1 / scale;
      for (const guide of guides) {
        ctx.beginPath();
        if (guide.axis === "x") {
          ctx.moveTo(guide.at, -y / scale);
          ctx.lineTo(guide.at, (height - y) / scale);
        } else {
          ctx.moveTo(-x / scale, guide.at);
          ctx.lineTo((width - x) / scale, guide.at);
        }
        ctx.stroke();
      }
      $("focus-card")?.toggleAttribute("disabled", !selected);
      $("canvas-node-count")?.replaceChildren(
        document.createTextNode(`${model.items.size} 个对象`),
      );
      drawMinimap();
    }
    function drawMinimap() {
      const map = $("minimap-content");
      if (!map) return;
      const s = size();
      const show = minimapPreference ?? (s.width >= 1000 && s.height >= 780);
      $("canvas-minimap").hidden = !show;
      $("toggle-minimap").setAttribute("aria-expanded", String(show));
      const overview = model.overview(s.width, s.height);
      for (const [id, button] of minimapButtons)
        if (!model.items.has(id)) {
          button.remove();
          minimapButtons.delete(id);
        }
      const position = (element, rect) => {
        Object.assign(element.style, {
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${Math.max(4, rect.width)}px`,
          height: `${Math.max(4, rect.height)}px`,
        });
      };
      position($("minimap-window"), overview.viewport);
      for (const item of overview.nodes) {
        let button = minimapButtons.get(item.id);
        if (!button) {
          button = document.createElement("button");
          button.type = "button";
          button.className = "minimap-node";
          button.addEventListener("click", () => {
            choose(item.id);
            reveal(item.id, true);
          });
          minimapButtons.set(item.id, button);
          map.append(button);
        }
        position(button, item);
        button.dataset.kind = item.kind || "question";
        button.setAttribute("aria-pressed", String(item.id === selected));
        button.setAttribute(
          "aria-label",
          `画布导航：${records.get(item.id).query.question}`,
        );
        button.title = records.get(item.id).query.question;
      }
      $("canvas-minimap").classList.toggle("empty", !model.items.size);
    }
    const cardObserver = new ResizeObserver(draw);
    window.FrameSeekWorkbench?.subscribe(draw);
    function fit() {
      draw();
      const s = size();
      model.fit(
        s.width,
        s.height,
        window.FrameSeekWorkbench
          ? { top: s.height < 850 ? 70 : 100, bottom: 240 }
          : null,
      );
      draw();
    }
    function choose(id, focus = false) {
      const record = records.get(id);
      if (!record) return;
      selected = id;
      callbacks.select(record.query.response, record.history);
      const scope = records.get(record.query.sourceTurn)?.query || record.query;
      $("composer-label").textContent = `继续追问：${scope.question}`;
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
          record.controller.abort();
          records.delete(id);
          model.remove(id);
        }
      const parent = query.parentTurn || null;
      model.add(turn.id, parent, {
        time: query.response.events[0]?.start,
        status: query.response.status,
        kind: query.kind || null,
      });
      const header = document.createElement("div");
      header.className = "card-heading";
      const drag = document.createElement("button");
      drag.type = "button";
      drag.className = "card-drag";
      drag.textContent =
        query.kind === "evidence"
          ? "证据帧"
          : query.kind === "conclusion"
            ? "结论"
            : `问题 ${turn.id.split("-")[1]}${parent ? " · 追问" : ""}`;
      drag.setAttribute(
        "aria-label",
        `移动卡片：${query.question}，方向键移动`,
      );
      const select = document.createElement("button");
      select.type = "button";
      select.className = "card-select";
      select.textContent = "选中";
      select.setAttribute(
        "aria-label",
        `选中${query.kind === "evidence" ? "证据" : query.kind === "conclusion" ? "结论" : "问题"}：${query.question}`,
      );
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
      const replies =
        query.suggested_replies ||
        (query.id === "center"
          ? ["那后来呢？"]
          : query.id === "right"
            ? ["谁搬的？"]
            : []);
      (query.kind ? [] : replies).slice(0, 2).forEach((reply) => {
        const suggested = document.createElement("button");
        suggested.type = "button";
        suggested.className = "text-button";
        suggested.textContent = reply;
        suggested.addEventListener("click", () => {
          choose(turn.id);
          callbacks.ask(reply);
        });
        actions.append(suggested);
      });
      if (!query.kind) actions.append(follow);
      turn.append(actions);
      const controller = new AbortController();
      records.set(turn.id, { turn, query, history, select, controller });
      if (query.kind) {
        const questions = [...model.items.values()].filter(
          (item) => !item.kind,
        );
        const pins = [...model.items.values()].filter((item) => item.kind);
        const top = questions.length
          ? Math.max(...questions.map((item) => item.y + item.height)) + 120
          : 175;
        let slot = 0;
        const rowHeight =
          Math.max(400, ...pins.map((item) => item.height)) + 80;
        while (slot < 30) {
          const x = 84 + (slot % 3) * 420;
          const y = top + Math.floor(slot / 3) * rowHeight;
          const overlaps = pins.some(
            (item) =>
              item.id !== turn.id &&
              x < item.x + item.width &&
              x + 350 > item.x &&
              y < item.y + item.height &&
              y + 420 > item.y,
          );
          if (!overlaps) {
            model.move(turn.id, x, y);
            break;
          }
          slot++;
        }
      }
      drag.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
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
        drag.focus({ preventScroll: true });
        drag.setPointerCapture(e.pointerId);
        choose(turn.id);
        turn.classList.add("dragging");
      });
      const end = () => {
        if (gesture?.id !== turn.id) return;
        gesture = null;
        guides = [];
        turn.classList.remove("dragging");
        draw();
      };
      drag.addEventListener("lostpointercapture", end);
      // The document fallback also handles native browser retargeting during a drag.
      document.addEventListener(
        "pointermove",
        (e) => {
          if (gesture?.id !== turn.id || gesture.pointer !== e.pointerId)
            return;
          if (!(e.buttons & 1)) {
            end();
            return;
          }
          const x = gesture.x + (e.clientX - gesture.px) / gesture.scale;
          const y = gesture.y + (e.clientY - gesture.py) / gesture.scale;
          const next = e.shiftKey
            ? { x, y, guides: [] }
            : model.snap(turn.id, x, y, 7 / gesture.scale);
          model.move(turn.id, next.x, next.y);
          guides = next.guides;
          scheduleDraw();
        },
        { signal: controller.signal },
      );
      document.addEventListener("pointerup", end, {
        signal: controller.signal,
      });
      document.addEventListener("pointercancel", end, {
        signal: controller.signal,
      });
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
    function reveal(id, readable = false) {
      const item = model.items.get(id);
      if (!item) return;
      if (window.FrameSeekWorkbench) {
        const s = size();
        const composerTop =
          $("question-form").getBoundingClientRect().top -
          viewport.getBoundingClientRect().top;
        const targetScale = Math.min(
          readable ? 1 : model.view.scale,
          1,
          (composerTop - 48) / item.height,
        );
        model.zoom(targetScale, s.width / 2, s.height / 2);
        const v = model.view;
        const targetTop = Math.max(
          24,
          Math.min(100, (composerTop - item.height * v.scale) / 2),
        );
        model.pan(
          s.width * 0.46 -
            (item.x * v.scale + v.x) -
            (item.width * v.scale) / 2,
          targetTop - (item.y * v.scale + v.y),
        );
        draw();
        return;
      }
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
      if (
        gesture?.kind === "card" ||
        e.button !== 0 ||
        e.target.closest(".turn,button,a")
      )
        return;
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
      scheduleDraw();
    });
    const stopPan = () => {
      if (gesture?.kind === "pan") gesture = null;
      viewport.classList.remove("panning");
    };
    viewport.addEventListener("pointerup", stopPan);
    viewport.addEventListener("pointercancel", stopPan);
    viewport.addEventListener("lostpointercapture", stopPan);
    document.addEventListener("pointerup", stopPan);
    document.addEventListener("pointercancel", stopPan);
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
        scheduleDraw();
      },
      { passive: false },
    );
    viewport.addEventListener("keydown", (e) => {
      if (e.target !== viewport) return;
      if (e.key === "Home") {
        e.preventDefault();
        fit();
        return;
      }
      if (e.key.toLowerCase() === "f" && selected) {
        e.preventDefault();
        reveal(selected, true);
        return;
      }
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
    $("focus-card")?.addEventListener("click", () => {
      reveal(selected, true);
      callbacks.announce("已聚焦当前对象。适应视图可回到全局。");
    });
    $("toggle-minimap")?.addEventListener("click", () => {
      minimapPreference = $("canvas-minimap").hidden;
      draw();
    });
    viewport.addEventListener("dblclick", (e) => {
      if (!e.target.closest(".turn,button,a")) fit();
    });
    function arrange(mode) {
      callbacks.close();
      $("arrange-mode").value = mode;
      model.arrange(mode);
      fit();
      callbacks.announce("已自动整理调查卡片。");
    }
    $("arrange-canvas").addEventListener("click", () =>
      arrange($("arrange-mode").value),
    );
    $("clear-context").addEventListener("click", () => {
      clearScope();
      $("question").focus();
    });
    $("rail-canvas").addEventListener("click", () => {
      callbacks.close();
      fit();
    });
    viewport.addEventListener("focusin", (e) => {
      if (gesture) return;
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
    let lastSize = size();
    new ResizeObserver(() => {
      const next = size();
      draw();
      if (
        selected &&
        !gesture &&
        (next.width < lastSize.width || next.height < lastSize.height)
      )
        reveal(selected, true);
      lastSize = next;
    }).observe(viewport);
    return {
      register,
      choose,
      arrange,
      clearScope,
      context: () => {
        const record = selected ? records.get(selected) : null;
        return record?.query.sourceTurn
          ? records.get(record.query.sourceTurn) || record
          : record;
      },
      reveal,
      remove: (id) => {
        const record = records.get(id);
        if (record) {
          cardObserver.unobserve(record.turn);
          record.controller.abort();
        }
        records.delete(id);
        model.remove(id);
        if (gesture?.id === id) {
          gesture = null;
          guides = [];
        }
        if (selected === id) clearScope();
        draw();
      },
      clear: () => {
        cardObserver.disconnect();
        for (const record of records.values()) record.controller.abort();
        gesture = null;
        viewport.classList.remove("panning");
        records.clear();
        model.clear();
        guides = [];
        clearScope();
        draw();
      },
      source: (local) => {
        $("source-thumbnail").hidden = local;
        $("canvas-hint").textContent = local
          ? "当前文件仅供本地播放，尚未建立索引"
          : "拖动空白平移 · Ctrl / ⌘ + 滚轮缩放";
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
