<script lang="ts" setup>
import type { AnnotationAddState } from "./annotation-add-state";

const props = defineProps<{
  // startRow: number;
  startColumn: number;
  barPositions: number[];
  annotationRows: number;
  addState: AnnotationAddState;
}>();
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
      @mouseover="addState.drag(position)"
    />
  </template>
</template>
