<script lang="ts" setup>
import { toMidi } from "~/theory/notes";
import { SPACING } from "~/theory/spacing";
import { TIE_TYPE, type GuitarNote } from "~/model/data";
import { createTabStore } from "~/model/stores";

const store = createTabStore();
// store.timeChanges.set(8, {
//   beatsPerBar: 3,
//   beatSize: SPACING.Quarter,
// });

store.annotations.createAnnotation(0, {
  text: "1",
  start: 5,
  end: 8,
});

store.annotations.createAnnotation(1, {
  text: "2",
  start: 12,
  end: 14,
});

// store.annotations.createAnnotation(0, {
//   text: "3",
//   start: 16,
//   end: 24,
// });

// store.annotations.createAnnotation(0, {
//   text: "4",
//   start: 0,
//   end: 0,
// });

// store.annotations.createAnnotation(0, {
//   text: "5",
//   start: 3,
//   end: 3,
// });

// store.annotations.createAnnotation(0, {
//   text: "6",
//   start: 1,
//   end: 2,
// });

// store.annotations.createAnnotation(0, {
//   text: "7",
//   start: 25,
//   end: 40,
// });

const guitar = store.createGuitarTab();

const guitarNotes: Array<[number, number, string]> = [
  // [0, 0, "B4"],
  // [SPACING.Quarter * 4, 2, "B4"],
  // [SPACING.Quarter * 4.5, 2, "B4"],
  // [SPACING.Quarter * 5, 2, "B4"],
  // [SPACING.Quarter * 5.5, 2, "B4"],
  // [SPACING.Quarter * 6, 2, "B4"],
  // [SPACING.Quarter * 6.5, 2, "B4"],
  // [SPACING.Quarter * 7, 2, "B4"],
  // [SPACING.Quarter * 7.5, 2, "B4"],
  // [SPACING.Quarter * 8, 2, "B4"],
  [SPACING.Quarter * 2, 2, "B4"],
  // [SPACING.Quarter * 2 + SPACING.Sixteenth, 2, "D4"],
  [SPACING.Quarter * 3 - SPACING.Eighth, 0, "G4"],
  [SPACING.Quarter * 3, 4, "B3"],
  // [SPACING.Quarter * 3 + SPACING.Sixteenth, 1, "B3"],
  [SPACING.Quarter * 4, 5, "A3"],
  [SPACING.Quarter * 4 - SPACING.Eighth, 5, "A2"],
  // [SPACING.Quarter * 4 + SPACING.Sixteenth, 1, "A4"],
  [SPACING.Quarter * 5, 5, "C3"],
  [SPACING.Quarter * 5 + SPACING.Sixteenth, 1, "C5"],
  [SPACING.Quarter * 6, 1, "G4"],
  [SPACING.Quarter * 6, 5, "G3"],
  [SPACING.Quarter * 7, 2, "G3"],
  // [SPACING.Quarter * 8 - SPACING.Sixteenth, 2, "A3"],
  [SPACING.Quarter * 8, 2, "B3"],
  [SPACING.Quarter * 8, 5, "F3"],
  // [SPACING.Quarter * 9 - SPACING.Sixteenth, 0, "G4"],
  // [SPACING.Quarter * 9 - SPACING.Sixteenth, 2, "B3"],
  [SPACING.Quarter * 9, 0, "F#4"],
  // [SPACING.Quarter * 9 + SPACING.Eighth + SPACING.Sixteenth, 0, "F4"],
  // [SPACING.Quarter * 10 + SPACING.Sixteenth, 2, "F4"],
  [SPACING.Quarter * 12 - SPACING.Eighth, 2, "G4"],
  [SPACING.Quarter * 12, 2, "F4"],
  // [SPACING.Quarter * 25 + SPACING.Sixteenth, 0, "F4"],
  // [SPACING.Quarter * 45 + SPACING.Sixteenth, 0, "F4"],
];

guitarNotes.forEach(([position, string, midiString]) => {
  const data: GuitarNote = {
    note: toMidi(midiString),
  };
  guitar.setNote({ position, string }, data);
});

const ties = guitar.ties;

ties.setTie(5, SPACING.Quarter * 4 - SPACING.Eighth, {
  type: "bend",
  releaseType: "connect",
  bend: 1,
  through: [SPACING.Sixteenth],
  to: SPACING.Quarter * 5,
});

// ties.setTie(5, SPACING.Quarter * 5 - SPACING.Eighth, {
//   type: "bend",
//   releaseType: "hold",
//   bend: 0.5,
//   through: [SPACING.Sixteenth * 4],
//   to: SPACING.Quarter * 6,
// });

// ties.setTie(0, SPACING.Quarter * 3 - SPACING.Eighth, {
//   type: "bend",
//   releaseType: "hold",
//   bend: 1,
//   to: SPACING.Quarter * 3,
// });

ties.setTie(2, SPACING.Quarter * 7, {
  type: "bend",
  releaseType: "connect",
  bend: 1,
  // through: [SPACING.Sixteenth * 2],
  to: SPACING.Quarter * 13,
});

// ties.setTie(2, SPACING.Quarter * 11, {
//   type: "bend",
//   releaseType: "connect",
//   bend: 1,
//   // through: [SPACING.Sixteenth * 2],
//   to: SPACING.Quarter * 12,
// });

// ties.setTie(2, SPACING.Quarter * 2, {
//   to: SPACING.Quarter * 2 + SPACING.Sixteenth,
//   type: TIE_TYPE.Hammer,
// });

ties.setTie(1, SPACING.Quarter * 5 + SPACING.Sixteenth, {
  to: SPACING.Quarter * 6,
  type: TIE_TYPE.TieSlide,
});

ties.setTie(2, SPACING.Whole * 2 - SPACING.Sixteenth, {
  to: SPACING.Whole * 2,
  type: TIE_TYPE.Hammer,
});

ties.setTie(2, SPACING.Whole * 3 - SPACING.Eighth, {
  to: SPACING.Whole * 3,
  type: TIE_TYPE.Slide,
});

// ties.setTie(0, SPACING.Quarter * 9, {
//   to: SPACING.Quarter * 10 - SPACING.Sixteenth,
//   type: TieType.Slide,
// });

// ties.setTie(2, SPACING.Quarter * 9 - SPACING.Sixteenth, {
//   to: SPACING.Quarter * 10 + SPACING.Sixteenth,
//   type: TieType.Hammer,
// });
</script>

<template>
  <EditorApp :id="''" :tab-store="store" />
</template>

<style scoped></style>
