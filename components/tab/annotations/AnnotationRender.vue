<script setup lang="ts">
import type { Annotation } from "~/model/data";
import { useTemplateRef } from "vue";
import OverlayCoords from "../bars/OverlayCoords.vue";
import { injectTabBarBounds } from "../bars/provide-bar-bounds";
import { injectBarManagement } from "../providers/state/provide-bar-management";
import {
  injectStackResizeObserver,
  type StackCoords,
} from "../providers/events/provide-resize-observer";

export interface AnnotationRenderProps {
  row: number;
  startAtLeft?: number;
  endAtRight?: number;
  annotation: Annotation;
}

const props = defineProps<AnnotationRenderProps>();

const emit = defineEmits<{
  updateTitle: [string];
  delete: [];
}>();

const barManagement = injectBarManagement();

const start = computed(() => props.startAtLeft ?? props.annotation.start);
const end = computed(
  // neat or evil??
  () => props.endAtRight ?? props.annotation.end ?? props.annotation.start,
);

const pointerEvents = computed(() => (props.annotation ? "auto" : "none"));

const titleEl = useTemplateRef("title");

function titleInput() {
  if (props.annotation) {
    const value = titleEl.value!.innerText;
    emit("updateTitle", value);
  }
}

function titleFocus() {
  window.getSelection()?.selectAllChildren(titleEl.value!);
  titleEl.value!.scrollTo({ left: 0 });
}

watch(
  () => props.annotation,
  (data) => {
    if (data) {
      setTimeout(() => titleEl.value!.focus(), 1);
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
</script>

<template>
  <OverlayCoords
    v-slot="{ coords: [startCoords, endCoords] }"
    :positions="[start, end]"
  >
    <div
      v-if="startCoords && endCoords"
      :class="`annotation annotation-${row}`"
      :style="{
        left: left(startCoords),
        width: width(startCoords, endCoords),
      }"
      @click="console.log(startCoords.left, endCoords.right)"
    >
      <div
        ref="title"
        class="title"
        contenteditable
        @input="titleInput"
        @focus="titleFocus"
      >
        {{ annotation?.text }}
      </div>
      <div v-if="annotation" class="delete" @click="emit('delete')">
        &Cross;
      </div>
    </div>
  </OverlayCoords>
</template>

<style scoped>
.annotation {
  position: absolute;
  top: calc(v-bind(row) * var(--cell-height));
  height: var(--cell-height);
  display: flex;
  align-items: center;
  border-right: 1px solid gray;
  background-color: lightblue;
  pointer-events: v-bind(pointerEvents);

  &:hover {
    .delete {
      visibility: visible;
    }
  }
}

.title {
  overflow: hidden;
  white-space: nowrap;
  /* text-overflow: ellipsis; */
  flex-grow: 1;
  text-align: center;
}

.delete {
  color: maroon;
  cursor: pointer;
  padding: 0px 1px;
  visibility: hidden;
  &:hover {
    font-weight: bold;
    color: darkred;
  }
}
</style>
