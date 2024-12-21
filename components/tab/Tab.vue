<script lang="ts" setup>
import { type TabStore } from "./data";
import type { GuitarStack } from "./guitar/GuitarBar.vue";
import GuitarBar from "./guitar/GuitarBar.vue";

const props = withDefaults(defineProps<{
  data: TabStore
  barsPerLine?: number
  notches?: number // per bar
  subdivisions?: number // per notch
  collapseSubdivisions?: boolean
  collapseEmpty?: boolean
}>(), {
  barsPerLine: 3,
  notches: 2,
  subdivisions: 4,
});

const barSize = computed(() => props.data.beatsPerBar * props.data.beatSize);
const notchUnit = computed(() => barSize.value / props.notches);
const subUnit = computed(() => notchUnit.value / props.subdivisions);

const columnsPerBar = computed(() => barSize.value / subUnit.value);

const barsUntil = ref(props.data.guitar?.lastPosition() ?? 0);

type Bar = Array<GuitarStack[]>;

// TODO: swap out the view that's determining the bars / use the longest view
const bars = computed<Bar>(() => {
  if (!props.data.guitar) return [];
  const bars: Array<GuitarStack[]> = [];
  for (let i = 0; i <= barsUntil.value; i += barSize.value) {
    const columns = [];
    for (let position = i; position < i + barSize.value; position += subUnit.value) {
      const stack = props.data.guitar.stacks.get(position)
        ?? props.data.guitar.tuning.map((_, string) => ({ string, position }));
      columns.push({ stack, position });
    }
    bars.push(columns);
  }
  return bars;
});

const tabLines = computed<Bar[]>(() => {
  const tabLineBars = [];
  for (let i = 0; i <= bars.value.length; i += props.barsPerLine) {
    tabLineBars.push(bars.value.slice(i, i + props.barsPerLine));
  }
  return tabLineBars;
});

const gridTemplateColumns = computed<string>(() => {
  const barTemplateColumns = `repeat(${columnsPerBar.value}, 1fr)`;
  const bars = Array.from({ length: props.barsPerLine }, () => barTemplateColumns).join(" min-content ");
  return `min-content ${bars} min-content`;
});

function newBarClick() {
  barsUntil.value = Math.max((props.data.guitar?.lastPosition() ?? 0), barsUntil.value + barSize.value);
}
</script>

<template>
  <div class="tab">
    <div v-for="tabLine in tabLines"
         class="tab-line">
      <div class="divider" />
      <template v-for="(bar, i) in tabLine"
                :key="bar[0].position">
        <GuitarBar
          :stack-data="bar"
          :subdivisions
          :notch-unit
          :start-column="(i * (columnsPerBar + 1)) + 2"
          :collapse-empty
          :collapse-subdivisions
          :tuning="data.guitar!.tuning"
          :frets="data.guitar!.frets"
          :num-strings="data.guitar!.strings"
          @note-change="data.guitar!.setNote"
        />

        <div class="divider" />
      </template>
    </div>
  </div>
</template>

<style scoped>
  .tab {
  --cell-height: 24px;
  --note-font-size: calc(var(--cell-height) * 0.8);
  --substack-bg: rgba(255, 0, 0, 0.1);
  --string-width: 1px;
  --string-color: gray;
  --highlight-color: rgba(172, 206, 247, 0.4);
  --note-hover-color: rgba(172, 206, 247, 0.8);
  }

  .tab-line {
  display: grid;
  grid-template-columns: v-bind(gridTemplateColumns);
    grid-template-rows: auto calc(var(--cell-height) * 0.8);
  }

  .divider {
  width: calc(var(--cell-height) / 4);
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  }
</style>
