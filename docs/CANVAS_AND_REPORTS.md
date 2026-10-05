# Desktop canvas tools and investigation reports

The canvas retains questions, evidence and conclusions as separate objects with their actual source/parent relationships. These controls organize the current investigation; they do not combine model context or run new analysis.

## Selection and layout

- Click a card's **选中** button to choose its follow-up context. Shift-click selects/deselects additional cards. The primary selected card still supplies the next question's context; batch selection does not merge conversation histories.
- Drag a selected card's title to move the selection together. A folded subtree follows its parent once. Title-focused arrow keys move by 10 canvas units; Shift increases this to 50.
- The batch bar offers named groups, removal of groups touching the selection, left/top alignment and horizontal/vertical spacing. Spacing needs at least three objects. Groups are visual containers; they preserve evidence and question identities. At most 20 groups, each up to 24 current objects, with 60-character names.
- **撤销 / 重做** or Command/Ctrl+Z / Shift+Z restore positions, path names/folding, groups and arrangements. History retains at most 60 layout operations. It does not undo queries, evidence deletion, notes, drafts or model dispatch. Pan/zoom stay where they are. Refresh restores the layout and starts a fresh undo history.
- **搜索** or Command/Ctrl+K searches the current retained questions, answers, evidence captions and group/path names. Enter selects the first result; Arrow Down moves into results. Search can reveal folded objects. It does not search other investigations or retrieve additional video evidence.
- **快捷键** lists controls. Canvas-local Command/Ctrl+A selects visible objects; Escape exits batch selection. Input fields retain ordinary text-editing shortcuts. Home fits the canvas; F focuses the selected card.

Layouts/groups are saved with the existing investigation revision and restore after refresh/navigation. If another page modifies the investigation, the existing conflict flow prevents silent overwrite. Removing an object prunes its groups; undo cannot resurrect an expired/deleted answer or private source.

## Portable reports

Open **发现 → 导出调查记录**. The dialog captures a fixed snapshot of retained questions, pinned discoveries, their preserved originating questions, notes and layout. Drafts are excluded. Repeated fixture request IDs still preserve separate conversation turns. The report is limited to the latest 12 questions plus pinned origins; it does not imply an exhaustive video search or complete investigation history.

- **Markdown:** readable questions, conclusions, exact source timestamps, evidence references, statuses and unresolved items.
- **JSON:** report version 1.0, source provenance, questions/parent turns, findings, evidence IDs/timestamps/source-request and turn links, and canvas layout. This is an export contract, not an import/restore interface.
- **HTML:** inert, self-contained text and optional raster evidence images; all dynamic text is escaped and a restrictive Content Security Policy prevents scripts/external resource loading. Open locally or use the browser's Print → Save as PDF. The app does not generate a PDF file directly.

HTML can embed up to 24 available frames, 2 MiB each and 16 MiB total. Fetches stay on owned `/media/{video}/frames/` references. Expired/unavailable/oversized images remain labeled missing, with timestamps and source references preserved. Closing the dialog aborts collection. Audio evidence text is retained, but source audio/video streams are not embedded.

The downloaded file is a local copy and may contain private source frames. Original service references still require the owner session and can expire with retention/deletion; an embedded copy remains readable independently. Reports distinguish synthetic preset demos, unindexed local media and real sources. Support levels describe evidence support, not measured correctness. Partial/no-result/error statuses and unresolved items remain visible.
