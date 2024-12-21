<script lang="ts" setup>
import type { AnnotationAddState } from "../state/annotation-add-state";
import {
  CellHoverInjectionKey,
  type CellHoverEvents,
} from "../state/cell-hover-events";

const props = defineProps<{
  // startRow: number;
  startColumn: number;
  barPositions: number[];
  annotationRows: number;
  addState: AnnotationAddState;
}>();

const cellHoverState = inject(CellHoverInjectionKey) as CellHoverEvents;
</script>

<template>
  <template v-for="(_, rowIndex) in annotationRows">
    <div
      class="drag-start between"
      :style="{
        gridColumn: startColumn,
        gridRow: annotationRows - rowIndex,
      }"
      @mousedown="addState.start(rowIndex, barPositions[0])"
    />
    <div
      v-for="(position, i) in barPositions"
      class="drag-start"
      :style="{
        gridColumn: startColumn + 1 + i,
        gridRow: annotationRows - rowIndex,
      }"
      @mousedown="addState.start(rowIndex, position)"
      @mouseover="cellHoverState.hover('annotation', position)"
    />
  </template>
</template>
<style scoped>
div {
  border-bottom: 1px solid lightgray;
}
</style>
