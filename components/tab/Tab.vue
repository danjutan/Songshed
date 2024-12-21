<script setup lang="ts">
import type { Annotation, GuitarNote, StackMap } from "~/model/data";
import type { TabStore } from "~/model/stores";
import GuitarBar from "./guitar/GuitarBar.vue";
import AnnotationRender from "./annotations/AnnotationRender.vue";

import {
  createSelectionState,
  SelectionInjectionKey,
  type SelectionState,
} from "./guitar/providers/selection";

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

const selectionState = createSelectionState();
provide(SelectionInjectionKey, selectionState);

const barSize = computed(() => props.data.beatsPerBar * props.data.beatSize);
const notchUnit = computed(() => barSize.value / props.notches);
const subUnit = computed(() => notchUnit.value / props.subdivisions);

const columnsPerBar = computed(() => barSize.value / subUnit.value); // Doesn't include the one divider

const newBarStart = ref(0);

const numStrings = computed(() => props.data.guitar?.strings);

type Bar = {
  start: number;
  stacks: StackMap<GuitarNote>;
};

// TODO: swap out the view that's determining the bars / use the longest view
const bars = computed<Bar[]>(() => {
  if (!props.data.guitar) return [];
  const bars: Bar[] = [];
  for (
    let i = 0;
    i <= Math.max(newBarStart.value, props.data.guitar.lastPosition() ?? 0);
    i += barSize.value
  ) {
    bars.push({
      start: i,
      stacks: props.data.guitar.getStacks(i, i + barSize.value, subUnit.value),
    });
  }
  return bars;
});

const tabLines = computed<Array<Bar[]>>(() => {
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
  return `var(--cell-height) ${bars} var(--note-font-size)`;
});

const annotationRows = computed(() =>
  Math.max(props.data.annotations.getRows().length, 1),
);
const notesRow = computed(() => annotationRows.value + 1);

function newAnnotationRowClick() {
  if (props.data.annotations.getRows().length === annotationRows.value - 1) {
    props.data.annotations.createNextRow();
  }
  props.data.annotations.createNextRow();
}

function newBarClick(lastBarStart?: number) {
  if (lastBarStart !== undefined)
    newBarStart.value = lastBarStart + notchUnit.value * props.notches;
}

const newAnnotation = reactive<{
  row: undefined | number;
  start: undefined | number;
  end: undefined | number;
}>({ row: undefined, start: undefined, end: undefined });
function annotationStart(row: number, position: number) {
  newAnnotation.row = row;
  newAnnotation.start = position;
}
function annotationDragThrough(position: number) {
  if (newAnnotation.start !== undefined) {
    /* if (position > newAnnotation.start) {
      newAnnotation.end = position + subUnit.value;
    } else {
      newAnnotation.end = position;
    } */
    newAnnotation.end = position;
  }
}
function annotationEnd() {
  const { row, start, end } = newAnnotation;
  if (
    row !== undefined &&
    start !== undefined &&
    end !== undefined &&
    start !== end
  ) {
    const first = Math.min(start, end);
    const last = Math.max(start, end);
    props.data.annotations.createAnnotation(row, {
      start: first,
      end: last + subUnit.value,
      title: "",
    });
  }
  newAnnotation.start = newAnnotation.end = undefined;
}

type TablineColumn = {
  tabline: number;
  column: number;
};
const posToCol = (pos: number): TablineColumn => {
  const cols = pos / subUnit.value;
  const tabline = Math.floor(cols / (props.barsPerLine * columnsPerBar.value));
  const colsInLine = cols - tabline * props.barsPerLine * columnsPerBar.value;
  // TODO: document how this works
  const column = colsInLine + Math.ceil(colsInLine / columnsPerBar.value) + 1;
  return {
    tabline,
    column,
  };
};

// TODO: rows <-> types
const annotationRenders = computed(() => {
  const annotationRenders: Map<
    number, // tabline index
    Array<{
      row: number;
      startColumn: number;
      endColumn: number;
      annotation: Annotation | undefined;
    }>
  > = new Map();

  function push(
    tablineIndex: number,
    row: number,
    startColumn: number,
    endColumn: number,
    annotation?: Annotation,
  ) {
    const atTabline = annotationRenders.get(tablineIndex) || [];
    atTabline.push({ row, startColumn, endColumn, annotation });
    annotationRenders.set(tablineIndex, atTabline);
  }

  props.data.annotations.getRows().forEach((rowIndex) => {
    const annotations = props.data.annotations.getAnnotations(rowIndex);
    const row = annotationRows.value - rowIndex;
    for (const annotation of annotations) {
      const start = posToCol(annotation.start);
      const end = posToCol(annotation.end);
      if (start.tabline !== end.tabline) {
        push(start.tabline, row, start.column, -2, annotation);
        push(end.tabline, row, 1, end.column, annotation);
        continue;
      }
      push(start.tabline, row, start.column, end.column, annotation);
    }
  });

  if (newAnnotation.start !== undefined) {
    const row = annotationRows.value - newAnnotation.row!;
    const start = newAnnotation.start;
    const end = newAnnotation.end ?? start;
    const first = posToCol(Math.min(start, end));
    const last = posToCol(Math.max(start, end) + subUnit.value);
    if (first.tabline !== last.tabline) {
      push(first.tabline, row, first.column, -2);
      push(last.tabline, row, 1, last.column);
    } else {
      push(first.tabline, row, first.column, last.column);
    }
  }

  return annotationRenders;
});

