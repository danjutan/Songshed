<script setup lang="ts">
import type { Bar } from "./Tab.vue";
import type { TabStore } from "~/model/stores";
import Toolbar from "./Toolbar.vue";
import Divider from "./BarDivider.vue";
import GuitarTabline from "./guitar/GuitarTabline.vue";
import { useTemplateColumns } from "./hooks/use-tabline-columns";
import { injectStackResizeObserver } from "./providers/events/provide-resize-observer";
import { injectSettingsState } from "./providers/state/provide-settings-state";
import { injectAnnotationRenderState } from "./providers/state/annotations/provide-annotation-render-state";
import { Plus } from "lucide-vue-next";

const props = defineProps<{
  tabline: Bar[];
  tablineIndex: number;
  isLastTabline: boolean;
  tabStore: TabStore;
  columnsPerBar: number;
}>();

const emit = defineEmits<{
  "new-bar-click": [];
}>();

const resizeObserver = injectStackResizeObserver();
const settings = injectSettingsState();
const annotationRenders = injectAnnotationRenderState();

const templateColumns = useTemplateColumns(
  reactiveComputed(() => ({
    tabline: props.tabline,
    beatSize: props.tabStore.beatSize,
    resizeObserver,
    settings,
  })),
);

const overlayedBarStart = ref<number | undefined>();

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

onMounted(() => {
  console.log("mounted tabline", props.tablineIndex);
});
</script>

<template>
  <div
    class="tab-line"
    :style="{
      gridTemplateColumns: templateColumns.gridTemplateColumns.value,
    }"
  >
    <Toolbar
      :tabline="tabline"
      :tabline-index="tablineIndex"
      @new-annotation-row-clicked="tabStore.annotations.createNextRow"
      @delete-annotation-clicked="
        (row, annotation) =>
          tabStore.annotations.deleteAnnotation(row, annotation)
      "
    />
    <GuitarTabline
      v-if="tabStore.guitar"
      :tabline-index="tablineIndex"
      :guitar-store="tabStore.guitar"
      :bars="tabline"
      :start-row="annotationRenders.annotationRows + 1"
      :beat-size="tabStore.beatSize"
      :columns-per-bar="columnsPerBar"
    >
      <template #divider="{ bar, barIndex, numStrings }">
        <Divider
          :bar-index="barIndex"
          :joinable="tabStore.lineBreaks.has(bar.start)"
          :style="{
            gridColumn: barIndex * (columnsPerBar + 1) + 1,
            gridRow: `2 / span ${numStrings}`,
          }"
          @start-drag="templateColumns.resetDrag"
          @resize="
            (diffX: number) => {
              const gridWidth = $el.getBoundingClientRect().width;
              templateColumns.handleResize(barIndex - 1, diffX, gridWidth);
            }
          "
          @end-drag="templateColumns.resetDrag"
          @insert="insertBar(bar.start)"
          @delete="deleteBar(bar.start)"
          @join="joinBreak(bar.start)"
          @break="insertBreak(bar.start)"
          @delete-hover-start="overlayedBarStart = bar.start"
          @delete-hover-end="overlayedBarStart = undefined"
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

        <div
          v-if="isLastTabline && barIndex === tabline.length - 1"
          class="endcap"
          :style="{
            gridColumn: tabline.length * (columnsPerBar + 1) + 1,
            gridRow: `2 / span ${numStrings}`,
          }"
          @click="$emit('new-bar-click')"
        >
          <div class="new-button"><Plus color="white" /></div>
        </div>
      </template>
    </GuitarTabline>
  </div>
</template>

<style scoped>
.tab-line {
  display: grid;
  grid-template-rows: max-content;
  grid-auto-rows: var(--cell-height);
}

.endcap {
  height: 100%;
  background: black;
  width: var(--note-font-size);
}
.endcap .new-button {
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
  z-index: var(--bar-overlay-z-index);
  opacity: var(--select-alpha);
  background-color: var(--delete-color);
}
</style>
