<script setup lang="ts">
import type { Annotation } from "../data";

const props = defineProps<{
  row: number;
  startColumn: number;
  endColumn: number;
  annotation?: Annotation;
}>();

const pointerEvents = computed(() => (props.annotation ? "auto" : "none"));
</script>

<template>
  <div :class="`annotation annotation-${row}`">
    {{ annotation?.title }}
  </div>
</template>

<style scoped>
.annotation {
  border: 1px solid gray;
  grid-column-start: v-bind(startColumn);
  grid-column-end: v-bind(endColumn);
  grid-row: v-bind(row);
  background-color: lightblue;
  pointer-events: v-bind(pointerEvents);
}
</style>
