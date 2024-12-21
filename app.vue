<script setup lang="ts">
import { Spacing, createTabStore } from "./components/tab/data";
import TabBar from "./components/tab/bar/TabBar.vue";
import Tab from "./components/tab/Tab.vue";

const notes = createTabStore();

notes.setNote(0, 0, "B4");
notes.setNote(Spacing.Quarter * 3, 0, "B4");
notes.setNote(Spacing.Quarter * 4 - Spacing.Sixteenth, 0, "B4");
notes.setNote(Spacing.Quarter * 4, 0, "G4");
// notes.addNote(Spacing.Quarter * 8, 2, "A4"),

notes.setNote(Spacing.Quarter * 2, 0, "C5");

notes.setNote(Spacing.Quarter * 2 + Spacing.SixtyFourth, 1, "G5");
notes.setNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 2, 4, "B3");
notes.setNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 3, 4, "C4");
notes.setNote(Spacing.Quarter * 2 + Spacing.SixtyFourth * 3, 5, "F3");

notes.setNote(Spacing.Quarter * 2 + Spacing.Sixteenth, 5, "F2");
console.log(notes.getNotes());
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
.bar {
  /* width: 0px; */
}
</style>
