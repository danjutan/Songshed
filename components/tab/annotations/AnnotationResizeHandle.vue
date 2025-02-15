<script setup lang="ts">
import type { Annotation } from "~/model/data";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import { getAnnotationResizeDragData } from "../hooks/dnd/types";

const props = defineProps<{
  row: number;
  annotation: Annotation;
  side: "start" | "end";
  below?: boolean;
}>();

const emit = defineEmits<{
  dragEnd: [];
}>();

const handleRef = ref<HTMLElement>();

watchEffect((cleanup) => {
  if (!handleRef.value) return;

  cleanup(
    draggable({
      element: handleRef.value,
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        disableNativeDragPreview({ nativeSetDragImage });
        preventUnhandled.start();
      },
      getInitialData: () =>
        getAnnotationResizeDragData({
          row: props.row,
          annotation: props.annotation,
          side: props.side,
        }),
      onDrop: () => emit("dragEnd"),
    }),
  );
});
</script>

<template>
  <div
    ref="handleRef"
    class="resize-handle"
    :class="{
      start: side === 'start',
      end: side === 'end',
      below,
    }"
  >
    <!-- <div class="pole" /> -->
    <div class="dragger" />
  </div>
</template>

<style scoped>
.resize-handle {
  z-index: var(--annotation-resize-dragger-z-index);
  position: absolute;
  width: var(--collapsed-min-width);
  height: calc(var(--cell-height) * 1.35);
  display: grid;
  justify-items: center;
  &.below {
    /* & .pole {
      height: calc(var(--cell-height) * 1.35);
    } */
    & .dragger {
      margin-top: calc(var(--cell-height) * 0.8);
    }
  }
}

.resize-handle.start {
  left: calc(var(--collapsed-min-width) / -2);
}

.resize-handle.end {
  right: calc(var(--collapsed-min-width) / -2);
}

.dragger {
  grid-area: 1 / 1;
  width: 4px;
  height: calc(var(--cell-height) * 0.6);
  margin-top: calc(var(--cell-height) * 0.25);
  background-color: var(--annotation-dragger-color);
}

.resize-handle:hover .dragger {
  width: 6px;
  background-color: var(--annotation-dragger-hover-color);
}

/* .pole {
  grid-area: 1 / 1;
  width: var(--pos-line-width);
  height: var(--cell-height);
  background-color: var(--pos-line-color);
} */
</style>
