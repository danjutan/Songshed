<script setup lang="ts">
import type { Bar } from "./Tab.vue";
import type { TabStore } from "~/model/stores";
import GuitarTabLine from "./guitar/GuitarTabLine.vue";
import Toolbar from "./Toolbar.vue";
import ResizeDragger from "./ResizeDragger.vue";
import { useTemplateColumns } from "./hooks/use-tabline-columns";
import { injectStackResizeObserver } from "./providers/events/provide-resize-observer";
import { injectSettingsState } from "./providers/state/provide-settings-state";
import { injectAnnotationRenderState } from "./providers/state/annotations/provide-annotation-render-state";

const props = defineProps<{
  tabLine: Bar[];
  tabLineIndex: number;
  tabStore: TabStore;
  columnsPerBar: number;
  subUnit: number;
}>();

const emit = defineEmits<{
  "new-bar-click": [];
}>();

const resizeObserver = injectStackResizeObserver();
const settings = injectSettingsState();
const annotationRenders = injectAnnotationRenderState();
const overlayedBarStart = ref<number | undefined>();

// Move tabline hook into component
const tablineHook = useTemplateColumns(
  reactiveComputed(() => ({
    tabline: props.tabLine,
    beatSize: props.tabStore.beatSize,
    resizeObserver,
    settings,
  })),
);

function deleteBar(start: number) {
  props.tabStore.guitar!.deleteStacks(
    start,
    start + props.tabStore.beatsPerBar * props.tabStore.beatSize,
  );
  props.tabStore.guitar!.shiftFrom(
    start,
    -props.tabStore.beatsPerBar * props.tabStore.beatSize,
  );
  overlayedBarStart.value = undefined;
}

function insertBar(start: number) {
  props.tabStore.guitar!.shiftFrom(
    start,
    props.tabStore.beatsPerBar * props.tabStore.beatSize,
  );
}

function insertBreak(start: number) {
  props.tabStore.lineBreaks.add(start);
}

function joinBreak(start: number) {
  props.tabStore.lineBreaks.delete(start);
}
</script>

<template>
  <div
    class="tab-line"
    :style="{
      gridTemplateColumns: tablineHook.gridTemplateColumns.value,
    }"
  >
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
        :tab-line-index="tabLineIndex"
        :guitar-store="tabStore.guitar"
        :bars="tabLine"
        :start-row="annotationRenders.annotationRows + 1"
        :beat-size="tabStore.beatSize"
        :sub-unit="subUnit"
        :columns-per-bar="columnsPerBar"
      >
        <template #divider="{ bar, barIndex, numStrings }">
          <ResizeDragger
            :style="{
              gridColumn: barIndex * (columnsPerBar + 1) + 1,
              gridRow: `2 / span ${numStrings}`,
            }"
            @start-drag="tablineHook.resetDrag"
            @resize="
              (diffX: number) => {
                const gridWidth = $el.getBoundingClientRect().width;
                tablineHook.handleResize(barIndex - 1, diffX, gridWidth);
              }
            "
            @end-drag="tablineHook.resetDrag"
          />

          <div
            v-if="overlayedBarStart === bar.start"
            class="bar-overlay"
            :style="{
              gridColumnStart: barIndex * (columnsPerBar + 1) + 2,
              gridColumnEnd: (barIndex + 1) * (columnsPerBar + 1) + 2,
              gridRow: `1 / span ${numStrings + 1}`,
            }"
          />

          <!-- <div
            v-if="
              tabLineIndex === tabStore.lineBreaks.size &&
              barIndex === tabLine.length - 1
            "
            class="divider"
            :style="{
              gridColumn: tabLine.length * (columnsPerBar + 1) + 1,
              gridRow: `2 / span ${numStrings}`,
            }"
            @click="$emit('new-bar-click')"
          >
            <div class="new-button">+</div>
          </div> -->
        </template>
      </GuitarTabLine>
    </template>
  </div>
</template>

<style scoped>
.tab-line {
  display: grid;
  grid-template-rows: max-content;
  grid-auto-rows: var(--cell-height);
}

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
