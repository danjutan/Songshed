<script setup lang="ts">
import type { GuitarNote, NoteStack, StackMap } from "~/model/data";
import Stack from "./stack/Stack.vue";
import { injectSettingsState } from "~/components/tab/providers/state/provide-settings-state";
import { injectEditingState } from "../../providers/state/provide-editing-state";
import type { NotePosition } from "~/model/stores";
import SelectionRegions from "./selections/SelectionRegions.vue";
import { injectCollapsedState } from "../../providers/state/provide-collapsed-state";

const props = defineProps<{
  stackData: StackMap<GuitarNote>;
  subUnit: number;
  beatSize: number;
  startColumn: number;
  startRow: number;
  tuning: Midi[];
  frets: number;
  numStrings: number;
}>();

const emit = defineEmits<{
  noteDelete: [notePosition: NotePosition];
  noteChange: [notePosition: NotePosition, note: GuitarNote];
}>();

const { collapsed } = injectCollapsedState();
</script>

<template>
  <template
    v-for="([position, stack], i) in stackData.entries()"
    :key="position"
  >
    <Stack
      :style="{
        gridColumn: startColumn + i,
        gridRow: `${startRow} / span ${numStrings}`,
      }"
      :notes="stack"
      :position="position"
      :collapse="collapsed.has(position)"
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
  </template>
  <SelectionRegions />
</template>

<style></style>
