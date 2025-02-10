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

const props = defineProps<{
  row: number;
  renderRow: number;
  position: number;
  firstInBar: boolean;
}>();

const { dragStart, dragEnd } = injectAnnotationAddState();
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

watchEffect((cleanup) => {
  if (!element.value) {
    return;
  }
  const data = getAnnotationDragData({
    row: props.row,
    position: props.position,
  });
  cleanup(
    combine(
      dropTargetForElements({
        element: element.value,
        getData: () => data,
      }),
      draggable({
        element: element.value,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          disableNativeDragPreview({ nativeSetDragImage });
          preventUnhandled.start();
        },
        getInitialData: () => data,
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
      :style="{
        left: left(coords),
        width: width(coords),
      }"
      @mousedown="dragStart(row, position)"
      @click="dragEnd()"
    />
  </OverlayCoords>
</template>

<style scoped>
.draggable {
  /* border: 1px solid black; */
  z-index: var(--annotation-dragger-z-index);
  position: absolute;
  top: calc(v-bind(renderRow) * var(--cell-height));
  height: var(--cell-height);
}
</style>
