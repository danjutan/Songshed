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

const CHROMA_PLACEHOLDER = "scroll →";
const CHROMA_PICKER_ITEMS = [CHROMA_PLACEHOLDER, ...CHROMATIC_NOTES];

const selectedPickerItem = ref(CHROMA_PLACEHOLDER);
const activeChroma = ref<string | null>(null);
const selectedSuffix = ref("");

watch(selectedPickerItem, (item) => {
  if (item !== CHROMA_PLACEHOLDER) {
    activeChroma.value = item;
  }
});

const isPreviewMode = computed(
  () => selectedPickerItem.value === CHROMA_PLACEHOLDER,
);

// Use C (index 0) as preview when no real selection yet
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
  if (activeChroma.value === null) return null;
  const suffix = formatSuffixForTitle(selectedSuffix.value);
  return `${activeChroma.value}${suffix}`;
});

const emit = defineEmits<{
  "update:voicing": [voicing: NoteStack<ChordNote> | null];
  "update:title": [title: string];
  accept: [voicing: NoteStack<ChordNote> | null];
  close: [];
}>();

watch(selectedVoicing, (v) => emit("update:voicing", v), { immediate: true });
watch(selectedTitle, (title) => {
  if (title !== null) {
    emit("update:title", title);
  }
});
</script>

<template>
  <div class="chord-select">
    <ScrollPicker
      v-model="selectedPickerItem"
      class="chroma-picker"
      :items="CHROMA_PICKER_ITEMS"
      :placeholder-item="CHROMA_PLACEHOLDER"
      name="chord-chroma"
    />
    <div class="preview-container" :class="{ preview: isPreviewMode }">
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
        :disabled="isPreviewMode"
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
