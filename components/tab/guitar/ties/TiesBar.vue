<script lang="ts" setup>
import type {
  GuitarNote,
  NoteStack,
  StackMap,
  Tie,
  Ties,
  TieType,
} from "~/model/data";
import FullTie from "./FullTie.vue";
import type { OverlayPosition } from "~/components/tab/overlay-objects";

const props = defineProps<{
  ties: Ties;
  startRow: number;
  startColumn: number;
  startPosition: number;
  endPosition: number;
  subUnit: number;
}>();

interface FullTie extends OverlayPosition {
  type: TieType;
}

// Assumes ties can stretch over one divider, but not two

const fullTies = computed<FullTie[]>(() => {
  const ties: FullTie[] = [];
  for (const [string, stack] of props.ties) {
    for (const [position, tie] of stack) {
      if (position >= props.startPosition && position <= props.endPosition) {
        ties.push({
          row: props.startRow + string,
          startColumn:
            props.startColumn +
            (position - props.startPosition) / props.subUnit,
          endColumn:
            props.startColumn + (tie.to - props.startPosition) / props.subUnit,
          type: tie.type,
        });
      }
    }
  }
  return ties;
  // [...props.stackData.entries()].forEach(([position, stack], index) => {
  //   for (const [string, note] of stack) {
  //     if (note.tie) {
  //       ties.push({
  //         string,
  //         startColumn: props.startColumn + index,
  //         endColumn:
  //           props.startColumn +
  //           index +
  //           (note.tie.to - position) / props.subUnit,
  //         type: note.tie.type,
  //       });
  //     }
  //   }
});
</script>

<template>
  <FullTie
    v-for="{ row, startColumn, endColumn } in fullTies"
    :key="`${row}${startColumn}`"
    :style="{
      gridRow: row,
      gridColumn: `${startColumn} / ${endColumn + 1}`,
    }"
  />
</template>

<style scoped></style>
