<script lang="ts" setup>
import type { NoteSpot } from "../data";

const props = withDefaults(defineProps<{
  stack: NoteSpot[]
  frets: number
  tuning: Midi[]
  selected?: boolean
  substack?: boolean
}>(), {
});

const emit = defineEmits<{
  noteChange: [note: NoteSpot]
}>();

const backgroundColor = computed(() => props.selected ? "var(--highlight-color)" : "transparent");
</script>

<template>
  <div class="stack"
       :class="{ substack }">
    <div v-for="noteSpot in stack"
         :key="noteSpot.string"
         class="container">
      <div v-if="substack && noteSpot.data"
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
}

.substack .container {
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
}

@container (aspect-ratio < 0.2) {
  .square {
    width: 100%;
  }
}

@container (aspect-ratio < 0.8) {
   .input {
    display: none;
  }
}
</style>
