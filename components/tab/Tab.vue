<script setup lang="ts">
import type { GuitarNote, StackMap } from "~/model/data";
import type { TabStore } from "~/model/stores";
import GuitarTabLine from "./guitar/GuitarTabLine.vue";
import AnnotationRender from "./annotations/AnnotationRender.vue";
import AnnotationDragBar from "./annotations/AnnotationDragBar.vue";

import {
  createSelectionState,
  SelectionInjectionKey,
} from "./state/selection-state";

import { createAnnotationAddState } from "./state/annotation-add-state";
import { createAnnotationRenderState } from "./state/annotation-render-state";
import { createEditingState, EditingInjectionKey } from "./state/editing-state";
import {
  CellHoverInjectionKey,
  createCellHoverEvents,
} from "./state/cell-hover-events";
import {
  createTieAddState,
  TieAddInjectionKey,
} from "./guitar/state/tie-add-state";
import {
  BendEditInjectionKey,
  createBendEditState,
} from "./guitar/state/bend-edit-state";
import { SettingsInjectionKey, type Settings } from "./state/settings-state";

const props = defineProps<{
  tabStore: TabStore;
}>();

const settings = inject(SettingsInjectionKey) as Settings;
const barSize = computed(
  () => props.tabStore.beatsPerBar * props.tabStore.beatSize,
);
// const notchUnit = computed(() => props.tabStore.beatSize);
const subUnit = computed(() => props.tabStore.beatSize / settings.subdivisions);

const columnsPerBar = computed(() => barSize.value / subUnit.value); // Doesn't include the one divider
const newBarStart = ref(0);

const numStrings = computed(() => props.tabStore.guitar?.strings);

const cellHoverEvents = createCellHoverEvents();
provide(CellHoverInjectionKey, cellHoverEvents);
const selectionState = createSelectionState(cellHoverEvents);
provide(SelectionInjectionKey, selectionState);
const editingState = createEditingState();
provide(EditingInjectionKey, editingState);

const tieAddState = createTieAddState(
  cellHoverEvents,
  computed(() => props.tabStore.guitar),
  computed(() => subUnit.value),
);

provide(TieAddInjectionKey, tieAddState);

const bendEditState = createBendEditState(
  cellHoverEvents,
  tieAddState,
  computed(() => props.tabStore.guitar?.ties),
);

provide(BendEditInjectionKey, bendEditState);

export type Bar = {
  start: number;
  stacks: StackMap<GuitarNote>;
};

// TODO: swap out the view that's determining the bars / use the longest view
const bars = computed<Bar[]>(() => {
  if (!props.tabStore.guitar) return [];
  const bars: Bar[] = [];
  for (
    let i = 0;
    i <= Math.max(newBarStart.value, props.tabStore.guitar.getLastPosition());
    i += barSize.value
  ) {
    bars.push({
      start: i,
      stacks: props.tabStore.guitar.getStacks(
        i,
        i + barSize.value,
        subUnit.value,
      ),
    });
  }
  return bars;
});

const tabLines = computed<Array<Bar[]>>(() => {
  const tabLineBars: Array<Bar[]> = [];
  let currTabLine: Bar[] = [];
  bars.value.forEach((bar, i) => {
    currTabLine.push(bar);
    if (
      currTabLine.length === settings.barsPerLine ||
      props.tabStore.lineBreaks.has((i + 1) * barSize.value)
    ) {
      tabLineBars.push(currTabLine);
      currTabLine = [];
    }
  });
  if (currTabLine.length) {
    tabLineBars.push(currTabLine);
  }
  return tabLineBars;
});

const gridTemplateColumns = computed<string>(() => {
  const barTemplateColumns = `repeat(${columnsPerBar.value}, 1fr)`;
  const bars = Array.from(
    { length: settings.barsPerLine },
    () => barTemplateColumns,
  ).join(" min-content ");
  return `var(--cell-height) ${bars} var(--note-font-size)`;
});

export type TablineColumn = {
  tabline: number;
  column: number;
  tablineColumns: number; // total columns in tabline
};

const posToCol = (pos: number): TablineColumn => {
  let tabLineIndex = 0;
  let tabLineLength = -1;
  for (const tabLine of tabLines.value) {
    const tabLength = tabLine.length * barSize.value;
    tabLineLength = tabLength;
    if (pos - tabLength < 0) break;
    pos -= tabLength;
    tabLineIndex++;
  }
  const colsIntoLine = pos / subUnit.value;
  const tablineCols = tabLineLength / subUnit.value;
  // const cols = pos / subUnit.value; // convert position to columns
  // // const tabline = Math.floor(cols / (props.barsPerLine * columnsPerBar.value)); // figure out which tabline these columns reach
  // const tabline = Math.floor(pos / (props.barsPerLine * barSize.value));
  // const colsInLine = cols - tabline * props.barsPerLine * columnsPerBar.value;

  // TODO: document how these lines work
  // add 1 to work with grid columns
  let column = colsIntoLine + Math.ceil(colsIntoLine / columnsPerBar.value) + 1;
  if (column % (columnsPerBar.value + 1) === 1) {
    column += 1;
  }
  const tablineColumns = tablineCols + tablineCols / columnsPerBar.value + 1;
  return {
    tabline: tabLineIndex,
    column,
    tablineColumns,
  };
};

const annotationAddState = createAnnotationAddState(
  props.tabStore.annotations,
  subUnit,
  cellHoverEvents,
);

