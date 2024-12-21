<script lang="ts" setup>
import Stack from "./bar/Stack.vue";
import { type GuitarNote, type NoteSpot, type TabStore } from "./data";
import { ExpansionStateKey, createExpansionState } from "./providers/expansion-state";
import Strings from "./bar/Strings.vue";
import Overlay from "./bar/Overlay.vue";
import Unexpander from "./bar/Unexpander.vue";

// TODO: move to app
provide(ExpansionStateKey, createExpansionState());

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

type ColumnData = {
  stack: GuitarNote[]
  position: number
};

const barSize = computed(() => props.data.beatsPerBar * props.data.beatSize);
const notchUnit = computed(() => barSize.value / props.notches);
const subUnit = computed(() => notchUnit.value / props.subdivisions);

const isNotch = (position: number) => position % notchUnit.value === 0;

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

const collapsedEmpty = computed<Set<number>>(() => {
  const collapsed = new Set<number>();
  if (!props.collapseEmpty || !props.data.guitar) return collapsed;
  const emptyStack = (stack: GuitarNote[]) => stack.every(spot => !spot.data);
  const columns = bars.value.flat();
  // [...props.data.guitar!.getStacks(notch.position, notch.position += subUnit.value * props.subdivisions)
  //   .values()].every(emptyStack);
  columns.forEach((notch, i) => {
    if (!isNotch(notch.position)) return;
    const emptyNotchGroup = columns.slice(i, i + props.subdivisions).every(({ stack }) => emptyStack(stack));
    if (emptyNotchGroup) {
      for (let i = 0; i < props.subdivisions; i++) {
        collapsed.add(notch.position + i * subUnit.value);
      }
    }
  });
  console.log(collapsed, bars.value);
  return collapsed;
});

const collapsed = computed<Set<number>>(() => {
  const positions = new Set<number>(
    bars.value.flat().map(c => c.position).filter((position) => {
      if (expanded.has(position))
        return false;
      if (props.collapseEmpty && collapsedEmpty.value.has(position))
        return true;
      if (isNotch(position))
        return false;
      if (props.collapseSubdivisions)
        return true;
    }),
  );
  return positions;
});

function toggleSubdivisions(notchCol: ColumnData) {
  const firstPos = notchCol.position; /* notchCol.position + subUnit.value; */
  const collapse = expanded.has(firstPos);
  for (let i = 0; i < props.subdivisions; i++) {
    const pos = firstPos + i * subUnit.value;
    if (collapse) {
      expanded.delete(pos);
      continue;
    }
    expanded.add(pos);
  }
}
</script>

<template>
  <div class="tab">
    <div v-for="barGroup in tabLines"
         class="tab-line">
      <div class="divider" />
      <template v-for="columns in barGroup"
                :key="columns[0].position">
        <Strings
          :start-column="columnPos(columns[0])"
          :columns="columns.length"
          :num-strings="numStrings"
          :start-row="1"
        />
        <template v-for="(column, i) in columns"
                  :key="column.position">
          <Stack
            class="stack"
            :style="{
              // borderTop: isNotch(column.position) && '1px solid maroon',
              borderRight: i < columns.length && '1px solid lightgray',
              gridColumn: columnPos(column),
            }"
            :notes="column.stack"
            :collapse="collapsed.has(column.position)"
            :tuning="data.guitar!.tuning"
            :frets="data.guitar!.frets"
            @note-change="data.guitar!.setNote"
          />
          <template v-if="isNotch(column.position)">
            <template v-if="collapsedEmpty.has(column.position)">
              <Overlay
                :start-column="columnPos(column)"
                :columns="props.subdivisions"
                :start-row="1"
                :rows="numStrings">
                <div
                  class="overlay"
                  :class="{ expanded: expanded.has(column.position) }"
                  @click="toggleSubdivisions(column)"
                />
              </Overlay>
            </template>
            <template v-else-if="props.collapseSubdivisions">
              <Overlay
                :start-column="1 + columnPos(column)"
                :columns="props.subdivisions - 1"
                :start-row="1"
                :rows="numStrings">
                <div
                  class="overlay"
                  :class="{ expanded: expanded.has(column.position + subUnit) }"
                  @click="toggleSubdivisions(column)"
                />
              </Overlay>
            </template>
            <Unexpander v-if="expanded.has(column.position + subUnit)"
                        class="unexpander"
                        :start-column="columnPos(column)"
                        :columns="props.subdivisions"
                        :row="2"
                        @click="toggleSubdivisions(column)"
            />
          </template>
        </template>
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

  .stack {
    grid-row: 1;
  }

  .divider {
  width: calc(var(--cell-height) / 4);
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  }

  .overlay {
    z-index: 1;
    height: 100%;
    /* height: calc(100% - var(--cell-height) / 8); */
    /* border-bottom: calc(var(--cell-height) / 8) solid var(--substack-bg); */
    &:hover {
      /* border-bottom: none; */
      /* height: 100%; */
      background: var(--substack-bg);
    }
    /* &.expanded { */
    /*   border-bottom: none; */
    /* } */
  }
</style>
