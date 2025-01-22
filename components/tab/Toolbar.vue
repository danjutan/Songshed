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
import { Pencil, Plus } from "lucide-vue-next";

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

const hasBends = computed(() => {
  const tablineStart = props.tabline[0].start;
  const tablineEnd = props.tabline[props.tabline.length - 1].end;
  return tieAddState.hasBendsWithin(tablineStart, tablineEnd);
});

const gridTemplateRows = computed(() => {
  const rows = [
    renderState.annotationRows &&
      `repeat(${renderState.annotationRows}, var(--cell-height))`,
    hasBends.value && "var(--cell-height)",
    "var(--context-menu-height)",
  ];
  return rows.filter(Boolean).join(" ");
});
</script>

<template>
  <div class="toolbar">
    <div
      class="new-row-box"
      :class="{
        'with-bends': renderState.annotationRows === 0 && hasBends,
        'last-row': renderState.annotationRows === 0 && !hasBends,
      }"
      @click="emits('newAnnotationRowClicked')"
    >
      <Pencil :size="16" class="pencil" />
      <Plus :size="11" class="plus" />
    </div>

    <template v-for="(bar, i) in tabline" :key="bar.start">
      <AnnotationDragBar
        :start-column="i * (bar.stacks.size + 1) + 1"
        :bar-positions="[...bar.stacks.keys()]"
      />
      <BendTopBar
        v-if="hasBends"
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
  grid-column: 1;
  font-size: var(--cell-height);
  border-right: none;
  width: min-content;
  transform: translateX(25%);
  cursor: pointer;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;

  &.with-bends {
    margin-bottom: -6px;
  }

  &.last-row {
    margin-top: -4px;
  }

  &:hover {
    & svg {
      stroke-width: 2.5;
    }
  }

  & .pencil {
    grid-area: 1 / 1;
    align-self: center;
  }

  & .plus {
    grid-area: 1 / 1;
    align-self: center;
    justify-self: end;
    transform: translateX(20%) translateY(40%);
    /* align-self: center;
    justify-self: start;
    transform: translateX(-25%) translateY(-10%); */
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
  pointer-events: none;
  grid-row: -2 / -1;
  grid-column: 1 / -1;
}
</style>
