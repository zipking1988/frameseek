/* Behavioral regression coverage without a browser dependency or network access. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

class Element {
  constructor(tag = "div") {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this.value = "";
    this.hidden = false;
    this.scrollTop = 0;
    this.textContent = "";
    this.firstChild = { textContent: "" };
    this.classes = new Set();
    this.classList = {
      add: (x) => this.classes.add(x),
      remove: (x) => this.classes.delete(x),
      contains: (x) => this.classes.has(x),
      toggle: (x, enabled) => {
        if (enabled) this.classes.add(x);
        else this.classes.delete(x);
      },
    };
  }
  set className(value) {
    this.classes = new Set(value.split(" "));
  }
  get className() {
    return [...this.classes].join(" ");
  }
  append(...nodes) {
    for (const node of nodes) {
      node.parent = this;
      this.children.push(node);
    }
  }
  prepend(node) {
    node.parent = this;
    this.children.unshift(node);
  }
  replaceChildren() {
    this.children = [];
  }
  remove() {
    this.parent.children = this.parent.children.filter((x) => x !== this);
  }
  get firstElementChild() {
    return this.children[0];
  }
  setAttribute(key, value) {
    this.attributes[key] = value;
  }
  getAttribute(key) {
    return this.attributes[key] ?? null;
  }
  removeAttribute(key) {
    delete this.attributes[key];
  }
  addEventListener(name, fn) {
    (this.listeners[name] ??= []).push(fn);
  }
  dispatch(name) {
    for (const fn of this.listeners[name] ?? [])
      fn({ currentTarget: this, preventDefault() {} });
  }
  click() {
    this.dispatch("click");
  }
  focus() {
    this.focused = true;
  }
  getBoundingClientRect() {
    return { top: 0 };
  }
  scrollIntoView() {}
  pause() {
    this.paused = true;
  }
  load() {}
  querySelector() {
    return new Element();
  }
}
async function harness(readyState = 1, width = 1440) {
  const ids = new Map();
  const get = (id) => {
    if (!ids.has(id)) ids.set(id, new Element());
    return ids.get(id);
  };
  const sourceSteps = [new Element(), new Element(), new Element()];
  const shell = new Element();
  const player = get("player");
  Object.assign(player, {
    readyState,
    duration: 18,
    currentTime: 0,
    paused: true,
  });
  const walk = (nodes) => nodes.flatMap((n) => [n, ...walk(n.children)]);
  const byClass = (cls) =>
    walk([...ids.values()]).filter((n) => n.classList.contains(cls));
  const document = {
    getElementById: get,
    createElement: (tag) => new Element(tag),
    querySelector: (s) =>
      s === ".source-item span"
        ? get("source-name")
        : s.startsWith("[data-turn=")
          ? byClass("history-task").find(
              (n) => n.dataset.turn === s.split('"')[1],
            )
          : s === ".agent-shell"
            ? shell
            : s.includes("li:first-child")
              ? sourceSteps[0]
              : s.includes("li:nth-child(2)")
                ? sourceSteps[1]
                : s.includes("li:last-child")
                  ? sourceSteps[2]
                  : null,
    querySelectorAll: (s) =>
      s === ".run-steps li"
        ? sourceSteps
        : s === ".history-task"
          ? byClass("history-task")
          : s === ".evidence-button"
            ? byClass("evidence-button")
            : [],
  };
  const context = vm.createContext({
    document,
    window: {
      innerWidth: width,
      matchMedia: () => ({ matches: true }),
      addEventListener() {},
    },
    navigator: { clipboard: { writeText: async () => {} } },
    fetch: async () => ({ ok: true, json: async () => ({ queries: [] }) }),
    URL: {},
    console,
  });
  vm.runInContext(
    fs.readFileSync(
      path.join(__dirname, "../src/frameseek/static/app.js"),
      "utf8",
    ),
    context,
  );
  await new Promise(setImmediate);
  const run = (source) => vm.runInContext(source, context);
  const answer = (status, events = []) => ({
    question: status,
    response: {
      status,
      answer: status,
      events,
      unresolved: [],
      errors: [],
      followups: [],
    },
  });
  return { get, player, run, shell, answer };
}

test("cached metadata supports immediate seek; deferred metadata applies a queued seek", async () => {
  let h = await harness();
  h.run("seek(6)");
  assert.equal(h.player.currentTime, 6);
  assert.match(h.get("seek-status").textContent, /00:06/);
  h = await harness(0);
  h.run("seek(10)");
  assert.equal(h.player.currentTime, 0);
  h.player.readyState = 1;
  h.player.dispatch("loadedmetadata");
  assert.equal(h.player.currentTime, 10);
  assert.equal(h.player.paused, true);
});
test("reset after media failure cannot claim readiness; reload updates source with existing tasks", async () => {
  const h = await harness();
  h.player.dispatch("error");
  h.run("newTask()");
  assert.equal(h.get("source-step-state").textContent, "需重试");
  assert.equal(h.get("attached-source-state").textContent, "加载失败");
  h.run("turns = 2");
  h.get("reload-video").click();
  assert.equal(h.get("source-step-state").textContent, "加载中");
  h.player.dispatch("loadedmetadata");
  assert.equal(h.get("source-step-state").textContent, "已就绪");
});
test("selecting an older task synchronizes the canvas and exposes selected history", async () => {
  const h = await harness();
  h.run(
    `renderAnswer(${JSON.stringify(h.answer("ok", [{ action: "包裹", start: 5, end: 11, evidence: [], summary: "位置" }]))})`,
  );
  h.run(`renderAnswer(${JSON.stringify(h.answer("no_result"))})`);
  assert.equal(h.get("run-state").textContent, "未找到相关画面");
  const old = h.get("task-list").children[1];
  old.click();
  assert.equal(h.get("run-state").textContent, "已提供证据");
  assert.equal(old.getAttribute("aria-current"), "true");
  assert.equal(h.get("evidence-step-state").textContent, "待选择");
});
test("mobile evidence reveal and collapse retain task draft", async () => {
  const h = await harness(1, 375);
  h.get("question").value = "保留我的任务";
  h.run("seek(6)");
  assert.equal(h.get("toggle-evidence").getAttribute("aria-expanded"), "true");
  assert.equal(h.shell.classList.contains("evidence-open"), true);
  h.get("toggle-evidence").click();
  assert.equal(h.get("question").value, "保留我的任务");
  assert.equal(h.shell.classList.contains("evidence-open"), false);
});
test("local playback and new task retain unindexed state and disabled question", async () => {
  const h = await harness();
  h.run("setLocalMode(true)");
  h.run("newTask()");
  assert.equal(h.get("question").disabled, true);
  assert.equal(h.get("run-state").textContent, "未建立索引");
  assert.equal(h.get("source-step-state").textContent, "未索引");
  assert.equal(h.get("empty-state").hidden, false);
  assert.equal(h.get("restore-demo").hidden, false);
});
test("bounded session history removes the same oldest task as the conversation", async () => {
  const h = await harness();
  for (let i = 0; i < 13; i++)
    h.run(`renderAnswer(${JSON.stringify(h.answer("no_result"))})`);
  assert.equal(h.get("messages").children.length, 12);
  assert.equal(h.get("task-list").children.length, 12);
  assert.equal(
    h.get("task-list").children.at(-1).dataset.turn,
    h.get("messages").children[0].id,
  );
  h.run("newTask()");
  assert.equal(h.get("task-list").children.length, 0);
  assert.equal(h.get("task-count").textContent, "0");
});

test("source rail toggles the open panel and evidence restores its state without clearing the draft", async () => {
  const h = await harness();
  h.run("window.FrameSeekWorkbench = {}; investigation = { evidence() {} }");
  h.get("question").value = "保留当前追问";
  const rail = h.get("rail-source");
  assert.equal(rail.getAttribute("aria-expanded"), "true");
  rail.click();
  assert.equal(h.shell.classList.contains("source-collapsed"), true);
  assert.equal(rail.getAttribute("aria-expanded"), "false");
  assert.equal(rail.getAttribute("aria-label"), "打开素材");
  rail.click();
  assert.equal(h.shell.classList.contains("source-collapsed"), false);
  assert.equal(rail.getAttribute("aria-expanded"), "true");
  h.get("collapse-source").click();
  assert.equal(rail.focused, true);
  assert.equal(rail.getAttribute("aria-expanded"), "false");
  h.run("seek(13)");
  assert.equal(h.shell.classList.contains("source-collapsed"), false);
  assert.equal(rail.getAttribute("aria-expanded"), "true");
  assert.equal(rail.getAttribute("aria-label"), "收起素材");
  assert.equal(h.player.currentTime, 13);
  assert.equal(h.get("question").value, "保留当前追问");
});

test("发现导航显式展开小桌面检查器并保留输入", async () => {
  const h = await harness(1, 1200);
  h.get("question").value = "保留追问";
  h.run(
    "window.FrameSeekWorkbench = { showPanel(tab) { window.lastPanel = tab; } }",
  );
  h.shell.classList.add("inspector-collapsed");
  h.get("rail-findings").click();
  assert.equal(h.run("window.lastPanel"), "findings");
  assert.equal(h.shell.classList.contains("inspector-open"), true);
  assert.equal(h.shell.classList.contains("inspector-collapsed"), false);
  assert.equal(h.get("toggle-inspector").getAttribute("aria-expanded"), "true");
  assert.equal(h.get("inspector-findings-tab").focused, true);
  assert.equal(h.get("question").value, "保留追问");
});
