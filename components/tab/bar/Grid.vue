<script setup lang="ts">
const cellHeight = "var(--cell-height)";
const props = withDefaults(defineProps<{
  rows: number
  rowHeight?: string
  columns: number
  expanded: Set<number>
  expandTo?: string
}>(), {
  rowHeight: cellHeight,
  expandTo: cellHeight,
});

const gridTemplateColumns = computed<string>(() => {
  const widths = [];
  for (let i = 1; i <= props.columns; i++) {
    if (props.expanded.has(i))
      widths.push(props.expandTo);
    widths.push("1fr");
  }
  return widths.join(" ");
});

const rows = computed(() => props.rows);
const rowHeight = computed(() => props.rowHeight);
</script>

<template>
  <div class="grid">
    <slot />
  </div>
</template>

<style scoped>
  .grid {
    display: grid;
    grid-template-columns: v-bind(gridTemplateColumns);
    grid-template-rows: repeat(v-bind(rows), v-bind(rowHeight));
  }
</style>
