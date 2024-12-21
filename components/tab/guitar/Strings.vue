<script lang="ts" setup>
defineProps<{
  startRow: number
  numStrings: number
  startColumn: number
  columns: number
}>();
</script>

<template>
  <div class="strings">
    <div v-for="i in numStrings"
         :key="i"
         class="string-box">
      <div class="string" />
    </div>
  </div>
</template>

<style scoped>
.strings {
  grid-row: v-bind(startRow) / span v-bind(numStrings);
  grid-column: v-bind(startColumn) / span v-bind(columns);
}

.string-box {
  width: 100%;
  height: var(--cell-height);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.string {
  height: var(--string-width);
  background-color: var(--string-color);
}
</style>
