# Plan: Enable Drag Anywhere on Chord Chart

**Date:** 2026-01-21
**Branch:** chord-to-tab

## Summary

Enable dragging chord charts by clicking anywhere on the chart itself, not just the drag handle. The drag handle will remain visible as a visual affordance.

## Current Implementation

The drag functionality in `ChordContainer.vue` uses `@atlaskit/pragmatic-drag-and-drop`. Currently:
- Line 69: `draggable()` is bound to `moveHandleRef` (the GripVertical icon)
- Line 83: The entire `chart-container` (`droppableRef`) is already a drop target
- Visual states (`moving`, `mightMove`) are triggered by the drag handle

## Proposed Changes

### File: `components/chords/ChordContainer.vue`

1. **Change drag element from handle to container** (line 69)
   - Change `element: moveHandleRef.value!` → `element: droppableRef.value!`
   - This makes the entire chord chart the drag source

2. **Update cursor styling** (lines 179-194)
   - Add `cursor: grab` to the `.chart-container` class
   - Add `cursor: grabbing` when `.moving` class is applied

3. **Keep `mightMove` behavior on drag handle only**
   - No changes to `mightMove` state or mouseenter/mouseleave handlers
   - The highlight still shows when hovering over the drag handle specifically

4. **Keep drag handle visible** (lines 140-147)
   - Keep the GripVertical icon as visual affordance
   - No changes needed to the template structure

## Verification

1. Open the app and verify chord charts can be dragged by clicking anywhere on the chart
2. Verify the drag handle is still visible on hover
3. Verify hovering over the drag handle still shows the 'might-move' highlight
4. Verify clicking the title to edit still works (not blocked by drag)
5. Verify the delete button still works
6. Verify drop targeting still works correctly (green highlight when hovering)
7. Verify reordering completes successfully after dropping

## Prompts

> Right now, dragging chord charts only works if you use the drag handle. I still want the drag handle to be there, but I also want you to be able to drag the chords around by clicking and dragging anywhere on the chart itself.
