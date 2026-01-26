<script lang="ts" setup>
import type { ChordNote, NoteStack } from "~/model/data";
import { type Chroma, defaultTuning } from "~/theory/notes";
import { getChordsFromDb, getSuffixesForChroma } from "~/theory/chords";
import ScrollPicker from "./ScrollPicker.vue";
import DiagramPicker from "./DiagramPicker.vue";

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

const selectedVoicingIndex = ref(0);

const voicings = computed(() =>
  getChordsFromDb(chromaIndex.value, selectedSuffix.value),
);

const selectedVoicing = computed(
  () => voicings.value[selectedVoicingIndex.value] ?? null,
);

watch([chromaIndex, selectedSuffix], () => {
  selectedVoicingIndex.value = 0;
});

const emit = defineEmits<{
  "update:voicing": [voicing: NoteStack<ChordNote> | null];
}>();

watch(selectedVoicing, (v) => emit("update:voicing", v), { immediate: true });
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
    <DiagramPicker
      v-if="voicings.length > 0"
      v-model="selectedVoicingIndex"
      :voicings="voicings"
      :tuning="defaultTuning"
    />
  </div>
</template>

<style scoped>
.chord-select {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  overflow: hidden;
}
</style>
