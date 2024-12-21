<script setup lang="ts">
import { Spacing, createTabStore } from "./components/tab/data";
import Tab from "./components/tab/Tab.vue";
import { SelectionStateKey, createSelectionState } from "./components/tab/providers/selection-state";

const selectionState = createSelectionState();
provide(SelectionStateKey, selectionState);

const notes = createTabStore();

notes.setNote(0, 0, "B4");
notes.setNote(Spacing.Quarter * 3, 0, "B4");
notes.setNote(Spacing.Quarter * 4 - Spacing.Sixteenth, 0, "B4");
/* notes.setNote(Spacing.Quarter * 4, 0, "F4");
notes.setNote(Spacing.Quarter * 5, 1, "E4");
// notes.setNote(Spacing.Quarter * 5 + Spacing.ThirtySecond * 3, 0, "E4");
notes.setNote(Spacing.Quarter * 6, 2, "G4");
notes.setNote(Spacing.Quarter * 6 + Spacing.SixtyFourth, 3, "G4");
notes.setNote(Spacing.Quarter * 7 + Spacing.ThirtySecond, 4, "A4"); */
notes.setNote(Spacing.Quarter * 8, 5, "F3");
notes.setNote(Spacing.Quarter * 9, 0, "F4");
notes.setNote(Spacing.Quarter * 9 + Spacing.ThirtySecond, 0, "F4");
notes.setNote(Spacing.Quarter * 8, 2, "A4"),

notes.setNote(Spacing.Quarter * 2, 0, "C5");

notes.setNote(Spacing.Quarter * 2 + Spacing.SixtyFourth, 1, "G5");
notes.setNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 2, 4, "B3");
notes.setNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 3, 4, "C4");
notes.setNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 3, 5, "F3");

notes.setNote(Spacing.Quarter * 2 + Spacing.Sixteenth, 5, "F2");

notes.setNote(Spacing.Quarter * 6, 0, "C5");

notes.setNote(Spacing.Quarter * 6 + Spacing.SixtyFourth, 1, "G5");
// notes.setNote(Spacing.Quarter * 6 + Spacing.SixtyFourth * 2, 4, "B3");
notes.setNote(Spacing.Quarter * 6 + Spacing.SixtyFourth * 3, 4, "C4");
// notes.setNote(Spacing.Quarter * 6 + Spacing.SixtyFourth * 3, 5, "F3");

notes.setNote(Spacing.Quarter * 7 + Spacing.SixtyFourth * 2, 1, "G5");
notes.setNote(Spacing.Quarter * 7 + Spacing.SixtyFourth * 3, 4, "B3");
</script>

<template>
  <!-- <input type="checkbox" v-model="showDivisions"/> -->
  <Tab :data="notes"
       :resolution="4"
  />
  <Tab :data="notes"
       :resolution="8"
  />
  <Fretboard width="50%" />
</template>

<style>
</style>
