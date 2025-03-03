<script setup lang="ts">
import TabBar from "./bars/TabBar.vue";
import TabToolbar from "./TabToolbar.vue";
import BarDivider from "./bars/BarDivider.vue";
import { Plus } from "lucide-vue-next";

import type { TabStore } from "~/model/stores";

import { provideSelectionState } from "./providers/state/provide-selection-state";
import { provideEditingState } from "./providers/state/provide-editing-state";
import { provideCellHoverEvents } from "./providers/events/provide-cell-hover-events";
import { provideTieAddState } from "./providers/state/provide-tie-add-state";
import { provideBendEditState } from "./providers/state/provide-bend-edit-state";
import { provideStackResizeObserver } from "./providers/events/provide-resize-observer";
import { provideAnnotationAddState } from "./providers/state/provide-annotation-add-state";
import { provideNotePreviewState } from "./providers/state/provide-note-preview-state";
import { provideSubUnit } from "./providers/provide-subunit";
import {
  provideBarManagement,
  type Bar,
} from "./providers/state/provide-bar-management";
import { provideBeatSize } from "./providers/provide-beatsize";
import { provideCopyState } from "./providers/state/provide-copy-state";
import { provideAnnotationResizeState } from "./providers/state/provide-annotation-resize-state";
import { provideAnnotationHoverState } from "./providers/state/provide-annotation-hover-state";

import { injectSettingsState } from "./providers/state/provide-settings-state";

import { useTieAddMonitor } from "./hooks/dnd/use-tie-add-monitor";
import { useSelectMonitor } from "./hooks/dnd/use-select-monitor";
import { useMoveMonitor } from "./hooks/dnd/use-move-monitor";
import { useBendEditMonitor } from "./hooks/dnd/use-bend-edit-monitor";
import { useAnnotationAddMonitor } from "./hooks/dnd/use-annotation-add-monitor";
import { useAnnotationResizeMonitor } from "./hooks/dnd/use-annotation-resize-monitor";

import { isCollapsed } from "./hooks/use-collapsed";
import { injectSpacingsState } from "./providers/provide-spacings";
import { provideBarHover } from "./providers/state/provide-bar-hover";
const props = defineProps<{
  tabStore: TabStore;
}>();

const settings = injectSettingsState();
const { collapsedMinWidth, cellHeight, dividerWidth, expandedMinWidth } =
  injectSpacingsState();

const subUnit = provideSubUnit(props.tabStore, settings);
const beatSize = provideBeatSize(props.tabStore);

const barSize = computed(() => props.tabStore.beatsPerBar * beatSize.value);

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

provideBarHover();

const copyState = provideCopyState(selectionState, props.tabStore.guitar);

provideNotePreviewState(selectionState, copyState, props.tabStore.guitar);

const annotationProps = reactiveComputed(() => ({
  store: props.tabStore.annotations,
  subUnit: subUnit.value,
}));

const annotationAddState = provideAnnotationAddState(annotationProps);
const annotationResizeState = provideAnnotationResizeState(annotationProps);
provideAnnotationHoverState();

onMounted(() => {
  useTieAddMonitor(tieAddState);
  useSelectMonitor(selectionState);
  useMoveMonitor(selectionState);
  useBendEditMonitor(bendEditState);
  useAnnotationAddMonitor(annotationAddState);
  useAnnotationResizeMonitor(annotationResizeState);
});

function onLeaveTab() {
  cellHoverEvents.clear();
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
        ? collapsedMinWidth.value
        : expandedMinWidth.value;
      return total + width;
    },
    0,
  );

  const firstBarBuffer = cellHeight.value;
  let total = stacks + dividerWidth.value;
  if (tablineStarts.includes(bar.start)) {
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

const deletingBarStart = ref<number | undefined>(undefined);
</script>

<template>
  <TabToolbar :min-subdivision="1 / props.tabStore.guitar.getMinSpacing()" />
  <div ref="tab" class="tab" @mouseleave="onLeaveTab">
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
