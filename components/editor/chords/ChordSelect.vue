<script lang="ts" setup>
import type { ChordNote, NoteStack } from "~/model/data";
import { type Chroma, defaultTuning } from "~/theory/notes";
import { getChordsFromDb, getSuffixesForChroma } from "~/theory/chords";
import ScrollPicker from "~/components/editor/chords/ScrollPicker.vue";
import DiagramPicker from "~/components/editor/chords/DiagramPicker.vue";

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

const activeChroma = ref<string | undefined>(undefined);
const selectedSuffix = ref("");

const displayChroma = computed(() => activeChroma.value ?? "C");
const chromaIndex = computed(
  () => CHROMATIC_NOTES.indexOf(displayChroma.value) as Chroma,
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

function formatSuffixForTitle(suffix: string): string {
  if (suffix === "major") return "maj";
  if (suffix === "minor") return "min";
  return suffix;
}

const selectedTitle = computed(() => {
  if (activeChroma.value === undefined) return null;
  const suffix = formatSuffixForTitle(selectedSuffix.value);
  return `${activeChroma.value}${suffix}`;
});

const emit = defineEmits<{
  "update:title": [title: string];
  accept: [voicing: NoteStack<ChordNote> | null];
  close: [];
}>();

watch(selectedTitle, (title) => {
  if (title !== null) {
    emit("update:title", title);
  }
});
</script>

<template>
  <div class="chord-select">
    <ScrollPicker
      v-model="activeChroma"
      class="chroma-picker"
      :items="CHROMATIC_NOTES"
      name="chord-chroma"
    >
      <template #placeholder>
        <span>scroll →</span>
      </template>
    </ScrollPicker>
    <div
      class="preview-container"
      :class="{ preview: activeChroma === undefined }"
    >
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
    <div class="button-row">
      <Button
        class="action-button"
        size="small"
        :disabled="activeChroma === undefined"
        @click="$emit('accept', selectedVoicing)"
      >
        Accept
      </Button>
      <Button
        class="action-button"
        severity="secondary"
        size="small"
        @click="$emit('close')"
      >
        Close
      </Button>
    </div>
  </div>
</template>

<style scoped>
.chord-select {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
}

.preview-container {
  display: flex;
  flex-direction: column;
}

.preview-container.preview {
  opacity: 0.35;
  pointer-events: none;
}

.button-row {
  display: flex;
  gap: 8px;
}

.action-button {
  font-size: 12px;
  flex: 1;
}
</style>
