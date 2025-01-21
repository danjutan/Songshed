<script setup lang="ts">
import type { GuitarNote, StackMap } from "~/model/data";
import type { TabStore } from "~/model/stores";
import Tabline from "./Tabline.vue";

import { provideSelectionState } from "./providers/state/provide-selection-state";
import { provideEditingState } from "./providers/state/provide-editing-state";
import { provideCellHoverEvents } from "./providers/events/provide-cell-hover-events";
import { provideTieAddState } from "./providers/state/provide-tie-add-state";
import { provideBendEditState } from "./providers/state/provide-bend-edit-state";
import { provideStackResizeObserver } from "./providers/events/provide-resize-observer";
import { provideColumnsMap } from "./providers/provide-columns-map";

import { useTieAddMonitor } from "./hooks/dnd/use-tie-add-monitor";
import { useSelectMonitor } from "./hooks/dnd/use-select-monitor";
import { useMoveMonitor } from "./hooks/dnd/use-move-monitor";

import { injectSettingsState } from "./providers/state/provide-settings-state";

import { provideAnnotationAddState } from "./providers/state/annotations/provide-annotation-add-state";
import { provideAnnotationRenderState } from "./providers/state/annotations/provide-annotation-render-state";

import { useWindowResizing } from "./hooks/use-window-resizing";

const props = defineProps<{
  tabStore: TabStore;
}>();

const settings = injectSettingsState();
const cellHeightPx = computed(() => `${settings.cellHeight}px`);
const contextMenuHeightPx = computed(() => `${settings.contextMenuHeight}px`);
const collapsedMinWidthPx = computed(() => `${settings.collapsedMinWidth}px`);
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

const tieAddState = provideTieAddState(
  reactiveComputed(() => ({
    cellHoverEvents,
    store: props.tabStore.guitar!,
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

provideStackResizeObserver();

onMounted(() => {
  useTieAddMonitor(tieAddState);
  useSelectMonitor(selectionState);
  useMoveMonitor(selectionState);
});

export type Bar = {
  start: number;
  stacks: StackMap<GuitarNote>;
};

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

const { lastWidth } = useWindowResizing();
const tablines = computed<Array<Bar[]>>(() => {
  const tablineBars: Array<Bar[]> = [];
  let currTabLine: Bar[] = [];
  const barMaxWidth =
    settings.collapseRatio * settings.collapsedMinWidth * columnsPerBar.value +
    (1 - settings.collapseRatio) * settings.cellHeight * columnsPerBar.value;
  const barsPerLine = lastWidth.value
    ? Math.floor(lastWidth.value / barMaxWidth)
    : 3;
  bars.value.forEach((bar, i) => {
    currTabLine.push(bar);
    if (
      currTabLine.length === barsPerLine ||
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

// const collapsed = provideCollapsedState(
//   reactiveComputed(() => ({
//     editing: editingState,
//     settings,
//     stackData: props.tabStore.guitar!.getStacks(
//       0,
//       barSize.value * bars.value.length,
//       subUnit.value,
//     ),
//     beatSize: props.tabStore.beatSize,
//   })),
// );

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
    <Tabline
      v-for="(tabLine, tabLineIndex) in tablines"
      :key="tabLineIndex"
      :tab-line="tabLine"
      :tab-line-index="tabLineIndex"
      :tab-store="tabStore"
      :columns-per-bar="columnsPerBar"
      :sub-unit="subUnit"
      @new-bar-click="newBarClick"
    />
  </div>
</template>

<style scoped>
.tab {
  --cell-height: v-bind(cellHeightPx);
  --context-menu-height: v-bind(contextMenuHeightPx);
  --collapsed-min-width: v-bind(collapsedMinWidthPx);
  --note-font-size: calc(var(--cell-height) * 0.8);
  --divider-width: calc(var(--cell-height) / 3);
  --substack-bg: rgba(255, 0, 0, 0.1);
  --string-width: 1px;
  --string-color: gray;
  --pos-line-color: lightgray;
  --note-hover-color: rgb(172, 206, 247);

  --select-alpha: 0.3;
  --select-color: rgb(173, 206, 247);
  --might-move-color: rgb(72, 187, 120);
  --moving-color: rgb(56, 161, 105);
  --delete-color: rgba(255, 0, 0);

  --tie-dragger-color: #1e3a8a;

  /* To allow for tie-dragging on the bottommost notes */
  --bottom-note-padding: var(--cell-height);

  --bar-overlay-z-index: 1;
  --overlay-controls-z-index: 1;
  --divider-z-index: 3;

  user-select: none;
}

.drag-start {
  cursor: crosshair;
}

/* .divider {
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

  }
}*/

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
</style>
