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
import { injectAnnotationAddState } from "../providers/state/annotations/provide-annotation-add-state";
import type { Annotation } from "~/model/data";
import type { NewAnnotationRenderProps } from "./NewAnnotationRender.vue";
import NewAnnotationRender from "./NewAnnotationRender.vue";

const props = defineProps<{
  annotationStore: AnnotationStore;
}>();

const annotationAddState = injectAnnotationAddState();
const tabBarBounds = injectTabBarBounds();
const { tablineStarts } = injectStackResizeObserver();
const subUnit = injectSubUnit();

const rows = computed(() => props.annotationStore.getRows());
const numRows = computed(() => rows.value.length);

const renderRow = (row: number) => numRows.value - row - 1;

function edgeProps(
  start: number,
  end: number,
): { startAtLeft?: number; endAtRight?: number } | false {
  const startLineStart =
    tablineStarts.value.findIndex((lineStart) => lineStart > start) - 1;
  const endAtRight = tabBarBounds.tabline.end - subUnit.value;

  const startsInCurrentBar =
    start >= tabBarBounds.start && start < tabBarBounds.end;

  if (startsInCurrentBar) {
    return {
      ...(end >= tabBarBounds.tabline.end && { endAtRight }),
    };
  }

  const isFirstBar = tabBarBounds.start === tabBarBounds.tabline.start;

  if (isFirstBar) {
    const extendsFromPreviousLine =
      startLineStart < tabBarBounds.tabline.start &&
      end >= tabBarBounds.tabline.start;

    if (extendsFromPreviousLine) {
      return {
        startAtLeft: tabBarBounds.tabline.start,
        ...(end >= tabBarBounds.tabline.end && { endAtRight }),
      };
    }
  }

  return false;
}

const annotationRenders = computed<AnnotationRenderProps[]>(() => {
  return rows.value.flatMap(
    (row) =>
      props.annotationStore
        .getAnnotations(row)
        .map((annotation) => {
          const { start, end } = annotation;
          const props = edgeProps(start, end);
          if (props) {
            return {
              ...props,
              row,
              renderRow: renderRow(row),
              annotation,
            };
          }
        })
        .filter(Boolean) as AnnotationRenderProps[],
  );
});

const newAnnotationRender = computed<NewAnnotationRenderProps | false>(() => {
  const newAnnotation = annotationAddState.newAnnotation.value;
  if (newAnnotation) {
    const { row, start, end } = newAnnotation;
    const props = edgeProps(start, end);
    if (props) {
      return {
        ...props,
        row,
        renderRow: renderRow(row),
        start,
        end,
      };
    }
  }
  return false;
});
</script>

<template>
  <div class="annotations-container">
    <template v-for="row in rows" :key="row">
      <template
        v-for="(_, i) in (tabBarBounds.end - tabBarBounds.start) / subUnit"
        :key="i"
      >
        <AnnotationDragDroppable
          :row="row"
          :render-row="renderRow(row)"
          :position="tabBarBounds.start + subUnit * i"
          :first-in-bar="i === 0"
        />
      </template>
    </template>
    <AnnotationRender
      v-for="renderProps in annotationRenders"
      :key="renderProps.annotation.start"
      v-bind="renderProps"
      @update-text="(text: string) => (renderProps.annotation.text = text)"
      @delete="
        annotationStore.deleteAnnotation(
          renderProps.row,
          renderProps.annotation,
        )
      "
    />
    <NewAnnotationRender
      v-if="newAnnotationRender"
      v-bind="newAnnotationRender"
    />
  </div>
</template>

<style scoped>
.annotations-container {
  height: calc(v-bind(numRows) * var(--cell-height));
  position: relative;
}
</style>
