<script setup lang="ts">
import type { Annotation } from "~/model/data";
import { useTemplateRef } from "vue";
import OverlayCoords from "../bars/OverlayCoords.vue";
import { injectBarManagement } from "../providers/state/provide-bar-management";
import { type StackCoords } from "../providers/events/provide-resize-observer";
import { X } from "lucide-vue-next";

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import { getAnnotationResizeDragData } from "../hooks/dnd/types";
import { injectAnnotationResizeState } from "../providers/state/provide-annotation-resize-state";

export interface AnnotationRenderProps {
  row: number;
  renderRow: number;
  startAtLeft?: number;
  endAtRight?: number;
  annotation: Annotation;

  creating?: boolean;
}

const props = defineProps<AnnotationRenderProps>();

const emit = defineEmits<{
  updateText: [string];
  delete: [];
}>();

const barManagement = injectBarManagement();
const resizeState = injectAnnotationResizeState();

const start = computed(() => props.startAtLeft ?? props.annotation.start);
const end = computed(() => props.endAtRight ?? props.annotation.end);

const isDragging = computed(() =>
  resizeState.isDragging(props.row, props.annotation),
);

const pointerEvents = computed(() =>
  props.annotation && !isDragging.value ? "auto" : "none",
);

const textEl = useTemplateRef("text");

function textInput() {
  if (props.annotation) {
    const value = textEl.value!.innerText;
    emit("updateText", value);
  }
}

function textFocus() {
  window.getSelection()?.selectAllChildren(textEl.value!);
  textEl.value!.scrollTo({ left: 0 });
}

watch(
  () => props.annotation,
  (data) => {
    if (data) {
      setTimeout(() => textEl.value!.focus(), 1);
    }
  },
);

// TODO: reconsider given that the first column could be a different bar
const startsInFirstColumn = computed(() => {
  return barManagement.bars.some((bar) => bar.start === start.value);
});

// const endsInFirstColumn = computed(() => {
//   return barManagement.bars.some(
//     (bar) => bar.start === (props.annotation.end ?? props.annotation.start),
//   );
// });

const left = (startCoords: StackCoords) => {
  if (startsInFirstColumn.value) {
    return `${startCoords.left}px`;
  }
  return `calc(var(--divider-width) + ${startCoords.left}px)`;
};

const width = (startCoords: StackCoords, endCoords: StackCoords) => {
  if (startsInFirstColumn.value) {
    return `calc(var(--divider-width) + ${endCoords.right - startCoords.left}px)`;
  }
  return `${endCoords.right - startCoords.left}px`;
};

const leftHandle = useTemplateRef("leftHandle");
const rightHandle = useTemplateRef("rightHandle");

watchEffect((cleanup) => {
  if (!leftHandle.value || !rightHandle.value) {
    return;
  }

  [leftHandle.value, rightHandle.value].forEach((el, i) => {
    cleanup(
      draggable({
        element: el,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          disableNativeDragPreview({ nativeSetDragImage });
          preventUnhandled.start();
        },
        getInitialData: () =>
          getAnnotationResizeDragData({
            row: props.row,
            annotation: props.annotation,
            side: i === 0 ? "start" : "end",
          }),
      }),
    );
  });
});
</script>

<template>
  <OverlayCoords
    v-slot="{ coords: [startCoords, endCoords] }"
    :positions="[start, end]"
  >
    <div
      v-if="startCoords && endCoords"
      class="annotation"
      :class="{
        creating: props.creating,
        dragging: isDragging,
      }"
      :style="{
        left: left(startCoords),
        width: width(startCoords, endCoords),
      }"
    >
      <div ref="leftHandle" class="resize-handle start" />

      <div
        ref="text"
        class="text"
        contenteditable
        @input="textInput"
        @focus="textFocus"
      >
        {{ annotation?.text }}
      </div>

      <div ref="rightHandle" class="resize-handle end" />
      <!-- <div v-if="annotation" class="delete" @click="emit('delete')">
        <X :size="16" />
      </div> -->
    </div>
  </OverlayCoords>
</template>

<style scoped>
.annotation {
  position: absolute;
  z-index: var(--annotation-z-index);
  top: calc(v-bind(renderRow) * var(--cell-height));
  height: var(--cell-height);
  display: flex;
  justify-content: center;
  pointer-events: v-bind(pointerEvents);

  &:hover,
  &.dragging {
    border: 1px solid gray;
    .delete {
      visibility: visible;
    }
  }

  &:not(:hover):not(.dragging) {
    .resize-handle {
      display: none;
    }
  }
}

.creating {
  opacity: 0.5;
  pointer-events: none;
}

.text {
  /* overflow: hidden; */
  white-space: nowrap;
  /* text-overflow: ellipsis; */
  flex-grow: 1;
  height: min-content;
  text-align: center;
}

.resize-handle {
  width: 4px;
  height: 80%;
  background-color: darkgray;
  align-self: center;

  &.start {
    margin-left: -2px;
  }

  &.end {
    margin-right: -2px;
  }

  &:hover {
    width: 6px;
    background-color: gray;

    &.start {
      margin-left: -4px;
    }

    &.end {
      margin-right: -4px;
    }
  }
}

.delete {
  cursor: pointer;
  padding: 0px 1px;
  visibility: hidden;
  &:hover svg {
    stroke-width: 3;
  }
}
</style>
