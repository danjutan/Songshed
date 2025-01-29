<script setup lang="ts">
import type { GuitarNote, StackMap } from "~/model/data";
import type { TabStore } from "~/model/stores";
import Tabline from "./Tabline.vue";
import TabBar from "./bars/TabBar.vue";

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
import { provideNotePreviewState } from "./providers/state/provide-note-preview-state";
import { provideSubUnit } from "./providers/provide-subunit";
import {
  provideBarManagement,
  type Bar,
} from "./providers/provide-bar-management";

import BarDivider from "./bars/BarDivider.vue";
import { isCollapsed } from "./hooks/use-collapsed";
import { provideBeatSize } from "./providers/provide-beatsize";

const props = defineProps<{
  tabStore: TabStore;
}>();

const settings = injectSettingsState();
const cellHeightPx = computed(() => `${settings.cellHeight}px`);
const contextMenuHeightPx = computed(() => `${settings.contextMenuHeight}px`);
const collapsedMinWidthPx = computed(() => `${settings.collapsedMinWidth}px`);

const subUnit = provideSubUnit(props.tabStore, settings);
const beatSize = provideBeatSize(props.tabStore);

const barSize = computed(() => props.tabStore.beatsPerBar * beatSize.value);

// const columnsPerBar = computed(() => barSize.value / subUnit.value); // Doesn't include the one divider
const newBarStart = ref(0);

const { tablineStarts } = provideStackResizeObserver();

const cellHoverEvents = provideCellHoverEvents();
const selectionState = provideSelectionState(
  reactiveComputed(() => ({
    guitar: props.tabStore.guitar,
    subUnit,
    barSize,
  })),
);
provideNotePreviewState(selectionState, props.tabStore.guitar);
const editingState = provideEditingState();

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

const barManagement = provideBarManagement(
  reactiveComputed(() => ({
    tabStore: props.tabStore,
    subUnit: subUnit.value,
  })),
);

onMounted(() => {
  useTieAddMonitor(tieAddState);
  useSelectMonitor(selectionState);
  useMoveMonitor(selectionState);
});

// const columnsMap = provideColumnsMap(
//   reactiveComputed(() => ({ tablines, subUnit, columnsPerBar })),
// );

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

// const annotationRenders = provideAnnotationRenderState(
//   reactiveComputed(() => ({
//     store: props.tabStore.annotations,
//     subUnit: subUnit.value,
//     newAnnotation: annotationAddState.newAnnotation,
//     columnsMap,
//   })),
// );

function onMouseUp() {
  cellHoverEvents.mouseup();
  // editingState.blurEditing();
}

function onLeaveTab() {
  cellHoverEvents.leaveTab();
  editingState.blurEditing();
}

function newBarClick() {
  const lastBarStart = barManagement.bars.at(-1)!.start;
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

const barMinWidth = (bar: Bar) =>
  Array.from(bar.stacks.entries()).reduce((total: number, [position]) => {
    const width = isCollapsed(
      settings,
      bar.stacks[position].notes,
      position % props.tabStore.beatSize === 0,
    )
      ? settings.collapsedMinWidth
      : settings.cellHeight;
    return total + width;
  }, 0);

const tabBarRefs = useTemplateRef("tabBars");
const tab = useTemplateRef("tab");

const barFlexGrow = ref(
  barManagement.bars.map((bar) => 10 / barManagement.bars.length),
);

watch(
  () => barManagement.bars,
  (next, prev) => {
    if (prev.length === next.length) return;
    // TODO: intelligently retain proportions and handle insersions/deletes
    barFlexGrow.value = barManagement.bars.map(
      (bar) => 10 / barManagement.bars.length,
    );
  },
);

let lastDiffX = 0;

function onResize(i: number, diffX: number) {
  if (!tabBarRefs.value) return;

  const tabWidth = tab.value!.clientWidth;
  const deltaX = diffX - lastDiffX;
  lastDiffX = diffX;
  const diffPercentage = deltaX / tabWidth;

  barFlexGrow.value[i - 1]! += diffPercentage * 10;
  barFlexGrow.value[i]! -= diffPercentage * 10;
}

function endDrag(i: number) {
  lastDiffX = 0;
}
</script>

<template>
  <div ref="tab" class="tab" @mouseup="onMouseUp" @mouseleave="onLeaveTab">
    <!-- <Tabline
      v-for="(tabline, tablineIndex) in tablines"
      :key="tablineIndex"
      :tabline="tabline"
      :tabline-index="tablineIndex"
      :is-last-tabline="tablineIndex === tablines.length - 1"
      :tab-store="tabStore"
      :columns-per-bar="columnsPerBar"
      @new-bar-click="newBarClick"
    /> -->
    <template v-for="(bar, i) in barManagement.bars" :key="bar.start">
      <div v-if="tabStore.lineBreaks.has(bar.start)" class="line-break" />

      <TabBar
        ref="tabBars"
        :flex-grow="barFlexGrow[i]"
        :guitar-store="props.tabStore.guitar"
        :bar="bar"
        :guitar-stacks="bar.stacks"
      >
        <template #divider>
          <BarDivider
            :start-of-line="tablineStarts.includes(bar.start)"
            :bar-start="bar.start"
            :joinable="tabStore.lineBreaks.has(bar.start)"
            @resize="(diffX: number) => onResize(i, diffX)"
            @end-drag="endDrag(i)"
          />
        </template>
      </TabBar>
    </template>
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
  --pos-line-width: 1px;
  --string-width: 1px;
  --pos-line-color: lightgray;
  --string-color: gray;
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

  display: flex;
  flex-wrap: wrap;
}

.line-break {
  width: 100%;
  height: 0px;
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
