<script setup lang="ts">
const props = defineProps<{
  startColumn: number
  columns: number
  row: number
}>();
</script>

<template>
  <div class="unexpander">
    <div class="content">
      <span>↦</span><span>↤</span>
    </div>
  </div>
</template>

<style scoped>
.unexpander {
  grid-column: v-bind(startColumn) / span v-bind(columns);
  grid-row: v-bind(row);
  height: 100%;
  background-color: var(--substack-bg);
  &:hover {
    background-color: rgba(255, 0, 0, 0.2);
  }
}

.content {
  position: relative;
  top: -10%;
  color: darkred;
  font-size: var(--note-font-size);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
