<script lang="ts" setup>
import type { AnnotationStore } from "~/model/stores";
import { injectTabBarBounds } from "~/components/editor/tab/bars/providers/provide-bar-bounds";
import { injectSubUnitFunctions } from "~/components/editor/tab/providers/provide-subunit";
import AnnotationDragDroppable from "~/components/editor/tab/annotations/AnnotationDragDroppable.vue";
import AnnotationRender, {
  type AnnotationRenderProps,
} from "~/components/editor/tab/annotations/AnnotationRender.vue";
import { injectStackResizeObserver } from "~/components/editor/tab/providers/events/provide-resize-observer";
import { injectAnnotationAddState } from "~/components/editor/tab/providers/state/provide-annotation-add-state";
import type { NewAnnotationRenderProps } from "~/components/editor/tab/annotations/NewAnnotationRender.vue";
import NewAnnotationRender from "~/components/editor/tab/annotations/NewAnnotationRender.vue";
import { useCoordsDirective } from "~/components/editor/tab/hooks/use-coords-directive";

const props = defineProps<{
  annotationStore: AnnotationStore;
}>();

const annotationAddState = injectAnnotationAddState();
const tabBarBounds = injectTabBarBounds();
const { tablineStarts } = injectStackResizeObserver();
const { getSubUnitForPosition, getPreviousPosition } = injectSubUnitFunctions();

const rows = computed(() => props.annotationStore.getRows());
const numRows = computed(() => rows.value.length);

const renderRow = (row: number) => numRows.value - row - 1;

const isFirstBar = computed(
  () => tabBarBounds.start === tabBarBounds.tabline.start,
);

function edgeProps(
  start: number,
  end: number,
): { startAtLeft?: number; endAtRight?: number } | false {
  if (tablineStarts.length === 0) {
    return false;
  }
  const startLineStart = tablineStarts.findLast(
    (lineStart) => start >= lineStart,
  )!;

  const endAtRight = getPreviousPosition(tabBarBounds.tabline.end);

  const startsInCurrentBar =
    start >= tabBarBounds.start && start < tabBarBounds.end;

  if (startsInCurrentBar) {
    return {
      ...(end >= tabBarBounds.tabline.end && { endAtRight }),
    };
  }

  if (isFirstBar.value) {
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

// Calculate droppable positions for each row
const droppablePositions = computed(() => {
  const positions: number[] = [];
  let currentPosition = tabBarBounds.start;

  while (currentPosition < tabBarBounds.end) {
    positions.push(currentPosition);
    currentPosition += getSubUnitForPosition(currentPosition);
  }

  return positions;
});
</script>

<template>
  <div class="annotations-container">
    <template v-for="row in rows" :key="row">
      <template v-for="(position, i) in droppablePositions" :key="i">
        <AnnotationDragDroppable
          :row="row"
          :render-row="renderRow(row)"
          :position="position"
          :first-in-bar="i === 0"
        />
      </template>
      <div
        class="line"
        :style="{
          top: `calc(${renderRow(row)} * var(--cell-height))`,
        }"
      />
    </template>
    <AnnotationRender
      v-for="(renderProps, i) in annotationRenders"
      :key="i"
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
    <div class="last line" />
  </div>
</template>

<style scoped>
.annotations-container {
  height: calc(v-bind(numRows) * var(--cell-height));
  position: relative;
}

.line {
  background: var(--annotation-row-line-color);
  position: absolute;
  left: 0;
  width: 100%;
  height: 1px;
  &.last {
    background: var(--annotation-row-line-last-color);
    height: 2px;
    top: calc(v-bind(numRows) * var(--cell-height));
  }
}


</style>
