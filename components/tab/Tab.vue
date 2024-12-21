<script lang="ts" setup>
import type { TabStore } from "./data";
import type { GuitarStack } from "./guitar/GuitarBar.vue";
import GuitarBar from "./guitar/GuitarBar.vue";

const props = withDefaults(
  defineProps<{
    data: TabStore;
    barsPerLine?: number;
    notches?: number; // per bar
    subdivisions?: number; // per notch
    collapseSubdivisions?: boolean;
    collapseEmpty?: boolean;
  }>(),
  {
    barsPerLine: 3,
    notches: 2,
    subdivisions: 4,
  },
);

const barSize = computed(() => props.data.beatsPerBar * props.data.beatSize);
const notchUnit = computed(() => barSize.value / props.notches);
const subUnit = computed(() => notchUnit.value / props.subdivisions);

const columnsPerBar = computed(() => barSize.value / subUnit.value); // Doesn't include the one divider

type Bar = Array<GuitarStack[]>;

const newBarStart = ref(0);

// TODO: swap out the view that's determining the bars / use the longest view
const bars = computed<Bar>(() => {
  if (!props.data.guitar) return [];
  const bars: Array<GuitarStack[]> = [];
  for (
    let i = 0;
    i <= Math.max(newBarStart.value, props.data.guitar.lastPosition() ?? 0);
    i += barSize.value
  ) {
    const columns = [];
    for (
      let position = i;
      position < i + barSize.value;
      position += subUnit.value
    ) {
      const stack =
        props.data.guitar.stacks.get(position) ??
        props.data.guitar.tuning.map((_, string) => ({ string, position }));
      columns.push({ stack, position });
    }
    bars.push(columns);
  }
  return bars;
});

const tabLines = computed<Bar[]>(() => {
  const tabLineBars = [];
  for (let i = 0; i < bars.value.length; i += props.barsPerLine) {
    tabLineBars.push(bars.value.slice(i, i + props.barsPerLine));
  }
  return tabLineBars;
});

const gridTemplateColumns = computed<string>(() => {
  const barTemplateColumns = `repeat(${columnsPerBar.value}, 1fr)`;
  const bars = Array.from(
    { length: props.barsPerLine },
    () => barTemplateColumns,
  ).join(" min-content ");
  return `min-content ${bars} var(--note-font-size)`;
});

const notesRow = computed(() => 2);

function newBarClick(lastColumn?: GuitarStack) {
  if (lastColumn) newBarStart.value = lastColumn.position + subUnit.value;
}

const newAnnotation = reactive<{
  start: undefined | number;
  end: undefined | number;
}>({ start: undefined, end: undefined });
function annotationStart(position: number) {
  newAnnotation.start = position;
}
function annotationDragThrough(position: number) {
  if (newAnnotation.start !== undefined) {
    newAnnotation.end = position;
  }
}
function annotationEnd() {
  newAnnotation.start = newAnnotation.end = undefined;
}

const posToCol = (pos: number) => {
  const cols = pos / subUnit.value;
  const tabline = Math.floor(cols / (props.barsPerLine * columnsPerBar.value));
  const colsInLine = cols - tabline * props.barsPerLine * columnsPerBar.value;
  const column = colsInLine + Math.floor(colsInLine / columnsPerBar.value) + 2;
  return {
    tabline,
    column,
  };
};

/* const annotationColumns = ({
  start,
  end,
}: {
  start: number | undefined;
  end: number | undefined;
}) => {
  if (start === undefined || end === undefined) return undefined;
  const columnsStart = posToCol(start);
  const columnsEnd = posToCol(end);
  return { start: columnsStart, end: columnsEnd };
}; */
// const newAnnotationColumns = computed(() => annotationColumns(newAnnotation));
</script>

<template>
  <div class="tab">
    <div v-for="(tabLine, tabLineIndex) in tabLines" class="tab-line">
      <template v-for="(bar, i) in tabLine" :key="bar[0].position">
        <div
          class="divider hoverable"
          @click="data.guitar?.shiftFrom(bar[0].position, barSize)"
        />
        <GuitarBar
          :stack-data="bar"
          :subdivisions
          :notch-unit
          :start-column="i * (columnsPerBar + 1) + 2"
          :start-row="notesRow"
          :collapse-empty
          :collapse-subdivisions
          :tuning="data.guitar!.tuning"
          :frets="data.guitar!.frets"
          :num-strings="data.guitar!.strings"
          @note-change="data.guitar!.setNote"
        />
        <div
          class="drag-start between"
          :style="{
            gridColumn: i * (columnsPerBar + 1) + 1,
            gridRow: 1,
          }"
          @mousedown="annotationStart(bar[0].position)"
          @mouseup="annotationEnd"
        />
        <div
          v-for="(stack, s) in bar"
          class="drag-start"
          :style="{
            gridColumn: i * (columnsPerBar + 1) + 2 + s,
            gridRow: 1,
          }"
          @mousedown="annotationStart(stack.position)"
          @mouseover="annotationDragThrough(stack.position)"
          @mouseup="annotationEnd"
        />
      </template>
      <div
        v-if="
          newAnnotation.start &&
          posToCol(newAnnotation.start!).tabline === tabLineIndex
        "
        :style="{
          background: 'blue',
          gridColumn: posToCol(newAnnotation.start!).column,
          gridRow: 1,
        }"
      />
      <div
        v-if="
          newAnnotation.end &&
          posToCol(newAnnotation.end!).tabline === tabLineIndex
        "
        :style="{
          background: 'red',
          gridColumn: posToCol(newAnnotation.end!).column,
          gridRow: 1,
        }"
      />
      <div
        v-if="tabLineIndex === tabLines.length - 1"
        class="divider"
        @click="newBarClick(tabLine.at(-1)?.at(-1))"
      >
        <div class="new-button">+</div>
      </div>
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
  user-select: none;
}

.tab-line {
  display: grid;
  grid-template-columns: v-bind(gridTemplateColumns);
  grid-template-rows: var(--cell-height) auto calc(var(--cell-height) * 0.8);
}

.divider {
  grid-row: v-bind(notesRow);
  width: calc(var(--cell-height) / 3);
  padding: 0px 1px;
  height: 100%;
  background: black;
  color: white;
  font-size: var(--cell-height);
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &.hoverable {
    &:hover {
      width: var(--note-font-size);
    }
    &:hover::before {
      content: "+";
    }
  }
}

/* We don't want this last divider to take up extra space in the grid and throw it off */
.divider .new-button {
  margin-left: calc(var(--cell-height) * 0.4);
  padding-right: calc(var(--cell-height) * 0.1);
  background: black;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-start {
  background-color: rgba(0, 100, 255, 0.1);
}
</style>
