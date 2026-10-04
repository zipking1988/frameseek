/* Behavioral regression coverage without a browser dependency or network access. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

let activeDocument;
class Element {
  constructor(tag = "div") {
    this.tagName = tag;
    this.isConnected = true;
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
    this.isConnected = false;
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
    activeDocument.activeElement = this;
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
  activeDocument = document;
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
  return { get, player, run, shell, answer, document };
}

const event = { start: 5, end: 11, action: "center", summary: "parcel", evidence: [{ t: 6, uri: "/frame.jpg", caption: "parcel" }] };
function evidenceButton(h) {
  h.run("renderAnswer(demo.queries[0])");
  return h.get("messages").children[0].children.find(n => n.classList.contains("event")).children.find(n => n.classList.contains("evidence-grid")).children[0];
}
async function conversation(ready = 1, width = 375) {
  const h = await harness(ready, width);
  h.run(`demo.queries = [${JSON.stringify({ question: "center", response: { status: "ok", answer: "center", events: [event], unresolved: [], errors: [], followups: [] } })}]`);
  return h;
}
test("mobile evidence hands focus to return action, then restores clicked evidence and draft", async () => {
  const h = await conversation();
  const evidence = evidenceButton(h);
  h.get("question").value = "draft to retain";
  h.get("question").focus();
  evidence.click();
  assert.equal(h.document.activeElement, h.get("toggle-evidence"));
  assert.equal(h.player.currentTime, 6);
  h.get("toggle-evidence").click();
  assert.equal(h.document.activeElement, evidence);
  assert.equal(h.get("question").value, "draft to retain");
});
test("loading video retains original evidence trigger for focus restoration", async () => {
  const h = await conversation(0);
  const evidence = evidenceButton(h);
  evidence.click();
  h.player.readyState = 1;
  h.player.dispatch("loadedmetadata");
  assert.equal(h.document.activeElement, h.get("toggle-evidence"));
  h.get("toggle-evidence").click();
  assert.equal(h.document.activeElement, evidence);
});
test("removed evidence cannot receive focus; desktop seek preserves current focus", async () => {
  let h = await conversation();
  const evidence = evidenceButton(h);
  evidence.click();
  evidence.remove();
  h.get("toggle-evidence").click();
  assert.equal(h.document.activeElement, h.get("question"));
  h = await conversation(1, 1440);
  const desktopEvidence = evidenceButton(h);
  desktopEvidence.focus();
  desktopEvidence.click();
  assert.equal(h.document.activeElement, desktopEvidence);
  assert.equal(h.shell.classList.contains("evidence-open"), false);
});

test("unsupported follow-up on another topic gives a supported recovery question", async () => {
  const h = await conversation();
  h.get("question").value = "那后来呢？";
  h.run('lastQueryId = "forklift"; ask("那后来呢？")');
  assert.equal(h.get("question").value, "那后来呢？");
  assert.equal(h.get("messages").children.length, 0);
  assert.match(h.get("form-notice").textContent, /当前话题不支持这个追问/);
  assert.match(h.get("form-notice").textContent, /包裹什么时候出现在中央/);
  assert.doesNotMatch(h.get("form-notice").textContent, /演示支持「那后来呢/);
  h.run('lastQueryId = "center"; ask("不支持的问题")');
  assert.match(h.get("form-notice").textContent, /演示支持「那后来呢/);
});
