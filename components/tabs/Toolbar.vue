<script lang="ts" setup>
import type { DivisionData } from "./TabBar.vue";

const props = defineProps<{
  divisions: DivisionData[]
  tuning: Midi[]
}>();

const numStrings = computed(() => props.tuning.length);

const drapeStart = 2;
const drapeEnd = 5;

const drapeStyles = {
  gridColumn: `${drapeStart} / ${drapeEnd}`,
  height: `calc(var(--min-division-width) / 2 * ${drapeEnd - drapeStart})`,
};
</script>

<template>
  <div class="toolbar">
    <div v-for="(div, i) in divisions"
         :key="i"
         :style="{ backgroundColor: i % 2 ? 'lightblue' : 'lightgreen' }"
    />
    <div class="drape"
         :style="drapeStyles">
      <div class="drape-child" />
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  grid-row: 1;
  grid-column: -1 / 1;
  display: grid;
  grid-template-columns: subgrid;
}

.drape {
  /* background-color: var(--substack-bg); */
  container-name: drape;
  container-type: size;
}

.drape-child {
  background-color: var(--substack-bg);
  margin-top: calc(var(--min-division-width) / 2);
  height: calc(v-bind(numStrings) * var(--min-division-width) / 2);
}

@container drape (aspect-ratio > 1) {
  .drape-child {
    display: none
  }
}
</style>
