<script lang="ts" setup>
import { injectCellHoverEvents } from "../providers/events/provide-cell-hover-events";
import { injectAnnotationAddState } from "../providers/state/annotations/provide-annotation-add-state";
import { injectAnnotationRenderState } from "../providers/state/annotations/provide-annotation-render-state";

const props = defineProps<{
  startColumn: number;
  barPositions: number[];
}>();

const cellHoverState = injectCellHoverEvents();
const addState = injectAnnotationAddState();
const renderState = injectAnnotationRenderState();
</script>

<template>
  <template v-for="(_, rowIndex) in renderState.annotationRows">
    <div
      class="drag-start between"
      :style="{
        gridColumn: startColumn,
        gridRow: rowIndex,
      }"
      @mousedown="addState.start(rowIndex, barPositions[0])"
    />
    <div
      v-for="(position, i) in barPositions"
      class="drag-start"
      :style="{
        gridColumn: startColumn + 1 + i,
        gridRow: rowIndex + 1,
      }"
      @mousedown="addState.start(rowIndex, position)"
      @mouseover="cellHoverState.hover('annotation', position)"
    />
  </template>
</template>
<style scoped></style>
