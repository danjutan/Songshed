<script setup lang="ts">
import type { GuitarNote, StackMap } from "~/model/data";
import type { TabStore } from "~/model/stores";
import GuitarTabLine from "./guitar/GuitarTabLine.vue";
import Toolbar from "./Toolbar.vue";

import { provideSelectionState } from "./providers/state/provide-selection-state";
import { provideEditingState } from "./providers/state/provide-editing-state";
import { provideCellHoverEvents } from "./providers/events/provide-cell-hover-events";
import { provideTieAddState } from "./providers/state/provide-tie-add-state";
import { provideBendEditState } from "./providers/state/provide-bend-edit-state";
import { provideStackResizeObserver } from "./providers/events/provide-resize-observer";
import { provideColumnsMap } from "./providers/provide-columns-map";

import { useTieAddMonitor } from "./dnd/use-tie-add-monitor";
import { useSelectMonitor } from "./dnd/use-select-monitor";
import { useMoveMonitor } from "./dnd/use-move-monitor";

import { injectSettingsState } from "./providers/state/provide-settings-state";

import { provideAnnotationAddState } from "./providers/state/annotations/provide-annotation-add-state";
import { provideAnnotationRenderState } from "./providers/state/annotations/provide-annotation-render-state";

const props = defineProps<{
  tabStore: TabStore;
}>();

const settings = injectSettingsState();
const cellHeightPx = computed(() => `${settings.cellHeight}px`);
const contextMenuHeightPx = computed(() => `${settings.contextMenuHeight}px`);

const barSize = computed(
  () => props.tabStore.beatsPerBar * props.tabStore.beatSize,
);

const subUnit = computed(() => props.tabStore.beatSize / settings.subdivisions);

const columnsPerBar = computed(() => barSize.value / subUnit.value); // Doesn't include the one divider
const newBarStart = ref(0);

const cellHoverEvents = provideCellHoverEvents();
const selectionState = provideSelectionState(
  reactiveComputed(() => ({
    guitar: props.tabStore.guitar,
    subUnit,
    barSize,
  })),
);
const editingState = provideEditingState();

provideStackResizeObserver();

const tieAddState = provideTieAddState(
  reactiveComputed(() => ({
    cellHoverEvents,
    store: props.tabStore.guitar,
    subUnit,
  })),
);

provideBendEditState(
  reactiveComputed(() => ({
    cellHoverEvents,
    tieAddState,
    tieStore: props.tabStore.guitar?.ties,
  })),
);

onMounted(() => {
  useTieAddMonitor(tieAddState);
  useSelectMonitor(selectionState);
  useMoveMonitor(selectionState);
});

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

const tablines = computed<Array<Bar[]>>(() => {
  const tablineBars: Array<Bar[]> = [];
  let currTabLine: Bar[] = [];
  bars.value.forEach((bar, i) => {
    currTabLine.push(bar);
    if (
      currTabLine.length === settings.barsPerLine ||
      props.tabStore.lineBreaks.has((i + 1) * barSize.value)
    ) {
      tablineBars.push(currTabLine);
      currTabLine = [];
    }
  });
  if (currTabLine.length) {
    tablineBars.push(currTabLine);
  }
  return tablineBars;
});

const columnsMap = provideColumnsMap(
  reactiveComputed(() => ({ tablines, subUnit, columnsPerBar })),
);

const gridTemplateColumns = computed<string>(() => {
  const barTemplateColumns = `repeat(${columnsPerBar.value}, 1fr)`;
  const bars = Array.from(
    { length: settings.barsPerLine },
    () => barTemplateColumns,
  ).join(" min-content ");
  return `var(--note-font-size) ${bars}`;
});

const annotationAddState = provideAnnotationAddState(
  reactiveComputed(() => ({
    store: props.tabStore.annotations,
    subUnit: subUnit.value,
    cellHoverEvents,
  })),
);

const annotationRenders = provideAnnotationRenderState(
  reactiveComputed(() => ({
    store: props.tabStore.annotations,
    subUnit: subUnit.value,
    newAnnotation: annotationAddState.newAnnotation,
    columnsMap,
  })),
);

