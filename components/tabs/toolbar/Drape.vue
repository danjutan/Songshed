<script lang="ts" setup>
export type DrapeData = {
  start: number
  columns: number
};

const props = defineProps<DrapeData & {
  onlyCollapsed?: boolean
  color: string
  numStrings: number
}>();
</script>

<template>
  <div class="drape"
       :class="{ collapse: onlyCollapsed }">
    <div class="drape-child" />
  </div>
</template>

<style>
  .collapse {
    container-name: drape;
    container-type: size;
  }

  .drape {
    grid-column: v-bind(start) / span v-bind(columns);
    height: calc(var(--min-division-width) / 2 * v-bind(columns));
    pointer-events: none;
  }

  .drape-child {
    background-color: v-bind(color);
    margin-top: calc(var(--min-division-width) / 2);
    height: calc(v-bind(numStrings) * var(--min-division-width) / 2);
  }

  @container drape (aspect-ratio > 1) {
    .drape-child {
      display: none
    }
  }
</style>
