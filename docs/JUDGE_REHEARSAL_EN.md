# FrameSeek — English rehearsal guide

## Local English follow-up rehearsal — 2026-10-29

The local guide at `/static/demo-guide-en.html` now links directly to `/workspace`
and covers two exact English fixture questions. `When is the parcel in the center?`
returns the translated, explicitly preset answer. Selecting **Ask a follow-up**
and entering `What happens next?` resolves only from that center preset to the
existing right-side preset; it does not add general natural-language recognition.
The 00:06 and 00:13 references sought to player times 6 and 13, and both questions
and the 13-second player position survived refresh. Real and private answers
cannot use these translations. The complete UI is not translated.

A private English narrated screen walkthrough was prepared with ElevenLabs.
It clearly separates archived Nemotron basketball evidence from the current
synthetic interaction. See [video notes](HACKATHON_VIDEO.md). Neither the guide
update nor the source candidate was deployed or published in this task.

The Devpost project name, pitch, story and hosted link were saved as a draft.
The public video link and other submission gates remain incomplete.

**Working draft, not a verified submission or judge-access link.** This guide
translates the current Chinese desktop interface. The hosted build, fresh-judge
access, video rights, real-model availability and review period still need to be
verified before this can be supplied to judges.

## What to look for

FrameSeek helps people investigate a video by asking questions and inspecting
the cited moments. Each cited image links to a time in the source player. The
conversation and the canvas provide two views of the same investigation.
Sampled frames can miss short appearances; a result does not prove the full
video was inspected frame by frame or that an event count is complete.

## Interface translation

| Chinese label | English meaning |
| --- | --- |
| 上传视频 | Upload video |
| 对话 | Conversation |
| 画布 | Canvas |
| 向 FrameSeek 提问 | Ask FrameSeek |
| 回看 | Replay this evidence at its source time |
| 追问这条回答 | Ask a follow-up about this answer |
| 查看索引与候选画面 | Open the index and candidate frames |
| 仍需核实 | Needs verification |
| 未检查或不确定范围 | Unchecked or uncertain coverage |
| 演示库 | Demo library |
| 预设演示 · 未调用模型 | Preset demonstration; no model call |

## Rehearsal path

1. On a desktop browser, open the eventual judge-access URL in a fresh session.
   Verify that the session can access the intended demo without the owner's
   cookies or private investigation history.
2. The included parcel demo is a synthetic 18-second sequence of three static
   scenes; its answers are preset and do not demonstrate live video recognition.
   Enter `包裹什么时候出现在中央？` (When does the parcel appear in the center?)
   and send it. A shorter paraphrase was not recognized in the tested build.
3. Inspect the answer and select **回看** on an evidence image.
   Check that the player moves to the displayed time. Switch between **对话**
   and **画布** to inspect the two views.
4. If a separately verified real-video workflow is made available, follow its
   exact instructions and disclose its processor, source rights, sampling and
   known limitations. Do not describe the local Qwen experiment as NVIDIA
   Nemotron, or a saved answer as a new live model call.

The available evidence includes an earlier, limited Nemotron / Token Factory
smoke test and a separately tested local index. Neither establishes that a new
judge session can perform live model analysis. See the [submission draft](HACKATHON_JUDGE_DRAFT.md)
and [local test record](qa/KNOWLEDGE_REFACTOR_20261029.md).

## Fresh HTTP session check — 2026-10-29

A separate cookie jar received HTTP 200 for the hosted home page, demo catalog,
demo video and session endpoint. Its video and investigation lists were empty,
confirming that this new session did not inherit the owner's saved work. This
was an HTTP check only: it did not exercise the browser demo flow, test live
inference, establish funding duration, or establish judge readiness. It created
an ordinary new session and sent no question or model request.

An in-app browser tab subsequently restored an existing private investigation,
so it was closed without interacting with that investigation. It cannot serve as
evidence of a fresh judge browser session; the independent HTTP check above
remains the only fresh-session evidence recorded here.

In a separate Chrome profile showing an empty initial investigation, the hosted
page returned its labeled preset answer to the exact question above. Selecting
the 00:06 image sought to 00:06, refreshing restored the answer, and switching
to the canvas displayed the same question and evidence. This created an ordinary
demo investigation in that browser session and did not call a model. The profile
was not proven to have been newly created, and this test does not establish live
inference, real-video quality, English UI, or continued hosting through judging.

The local development build subsequently added explicit Chinese and English
aliases for this one preset question. An isolated local browser confirmed the
short Chinese wording returns the labeled preset answer. The change has not been
deployed; the hosted test above still requires its exact example wording. This
fixture convenience does not expand real-video understanding.

The local development build also displays preset sample questions in an empty
demo conversation, labeled as synthetic and no-model. A local browser check
confirmed a click fills the input without sending, does not overwrite a draft,
and disappears on switching to an uploaded video. This interface change has not
been deployed to the hosted site.

The local development build now includes an **EN guide** link in the header to
an English synthetic-demo guide. In an isolated new fixture workspace, the exact
English question in that guide returned the labelled preset answer and its
00:06 evidence sought the player to 00:06. The guide explicitly explains that
this path uses preset data, not a live model. It is not a full English UI, has
not been deployed, and does not establish live recognition or judge access.

The exact English preset now also displays its answer and evidence controls in
English, explicitly marked “Synthetic demo · preset answer”. An isolated local
browser submitted that question, replayed its 00:06 evidence at 00:06, and
confirmed that the answer remained after refresh. The stored preset remains
unchanged; most other interface controls are still Chinese. The same example's
follow-up reference now shows the English answer. A separate isolated browser
check removed the reference while keeping an unsent draft intact.
This is a local fixture presentation change, not a translation of the full app
or a real-video recognition result.
