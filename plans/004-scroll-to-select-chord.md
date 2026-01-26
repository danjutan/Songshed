**Date:** 2026-01-26
**Branch:** chord-to-tab

## Scope
- Update `ChordSelect.vue` to render a scroll-snapping, single-column list of chord suffixes from `getSuffixesForChroma(0)` in `chords.ts`.
- Keep selection local to the component (no output yet), and keep styling minimal while relying on PrimeVue CSS variables.

## Implementation approach
- Data:
  - Import `getSuffixesForChroma` and compute `suffixes` for chroma 0.
  - Track `selectedSuffix` in local state; default to the first suffix if available.
- UI structure:
  - Render a scroll container with one column of selectable items (labels with embedded radio inputs) to preserve native form semantics.
  - Use CSS scroll snapping (`scroll-snap-type: y mandatory`) and item alignment (`scroll-snap-align: center`).
  - Add vertical padding/margins so the first/last item can snap to center.
- Scroll-to-select behavior:
  - Use an `IntersectionObserver` against the scroll container to detect the item centered in view and update `selectedSuffix` accordingly.
  - On mount, scroll the container to the selected item.
- Styling (PrimeVue-friendly):
  - Use PrimeVue theme variables (`--p-surface-*`, `--p-text-color`, `--p-primary-color`, `--p-border-color`) for backgrounds, text, borders, and selection highlight.
  - Keep the layout simple and narrow so it fits the chord chart column, mirroring how other controls are styled (no hard-coded bright colors).

## Files to touch
- `components/chords/ChordSelect.vue`
- `theory/chords.ts` (read-only use; no edits expected)

## Notes
- Single column only for now; structure and CSS should make it easy to add two more columns later.
- No changes to parent components unless the layout needs small spacing adjustments.

## Prompts
Read this article https://css-tricks.com/how-to-make-a-scroll-to-select-form-control/  and turn ChordSelect into an implementation of that kind of "scrol lto select" form control. Eventually, there will be three columns, but for now, just implement one column. The contents of this select list will be all suffixes for chroma zero as retrieved from `chords.ts`. Use simple styling and all colors must integrate with the existing primevue system (like the other components do)

## Follow-up Prompts
Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

**Agent: Cursor**
