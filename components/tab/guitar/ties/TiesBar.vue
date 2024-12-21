<script lang="ts" setup>
import type {
  GuitarNote,
  NoteStack,
  StackMap,
  Tie,
  TieType,
} from "~/model/data";
import FullTie from "./FullTie.vue";

const props = defineProps<{
  stackData: StackMap<GuitarNote>;
  prevStack?: NoteStack<GuitarNote>;
  startRow: number;
  startColumn: number;
  subUnit: number;
}>();

interface FullTie {
  string: number;
  startColumn: number;
  endColumn: number;
  type: TieType;
}

const fullTies = computed<FullTie[]>(() => {
  const ties: FullTie[] = [];
  [...props.stackData.entries()].forEach(([position, stack], index) => {
    for (const [string, note] of stack) {
      if (note.tie) {
        ties.push({
          string,
          startColumn: props.startColumn + index,
          endColumn:
            props.startColumn +
            index +
            (note.tie.to - position) / props.subUnit,
          type: note.tie.type,
        });
      }
    }
  });
  return ties;
});
</script>

<template>
  <FullTie
    v-for="{ string, startColumn, endColumn } in fullTies"
    :key="`${string}${startColumn}`"
    :style="{
      gridRow: startRow + string,
      gridColumn: `${startColumn} / ${endColumn + 1}`,
    }"
  />
</template>

<style scoped></style>
