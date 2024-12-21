<script lang="ts" setup>
import type { NoteSpot } from "../data";

const props = withDefaults(defineProps<{
  stack: NoteSpot[]
  frets: number
  tuning: Midi[]
  selected?: boolean
}>(), {
});

const emit = defineEmits<{
  noteChange: [note: NoteSpot]
}>();

const backgroundColor = computed(() => props.selected ? "var(--highlight-color)" : "transparent");
</script>

<template>
  <div class="stack">
    <div v-for="noteSpot in stack"
         :key="noteSpot.string"
         class="container">
      <div v-if="noteSpot.data"
           class="square"
           :style="{
             backgroundColor: defaultColors[getChroma(noteSpot.data.midi)],
           }"
      />
      <div class="input">
        <TabBarNoteInput
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

<style>
.stack {
  grid-row: 2 / -1;
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
  container-type: size;
}

.input {
  display: none;
}

.square {
  width: 95%;
  min-width: 5px;
  max-width: calc(var(--cell-height) / 2);
  aspect-ratio: 1;
  background-color: blue;
}

@container (aspect-ratio < 0.1) or (aspect-ratio > 0.8) {
  .square {
    display: none;
  }
}

@container (aspect-ratio > 0.8) {
   .input {
    display: block;
  }
}
</style>
