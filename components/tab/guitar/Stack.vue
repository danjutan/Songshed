<script lang="ts" setup>
import type { GuitarNote } from "../data";
import NoteInput from "./NoteInput.vue";

const props = withDefaults(
  defineProps<{
    notes: GuitarNote[];
    frets: number;
    tuning: Midi[];
    selected?: boolean;
    collapse?: boolean;
  }>(),
  {},
);

const emit = defineEmits<{
  noteChange: [note: GuitarNote];
}>();

const backgroundColor = computed(() =>
  props.selected ? "var(--highlight-color)" : "transparent",
);
</script>

<template>
  <div class="stack" :class="{ collapse }">
    <div v-for="noteSpot in notes" :key="noteSpot.string" class="container">
      <div
        v-if="collapse && noteSpot.data"
        class="square"
        :style="{
          backgroundColor: defaultColors[getChroma(noteSpot.data.midi)],
        }"
      />
      <div class="input">
        <NoteInput
          :data="noteSpot.data"
          :tuning="props.tuning[noteSpot.string]"
          :frets="props.frets"
          :blocking-color="selected ? 'transparent' : undefined"
          @data-change="emit('noteChange', { ...noteSpot, data: $event })"
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
