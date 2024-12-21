<script lang="ts" setup>
import Stack from "./bar/Stack.vue";
import { type GuitarNote, type NoteSpot, type TabStore } from "./data";
import { ExpansionStateKey, createExpansionState } from "./providers/expansion-state";

// TODO: move to app
provide(ExpansionStateKey, createExpansionState());

const props = withDefaults(defineProps<{
  data: TabStore
  barsPerLine?: number
  notches?: number // per bar
  subdivisions?: number // per notch
  // The top part of a time signature
  // The bottom part of a time signature
}>(), {
  barsPerLine: 3,
  notches: 2,
  subdivisions: 4,
});

type ColumnData = {
  stack: GuitarNote[]
  position: number
};

const barSize = computed(() => props.data.beatsPerBar * props.data.beatSize);
const notchUnit = computed(() => barSize.value / props.notches);
const subUnit = computed(() => notchUnit.value / props.subdivisions);

const barsUntil = ref(props.data.guitar?.lastPosition() ?? 0);

type Bar = Array<ColumnData[]>;

const bars = computed<Bar>(() => {
  if (!props.data.guitar) return [];
  const bars: Array<ColumnData[]> = [];
  for (let i = 0; i <= barsUntil.value; i += barSize.value) {
    const columns = [];
    for (let position = i; position < i + barSize.value; position += subUnit.value) {
      const stack = props.data.guitar.stacks.get(position)
        ?? props.data.guitar.tuning.map((_, string) => ({ string, position }));
      columns.push({ stack, position });
    }
    bars.push(columns);
  }
  console.log(bars);
  return bars;
});

const tabLines = computed<Bar[]>(() => {
  const tabLineBars = [];
  for (let i = 0; i <= bars.value.length; i += props.barsPerLine) {
    tabLineBars.push(bars.value.slice(i, i + props.barsPerLine));
  }
  console.log(tabLineBars);
  return tabLineBars;
});

const gridTemplateColumns = computed<string>(() => {
  const columnsPerBar = barSize.value / subUnit.value;
  const barTemplateColumns = `repeat(${columnsPerBar}, 1fr) min-content`;
  return Array.from({ length: props.barsPerLine }, () => barTemplateColumns).join(" ");
});

function newBarClick() {
  barsUntil.value = Math.max((props.data.guitar?.lastPosition() ?? 0), barsUntil.value + barSize.value);
}
</script>

<template>
  <div class="tab">
    <div v-for="barGroup in tabLines"
         class="tab-line">
      <template v-for="columns in barGroup">
        <Stack v-for="column in columns"
               :key="column.position"
               :stack="column.stack"
               :tuning="data.guitar!.tuning"
               :frets="data.guitar!.frets"
        />
        <div class="divider" />
      </template>
    </div>
  </div>
</template>
    <!-- <TabBar v-for="barStore in bars"
            :data="barStore"
            :beats="barSize"
            :notches="notches * beatsPerBar"
            :subdivisions="subdivisions"
    />
    <div class="new-button"
         @click="newBarClick">
      <span>+</span>
    </div> -->

<style scoped>
.tab {
  --cell-height: 23px;
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
}

.divider {
  width: calc(var(--cell-height) / 4);
  height: 100%;
  background: black;
}

.new-button {
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.new-button:hover {
  background-color: rgba(240, 240, 240);
}

.new-button span {
  color: rgba(100, 100, 100);
  font-size: 16px;
}
</style>
