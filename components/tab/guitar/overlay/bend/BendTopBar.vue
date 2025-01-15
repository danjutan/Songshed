<script lang="ts" setup>
import { injectCellHoverEvents } from "../../../providers/events/provide-cell-hover-events";

const props = defineProps<{
  // startRow: number;
  startColumn: number;
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
    }"
    @mouseover="cellHoverState.hover('bend', position)"
  />
</template>

<style scoped>
.bend-cell {
  grid-row: -3 / -2; /* second to last row */
}
</style>
