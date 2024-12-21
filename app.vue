<script setup lang="ts">
import type { GuitarNote } from "./components/tab/data";
import { Spacing, createTabStore } from "./components/tab/data";
import Tab from "./components/tab/Tab.vue";

const tabStore = createTabStore();

const guitar = tabStore.createGuitarTab();

const guitarNotes: Array<[number, number, string]> = [
  [0, 0, "B4"],
  [Spacing.Quarter * 2, 0, "B4"],
  [Spacing.Quarter * 2 + Spacing.SixtyFourth, 1, "G4"],
  [Spacing.Quarter * 2 + Spacing.ThirtySecond, 2, "D4"],
  [Spacing.Quarter * 2 + Spacing.SixtyFourth * 3, 3, "C4"],
  [Spacing.Quarter * 2 + Spacing.SixtyFourth * 3, 4, "C4"],
  [Spacing.Quarter * 3, 4, "B3"],
  [Spacing.Quarter * 4, 5, "A3"],
  [Spacing.Quarter * 6, 5, "G3"],
  [Spacing.Quarter * 6 + Spacing.SixtyFourth * 3, 4, "C4"],
  [Spacing.Quarter * 8, 5, "F3"],
  [Spacing.Quarter * 9, 0, "F4"],
  [Spacing.Quarter * 9 + Spacing.ThirtySecond, 0, "F4"],
  [Spacing.Quarter * 12, 0, "F4"],
  [Spacing.Quarter * 12 + Spacing.ThirtySecond, 0, "F4"],
];

guitarNotes.forEach(([position, string, midiString]) => {
  const noteSpot: GuitarNote = { position, string };
  noteSpot.data = {
    midi: toMidi(midiString),
  };
  guitar.setNote(noteSpot);
});

/*
const activeStack = computed(() => {
  if (selectionState.start) {
    return notes.getStack(selectionState.start);
  }
  return notes.tuning.map((_, string) => ({ position: -1, string }));
});

function fretboardNoteChange(note: GuitarNote) {
  const { position, string, data } = note;
  if (data) {
    notes.setNote(position, string, data);
    return;
  }
  notes.deleteNote(position, string);
} */

const notches = ref(4);
const subdivisions = ref(4);
const collapseSubdivisions = ref(true);
const collapseEmpty = ref(true);

async function save() {}
</script>

<template>
  <!-- <input type="checkbox" v-model="showDivisions"/> -->
  Notches per bar:
  <input v-model="notches" type="number" />
  Subdivide notches by:
  <input v-model="subdivisions" type="number" />
  Collapse subdivisions:
  <input v-model="collapseSubdivisions" type="checkbox" />

  Collapse empty notches:
  <input v-model="collapseEmpty" type="checkbox" />

  <button @click="save">Save</button>

  <Tab :data="tabStore" :notches :subdivisions :collapse-subdivisions :collapse-empty />
  <!-- <Fretboard
    width="75%"
    :stack="activeStack"
    @note-change="fretboardNoteChange"
  /> -->
</template>

<style scoped>
input[type="number"] {
  width: 50px;
}
</style>
