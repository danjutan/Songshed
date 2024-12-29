<script lang="ts" setup>
import { injectCellHoverEvents } from "../../../providers/events/provide-cell-hover-events";

const props = defineProps<{
  // startRow: number;
  startColumn: number;
  bendRow: number;
  barPositions: number[];
}>();

const cellHoverState = injectCellHoverEvents();
</script>

<template>
  <!-- <div class="teleport-bend-labels" /> -->
  <div
    v-for="(position, i) in barPositions"
    class="bend-cell"
    :style="{
      gridColumn: startColumn + 1 + i,
      gridRow: bendRow,
    }"
    @mouseover="cellHoverState.hover('bend', position)"
  />
</template>

<style scoped>
/* .teleport-bend-labels {
  display: grid;
  grid-column: 1 / -1;
  grid-row: v-bind(bendRow);
  grid-template-columns: subgrid;
  grid-template-rows: 1fr;
} */
</style>
