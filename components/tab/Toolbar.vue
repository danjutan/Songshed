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
import { Plus } from "lucide-vue-next";

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
      <Plus :size="20" class="plus" />
      <div class="diagonal" />
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
  grid-row: 1;
  grid-column: 1 / 3;
  font-size: var(--cell-height);
  width: calc(var(--cell-height) / 2);
  border-right: none;

  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  grid-template-columns: 1fr;

  cursor: pointer;

  &:hover {
    font-weight: bold;
    background-color: lightcoral;
    color: white;
  }
}

.plus {
  grid-row: 1;
  grid-column: 1;
  transform: translateX(calc(-1 * var(--cell-height) / 4));
}

.diagonal {
  grid-row: 2;
  grid-column: 1;
  width: calc(var(--cell-height) / 2);
  /* height: calc(var(--cell-height) / 2); */
  background: linear-gradient(
    to top left,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0) calc(50% - 0.8px),
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 0) calc(50% + 0.8px),
    rgba(0, 0, 0, 0) 100%
  );
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
