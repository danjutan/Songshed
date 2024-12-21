<script lang="ts" setup>
import {
  CellHoverInjectionKey,
  type CellHoverEvents,
} from "../../state/cell-hover-events";

const props = defineProps<{
  // startRow: number;
  startColumn: number;
  bendRow: number;
  barPositions: number[];
}>();

const cellHoverState = inject(CellHoverInjectionKey) as CellHoverEvents;
</script>

<template>
  <!-- <div
      class="bend-cell between"
      :style="{
        gridColumn: startColumn,
        gridRow: bendRow,
      }"
      @mouseover="cellHoverState.hover('bend', barPositions[0])"
    /> -->
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

<style scoped></style>
