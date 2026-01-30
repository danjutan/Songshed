# Auto-detect Chord Title from Notes

**Date:** 2025-01-21
**Branch:** chord-to-tab

## Summary

Automatically update chord chart titles using tonal's `Chord.detect` when notes are edited. The title tracks whether it was auto-detected or manually set, with support for slash chord notation.

## Behavior

- **Auto-detection**: When notes change, auto-detect and update title if in "auto" mode
- **Manual override**: When user manually edits title (non-empty), stop auto-updating
- **Resume auto**: When user clears the title, resume auto-detection
- **Unknown chords**: Leave title empty (shows "..." placeholder)
- **Slash chords**: Show bass note notation when lowest note differs from root (e.g., "Am/E")

## Implementation Plan

### 1. Update Chord Type (model/data.ts)

Add `autoTitle` flag to track auto vs manual mode:

```typescript
export type Chord = {
  title: string;
  notes: NoteStack<ChordNote>;
  autoTitle?: boolean; // undefined/true = auto-detect, false = manual
};
```

### 2. Create Chord Detection Helper (composables/theory.ts)

Add a function to detect chord from MIDI notes:

```typescript
import { Chord as TonalChord, Note } from "tonal";

export function detectChord(notes: NoteStack<ChordNote>): string | null {
  if (notes.size === 0) return null;

  // Convert MIDI to pitch classes, get bass note (lowest string number)
  const entries = [...notes.entries()].sort((a, b) => b[0] - a[0]); // highest string = lowest pitch
  const pitchClasses = entries.map(([_, n]) => Note.pitchClass(Note.fromMidi(n.note)));
  const bassNote = pitchClasses[0];

  // Detect chord
  const detected = TonalChord.detect(pitchClasses);
  if (detected.length === 0) return null;

  const chordName = detected[0]; // Use first (typically simplest) match

  // Add slash notation if bass differs from root
  const root = TonalChord.get(chordName).tonic;
  if (root && bassNote !== root) {
    return `${chordName}/${bassNote}`;
  }

  return chordName;
}
```

### 3. Update ChordContainer.vue

Add watcher to auto-update title when notes change:

```typescript
import { detectChord } from "~/composables/theory";

// Watch for note changes and auto-detect
watch(
  () => [...props.chord.notes.entries()],
  () => {
    if (props.chord.autoTitle !== false) {
      const detected = detectChord(props.chord.notes);
      props.chord.title = detected ?? "";
    }
  },
  { deep: true }
);
```

Update title input to track manual edits:

```typescript
function onTitleChange(newTitle: string) {
  props.chord.title = newTitle;
  // Empty title = resume auto-detect, non-empty = manual mode
  props.chord.autoTitle = newTitle === "";
}
```

### 4. Update ChordStore (model/stores.ts)

Ensure `addChord()` initializes new chords with `autoTitle: true`:

```typescript
function addChord() {
  chords.value.push({ title: "", notes: new Map(), autoTitle: true });
}
```

### 5. Update Serialization (model/serialize.ts)

Ensure `autoTitle` field is properly serialized/deserialized. Since it's a simple boolean, it should work with existing JSON serialization, but verify.

## Files to Modify

1. `model/data.ts` - Add `autoTitle` to Chord type
2. `composables/theory.ts` - Add `detectChord()` function and `Chord` import from tonal
3. `components/chords/ChordContainer.vue` - Add watcher and title change handler
4. `model/stores.ts` - Initialize `autoTitle` in `addChord()`
5. `model/serialize.ts` - Verify serialization (likely no changes needed)

## Verification

1. Create a new chord chart - verify title auto-updates as you add notes
2. Add notes for C major (C, E, G) - verify title shows "CM" or "C"
3. Add notes for Am with E bass - verify title shows "Am/E"
4. Manually edit the title - verify it stops auto-updating
5. Clear the title - verify auto-detection resumes
6. Save and reload - verify autoTitle state persists

## Prompts

```
Use tonal's Chord.detect to automatically update the title of a chord chart when its notes are edited.
```
