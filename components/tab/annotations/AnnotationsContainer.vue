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

const rows = props.annotationStore.getRows();
const numRows = computed(() => rows.length);

function edgeProps(
  start: number,
  end: number,
): { startAtLeft?: number; endAtRight?: number } | false {
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
      ...(end >= currentLineEnd && { endAtRight }),
    };
  }

  const isFirstBar = tabBarBounds.start === currentLineStart;

  if (isFirstBar) {
    const extendsFromPreviousLine =
      startLineStart < currentLineStart && end >= currentLineStart;

    if (extendsFromPreviousLine) {
      return {
        startAtLeft: currentLineStart,
        ...(end >= currentLineEnd && { endAtRight }),
      };
    }
  }

  return false;
}

const annotationRenders = computed<AnnotationRenderProps[]>(() => {
  return rows.flatMap(
    (row) =>
      props.annotationStore
        .getAnnotations(row)
        .map((annotation) => {
          const { start, end } = annotation;
          const props = edgeProps(start, end);
          if (!props) return false;
          return {
            ...props,
            row,
            annotation,
          };
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
          :position="tabBarBounds.start + subUnit * i"
          :first-in-bar="i === 0"
        />
      </template>
    </template>
    <AnnotationRender
      v-for="{ annotation, row, startAtLeft, endAtRight } in annotationRenders"
      :key="annotation.start"
      :annotation="annotation"
      :row="row"
      :start-at-left="startAtLeft"
      :end-at-right="endAtRight"
      @update-title="(text: string) => (annotation.text = text)"
      @delete="annotationStore.deleteAnnotation(row, annotation)"
    />
    <NewAnnotationRender
      v-if="newAnnotationRender"
      :row="newAnnotationRender.row"
      :start="newAnnotationRender.start"
      :end="newAnnotationRender.end"
      :start-at-left="newAnnotationRender.startAtLeft"
      :end-at-right="newAnnotationRender.endAtRight"
    />
  </div>
</template>

<style scoped>
.annotations-container {
  height: calc(v-bind(numRows) * var(--cell-height));
  position: relative;
}
</style>
