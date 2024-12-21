<script lang="ts" setup>
const props = defineProps<{
  startColumn: number
  columns: number
  startRow: number
  rows: number
}>();
</script>

<template>
  <div class="container">
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .container {
  container-type: size;
  z-index: 1;
  grid-column: v-bind(startColumn) / span v-bind(columns);
  grid-row: v-bind(startRow) / span v-bind(rows);
  height: calc(var(--note-font-size) * v-bind(columns));
  pointer-events: none;
}

.content {
  pointer-events: auto;
  width: 100%;
  height: calc(v-bind(rows) * var(--cell-height));
}

@container (aspect-ratio < 0.1) or (aspect-ratio >= 1) {
  .content {
    display: none;
  }
}
</style>
