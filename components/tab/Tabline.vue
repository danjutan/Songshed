<script setup lang="ts">
import type { TabStore } from "~/model/stores";
import Toolbar from "./Toolbar.vue";
import Divider from "./BarDivider.vue";
import GuitarTabline from "~/components/tab/bars/guitar/GuitarTabLine.vue";
import { injectStackResizeObserver } from "./providers/events/provide-resize-observer";
import { injectSettingsState } from "./providers/state/provide-settings-state";
import { injectAnnotationRenderState } from "./providers/state/annotations/provide-annotation-render-state";
import { Plus } from "lucide-vue-next";
import type { Bar } from "./providers/state/provide-bar-management";

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

const tablineRef = useTemplateRef("tablineRef");

const barFrs = ref<number[]>(
  Array.from({ length: props.tabline.length }, () => 1 / props.tabline.length),
);

let lastDiffX = 0;

// Update bar sizes when number of bars changes
watch(
  () => props.tabline.length,
  () => {
    barFrs.value = Array.from(
      { length: props.tabline.length },
      () => 1 / props.tabline.length,
    );
  },
);

const gridTemplateColumns = computed(() => {
  const barTemplates = barFrs.value
    .map((size) => `${size}fr`)
    .join(" var(--divider-width) ");
  return `var(--note-font-size) ${barTemplates} var(--note-font-size)`;
});

function handleDividerDrag(barIndex: number, diffX: number) {
  if (!tablineRef.value) return;

  const totalWidth = tablineRef.value.getBoundingClientRect().width;
  const deltaX = diffX - lastDiffX;
  lastDiffX = diffX;

  const deltaFraction = deltaX / totalWidth;

  // Ensure minimum size (e.g., 0.1 or 10% of total width)
  const MIN_SIZE = 0.1;
  const newLeftSize = barFrs.value[barIndex - 1] + deltaFraction;
  const newRightSize = barFrs.value[barIndex] - deltaFraction;

  if (newLeftSize >= MIN_SIZE && newRightSize >= MIN_SIZE) {
    barFrs.value[barIndex - 1] = newLeftSize;
    barFrs.value[barIndex] = newRightSize;
  }
}

function resetDrag() {
  lastDiffX = 0;
}

const overlayedBarStart = ref<number | undefined>();

const numBars = computed(() => props.tabline.length);

onMounted(() => {
  console.log("mounted tabline", props.tablineIndex);
});
</script>

<template>
  <div
    ref="tablineRef"
    class="tab-line"
    :style="{ 'grid-template-columns': gridTemplateColumns }"
  >
    <Toolbar
      :tabline="tabline"
      :tabline-index="tablineIndex"
      @new-annotation-row-clicked="tabStore.annotations.createNextRow"
      @delete-annotation-clicked="tabStore.annotations.deleteAnnotation"
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
      <template #divider="{ bar, barIndex }">
        <Divider
          :bar-index="barIndex"
          :bar-start="bar.start"
          :joinable="tabStore.lineBreaks.has(bar.start)"
          :style="{
            gridColumn: barIndex * 2 + 1,
            gridRow: `2`,
          }"
          @start-drag="resetDrag"
          @resize="(diffX: number) => handleDividerDrag(barIndex, diffX)"
          @end-drag="resetDrag"
          @delete-hover-start="overlayedBarStart = bar.start"
          @delete-hover-end="overlayedBarStart = undefined"
        />
      </template>
    </GuitarTabline>
    <div
      v-if="isLastTabline"
      class="endcap"
      :style="{
        gridColumn: tabline.length * 2 + 1,
        gridRow: `2`,
      }"
      @click="$emit('new-bar-click')"
    >
      <div class="new-button"><Plus color="white" /></div>
    </div>
  </div>
</template>

<style scoped>
.tab-line {
  display: grid;
  /* grid-template-rows: max-content max-content; */
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
