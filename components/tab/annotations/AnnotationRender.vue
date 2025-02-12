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
import { injectAnnotationAddState } from "../providers/state/provide-annotation-add-state";

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
const annotationAddState = injectAnnotationAddState();

const start = computed(() => props.startAtLeft ?? props.annotation.start);
const end = computed(() => props.endAtRight ?? props.annotation.end);

const isDragging = computed(() =>
  resizeState.isDragging(props.row, props.annotation),
);

const isAnyCreating = computed(() => annotationAddState.newAnnotation.value);

const isAnyDragging = resizeState.isAnyDragging;

const pointerEvents = computed(() =>
  props.annotation && !isDragging.value ? "auto" : "none",
);

const textEl = useTemplateRef("text");

function onTextInput() {
  if (props.annotation) {
    const value = textEl.value!.innerText;
    emit("updateText", value);
  }
}

function focusText() {
  if (textEl.value) {
    textEl.value.focus();
  }
}
onMounted(() => {
  if (!props.creating) {
    setTimeout(() => focusText(), 1);
  }
});

const startsInFirstColumn = computed(() => {
  return barManagement.bars.some((bar) => bar.start === start.value);
});

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
        onDrop: () => {
          focusText();
        },
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
        'no-right-border': endAtRight,
        'no-left-border': startAtLeft,
        'any-dragging': isAnyDragging,
        'any-creating': isAnyCreating,
      }"
      :style="{
        left: left(startCoords),
        width: width(startCoords, endCoords),
      }"
    >
      <div v-show="!startAtLeft" ref="leftHandle" class="resize-handle start">
        <div class="visible" />
      </div>

      <div ref="text" class="text" contenteditable @input="onTextInput">
        {{ annotation?.text }}
      </div>

      <div v-show="!endAtRight" ref="rightHandle" class="resize-handle end">
        <div class="visible" />
      </div>

      <div
        v-if="annotation.start === annotation.end"
        class="center-line pos-line"
      />

      <div class="delete" @click="emit('delete')">
        <X :size="16" />
      </div>
      <!-- <template v-else>
        <div class="left-line pos-line" />
        <div class="right-line pos-line" />
      </template> -->
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
  align-items: center;
  pointer-events: v-bind(pointerEvents);

  &:hover,
  &:has(.text:focus),
  &.any-dragging,
  &.any-creating {
    border: 1px solid gray;
    border-top: none;
    &.no-right-border {
      border-right: none;
    }
    &.no-left-border {
      border-left: none;
    }
  }

  &:hover {
    .center-line {
      display: none;
    }
  }

  &:not(:hover):not(.dragging) {
    .resize-handle {
      display: none;
    }
    .delete {
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
  outline: none;
}

.resize-handle {
  position: absolute;
  width: var(--collapsed-min-width);
  height: calc(100% + 10px);
  top: -5px;
  /* background-color: blue; */
  display: flex;
  justify-content: center;
  align-items: center;

  &.start {
    left: calc(var(--collapsed-min-width) / -2);
  }

  &.end {
    right: calc(var(--collapsed-min-width) / -2);
  }

  .visible {
    width: 4px;
    height: calc(var(--cell-height) * 0.8);
    background-color: darkgray;
  }

  &:hover {
    .visible {
      width: 6px;
      background-color: gray;
    }
  }
}

.center-line {
  position: absolute;
  margin-left: auto;
  margin-right: auto;
  left: 0;
  right: 0;
}

.pos-line {
  width: var(--pos-line-width);
  /* background-color: var(--pos-line-color); */
  background: gray;
  height: calc((var(--cell-height) - var(--note-font-size)) * 1.5);
  top: var(--note-font-size);
}
.delete {
  cursor: pointer;
  position: absolute;
  margin-left: auto;
  margin-right: auto;
  width: min-content;
  left: 0;
  right: 0;
  transform: translateY(-60%) translateX(50%);
  color: darkred;

  &:hover svg {
    stroke-width: 3;
  }
}
</style>
