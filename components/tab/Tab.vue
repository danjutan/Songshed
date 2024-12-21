<script setup lang="ts">
import type { Annotation, GuitarNote, StackMap } from "~/model/data";
import type { TabStore } from "~/model/stores";
import GuitarBar from "./guitar/GuitarBar.vue";
import TiesBar from "./guitar/ties/TiesBar.vue";
import AnnotationRender from "./annotations/AnnotationRender.vue";

import {
  createSelectionState,
  SelectionInjectionKey,
  type SelectionState,
} from "./state/selection-state";
import { createAnnotationAddState } from "./state/annotation-add-state";
import { createAnnotationRenderState } from "./state/annotation-render-state";
import { createTieAddState, TieAddInjectionKey } from "./state/tie-add-state";
import { createEditingState, EditingInjectionKey } from "./state/editing-state";
import AnnotationDragBar from "./annotations/AnnotationDragBar.vue";
import { createBendRenderState } from "./state/bend-render-state";
import BendRender from "./guitar/bends/BendRender.vue";

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
const newBarStart = ref(0);

const numStrings = computed(() => props.data.guitar?.strings);

const selectionState = createSelectionState();
provide(SelectionInjectionKey, selectionState);
const tieAddState = createTieAddState(
  computed(() => props.data.guitar),
  subUnit,
);
provide(TieAddInjectionKey, tieAddState);
const editingState = createEditingState();
provide(EditingInjectionKey, editingState);

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

export type TablineColumn = {
  tabline: number;
  column: number;
};

const posToCol = (pos: number): TablineColumn => {
  const cols = pos / subUnit.value;
  const tabline = Math.floor(cols / (props.barsPerLine * columnsPerBar.value));
  const colsInLine = cols - tabline * props.barsPerLine * columnsPerBar.value;
  // TODO: document how this works
  let column = colsInLine + Math.ceil(colsInLine / columnsPerBar.value) + 1;
  if (column % (columnsPerBar.value + 1) === 1) {
    column += 1;
  }
  return {
    tabline,
    column,
  };
};

const annotationAddState = createAnnotationAddState(
  props.data.annotations,
  subUnit,
);

const annotationRenders = createAnnotationRenderState(
  props.data.annotations,
  subUnit,
  posToCol,
  annotationAddState.newAnnotation,
);

const annotationRows = computed(() =>
  Math.max(props.data.annotations.getRows().length, 1),
);

const bendRenders = computed(() => {
  if (props.data.guitar) {
    return createBendRenderState(
      props.data.guitar!.ties,
      subUnit,
      computed(() => annotationRows.value + 2),
      posToCol,
    ).value;
  }
  return undefined;
});

const bendRow = computed(() =>
  bendRenders.value && bendRenders.value.size
    ? annotationRows.value + 1
    : undefined,
);

const notesRow = computed(() =>
  bendRow.value ? bendRow.value + 1 : annotationRows.value + 1,
);

function newAnnotationRow() {
  if (props.data.annotations.getRows().length === annotationRows.value - 1) {
    props.data.annotations.createNextRow();
  }
  props.data.annotations.createNextRow();
}

function cancelSelection() {
  annotationAddState.end();
  selectionState.end();
  editingState.blurEditing();
}

function newBarClick(lastBarStart?: number) {
  if (lastBarStart !== undefined)
    newBarStart.value = lastBarStart + notchUnit.value * props.notches;
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === "Escape" || e.key === "Backspace") {
    if (props.data.guitar && selectionState.selectedRange) {
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
          :style="{
            gridColumn: i * (columnsPerBar + 1) + 1,
          }"
          @click="data.guitar?.shiftFrom(bar.start, barSize)"
        />

        <!--provider instead?-->
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

        <TiesBar
          :ties="data.guitar!.ties"
          :num-strings="numStrings!"
          :start-row="notesRow"
          :start-column="i * (columnsPerBar + 1) + 2"
          :start-position="bar.start"
          :end-position="bar.start + barSize"
          :sub-unit="subUnit"
        />

        <AnnotationDragBar
          :start-column="i * (columnsPerBar + 1) + 1"
          :bar-positions="[...bar.stacks.keys()]"
          :annotation-rows="annotationRows"
          :add-state="annotationAddState"
        />

        <div class="new-row-box" @click="newAnnotationRow">
          <span>+</span>
        </div>
      </template>
      <div
        v-if="tabLineIndex === tabLines.length - 1"
        class="divider"
        :style="{ gridColumn: tabLine.length * (columnsPerBar + 1) + 1 }"
        @click="newBarClick(tabLine.at(-1)?.start)"
      >
        <div class="new-button">+</div>
      </div>

      <AnnotationRender
        v-for="render in annotationRenders.get(tabLineIndex)"
        :key="render.startColumn"
        v-bind="render"
        @update-title="(title) => (render.annotation!.title = title)"
        @delete="
          data.annotations.deleteAnnotation(
            annotationRows - render.row,
            render.annotation!,
          )
        "
      />

      <template v-if="bendRow">
        <!--TODO: only show this while dragging new bends/interacting with bends-->
        <div class="bend-row-label">bend</div>
        <BendRender
          v-for="render in bendRenders!.get(tabLineIndex)"
          :key="render.startColumn"
          v-bind="render"
          :bend-row
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.tab {
  --cell-height: 24px;
  --note-font-size: calc(var(--cell-height) * 0.8);
  --divider-width: calc(var(--cell-height) / 3);
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
    repeat(calc(v-bind(notesRow) - 1 + v-bind(numStrings)), var(--cell-height))
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
  width: var(--divider-width);
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

.bend-row-label {
  grid-row: v-bind(bendRow);
  grid-column: 1;
  font-size: calc(var(--note-font-size) * 0.75);
  align-self: center;
  /* writing-mode: vertical-rl;
  text-orientation: upright; */
}
</style>
