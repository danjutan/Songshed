<script lang="ts" setup>
import Stack from "./bar/Stack.vue";
import { type GuitarNote, type NoteSpot, type TabStore } from "./data";
import { ExpansionStateKey, createExpansionState } from "./providers/expansion-state";
import Overlay from "./bar/Overlay.vue";

// TODO: move to app
provide(ExpansionStateKey, createExpansionState());

const props = withDefaults(defineProps<{
  data: TabStore
  barsPerLine?: number
  notches?: number // per bar
  subdivisions?: number // per notch
  collapseSubdivisions?: boolean
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
const columnsPerBar = computed(() => barSize.value / subUnit.value);

const barsUntil = ref(props.data.guitar?.lastPosition() ?? 0);

const numStrings = computed(() => props.data.guitar?.strings ?? 0);

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

const columnPos = (column: ColumnData) => {
  const columnsIn = (column.position / subUnit.value) % (props.barsPerLine * columnsPerBar.value);
  const dividers = 1 + Math.floor(columnsIn / columnsPerBar.value);
  return 1 + columnsIn + dividers;
};

function newBarClick() {
  barsUntil.value = Math.max((props.data.guitar?.lastPosition() ?? 0), barsUntil.value + barSize.value);
}

const expanded = reactive<Set<number>>(new Set());

const collapsed = computed<Set<number>>(() => {
  const positions = new Set<number>(
    bars.value.flat().map(c => c.position).filter((position) => {
      if (expanded.has(position))
        return false;
      const isNotch = position % notchUnit.value === 0;
      console.log(position, notchUnit.value, position % notchUnit.value, isNotch);
      if (isNotch)
        return false;
      if (props.collapseSubdivisions)
        return true;
    }),
  );
  console.log(positions);
  return positions;
});

// const notchInderes = (columns: ColumnData[]) => columns.map((_, i) => i)
//  .filter(i => i % props.subdivisions === 0);
</script>

<template>
  <div class="tab">
    <div v-for="(barGroup, t) in tabLines"
         class="tab-line">
      <div class="divider" />
      <template v-for="columns in barGroup">
        <template v-for="(column, i) in columns"
                  :key="column.position">
          <Stack
            :style="{
              gridRow: 1,
              gridColumn: columnPos(column),
              borderTop: `2px solid ${collapsed.has(column.position) ? 'blue' : 'red'}`,
            }"
            :notes="column.stack"
            :collapse="collapsed.has(column.position)"
            :tuning="data.guitar!.tuning"
            :frets="data.guitar!.frets"
          />

          <template v-if="i % props.subdivisions === 0 && props.collapseSubdivisions">
            <Overlay
              :start-column="1 + columnPos(column)"
              :columns="props.subdivisions - 1"
              :start-row="1"
              :rows="numStrings">
              <div
                class="overlay"
                @click="console.log('overlay')"
              />
            </Overlay>
          </template>
        </template>
        <div class="
                  divider"
        />
      </template>
    </div>
  </div>
</template>

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
  margin-right: calc(var(--cell-height) * 0.2);
  }

  .overlay {
    z-index: 1;
    height: 100%;
    &:hover {
      background-color: var(--substack-bg);
    }
  }
</style>
