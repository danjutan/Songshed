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
  <div ref="handleRef" class="resize-handle" :class="side">
    <div class="pole" />
    <div class="dragger" />
  </div>
</template>

<style scoped>
.resize-handle {
  z-index: var(--annotation-resize-dragger-z-index);
  position: absolute;
  width: var(--collapsed-min-width);
  height: 120%;
  display: grid;
  justify-items: center;
}

.resize-handle.start {
  left: calc(var(--collapsed-min-width) / -2);
}

.resize-handle.end {
  right: calc(var(--collapsed-min-width) / -2);
}

.dragger {
  grid-area: 1 / 1;
  align-self: flex-end;
  width: 4px;
  /* height: calc(var(--cell-height) * 0.8); */
  height: 50%;
  background-color: darkgray;
}

.resize-handle:hover .dragger {
  width: 6px;
  background-color: gray;
}

.pole {
  grid-area: 1 / 1;
  width: var(--pos-line-width);
  height: 100%;
  padding-bottom: 4px;
  background-color: var(--pos-line-color);
}
</style>
