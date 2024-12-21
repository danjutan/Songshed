<script lang="ts" setup>
import type { GuitarNote } from "~/model/data";
import { createTabStore } from "~/model/stores";

const store = createTabStore();

const guitar = store.createGuitarTab();

const guitarNotes: Array<[number, number, string]> = [
  [0, 0, "B4"],
  [Spacing.Quarter * 2, 2, "B4"],
  [Spacing.Quarter * 2 + Spacing.Sixteenth, 2, "D4"],
  [Spacing.Quarter * 3, 4, "B3"],
  [Spacing.Quarter * 3 + Spacing.Sixteenth, 1, "B3"],
  [Spacing.Quarter * 4, 5, "A3"],
  [Spacing.Quarter * 4 - Spacing.Eighth, 5, "A2"],
  [Spacing.Quarter * 4 + Spacing.Sixteenth, 1, "A4"],
  [Spacing.Quarter * 5, 5, "C3"],
  [Spacing.Quarter * 6, 5, "G3"],
  [Spacing.Quarter * 8 - Spacing.Sixteenth, 2, "A3"],
  [Spacing.Quarter * 8, 2, "B3"],
  [Spacing.Quarter * 8, 5, "F3"],
  [Spacing.Quarter * 9 - Spacing.Sixteenth, 0, "G4"],
  [Spacing.Quarter * 9 - Spacing.Sixteenth, 2, "B3"],
  [Spacing.Quarter * 9, 0, "F#4"],
  [Spacing.Quarter * 9 + Spacing.Eighth + Spacing.Sixteenth, 0, "F4"],
  [Spacing.Quarter * 10 + Spacing.Sixteenth, 2, "F4"],
  [Spacing.Quarter * 12 - Spacing.Eighth, 2, "G4"],
  [Spacing.Quarter * 12, 2, "F4"],
  [Spacing.Quarter * 12 + Spacing.Sixteenth, 0, "F4"],
];

guitarNotes.forEach(([position, string, midiString]) => {
  const data: GuitarNote = {
    note: toMidi(midiString),
  };
  guitar.setNote(position, string, data);
});

const ties = guitar.ties;

ties.setTie(5, Spacing.Quarter * 4 - Spacing.Eighth, {
  type: "bend",
  releaseType: "connect",
  bend: 1,
  through: [Spacing.Sixteenth],
  to: Spacing.Quarter * 5,
});

// ties.setTie(5, Spacing.Quarter * 5 - Spacing.Eighth, {
//   type: "bend",
//   releaseType: "hold",
//   bend: 0.5,
//   through: [Spacing.Sixteenth * 4],
//   to: Spacing.Quarter * 6,
// });

// ties.setTie(2, Spacing.Quarter * 3 - Spacing.Eighth, {
//   type: "bend",
//   releaseType: "hold",
//   bend: 1,
//   to: Spacing.Quarter * 3,
// });

ties.setTie(2, Spacing.Quarter * 11, {
  type: "bend",
  releaseType: "connect",
  bend: 1,
  // through: [Spacing.Sixteenth * 2],
  to: Spacing.Quarter * 12,
});

ties.setTie(2, Spacing.Quarter * 2, {
  to: Spacing.Quarter * 2 + Spacing.Sixteenth,
  type: { hammer: true },
});

ties.setTie(1, Spacing.Quarter * 3 + Spacing.Sixteenth, {
  to: Spacing.Whole + Spacing.Sixteenth,
  type: { slide: true, hammer: true },
});

ties.setTie(2, Spacing.Whole * 2 - Spacing.Sixteenth, {
  to: Spacing.Whole * 2,
  type: { hammer: true },
});

ties.setTie(2, Spacing.Whole * 3 - Spacing.Eighth, {
  to: Spacing.Whole * 3,
  type: { slide: true },
});

ties.setTie(0, Spacing.Quarter * 9, {
  to: Spacing.Quarter * 10 - Spacing.Sixteenth,
  type: { slide: true },
});

ties.setTie(2, Spacing.Quarter * 9 - Spacing.Sixteenth, {
  to: Spacing.Quarter * 10 + Spacing.Sixteenth,
  type: { hammer: true },
});
</script>

<template>
  <EditorApp :id="''" :tab-store="store" />
</template>

<style scoped></style>
