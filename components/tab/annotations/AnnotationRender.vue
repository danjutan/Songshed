<script setup lang="ts">
import type { Annotation } from "~/model/data";
import { useTemplateRef } from "vue";
import OverlayCoords from "../bars/OverlayCoords.vue";
import { injectBarManagement } from "../providers/state/provide-bar-management";
import {
  coordsEqual,
  type StackCoords,
} from "../providers/events/provide-resize-observer";

import { injectAnnotationResizeState } from "../providers/state/provide-annotation-resize-state";
import { injectAnnotationAddState } from "../providers/state/provide-annotation-add-state";
import { injectAnnotationHoverState } from "../providers/state/provide-annotation-hover-state";
import AnnotationResizeHandle from "./AnnotationResizeHandle.vue";
import { useCoordsDirective } from "../hooks/use-coords-directive";
import { injectSettingsState } from "../providers/state/provide-settings-state";

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
const settings = injectSettingsState();

const start = computed(() => props.startAtLeft ?? props.annotation.start);
const end = computed(() => props.endAtRight ?? props.annotation.end);

const isDragging = computed(() =>
  resizeState.isDragging(props.row, props.annotation),
);

// includes other half across tablines
const isHovered = computed(() =>
  hoverState.isHovered(props.row, props.annotation),
);
const isAnyHovered = computed(() => hoverState.hoveredRow.value !== undefined);
const isOtherHovered = computed(() => isAnyHovered.value && !isHovered.value);
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

const overflowing = ref(false);
useResizeObserver(textEl, ([entry]) => {
  if (!annotationEl.value) return;
  const textWidth = entry.target.clientWidth;
  const containerWidth = annotationEl.value?.clientWidth;
  overflowing.value = textWidth > containerWidth;
});

function onTextInput() {
  if (props.annotation) {
    const value = textEl.value!.innerText;
    emit("updateText", value);
  }
}

function onTextBlur() {
  if (props.annotation && textEl.value) {
    const value = textEl.value.innerText;
    if (value.length === 0) {
      emit("delete");
    }
  }
}

function focusText() {
  if (textEl.value) {
    textEl.value.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(textEl.value);
    selection?.removeAllRanges();
    selection?.addRange(range);
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
    return 0;
  }
  return startCoords.left;
};

const width = (startCoords: StackCoords, endCoords: StackCoords) => {
  if (startsInFirstColumn.value) {
    return endCoords.right;
  }
  return endCoords.right - startCoords.left;
};

const vCoords = useCoordsDirective({
  start: start,
  end: end,
});

const isOneColumn = computed(() => {
  return props.annotation.start === props.annotation.end;
});
</script>

<template>
  <div
    ref="annotation"
    v-coords:left="(coords) => left(coords.start)"
    v-coords:width="(coords) => width(coords.start, coords.end)"
    class="annotation"
    :class="{
      creating: props.creating,
      dragging: isDragging,
      'no-right-border': endAtRight,
      'no-left-border': startAtLeft,
      'any-creating': isAnyCreating,
      hovered: isHovered,
      'any-hovered': isAnyHovered,
      'other-hovered': isOtherHovered,
      'always-background': settings.showAnnotationBackground,
      'one-column': isOneColumn,
      // 'other-dragging': !isDragging && isAnyDragging,
    }"
    @mouseenter="hoverState.setHovered(props.row, props.annotation)"
    @mouseleave="if (!isDragging) hoverState.clearHovered();"
    @click="focusText"
  >
    <AnnotationResizeHandle
      v-show="!startAtLeft"
      :row="row"
      :annotation="annotation"
      side="start"
      :below="overflowing && !isDragging"
      @drag-end="focusText"
    />

    <AnnotationResizeHandle
      v-show="!endAtRight"
      :row="row"
      :annotation="annotation"
      side="end"
      :below="overflowing && !isDragging"
      @drag-end="focusText"
    />

    <div
      ref="text"
      class="text"
      contenteditable
      spellcheck="false"
      @input="onTextInput"
      @blur="onTextBlur"
      @click.stop
    >
      {{ annotation?.text }}
    </div>

    <div v-if="isOneColumn" class="notch" />
  </div>
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

  &.hovered,
  &.dragging,
  &:has(.text:focus):not(.other-hovered) {
    background-color: var(--annotation-hover-background-color);
    z-index: var(--annotation-current-z-index);
    & .resize-handle {
      visibility: visible;
    }
  }

  &.any-hovered,
  &.any-creating {
    /* pointer-events: none; */
    border: 1px solid var(--annotation-border);
    border-bottom: none;
    background-color: var(--annotation-default-background-color);
    &.no-right-border {
      border-right: none;
    }
    &.no-left-border {
      border-left: none;
    }
  }

  &.always-background:not(.one-column) {
    background-color: var(--annotation-default-background-color);
  }
}

.creating {
  opacity: 0.5;
  pointer-events: none;
}

.text {
  font-size: var(--annotation-font-size);
  max-width: min-content;
  display: flex;
  justify-content: center;
  align-self: center;
  white-space: nowrap;
  flex-grow: 1;
  height: min-content;
  text-align: center;
  outline: none;
}

.notch {
  position: absolute;
  margin-left: auto;
  margin-right: auto;
  inset: calc(var(--cell-height) * 0.85) 0 auto;
  height: calc((var(--cell-height) * 0.3));
  width: calc(var(--pos-line-width) + 1px);
  background: var(--annotation-notch-color);
}
</style>
