<script lang="ts" setup>
import type { Chroma } from "~/theory/notes";
import { getSuffixesForChroma } from "~/theory/chords";
import ScrollPicker from "./ScrollPicker.vue";

const CHROMATIC_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const selectedChroma = ref(CHROMATIC_NOTES[0]);
const selectedSuffix = ref("");

const chromaIndex = computed(
  () => CHROMATIC_NOTES.indexOf(selectedChroma.value) as Chroma,
);

const suffixes = computed(() => getSuffixesForChroma(chromaIndex.value));
</script>

<template>
  <div class="chord-select">
    <ScrollPicker
      v-model="selectedChroma"
      class="chroma-picker"
      :items="CHROMATIC_NOTES"
      name="chord-chroma"
    />
    <ScrollPicker
      v-model="selectedSuffix"
      :items="suffixes"
      name="chord-suffix"
    />
  </div>
</template>

<style scoped>
.chord-select {
  width: 100%;
  display: flex;
  /* justify-content: center; */
}

.chroma-picker {
  align-items: center;
}
</style>
