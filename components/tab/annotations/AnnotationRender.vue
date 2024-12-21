<script setup lang="ts">
import type { Annotation } from "../data";

const props = defineProps<{
  row: number;
  startColumn: number;
  endColumn: number;
  annotation: Annotation;
}>();
</script>

<template>
  <div :class="`annotation ${annotation.type}`">
    {{ annotation.title }}
  </div>
</template>

<style scoped>
.annotation {
  grid-column: v-bind(startColumn) / v-bind(endColumn);
  grid-row: v-bind(row);
  background-color: lightblue;
}
</style>
