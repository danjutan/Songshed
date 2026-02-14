<script setup lang="ts">
import TabBar from "~/components/editor/tab/bars/TabBar.vue";
import TabToolbar from "~/components/editor/tab/TabToolbar.vue";
import BarDivider from "~/components/editor/tab/bars/BarDivider.vue";
import TimeSignatureWidget from "~/components/editor/tab/bars/guitar/stack/widgets/TimeSignatureWidget.vue";
import TuningWidget from "~/components/editor/tab/bars/guitar/stack/widgets/TuningWidget.vue";
import NewRowButton from "~/components/editor/tab/annotations/NewRowButton.vue";

import { Plus } from "lucide-vue-next";

import type { TabStore } from "~/model/stores";

import { provideSelectionState } from "~/components/editor/tab/providers/state/provide-selection-state";
import { provideEditingState } from "~/components/editor/tab/providers/state/provide-editing-state";
import { provideCellHoverEvents } from "~/components/editor/tab/providers/events/provide-cell-hover-events";
import { provideTieAddState } from "~/components/editor/tab/providers/state/provide-tie-add-state";
import { provideBendEditState } from "~/components/editor/tab/providers/state/provide-bend-edit-state";
import { provideStackResizeObserver } from "~/components/editor/tab/providers/events/provide-resize-observer";
import { provideAnnotationAddState } from "~/components/editor/tab/providers/state/provide-annotation-add-state";
import { provideNotePreviewState } from "~/components/editor/tab/providers/state/provide-note-preview-state";
import {
  provideSubUnit,
  injectSubUnitFunctions,
} from "~/components/editor/tab/providers/provide-subunit";
import {
  provideBarManagement,
  type Bar,
} from "~/components/editor/tab/providers/state/provide-bar-management";
import { provideTimeSignature } from "~/components/editor/tab/providers/provide-time-signature";
import { provideCopyState } from "~/components/editor/tab/providers/state/provide-copy-state";
import { provideAnnotationResizeState } from "~/components/editor/tab/providers/state/provide-annotation-resize-state";
import { provideAnnotationHoverState } from "~/components/editor/tab/providers/state/provide-annotation-hover-state";

import { injectSettingsState } from "~/components/editor/providers/provide-settings-state";

import { useTieAddMonitor } from "~/components/editor/tab/hooks/dnd/use-tie-add-monitor";
import { useSelectMonitor } from "~/components/editor/tab/hooks/dnd/use-select-monitor";
import { useMoveMonitor } from "~/components/editor/tab/hooks/dnd/use-move-monitor";
import { useBendEditMonitor } from "~/components/editor/tab/hooks/dnd/use-bend-edit-monitor";
import { useAnnotationAddMonitor } from "~/components/editor/tab/hooks/dnd/use-annotation-add-monitor";
import { useAnnotationResizeMonitor } from "~/components/editor/tab/hooks/dnd/use-annotation-resize-monitor";
import { useBarDragMonitor } from "~/components/editor/tab/hooks/dnd/use-bar-drag-monitor";

import { isCollapsed } from "~/components/editor/tab/hooks/use-collapsed";
import { injectSpacingsState } from "~/components/editor/providers/provide-spacings";
import { provideBarHoverState } from "~/components/editor/tab/providers/state/provide-bar-hover-state";
const props = defineProps<{
  tabStore: TabStore;
}>();

const settings = injectSettingsState();
const { collapsedMinWidth, cellHeight, expandedMinWidth } =
  injectSpacingsState();

const { getTimeSignatureAt } = provideTimeSignature(props.tabStore);

const { getSubUnitForPosition, getPreviousPosition } = provideSubUnit(
  props.tabStore,
  settings,
  getTimeSignatureAt,
);

const barManagement = provideBarManagement(
  props.tabStore,
  getSubUnitForPosition,
  getTimeSignatureAt,
);

const { tablineStarts } = provideStackResizeObserver();

const cellHoverEvents = provideCellHoverEvents();
const selectionState = provideSelectionState(
  reactiveComputed(() => ({
    guitar: props.tabStore.guitar,
    getBarIndexAt: barManagement.getBarIndexAt,
    subunitFunctions: { getSubUnitForPosition, getPreviousPosition },
  })),
);
const editingState = provideEditingState();

const tieAddState = provideTieAddState(
  reactiveComputed(() => ({
    cellHoverEvents,
    store: props.tabStore.guitar,
    getSubUnitForPosition,
  })),
);

