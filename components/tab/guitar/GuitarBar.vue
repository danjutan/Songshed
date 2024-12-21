<script setup lang="ts">
import type { GuitarNote, NoteStack, StackMap } from "~/model/data";
import Strings from "./Strings.vue";
import Stack from "./Stack.vue";
import { SettingsInjectionKey, type Settings } from "../state/settings-state";

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
  noteDelete: [position: number, string: number];
  noteChange: [position: number, string: number, note: GuitarNote];
}>();

const settings = inject(SettingsInjectionKey) as Settings;

const isSubdivision = (position: number) => position % props.beatSize !== 0;

// const expanded = reactive<Set<number>>(new Set());

const collapsed = computed<Set<number>>(() => {
  const positions = new Set<number>(
    [...props.stackData]
      .filter(([position, stack]) => {
        // if (expanded.has(position)) return false;
        if (settings.collapseAll) return true;
        if (settings.collapseEmpty && stack.size === 0) return true;
        if (settings.collapseSubdivisions && isSubdivision(position))
          return true;
      })
      .map(([position, _]) => position),
  );
  return positions;
});
</script>

<template>
  <Strings
    :start-column
    :start-row
    :columns="stackData.size"
    :num-strings="numStrings"
  />
  <template
    v-for="([position, stack], i) in stackData.entries()"
    :key="position"
  >
    <Stack
      :style="{
        // borderTop: isNotch(column.position) && '1px solid maroon',
        borderRight: i < stackData.size && '1px solid lightgray',
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
          emit('noteChange', position, string, note)
      "
      @note-delete="(string: number) => emit('noteDelete', position, string)"
    />
  </template>
</template>

<style></style>
