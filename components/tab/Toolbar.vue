<script lang="ts" setup>
import type { TabStore } from "~/model/stores";
import { injectAnnotationAddState } from "./providers/state/annotations/provide-annotation-add-state";
import { injectAnnotationRenderState } from "./providers/state/annotations/provide-annotation-render-state";
import type { Bar } from "./Tab.vue";
import type { Annotation } from "~/model/data";
import AnnotationDragBar from "./annotations/AnnotationDragBar.vue";
import AnnotationRender from "./annotations/AnnotationRender.vue";
import { injectTieAddState } from "./providers/state/provide-tie-add-state";
import BendTopBar from "./guitar/overlay/bend/BendTopBar.vue";

const props = defineProps<{
  tabline: Bar[];
  tabLineIndex: number;
}>();

const emits = defineEmits<{
  newAnnotationRowClicked: [];
  deleteAnnotationClicked: [row: number, data: Annotation];
}>();

const tieAddState = injectTieAddState();
const renderState = injectAnnotationRenderState();

const gridTemplateRows = computed(() => {
  const rows = [
    renderState.annotationRows &&
      `repeat(${renderState.annotationRows}, var(--cell-height))`,
    tieAddState.hasTiesOrTieing && "var(--cell-height)",
    "var(--context-menu-height)",
  ];
  return rows.filter(Boolean).join(" ");
});
</script>

<template>
  <div class="toolbar">
    <div class="new-row-box" @click="emits('newAnnotationRowClicked')">
      <!-- <span>+</span> -->
    </div>

    <template v-for="(bar, i) in tabline" :key="bar.start">
      <AnnotationDragBar
        :start-column="i * (bar.stacks.size + 1) + 1"
        :bar-positions="[...bar.stacks.keys()]"
      />
      <BendTopBar
        v-if="tieAddState.hasTiesOrTieing"
        :start-column="i * (bar.stacks.size + 1) + 1"
        :bar-positions="[...bar.stacks.keys()]"
      />
    </template>

    <AnnotationRender
      v-for="render in renderState.annotationRenders.get(tabLineIndex)"
      :key="render.startColumn"
      v-bind="render"
      @update-title="(title: string) => (render.annotation!.title = title)"
      @delete="
        // TODO: clarify / uncomplicate the difference between rowIndex (row in store) and row (grid row)
        emits('deleteAnnotationClicked', render.row - 1, render.annotation!)
      "
    />

    <div class="context-row" />
  </div>
</template>

<style scoped>
.new-row-box {
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

.toolbar {
  grid-column: 1 / -1;
  grid-row: 1;
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: v-bind(gridTemplateRows);
}

.context-row {
  grid-row: -2 / -1;
  grid-column: 1 / -1;
}
</style>
