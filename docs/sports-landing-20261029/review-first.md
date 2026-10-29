# Sports landing — first visual comparison

final result: blocked

Reference: `selected-option-1.png` (946 × 1663), proportionally normalized to
1440 × 2531. Implementation: `desktop-first.png` (1440 × 2660), captured in the
in-app browser at a 1440 × 1000 CSS viewport, density 1, default Questions view,
shot frame selected, sequence paused. Combined evidence: `comparison-first.jpg`
and `hero-comparison-first.jpg`.

- [P2] Hero subject is too high; the ball approaches the navigation. Move the
  photo down 68px within the clipped hero. Tighten the headline-to-description
  gap and match the primary button width to the target.
- [P2] Question headings stretch wider than the visual target, evidence frames
  are too tall, and the question-to-evidence links are absent. Increase right-pane
  side padding, limit question width, use 1.85:1 evidence crops, and draw the
  actual sample question/evidence relationships from their DOM geometry.

The compact footer and explicit illustration disclosure are intentional additions.
The selected mock's Share control is replaced with a working workspace link.
The source player is an explicitly illustrative frame sequence, not playable
private footage or a claim of a new live-model result.