function onMouseUp() {
  cellHoverEvents.mouseup();
  // editingState.blurEditing();
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
    selectionState.deleteSelectedNotes();
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
    <div v-for="(tabLine, tabLineIndex) in tablines" class="tab-line">
      <template v-for="bar in tabLine" :key="bar.start">
        <Toolbar
          :tabline="tabLine"
          :tab-line-index="tabLineIndex"
          @new-annotation-row-clicked="tabStore.annotations.createNextRow"
          @delete-annotation-clicked="
            (row, annotation) =>
              tabStore.annotations.deleteAnnotation(row, annotation)
          "
        />
        <GuitarTabLine
          v-if="tabStore.guitar"
          :tab-line-index
          :guitar-store="tabStore.guitar"
          :bars="tabLine"
          :start-row="annotationRenders.annotationRows + 1"
          :beat-size="tabStore.beatSize"
          :sub-unit
          :columns-per-bar
        >
          <template #divider="{ bar, barIndex, numStrings }">
            <div
              class="divider hoverable"
              :style="{
                gridColumn: barIndex * (columnsPerBar + 1) + 1,
                gridRow: `2 / span ${numStrings}`,
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
                <template v-if="barIndex === 0">
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
                gridColumnStart: barIndex * (columnsPerBar + 1) + 2,
                gridColumnEnd: (barIndex + 1) * (columnsPerBar + 1) + 2,
                gridRow: `1 / span ${numStrings + 1}`,
              }"
            />

            <div
              v-if="
                tabLineIndex === tablines.length - 1 &&
                barIndex === tabLine.length - 1
              "
              class="divider"
              :style="{
                gridColumn: tabLine.length * (columnsPerBar + 1) + 1,
                gridRow: `1 / span ${numStrings}`,
              }"
              @click="newBarClick()"
            >
              <div class="new-button">+</div>
            </div>
          </template>
        </GuitarTabLine>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tab {
  --cell-height: v-bind(cellHeightPx);
  --note-font-size: calc(var(--cell-height) * 0.8);
  --context-menu-height: v-bind(contextMenuHeightPx);
  --divider-width: calc(var(--cell-height) / 3);
  --substack-bg: rgba(255, 0, 0, 0.1);
  --string-width: 1px;
  --string-color: gray;
  --pos-line-color: lightgray;
  --note-hover-color: rgb(172, 206, 247);

  --select-alpha: 0.3;
  --select-color: rgb(173, 206, 247);
  --might-move-color: rgb(70, 212, 134);
  --moving-color: rgb(35, 174, 98);
  --delete-color: rgba(255, 0, 0);
  /* --highlight-color: rgba(var(--h-r), var(--h-g), var(--h-b), var(--h-a));
  --h-r: 172.8;
  --h-g: 206;
  --h-b: 247;
  --h-a: 0.4; */

  /*
    https://graphicdesign.stackexchange.com/a/113050
    TODO: can we do all this with relative colors? (Does it have wide browser support yet?)
  */
  /* --highlight-blocking: rgb(
    calc(255 - var(--h-a) * (255 - var(--h-r))),
    calc(255 - var(--h-a) * (255 - var(--h-g))),
    calc(255 - var(--h-a) * (255 - var(--h-b)))
  ); */
  user-select: none;
}

.tab-line {
  display: grid;
  grid-template-columns: v-bind(gridTemplateColumns);
  grid-template-rows: max-content;
  grid-auto-rows: var(--cell-height);
  /* grid-template-rows:
    repeat(calc(v-bind(notesRow) - 1 + v-bind(numStrings)), var(--cell-height))
    calc(var(--cell-height) * 0.8); */
}

.drag-start {
  cursor: crosshair;
}

.divider {
  width: var(--divider-width);
  padding: 0px 1px;
  height: 100%;
  background: black;
  color: white;
  font-size: var(--cell-height);
  justify-self: end;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

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
  opacity: var(--select-alpha);
  background-color: var(--delete-color);
}
</style>
