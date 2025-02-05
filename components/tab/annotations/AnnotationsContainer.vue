<script lang="ts" setup>
import type { AnnotationStore } from "~/model/stores";
import { injectTabBarBounds } from "../bars/provide-bar-bounds";
import { injectSubUnit } from "../providers/provide-subunit";
import AnnotationDragDroppable from "./AnnotationDragDroppable.vue";
import AnnotationRender, {
  type AnnotationRenderProps,
} from "./AnnotationRender.vue";
import { injectStackResizeObserver } from "../providers/events/provide-resize-observer";
import { injectBarManagement } from "../providers/state/provide-bar-management";
const props = defineProps<{
  annotationStore: AnnotationStore;
}>();

const tabBarBounds = injectTabBarBounds();
const { tablineStarts } = injectStackResizeObserver();
const subUnit = injectSubUnit();

const rows = props.annotationStore.getRows();
const numRows = computed(() => rows.length);

const annotations = computed<
  Record<number, Exclude<AnnotationRenderProps, "row">[]>
>(() => {
  return Object.fromEntries(
    rows.map((row) => [
      row,
      props.annotationStore
        .getAnnotations(row)
        .map((annotation) => {
          const start = annotation.start;
          const end = annotation.end ?? start;

          const startLineStart =
            tablineStarts.value.findIndex((lineStart) => lineStart > start) - 1;
          const currentLineIndex =
            tablineStarts.value.findIndex(
              (lineStart) => lineStart > tabBarBounds.start,
            ) - 1;
          const currentLineStart = tablineStarts.value[currentLineIndex];
          const currentLineEnd = tablineStarts.value[currentLineIndex + 1];
          const endAtRight = currentLineEnd - subUnit.value;

          const startsInCurrentBar =
            start >= tabBarBounds.start && start < tabBarBounds.end;

          if (startsInCurrentBar) {
            return {
              annotation,
              ...(end >= currentLineEnd && { endAtRight }),
            };
          }

          const isFirstBar = tabBarBounds.start === currentLineStart;

          if (isFirstBar) {
            const extendsFromPreviousLine =
              startLineStart < currentLineStart && end >= currentLineStart;

            if (extendsFromPreviousLine) {
              return {
                annotation,
                startAtLeft: currentLineStart,
                ...(end >= currentLineEnd && { endAtRight }),
              };
            }
          }

          return false;
        })
        .filter(Boolean) as AnnotationRenderProps[],
    ]),
  );
});
</script>

<template>
  <div class="annotations-container">
    <template v-for="row in rows" :key="row">
      <AnnotationDragDroppable
        v-for="(_, i) in (tabBarBounds.end - tabBarBounds.start) / subUnit"
        :key="i"
        :row="row"
        :position="tabBarBounds.start + subUnit * i"
        :first-in-bar="i === 0"
      />
      <AnnotationRender
        v-for="renderProps in annotations[row]"
        :key="renderProps.annotation.start"
        :annotation="renderProps.annotation"
        :row="row"
        :start-at-left="renderProps.startAtLeft"
        :end-at-right="renderProps.endAtRight"
      />
    </template>
  </div>
</template>

<style scoped>
.annotations-container {
  height: calc(v-bind(numRows) * var(--cell-height));
  position: relative;
}
</style>
