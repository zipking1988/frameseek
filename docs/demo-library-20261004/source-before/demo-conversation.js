/* Deterministic fixture conversation. This is not a model or general NLP. */
(function (root) {
  "use strict";
  const normalize = (value) => value.replace(/[\s？?。！!，,]/g, "");
  function resolve(question, queries, previousId) {
    const value = normalize(question);
    const exact = queries.find((query) => normalize(query.question) === value);
    if (exact) return { query: exact, usedContext: false };
    const parcelContext = ["center", "right", "person"].includes(previousId);
    const followups = {
      那后来呢: "right",
      后来呢: "right",
      之后呢: "right",
      那之后呢: "right",
      然后呢: "right",
      后来去哪了: "right",
      那是谁搬的: "person",
      谁搬的: "person",
      是谁搬的: "person",
      能确认是谁搬的吗: "person",
      看看证据: previousId,
      能看一下证据吗: previousId,
    };
    const id = followups[value];
    const query =
      parcelContext && id ? queries.find((item) => item.id === id) : null;
    return { query: query || null, usedContext: Boolean(query) };
  }
  const api = { resolve };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FrameSeekDemoConversation = api;
})(typeof window !== "undefined" ? window : globalThis);
