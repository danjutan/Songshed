<script lang="ts" setup>
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import {
  getAnnotationDragData,
  getNoteInputDropData,
} from "../hooks/dnd/types";
import OverlayCoords from "~/components/tab/bars/OverlayCoords.vue";
import { injectAnnotationAddState } from "../providers/state/provide-annotation-add-state";
import { injectAnnotationResizeState } from "../providers/state/provide-annotation-resize-state";
import { injectAnnotationHoverState } from "../providers/state/provide-annotation-hover-state";
import { useCoordsDirective } from "../hooks/use-coords-directive";
import { injectSpacingsState } from "../providers/provide-spacings";
import { injectTabBarBounds } from "../bars/provide-bar-bounds";

const props = defineProps<{
  row: number;
  renderRow: number;
  position: number;
  firstInBar: boolean;
}>();

const { dragStart, dragEnd, newAnnotation } = injectAnnotationAddState();
const resizeState = injectAnnotationResizeState();
const hoverState = injectAnnotationHoverState();
const vCoords = useCoordsDirective({
  position: props.position,
});

const isDragging = computed(
  () =>
    resizeState.draggingFrom.value?.row === props.row ||
    newAnnotation.value?.row === props.row,
);

const left = (coords: { left: number }) => {
  return props.firstInBar ? 0 : coords.left;
};

const width = (coords: { left: number; right: number }) => {
  return props.firstInBar ? coords.right : coords.right - coords.left;
};

const element = useTemplateRef("element");

// TODO: when a drag starts on a row (whether a new annotation drag or a resize drag),
// all of the droppables on the row grow in height

watchEffect((cleanup) => {
  if (!element.value) {
    return;
  }
  const getData = () =>
    getAnnotationDragData({
      row: props.row,
      position: props.position,
    });
  cleanup(
    combine(
      dropTargetForElements({
        element: element.value,
        getData,
      }),
      draggable({
        element: element.value,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          disableNativeDragPreview({ nativeSetDragImage });
          preventUnhandled.start();
        },
        getInitialData: getData,
      }),
    ),
  );
});
</script>

<template>
  <div
    ref="element"
    v-coords:left="({ position }) => left(position)"
    v-coords:width="({ position }) => width(position)"
    class="draggable"
    :class="{ dragging: isDragging }"
    @mousedown="dragStart(row, position)"
    @click="dragEnd()"
    @mouseenter="hoverState.setHovered(row)"
    @mouseleave="hoverState.clearHovered()"
  />
</template>

<style scoped>
.draggable {
  z-index: var(--annotation-dragger-z-index);
  position: absolute;
  top: calc(v-bind(renderRow) * var(--cell-height));
  height: var(--cell-height);
  cursor: text;

  &:hover:not(.dragging) {
    background-color: var(--p-button-secondary-hover-background);
  }

  &.dragging {
    height: 400%;
    top: calc(v-bind(renderRow) * var(--cell-height) - 200%);
  }
}
</style>