const annotationRenders = createAnnotationRenderState(
  props.tabStore.annotations,
  subUnit,
  posToCol,
  annotationAddState.newAnnotation,
);

const annotationRows = computed(() =>
  Math.max(props.tabStore.annotations.getRows().length, 1),
);

const notesRow = computed(() => {
  const hasBend =
    tieAddState.newBend || props.tabStore.guitar?.ties.getBends().length;
  return annotationRows.value + (hasBend ? 2 : 1);
});

function newAnnotationRow() {
  if (
    props.tabStore.annotations.getRows().length ===
    annotationRows.value - 1
  ) {
    props.tabStore.annotations.createNextRow();
  }
  props.tabStore.annotations.createNextRow();
}

function onMouseUp() {
  cellHoverEvents.mouseup();
  editingState.blurEditing();
}

function onLeaveTab() {
  cellHoverEvents.leaveTab();
  editingState.blurEditing();
}

function newBarClick() {
  const lastBarStart = bars.value.at(-1)!.start;
  newBarStart.value = lastBarStart + barSize.value;
}

function deleteBar(start: number) {
  props.tabStore.guitar!.deleteStacks(start, start + barSize.value);
  props.tabStore.guitar!.shiftFrom(start, -barSize.value);
  overlayedBarStart.value = undefined;
  if (start > props.tabStore.guitar!.getLastPosition()) {
    newBarStart.value -= barSize.value;
  }
}

function insertBar(start: number) {
  props.tabStore.guitar!.shiftFrom(start, barSize.value);
  if (start > props.tabStore.guitar!.getLastPosition()) {
    newBarStart.value += barSize.value;
  }
}

function insertBreak(start: number) {
  props.tabStore.lineBreaks.add(start);
}

function joinBreak(start: number) {
  props.tabStore.lineBreaks.delete(start);
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === "Backspace") {
    if (props.tabStore.guitar && selectionState.selectedRange) {
      props.tabStore.guitar?.deleteStacks(
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

const overlayedBarStart = ref<number | undefined>();
</script>

<template>
  <div class="tab" @mouseup="onMouseUp" @mouseleave="onLeaveTab">
    <div v-for="(tabLine, tabLineIndex) in tabLines" class="tab-line">
      <template v-for="(bar, i) in tabLine" :key="bar.start">
        <div
          class="divider hoverable"
          :style="{
            gridColumn: i * (columnsPerBar + 1) + 1,
          }"
        >
          <div class="buttons">
            <div class="dummy">+</div>
            <div class="dummy">+</div>
            <div class="insert" @click="insertBar(bar.start)">+</div>
            <div
              class="delete"
              @mouseover="overlayedBarStart = bar.start"
              @mouseleave="overlayedBarStart = undefined"
              @click="deleteBar(bar.start)"
            >
              &#x2326;
            </div>
            <template v-if="i === 0">
              <div
                v-if="tabStore.lineBreaks.has(bar.start)"
                class="join"
                @click="joinBreak(bar.start)"
              >
                &#x2B11;
              </div>
              <div v-else class="dummy">+</div>
            </template>
            <div v-else class="break" @click="insertBreak(bar.start)">
              &#x21B5;
            </div>
          </div>
        </div>

        <div
          v-if="overlayedBarStart === bar.start"
          class="bar-overlay"
          :style="{
            gridColumnStart: i * (columnsPerBar + 1) + 2,
            gridColumnEnd: (i + 1) * (columnsPerBar + 1) + 2,
          }"
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

      <AnnotationRender
        v-for="render in annotationRenders.get(tabLineIndex)"
        :key="render.startColumn"
        v-bind="render"
        @update-title="(title) => (render.annotation!.title = title)"
        @delete="
          tabStore.annotations.deleteAnnotation(
            annotationRows - render.row,
            render.annotation!,
          )
        "
      />

      <GuitarTabLine
        v-if="tabStore.guitar"
        :tab-line-index
        :guitar-store="tabStore.guitar"
        :bars="tabLine"
        :start-row="annotationRows + 1"
        :pos-to-col
        :beat-size="tabStore.beatSize"
        :sub-unit
        :columns-per-bar
      />

      <div
        v-if="tabLineIndex === tabLines.length - 1"
        class="divider"
        :style="{ gridColumn: tabLine.length * (columnsPerBar + 1) + 1 }"
        @click="newBarClick()"
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
  --divider-width: calc(var(--cell-height) / 3);
  --substack-bg: rgba(255, 0, 0, 0.1);
  --delete-overlay-bg: rgba(0, 0, 0, 0.15);
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
  grid-auto-rows: var(--cell-height);
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
  display: flex;
  align-items: center;
  justify-content: center;

  & .buttons {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    visibility: hidden;

    & > div:hover {
      font-weight: bold;
      cursor: pointer;
    }

    & > .delete {
      font-size: calc(var(--divider-width) * 1.75);
    }

    & > .dummy {
      visibility: hidden;
    }
  }

  &.hoverable {
    &:hover {
      width: var(--note-font-size);

      & .buttons {
        visibility: visible;
      }
    }
    /* &:hover::before {
      content: "+";
    } */
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
  cursor: pointer;

  &:hover {
    font-weight: bold;
  }
}

.bar-overlay {
  z-index: 1;
  /* grid-row: v-bind(notesRow) / span v-bind(numStrings); */
  grid-row: 1 / -1;
  background-color: var(--delete-overlay-bg);
}
</style>
