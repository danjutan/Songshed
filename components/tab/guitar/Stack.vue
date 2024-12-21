<script lang="ts" setup>
import type { GuitarNote } from "../data";
import NoteInput from "./NoteInput.vue";

const props = withDefaults(
  defineProps<{
    notes: Array<GuitarNote>;
    frets: number;
    tuning: Midi[];
    selected?: boolean;
    collapse?: boolean;
  }>(),
  {},
);

const emit = defineEmits<{
  noteDelete: [string: number];
  noteChange: [note: GuitarNote];
}>();

const noteSpots = computed(() => {
  const noteSpots = new Array(props.tuning.length);
  for (const note of props.notes) {
    noteSpots[note.string] = note;
  }

  return noteSpots;
});

const backgroundColor = computed(() => (props.selected ? "var(--highlight-color)" : "transparent"));
</script>

<template>
  <div class="stack" :class="{ collapse }">
    <div v-for="(note, string) in noteSpots" class="container">
      <div
        v-if="collapse && note"
        class="square"
        :style="{
          backgroundColor: defaultColors[getChroma(note.midi)],
        }"
      />
      <div class="input">
        <NoteInput
          :data="note"
          :tuning="props.tuning[string]"
          :frets="props.frets"
          :blocking-color="selected ? 'transparent' : undefined"
          @note-delete="emit('noteDelete', string)"
          @note-change="(updated) => emit('noteChange', { ...note, string, ...updated })"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  background-color: v-bind(backgroundColor);
}

.container {
  display: flex;
  height: var(--cell-height);
  /* border: 1px solid red; */
  justify-content: flex-start;
  align-items: center;
}

.collapse .container {
  container-type: size;
}

.square {
  width: 95%;
  max-width: calc(var(--cell-height) / 2);
  aspect-ratio: 1;
  background-color: blue;
  display: none;
}

@container (aspect-ratio < 0.8) {
  .square {
    display: block;
  }
  .input {
    display: none;
  }
}

@container (aspect-ratio < 0.2) {
  .square {
    width: 100%;
  }
}

@container (aspect-ratio < 0.1) {
  .square {
    display: none;
  }
}
</style>
