**Date:** 2026-01-22
**Branch:** feature/hoist-bar-divider

# Hoist BarDivider Between Bars

## Approach
- Create a new branch before making code changes.
- Move `BarDivider` out of the `GuitarBar` slot and render it as a sibling between `TabBar` items in `Tab.vue` (no divider before bar 0, divider between bars).
- Adjust layout/CSS so the divider stretches to the full row height (annotations + guitar) and the `TabBar` grid no longer expects a divider column.
- Ensure spanning annotations occlude the divider by ordering/z-index so annotation layers sit above the divider where they overlap.

## Targeted Files
- `/Users/danjutan/Documents/Dev/tablink/components/tab/Tab.vue`
- `/Users/danjutan/Documents/Dev/tablink/components/tab/bars/TabBar.vue`
- `/Users/danjutan/Documents/Dev/tablink/components/tab/bars/guitar/GuitarBar.vue`
- `/Users/danjutan/Documents/Dev/tablink/components/EditorApp.vue`

## Prompts
I want the bar divider to extend up into the annotation rows (if any exist). Annotations can still be created and extended across bars. If an annotation spans across bars, it should occlude the bar (that includes during dragging). In such a case, the bar should only be occluded on the annotation row(s) that has the cross-bar annotation. If there's no annotation across a bar line, the divider should be visible.

This should use the existing BarDivider, so we get all of our hover and control logic. Do not create new divider elements. The BarDivider should be hoisted up and be in between TabBars.

**Agent: Cursor**
