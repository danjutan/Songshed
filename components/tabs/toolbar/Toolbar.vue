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
</script>

<template>
  <div class="toolbar">
    <div v-for="i in numNotches"
         :key="i"
         :style="{ gridColumn: `${i} / span 1` }"
         :class="{ 'border-even': i % 2 === 0, 'border-odd': i % 2 === 1 }"
         class="notch">
      <div class="selectable"
           @mouseover="hovering = i"
           @mouseleave="hovering = 0"
      />
    </div>
    <Drape v-for="{ start, columns } in spacers"
           :key="start"
           collapsed="show"
           default="hide"
           :start
           :columns
           :num-strings
           :row-start="2"
           color="var(--substack-bg)">
      <template #up>
        <div :style="{ width: '100%', height: 'var(--min-division-width)', pointerEvents: 'auto' }" />
      </template>
      <template #down>
        <div class="spacer-overlay">
          <div class="indicator-container">
            <div class="spacer-indicator">
              ⇤
            </div>
            <div class="spacer-indicator">
              ⇥
            </div>
          </div>
        </div>
      </template>
    </Drape>

    <Drape v-if="hovering"
           :start="hovering"
           :columns="1"
           :row-start="2"
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

.notch.border-odd {
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  margin-top: -2px;
}

.notch.border-even {
  /* border-bottom: 2px solid rgba(0, 100, 255, 0.5); */
  border-bottom: 2px solid rgba(0, 0, 0, 0.2);
  margin-top: -2px;
}

.spacer-overlay {
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.indicator-container {
  width: 100%;
  /* margin-top: calc(var(--min-division-width) / 2); */
  height: calc(var(--min-division-width));
  container-type: size;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spacer-indicator {
  /* margin-top: -50%; */
  font-size: clamp(10px, 50cqw, var(--min-division-width));
  color: rgba(255, 0, 0, 0.6);
}

.spacer-indicator:first-child {
  margin-left: -2cqw;
}

.spacer-indicator:last-child {
  margin-right: -2cqw;
}

@container (aspect-ratio < 0.8) {
  .spacer-indicator {
    display: none;
  }
}

.notch:not(:first-child) .selectable {
  /* border-left: var(--string-width) solid var(--string-color); */
}

.selectable {
  width: 100%;
  height: 100%;
  opacity: 0.5;
}

/* @container notch (aspect-ratio < 1) {
  .selectable {
    display: none;
  }
} */

.selectable:hover {
  background-color: lightblue;
}

.selected {
  background-color: lightblue;
}
</style>
