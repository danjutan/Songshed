# Plan: Convert ChordSelect to Horizontal Scrolling Layout

**Date:** 2026-01-26
**Branch:** chord-select

## Overview

Convert the ChordSelect component and its pickers (ScrollPicker and DiagramPicker) from vertical scrolling to horizontal scrolling. The pickers will be stacked vertically within ChordSelect, while each picker scrolls horizontally on the x-axis.

## Files to Modify

1. `/components/chords/ChordSelect.vue`
2. `/components/chords/ScrollPicker.vue`
3. `/components/chords/DiagramPicker.vue`

---

## Implementation Steps

### 1. ChordSelect.vue - Change container to stack pickers vertically

**Style changes (lines 76-81):**
```css
.chord-select {
  width: 100%;
  display: flex;
  flex-direction: column;  /* Change from row to column */
  align-items: stretch;    /* Change from center to stretch */
  gap: 8px;
}
```

---

### 2. ScrollPicker.vue - Convert to horizontal scrolling

**Script changes:**

| Line | Change |
|------|--------|
| 16-17 | `dragStartY` → `dragStartX`, `scrollStartY` → `scrollStartX` |
| 24 | `e.clientY` → `e.clientX` |
| 25 | `container.scrollTop` → `container.scrollLeft` |
| 34 | `dragStartY - e.clientY` → `dragStartX - e.clientX` |
| 35 | `container.scrollTop` → `container.scrollLeft` |
| 62 | `{ block: "center" }` → `{ inline: "center" }` |
| 92 | `"-45% 0px -55% 0px"` → `"0px -45% 0px -55%"` |

**Style changes:**

```css
.scroll-container {
  --item-width: 32px;      /* Renamed from --item-height */
  --item-gap: 6px;

  width: 100%;             /* Full width of container */
  height: fit-content;
  min-height: 32px;

  display: flex;
  flex-direction: row;       /* Changed from column */
  column-gap: var(--item-gap); /* Changed from row-gap */

  overflow-x: auto;          /* Changed from overflow-y */
  scroll-snap-type: x mandatory; /* Changed from y */
  overscroll-behavior-x: none;   /* Changed from y */

  padding-inline: calc(50% - var(--item-width) / 2); /* Center first/last items */
  /* ... rest unchanged */
}

.scroll-item {
  flex: 0 0 var(--item-width); /* Renamed from --item-height */
  /* ... rest unchanged */
}
```

---

### 3. DiagramPicker.vue - Convert to horizontal scrolling

**Script changes:** Same pattern as ScrollPicker (Y → X, scrollTop → scrollLeft, block → inline, rootMargin flip)

**Style changes:**

```css
.scroll-container {
  --item-width: 60px;      /* Width per diagram */
  --item-gap: 6px;

  height: 80px;            /* Fixed height for diagram row */
  width: 100%;             /* Full width of container */

  display: flex;
  flex-direction: row;
  column-gap: var(--item-gap);

  overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: none;

  padding-inline: calc(50% - var(--item-width) / 2); /* Center first/last items */
  padding-block: 4px;
  /* ... rest unchanged */
}

.scroll-item {
  flex: 0 0 var(--item-width);
  height: 100%;            /* Changed from width: 100% */
  /* ... rest unchanged */
}

.scroll-item :deep(.container) {
  height: 100%;
  width: auto;             /* Changed from width: 100% */
  transform: none;
}
```

---

## Verification

1. Open the app and navigate to a view that shows ChordSelect
2. Verify pickers are stacked vertically (Chroma on top, Suffix in middle, Diagrams at bottom)
3. Test drag-to-scroll works horizontally on each picker
4. Verify scroll snap centers items correctly
5. Verify selection changes as you scroll (IntersectionObserver)
6. Test that scrollIntoView works when programmatically selecting items
7. Test with different chord selections to ensure DiagramPicker conditional render works

---

## Prompts

User: Switch ChordSelect and all the pickers to work *horizontally* instead of vertically. So the pickers are stacked on top of each other, and each picker scrolls on the x axis.
