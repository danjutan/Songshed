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
    <div class="drape-down" />
  </div>
</template>

<style>
  .collapse {
    container-name: drape;
    container-type: size;
  }

  .drape {
    grid-column: v-bind(start) / span v-bind(columns);
    grid-row: 2;
    height: calc(var(--min-division-width) / 2 * v-bind(columns));
    pointer-events: none;
  }

  .drape-down {
    background-color: v-bind(color);
    height: calc(v-bind(numStrings) * var(--min-division-width) / 2);
    pointer-events: none;
    display: none;
  }

  @container drape (aspect-ratio < 0.5) {
    .drape-down {
      display: block;
    }
  }
</style>
