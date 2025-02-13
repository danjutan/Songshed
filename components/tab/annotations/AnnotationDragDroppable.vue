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

const props = defineProps<{
  row: number;
  renderRow: number;
  position: number;
  firstInBar: boolean;
}>();

const { dragStart, dragEnd, newAnnotation } = injectAnnotationAddState();
const resizeState = injectAnnotationResizeState();
const hoverState = injectAnnotationHoverState();

const isDragging = computed(
  () =>
    resizeState.draggingFrom.value?.row === props.row ||
    newAnnotation.value?.row === props.row,
);

const left = (coords: { left: number }) => {
  return props.firstInBar
    ? `${coords.left}px`
    : `calc(${coords.left}px + var(--divider-width))`;
};

const width = (coords: { left: number; right: number }) => {
  return props.firstInBar
    ? `calc(${coords.right - coords.left}px + var(--divider-width))`
    : `${coords.right - coords.left}px`;
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
  <OverlayCoords v-slot="{ coords: [coords] }" :positions="[position]">
    <div
      v-if="coords"
      ref="element"
      class="draggable"
      :class="{ dragging: isDragging }"
      :style="{
        left: left(coords),
        width: width(coords),
      }"
      @mousedown="dragStart(row, position)"
      @click="dragEnd()"
      @mouseenter="hoverState.setHovered(row)"
      @mouseleave="hoverState.clearHovered()"
    />
  </OverlayCoords>
</template>

<style scoped>
.draggable {
  z-index: var(--annotation-dragger-z-index);
  position: absolute;
  top: calc(v-bind(renderRow) * var(--cell-height));
  height: var(--cell-height);

  &.dragging {
    height: 400%;
    top: calc(v-bind(renderRow) * var(--cell-height) - 200%);
  }
}
</style>
