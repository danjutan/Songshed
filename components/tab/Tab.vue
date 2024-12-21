<script lang="ts" setup>
import type { PropType } from "vue";
import type { NoteSpot, FilledSpot } from "./data";
import { Spacing, smallestSpacing } from "./data";
import TabBar from "./bar/TabBar.vue";

const props = defineProps({

  tuning: {
    type: Array as PropType<Midi[]>,
    default: () => defaultTuning,
    validator: (tuning: Midi[], props) => {
      const notes = props.modelValue as FilledSpot[];
      return notes.every(note => note.string >= 0 && note.string < tuning.length);
    },
  },

  frets: {
    type: Number,
    default: 24,
  },

  // Notches per beat
  resolution: {
    type: Number,
    default: 4,
  },

  // The top part of a time signature
  beatsPerBar: {
    type: Number,
    default: 4,
  },

  // The bottom part of a time signature
  beatSize: {
    type: Number,
    default: Spacing.Quarter,
  },
});

const notes = defineModel<FilledSpot[]>({
  required: true,
  validator: (notes: FilledSpot[]) => {
    const noConflict = notes.length === (new Set(notes.map(note => `${note.string},${note.position}`))).size;
    const inGrid = notes.every(note => note.position % smallestSpacing == 0);
    // TODO
    return noConflict && inGrid;
  },
});

const barSize = computed(() => props.beatsPerBar * props.beatSize);

/* I could send *all* the notes to every TabBar,
 * and just have it ignore everything beyond its size.
 * That would be less clean conceptually, but it would allow a clean v-model pass-through. 
 * I prefer TabBar only see the notes it needs.
 */
const bars = computed(() => {
  let furthest = 0;
  const barMap: Map<number, FilledSpot[]> = new Map();
  for (const note of notes.value) {
    const barPosition = Math.floor(note.position / barSize.value);
    if (barPosition > furthest)
      furthest = barPosition;
    if (!barMap.has(barPosition)) {
      barMap.set(barPosition, [note]);
      continue;
    }
    barMap.get(barPosition)!.push(note);
  }
  const bars: Array<FilledSpot[]> = [];
  for (let i = 0; i <= furthest; i++) {
    if (barMap.has(i)) {
      bars.push(barMap.get(i)!);
      continue;
    }
    bars.push([]);
  }
  return bars;
});

function updateNotes(update: FilledSpot[], barIndex: number) {
  const newNotes: Array<FilledSpot> = [];

  bars.value.slice(0, barIndex - 1).forEach(bar => newNotes.push(...bar));

  newNotes.push(...update);

  bars.value.slice(barIndex + 1).forEach(bar => newNotes.push(...bar));

  notes.value = newNotes;
}
</script>

<template>
  <div>
    <TabBar v-for="(barNotes, i) in bars"
            :model-value="barNotes"
            :tuning
            :frets
            :note-position="i * barSize"
            :beats="barSize"
            :notches="resolution * beatsPerBar"
            @update:model-value="data => updateNotes(data, i)"
    />
  </div>
</template>

<style scoped>
</style>