function cancelSelection() {
  annotationEnd();
  selectionState.end();
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === "Escape" || e.key === "Backspace") {
    console.log("here");
    if (props.data.guitar && selectionState.selectedRange) {
      console.log(selectionState.selectedRange);
      props.data.guitar?.deleteStacks(
        selectionState.selectedRange.start,
        selectionState.selectedRange.end,
      );
    }
  }
}

onMounted(() => {
  document.addEventListener("keyup", onKeyUp);
});

onBeforeUnmount(() => {
  document.removeEventListener("keyup", onKeyUp);
});
</script>

<template>
  <div class="tab" @mouseup="cancelSelection" @mouseleave="cancelSelection">
    <div v-for="(tabLine, tabLineIndex) in tabLines" class="tab-line">
      <template v-for="(bar, i) in tabLine" :key="bar.start">
        <div
          class="divider hoverable"
          @click="data.guitar?.shiftFrom(bar.start, barSize)"
        />

        <GuitarBar
          :stack-data="bar.stacks"
          :subdivisions
          :notch-unit
          :start-column="i * (columnsPerBar + 1) + 2"
          :start-row="notesRow"
          :collapse-empty
          :collapse-subdivisions
          :tuning="data.guitar!.tuning"
          :frets="data.guitar!.frets"
          :num-strings="numStrings!"
          @note-change="data.guitar!.setNote"
          @note-delete="data.guitar!.deleteNote"
        />
        <template v-for="(_, rowIndex) in annotationRows">
          <div
            class="drag-start between"
            :style="{
              gridColumn: i * (columnsPerBar + 1) + 1,
              gridRow: annotationRows - rowIndex,
            }"
            @mousedown="annotationStart(rowIndex, bar.start)"
          />
          <div
            v-for="([position], s) in bar.stacks"
            class="drag-start"
            :style="{
              gridColumn: i * (columnsPerBar + 1) + 2 + s,
              gridRow: annotationRows - rowIndex,
            }"
            @mousedown="annotationStart(rowIndex, position)"
            @mouseover="annotationDragThrough(position)"
          />
        </template>

        <div class="new-row-box" @click="newAnnotationRowClick">
          <span>+</span>
        </div>
      </template>
      <div
        v-if="tabLineIndex === tabLines.length - 1"
        class="divider"
        @click="newBarClick(tabLine.at(-1)?.start)"
      >
        <div class="new-button">+</div>
      </div>

      <AnnotationRender
        v-for="{
          row,
          startColumn,
          endColumn,
          annotation,
        } in annotationRenders.get(tabLineIndex)"
        :key="startColumn"
        :row
        :start-column="
          startColumn % (columnsPerBar + 1) === 1
            ? startColumn + 1
            : startColumn
        "
        :end-column
        :annotation
        @update-title="(title) => (annotation!.title = title)"
        @delete="
          data.annotations.deleteAnnotation(annotationRows - row, annotation!)
        "
      />
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
  /*https://graphicdesign.stackexchange.com/a/113050*/
  --highlight-blocking: rgb(221.8, 235.4, 251.8);
  /* --highlight-blocking: rgb(
    from var(--highlight-color) calc(255 - 0.4 * (255 - r))
      calc(255 - 0.4 * (255 - g)) calc(255 - 0.4 * (255 - b))
  );*/
  --note-hover-color: rgba(172, 206, 247, 0.8);
  user-select: none;
}

.tab-line {
  display: grid;
  grid-template-columns: v-bind(gridTemplateColumns);
  grid-template-rows:
    repeat(v-bind(annotationRows), var(--cell-height))
    repeat(v-bind(numStrings), var(--cell-height))
    calc(var(--cell-height) * 0.8);
}

.new-row-box {
  grid-row: 1;
  grid-column: 1;
  font-size: var(--cell-height);
  border-right: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:hover {
    font-weight: bold;
    background-color: lightcoral;
    color: white;
  }
}

.drag-start {
  cursor: crosshair;
}

.divider {
  grid-row: v-bind(notesRow) / span v-bind(numStrings);
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

.divider:first-of-type {
  justify-self: end;
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
</style>