const bendEditState = provideBendEditState(
  reactiveComputed(() => ({
    cellHoverEvents,
    tieAddState,
    tieStore: props.tabStore.guitar?.ties,
  })),
);

provideBarHoverState();

const copyState = provideCopyState(selectionState, props.tabStore.guitar);

provideNotePreviewState(selectionState, copyState, props.tabStore.guitar);

const annotationProps = reactiveComputed(() => ({
  store: props.tabStore.annotations,
  getSubUnitForPosition,
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
  useBarDragMonitor(barManagement);
});

function onLeaveTab() {
  cellHoverEvents.clear();
  editingState.blurEditing();
  if (selectionState.isEmpty()) {
    selectionState.clearSelections();
  }
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
        position % getTimeSignatureAt(position).beatSize === 0,
      )
        ? collapsedMinWidth.value
        : expandedMinWidth.value;
      return total + width;
    },
    0,
  );

  const firstBarBuffer = cellHeight.value;
  let total = stacks;
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

const mightDeleteBarStart = ref<number | undefined>(undefined);
const mightMoveBarStart = ref<number | undefined>(undefined);
const movingBarStart = ref<number | undefined>(undefined);
const moveTargetBarStart = ref<number | undefined>(undefined);
</script>

<template>
  <div v-if="barManagement" ref="tab" class="tab" @mouseleave="onLeaveTab">
    <template v-for="(bar, i) in barManagement.bars" :key="bar.start">
      <div v-if="tabStore.lineBreaks.has(bar.start)" class="line-break" />

      <div
        class="bar-group"
        :style="{
          flex: barFlexGrow[i] ? `${barFlexGrow[i]} 0 0px` : undefined,
        }"
      >
        <NewRowButton
          v-if="tablineStarts.includes(bar.start)"
          class="new-row-button"
          @click="tabStore.annotations.createNextRow()"
        />
        <BarDivider
          class="tab-divider"
          :start-of-line="tablineStarts.includes(bar.start)"
          :bar-start="bar.start"
          :joinable="tabStore.lineBreaks.has(bar.start)"
          @resize="(diffX: number) => onResize(i, diffX)"
          @delete-hover-start="mightDeleteBarStart = bar.start"
          @delete-hover-end="mightDeleteBarStart = undefined"
          @end-drag="endDrag(i)"
          @move-hover-start="mightMoveBarStart = bar.start"
          @move-hover-end="mightMoveBarStart = undefined"
          @move-drag-start="movingBarStart = bar.start"
          @move-drag-end="movingBarStart = moveTargetBarStart = undefined"
          @inserting-into="
            (position: number) => (moveTargetBarStart = position)
          "
        />

        <TabBar
          ref="tabBars"
          :bar="bar"
          :annotation-store="props.tabStore.annotations"
          :guitar-store="props.tabStore.guitar"
          :highlight="
            (mightDeleteBarStart === bar.start && 'might-delete') ||
            (mightMoveBarStart === bar.start && 'might-move') ||
            (movingBarStart === bar.start && 'moving') ||
            (moveTargetBarStart === bar.start && 'move-target')
          "
        >
          <template
            v-if="i === 0 || tabStore.timeChanges.has(bar.start)"
            #widget
          >
            <template v-if="i === 0">
              <TuningWidget
                :tuning="tabStore.guitar.tuning"
                :update-tuning="tabStore.updateTuning.guitar"
              />
            </template>
            <template v-if="tabStore.timeChanges.has(bar.start)">
              <TimeSignatureWidget
                v-model:beats="tabStore.timeChanges.get(bar.start)!.beatsPerBar"
                v-model:beat-value="
                  tabStore.timeChanges.get(bar.start)!.beatSize
                "
                :first="bar.start === 0"
                @delete="tabStore.timeChanges.delete(bar.start)"
              />
            </template>
          </template>
        </TabBar>

        <div
          v-if="i === barManagement.bars.length - 1"
          class="new-button"
          @click="barManagement.newBarClick"
        >
          <Plus />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tab {
  user-select: none;
  display: flex;
  flex-wrap: wrap;
  row-gap: calc(var(--cell-height) / 2);
}

.new-row-button {
  margin-right: var(--divider-width);
}

.line-break {
  width: 100%;
  height: 0px;
}

.bar-group {
  max-width: max-content;
  display: flex;
  align-items: stretch;
}

.bar-group > .new-row-button {
  align-self: flex-start;
  margin-top: 1px;
}

.tab-divider {
  align-self: stretch;
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
