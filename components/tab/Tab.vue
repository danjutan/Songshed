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

import { useTieAddMonitor } from "./hooks/dnd/use-tie-add-monitor";
import { useSelectMonitor } from "./hooks/dnd/use-select-monitor";
import { useMoveMonitor } from "./hooks/dnd/use-move-monitor";
import { useBendEditMonitor } from "./hooks/dnd/use-bend-edit-monitor";
import { useAnnotationAddMonitor } from "./hooks/dnd/use-annotation-add-monitor";
import { injectSettingsState } from "./providers/state/provide-settings-state";

import { provideAnnotationAddState } from "./providers/state/provide-annotation-add-state";

import { provideNotePreviewState } from "./providers/state/provide-note-preview-state";
import { provideSubUnit } from "./providers/provide-subunit";
import {
  provideBarManagement,
  type Bar,
} from "./providers/state/provide-bar-management";

import BarDivider from "./bars/BarDivider.vue";
import { isCollapsed } from "./hooks/use-collapsed";
import { provideBeatSize } from "./providers/provide-beatsize";
import { Plus } from "lucide-vue-next";
import { provideCopyState } from "./providers/state/provide-copy-state";
import { useAnnotationResizeMonitor } from "./hooks/dnd/use-annotation-resize-monitor";
import { provideAnnotationResizeState } from "./providers/state/provide-annotation-resize-state";
const props = defineProps<{
  tabStore: TabStore;
}>();

const settings = injectSettingsState();
const cellHeightPx = computed(() => `${settings.cellHeight}px`);
const dividerWidthPx = computed(() => `${settings.dividerWidth}px`);
const contextMenuHeightPx = computed(() => `${settings.contextMenuHeight}px`);
const collapsedMinWidthPx = computed(() => `${settings.collapsedMinWidth}px`);

const subUnit = provideSubUnit(props.tabStore, settings);
const beatSize = provideBeatSize(props.tabStore);

const barSize = computed(() => props.tabStore.beatsPerBar * beatSize.value);

// const columnsPerBar = computed(() => barSize.value / subUnit.value); // Doesn't include the one divider

const { tablineStarts } = provideStackResizeObserver();

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
    store: props.tabStore.guitar,
    subUnit,
  })),
);

const bendEditState = provideBendEditState(
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

const copyState = provideCopyState(selectionState, props.tabStore.guitar);

provideNotePreviewState(selectionState, copyState, props.tabStore.guitar);

const annotationProps = reactiveComputed(() => ({
  store: props.tabStore.annotations,
  subUnit: subUnit.value,
}));

const annotationAddState = provideAnnotationAddState(annotationProps);

const annotationResizeState = provideAnnotationResizeState(annotationProps);

onMounted(() => {
  useTieAddMonitor(tieAddState);
  useSelectMonitor(selectionState);
  useMoveMonitor(selectionState);
  useBendEditMonitor(bendEditState);
  useAnnotationAddMonitor(annotationAddState);
  useAnnotationResizeMonitor(annotationResizeState);
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

const barMinWidth = (bar: Bar) => {
  // NOTE: This must always mirror how TabBar sets itself up
  const stacks = Array.from(bar.stacks.entries()).reduce(
    (total: number, [position]) => {
      const width = isCollapsed(
        settings,
        bar.stacks[position].notes,
        position % props.tabStore.beatSize === 0,
      )
        ? settings.collapsedMinWidth
        : settings.cellHeight;
      return total + width;
    },
    0,
  );

  const firstBarBuffer = settings.cellHeight;
  let total = stacks + settings.dividerWidth;
  if (tablineStarts.value.includes(bar.start)) {
    total += firstBarBuffer;
  }
  return total;
};

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
  const leftBar = tabBarRefs.value[i - 1];
  const rightBar = tabBarRefs.value[i];

  if (!leftBar || !rightBar) return;

  const deltaX = diffX - lastDiffX;
  lastDiffX = diffX;
  const diffPercentage = deltaX / tabWidth;

  const leftMinWidth = barMinWidth(barManagement.bars[i - 1]);
  const rightMinWidth = barMinWidth(barManagement.bars[i]);

  const leftNewWidth = leftBar.$el.clientWidth + deltaX;
  const rightNewWidth = rightBar.$el.clientWidth - deltaX;

  if (leftNewWidth > leftMinWidth && rightNewWidth > rightMinWidth) {
    // TODO: once there are more than one line, this moves too much
    barFlexGrow.value[i - 1]! += diffPercentage * 10;
    barFlexGrow.value[i]! -= diffPercentage * 10;
  }
}

function endDrag(i: number) {
  lastDiffX = 0;
}

const numStrings = computed(() => props.tabStore.guitar.strings);
const deletingBarStart = ref<number | undefined>(undefined);
</script>

<template>
  <div ref="tab" class="tab" @mouseup="onMouseUp" @mouseleave="onLeaveTab">
    <template v-for="(bar, i) in barManagement.bars" :key="bar.start">
      <div v-if="tabStore.lineBreaks.has(bar.start)" class="line-break" />

      <TabBar
        ref="tabBars"
        :bar="bar"
        :flex-grow="barFlexGrow[i]"
        :annotation-store="props.tabStore.annotations"
        :guitar-store="props.tabStore.guitar"
        :highlight="deletingBarStart === bar.start && 'delete'"
      >
        <template #divider>
          <BarDivider
            :start-of-line="tablineStarts.includes(bar.start)"
            :bar-start="bar.start"
            :joinable="tabStore.lineBreaks.has(bar.start)"
            @resize="(diffX: number) => onResize(i, diffX)"
            @delete-hover-start="deletingBarStart = bar.start"
            @delete-hover-end="deletingBarStart = undefined"
            @end-drag="endDrag(i)"
          />
        </template>
      </TabBar>
    </template>
    <!-- TODO: re-evaluate; do I toss this down a slot? -->
    <div class="new-button" @click="barManagement.newBarClick">
      <Plus />
    </div>
  </div>
</template>

<style scoped>
.tab {
  --cell-height: v-bind(cellHeightPx);
  --context-menu-height: v-bind(contextMenuHeightPx);
  --collapsed-min-width: v-bind(collapsedMinWidthPx);
  --divider-width: v-bind(dividerWidthPx);
  --note-font-size: calc(var(--cell-height) * 0.8);
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
  --annotation-dragger-z-index: 1;
  --annotation-z-index: 2;
  --annotation-resize-dragger-z-index: 0;
  --annotation-text-z-index: 1;

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

.new-button {
  align-self: center;
  cursor: pointer;

  &:hover svg {
    stroke-width: 3;
  }
}
</style>
