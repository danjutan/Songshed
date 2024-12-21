<script lang="ts" setup>
import type { DivisionData } from "../TabBar.vue";
import type { DrapeData } from "./Drape.vue";
import Drape from "./Drape.vue";
import { emptyDivisions } from "./empty-divisions";
import ExpanderOverlay from "./ExpanderOverlay.vue";
import UnexpanderOverlay from "./UnexpanderOverlay.vue";

const props = defineProps<{
  divisions: DivisionData[]
  tuning: Midi[]
  subdivisions: number
  expanded: Set<number>
}>();

const emit = defineEmits<{
  toggleExpanded: [start: number, num?: number]
}>();

const hovering = ref(0);

const numStrings = computed(() => props.tuning.length);
const numNotches = computed(() => props.divisions.length);
const spacers = computed<DrapeData[]>(() => emptyDivisions(props.divisions));
const stackExpanderStarts = computed<number[]>(
  () => props.divisions
    .filter(div => div.substacks)
    .map(div => div.notchPosition),
);
</script>

<template>
  <!-- <div style="position: absolute">
    <span v-for="i in expanded">{{ i }},</span>
  </div> -->
  <div class="toolbar">
    <div
      v-for="i in numNotches"
      :key="i"
      :style="{
        gridColumn: `${i} / span 1`,
      }"
      :class="{ border: i != hovering, even: i % 2 === 0, odd: i % 2 === 1 }"
      class="notch">
      <div
        class="selectable"
        @mouseover="hovering = i"
        @mouseleave="hovering = 0"
      />
    </div>
    <Drape
      v-for="{ start, columns } in spacers"
      :key="start"
      collapsed="show"
      default="hide"
      up="reverse"
      :start
      :columns
      :num-strings
      :row-start="2"
      color="var(--substack-bg)"
      @click="emit('toggleExpanded', start, columns)">
      <template v-if="expanded.has(start)"
                #up>
        <UnexpanderOverlay />
      </template>
      <template v-else
                #down>
        <ExpanderOverlay />
      </template>
    </Drape>

    <Drape
      v-if="hovering"
      :start="hovering"
      :columns="1"
      :row-start="2"
      :num-strings
      color="var(--highlight-color)"
    />

    <Drape
      v-for="start in stackExpanderStarts"
      :key="start"
      collapsed="show"
      default="hide"
      up="reverse"
      :start
      :columns="1"
      :row-start="2"
      :height-unit="`${subdivisions * 2 - 1} * var(--cell-height)`"
      color="var(--substack-bg)"
      :num-strings
      @click="emit('toggleExpanded', start)">
      <template #down>
        <ExpanderOverlay />
      </template>
      <template v-if="expanded.has(start)"
                #up>
        <UnexpanderOverlay />
      </template>
    </Drape>
  </div>
</template>

<style scoped>
.toolbar {
  grid-row: 1 / span 1;
  grid-column: -1 / 1;
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: var(--cell-height);
}

.notch {
  grid-row: 1 / span 1;
  container-name: notch;
  container-type: size;
}

.notch.border.odd {
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  margin-top: -2px;
}

.notch.border.even {
  /* border-bottom: 2px solid rgba(0, 100, 255, 0.5); */
  border-bottom: 2px solid rgba(0, 0, 0, 0.3);
  margin-top: -2px;
}

/* .spacer-indicator:first-child {
  margin-left: -1cqw;
}

.spacer-indicator:last-child {
  margin-right: -1cqw;
} */

.selectable {
  width: 100%;
  height: 100%;
}

/* @container notch (aspect-ratio < 1) {
  .selectable {
    display: none;
  }
} */

.selectable:hover {
  background-color: var(--highlight-color);
}
</style>
