const test = require("node:test");
const assert = require("node:assert/strict");
const { resolve } = require("../src/frameseek/static/demo-conversation.js");
const queries = [
  { id: "center", question: "包裹什么时候出现在中央？" },
  { id: "right", question: "什么时候移到右侧？" },
  { id: "person", question: "能确认是谁搬动的吗？" },
  { id: "forklift", question: "有叉车出现吗？" },
];
test("完整问题不依赖上下文", () => {
  assert.deepEqual(resolve("包裹什么时候出现在中央?", queries, null), {
    query: queries[0],
    usedContext: false,
  });
});
test("连续的指代追问承接包裹，再确认搬运者", () => {
  const first = resolve("包裹什么时候出现在中央？", queries, null);
  const second = resolve("那后来呢？", queries, first.query.id);
  const third = resolve("谁搬的？", queries, second.query.id);
  assert.equal(second.query.id, "right");
  assert.equal(third.query.id, "person");
  assert.equal(second.usedContext, true);
  assert.equal(third.usedContext, true);
});
test("查看证据引用上一轮而不产生新的事件", () => {
  assert.equal(resolve("看看证据", queries, "center").query, queries[0]);
});
test("重置或改变话题后不沿用旧包裹上下文", () => {
  for (const id of [null, "forklift", "failure"]) {
    assert.equal(resolve("那后来呢？", queries, id).query, null);
  }
});
test("未实现的问题不伪造回答，也不改动问题或目录", () => {
  const question = "那它是送给谁的？";
  assert.equal(resolve(question, queries, "center").query, null);
  assert.equal(question, "那它是送给谁的？");
  assert.equal(queries.length, 4);
});

const { materialize } = require("../src/frameseek/static/demo-conversation.js");
const scopedQueries = [
  {
    id: "left",
    question: "包裹最初在哪里？",
    followup_map: { "那后来呢？": "center" },
  },
  {
    id: "center",
    question: "包裹什么时候出现在中央？",
    followup_map: { "那后来呢？": "right" },
  },
  { id: "right", question: "什么时候移到右侧？" },
  {
    id: "objects",
    question: "视频里有哪些固定物体？",
    followup_map: { "灯光呢？": "lighting" },
  },
  { id: "lighting", question: "灯光状态有什么变化？" },
];
test("同一短追问按所选卡片解析，跨主题不会错误承接", () => {
  assert.equal(resolve("那后来呢？", scopedQueries, "left").query.id, "center");
  assert.equal(
    resolve("那后来呢？", scopedQueries, "center").query.id,
    "right",
  );
  assert.equal(
    resolve("灯光呢？", scopedQueries, "objects").query.id,
    "lighting",
  );
  assert.equal(resolve("灯光呢？", scopedQueries, "center").query, null);
  assert.equal(resolve("灯光呢？", scopedQueries, null).query, null);
  assert.equal(
    resolve("看看证据", scopedQueries, "objects").query.id,
    "objects",
  );
});
test("演示分支保留显式父轮次，不修改原目录", () => {
  const scenario = {
    steps: [
      { query_id: "objects", parent: null },
      { query_id: "lighting", question: "灯光呢？", parent: 0 },
      { query_id: "left", parent: null },
    ],
  };
  const before = JSON.stringify({ scenario, scopedQueries });
  const seeds = materialize(scenario, scopedQueries);
  assert.deepEqual(
    seeds.map((s) => s.parentIndex),
    [null, 0, null],
  );
  assert.deepEqual(
    seeds.map((s) => s.usedContext),
    [false, true, false],
  );
  assert.equal(seeds[1].question, "灯光呢？");
  assert.equal(JSON.stringify({ scenario, scopedQueries }), before);
});
test("损坏或循环的演示引用在载入前拒绝", () => {
  for (const steps of [
    [],
    [{ query_id: "missing", parent: null }],
    [{ query_id: "objects", parent: 0 }],
    [
      { query_id: "objects", parent: null },
      { query_id: "lighting", parent: 2 },
    ],
    Array(13).fill({ query_id: "objects", parent: null }),
  ]) {
    assert.throws(() => materialize({ steps }, scopedQueries));
  }
});
