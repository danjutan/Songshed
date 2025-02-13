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
import { injectAnnotationHoverState } from "../providers/state/provide-annotation-hover-state";
import AnnotationResizeHandle from "./AnnotationResizeHandle.vue";

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
const hoverState = injectAnnotationHoverState();

const start = computed(() => props.startAtLeft ?? props.annotation.start);
const end = computed(() => props.endAtRight ?? props.annotation.end);

const isDragging = computed(() =>
  resizeState.isDragging(props.row, props.annotation),
);

const isAnyHovered = computed(() => hoverState.hoveredRow.value !== undefined);
const isOtherHovered = computed(
  () =>
    isAnyHovered.value && !hoverState.isHovered(props.row, props.annotation),
);
// now reduntant because whenever we're creating we're also hovering over a row
// const isAnyDragging = computed(
//   () => resizeState.draggingFrom.value !== undefined,
// );
const isAnyCreating = computed(() => annotationAddState.newAnnotation.value);

const pointerEvents = computed(() =>
  props.annotation && !isDragging.value ? "auto" : "none",
);

const annotationEl = useTemplateRef("annotation");
const textEl = useTemplateRef("text");

const overflown = ref(false);
useResizeObserver(textEl, ([entry]) => {
  if (!annotationEl.value) return;
  const { width } = entry.contentRect;
  const containerWidth = annotationEl.value?.clientWidth;
  overflown.value = width > containerWidth;
});

function onTextInput() {
  if (props.annotation) {
    const value = textEl.value!.innerText;
    emit("updateText", value);
  }
}

function onTextBlur() {
  if (props.annotation) {
    const value = textEl.value!.innerText;
    if (value.length === 0) {
      emit("delete");
    }
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
</script>

<template>
  <OverlayCoords
    v-slot="{ coords: [startCoords, endCoords] }"
    :positions="[start, end]"
  >
    <div
      v-if="startCoords && endCoords"
      ref="annotation"
      class="annotation"
      :class="{
        creating: props.creating,
        dragging: isDragging,
        'no-right-border': endAtRight,
        'no-left-border': startAtLeft,
        'any-creating': isAnyCreating,
        'any-hovered': isAnyHovered,
        'other-hovered': isOtherHovered,
        // 'other-dragging': !isDragging && isAnyDragging,
      }"
      :style="{
        left: left(startCoords),
        width: width(startCoords, endCoords),
      }"
      @mouseenter="hoverState.setHovered(props.row, props.annotation)"
      @mouseleave="hoverState.clearHovered()"
    >
      <AnnotationResizeHandle
        v-show="!startAtLeft"
        :row="row"
        :annotation="annotation"
        side="start"
        :below="overflown"
        @drag-end="focusText"
      />

      <AnnotationResizeHandle
        v-show="!endAtRight"
        :row="row"
        :annotation="annotation"
        side="end"
        :below="overflown"
        @drag-end="focusText"
      />

      <div
        ref="text"
        class="text"
        contenteditable
        spellcheck="false"
        @input="onTextInput"
        @blur="onTextBlur"
      >
        {{ annotation?.text }}
      </div>

      <div
        v-if="annotation.start === annotation.end"
        class="center-line pos-line"
      />

      <!-- <div class="delete" @click="emit('delete')">
        <X :size="16" />
      </div> -->
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
  pointer-events: v-bind(pointerEvents);

  & .resize-handle {
    visibility: hidden;
  }

  &:hover,
  &.dragging,
  &:has(.text:focus):not(.other-hovered) {
    background-color: rgb(from var(--select-color) r g b / var(--select-alpha));
    & .resize-handle {
      visibility: visible;
    }
  }

  /* &.any-creating, */
  /* &.other-dragging { */
  &.other-hovered:not(:has(.text:focus)),
  &.any-creating {
    /* pointer-events: none; */
    border-left: 1px solid darkgray;
    border-right: 1px solid darkgray;
    &.no-right-border {
      border-right: none;
    }
    &.no-left-border {
      border-left: none;
    }
  }

  /* &:hover {
    .center-line {
      display: none;
    }
  } */

  /* &:not(:hover):not(.dragging) {
    background-color: transparent;
    &:not(:has(.text:focus)) {
      .resize-handle {
        display: none;
      }
      .delete {
        display: none;
      }
    }
  } */
}

.creating {
  opacity: 0.5;
  pointer-events: none;
}

.text {
  pointer-events: none;
  z-index: var(--annotation-text-z-index);
  font-size: var(--annotation-font-size);
  align-self: center;
  white-space: nowrap;
  flex-grow: 1;
  height: min-content;
  text-align: center;
  outline: none;
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

/* .delete {
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
} */
</style>
