<script lang="ts" setup>
import type { DivisionData } from "../TabBar.vue";
import Drape from "./Drape.vue";
import { emptyDivisions } from "./empty-divisions";

const props = defineProps<{
  divisions: DivisionData[]
  tuning: Midi[]
}>();

const hovering = ref(0);

const numStrings = computed(() => props.tuning.length);
const numNotches = computed(() => props.divisions.length);
const spacers = computed(() => emptyDivisions(props.divisions));

// TODO: drape up (slot? no background?)
</script>

<template>
  <div class="toolbar">
    <div v-for="i in numNotches"
         :key="i"
         class="notch">
      <div class="selectable"
           @mouseover="hovering = i"
           @mouseleave="hovering = 0"
      />
    </div>
    <Drape v-for="{ start, columns } in spacers"
           :key="start"
           only-collapsed
           :start
           :columns
           :num-strings
           color="var(--substack-bg)"
    />
    <Drape v-if="hovering"
           :start="hovering"
           :columns="1"
           :num-strings
           color="rgba(0,170,255,0.1)"
    />
  </div>
</template>

<style scoped>
.toolbar {
  grid-row: 1 / span 1;
  grid-column: -1 / 1;
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: calc(var(--min-division-width) / 2);
}

.notch {
  grid-row: 1 / span 1;
  container-name: notch;
  container-type: size;
}

.notch:not(:first-child) .selectable {
  /* border-left: var(--string-width) solid var(--string-color); */
}

.selectable {
  width: 100%;
  height: 100%;
  opacity: 0.5;
}

@container notch (aspect-ratio < 1) {
  .selectable {
    display: none;
  }
}

.selectable:hover {
  background-color: lightblue;
}

.selected {
  background-color: lightblue;
}
</style>
