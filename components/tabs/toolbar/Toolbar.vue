<script lang="ts" setup>
import type { DivisionData } from "../TabBar.vue";
import Drape from "./Drape.vue";
import { emptyDivisions } from "./empty-divisions";

const props = defineProps<{
  divisions: DivisionData[]
  tuning: Midi[]
}>();

const numStrings = computed(() => props.tuning.length);

const spacers = computed(() => emptyDivisions(props.divisions));
</script>

<template>
  <div class="toolbar">
    <Drape v-for="{ start, columns } in spacers"
           :key="start"
           only-collapsed
           :start
           :columns
           :num-strings
           color="var(--substack-bg)"
    />
  </div>
</template>

<style scoped>
.toolbar {
  grid-row: 1;
  grid-column: -1 / 1;
  display: grid;
  grid-template-columns: subgrid;
}
</style>
