<script setup lang="ts">
import type { GuitarNote, NoteStack, StackMap } from "~/model/data";
import Stack from "./stack/Stack.vue";
import type { GuitarStack, NotePosition } from "~/model/stores";
import SelectionRegions from "./selections/SelectionRegions.vue";
import Toolbar from "~/components/tab/Toolbar.vue";

import { injectSettingsState } from "~/components/tab/providers/state/provide-settings-state";

const settings = injectSettingsState();

export type GuitarBarProps = {
  stackData: GuitarStack[];
  beatSize: number;
  tuning: Midi[];
  frets: number;
  numStrings: number;
};

const props = defineProps<GuitarBarProps>();

const emit = defineEmits<{
  noteDelete: [notePosition: NotePosition];
  noteChange: [notePosition: NotePosition, note: GuitarNote];
}>();

const numStacks = computed(() => props.stackData.length);

onBeforeUpdate(() => {
  console.log("updated bar");
});
</script>

<template>
  <div class="guitar-bar">
    <Stack
      v-for="({ position, notes }, i) in stackData"
      :key="position"
      ref="stacks"
      class="stack"
      :class="{ border: !settings.posLineCenter && i < stackData.length - 1 }"
      :style="{
        gridColumn: i + 1,
      }"
      :on-beat="position % beatSize === 0"
      :notes
      :position="position"
      :tuning
      :frets
      @note-change="
        (string: number, note: GuitarNote) =>
          emit('noteChange', { position, string }, note)
      "
      @note-delete="
        (string: number) => emit('noteDelete', { position, string })
      "
    />
  </div>
  <!-- <SelectionRegions /> -->
</template>

<style>
.guitar-bar {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(v-bind(numStacks), 1fr);
  grid-template-rows: repeat(v-bind(numStrings), var(--cell-height));
}

.stack.border {
  border-right: var(--pos-line-width) solid var(--pos-line-color);
  grid-row: 1 / span v-bind(numStrings);
}
</style>
