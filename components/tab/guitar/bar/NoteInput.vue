<script lang="ts" setup>
import type { GuitarNote } from "~/model/data";

import { useTemplateRef } from "vue";
import { injectEditingState } from "../../providers/state/provide-editing-state";
import { injectCellHoverEvents } from "../../providers/events/provide-cell-hover-events";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

const props = withDefaults(
  defineProps<{
    data?: GuitarNote;
    string: number;
    position: number;
    tuning: Midi;
    frets: number;
    startFocused?: boolean;
    blockingColor?: string;
    hovering?: boolean;
  }>(),
  {
    data: undefined,
    blockingColor: "white",
  },
);

const emit = defineEmits<{
  noteChange: [data: GuitarNote];
  noteDelete: [];
  // TODO: remove if unused
  focus: [];
  blur: [];
}>();

const { editingNote, setEditing } = injectEditingState();
const { hover } = injectCellHoverEvents();

const input = useTemplateRef("input");
const container = useTemplateRef("container");

const isDragging = ref(false);
let dndCleanup: () => void;

function focus() {
  input.value!.focus();
  input.value!.select();
  setEditing(props.string, props.position);
  emit("focus");
}

onMounted(() => {
  if (props.startFocused) {
    focus();
  }
  dndCleanup = combine(
    draggable({
      element: container.value!,
      onGenerateDragPreview: ({ nativeSetDragImage, source }) => {
        // if (source.data.selecting) {
        //   disableNativeDragPreview({ nativeSetDragImage });
        //   preventUnhandled.start();
        // }
      },
      getInitialData: (s) => ({
        position: props.position,
        string: props.string,
        // selecting: s.input.shiftKey,
      }),
      onDragStart: () => (isDragging.value = true),
      onDrop: () => (isDragging.value = false),
    }),
    dropTargetForElements({
      element: container.value!,
      // getData: () => ({ position: props.position, string: props.string }),
      canDrop: ({ source }) => source.data.position !== undefined,
      onDragEnter: focus,
    }),
  );
});

const isEditing = computed(
  () =>
    editingNote?.position === props.position &&
    editingNote?.string === props.string,
);

// TODO: I think we can get rid of this
defineExpose({ focus });

function onBlur(e: Event) {
  emit("blur");
}

const noteText = computed(() => {
  if (props.data) {
    if (props.data.note === "muted") {
      return "⨯";
    }
    return (props.data.note - props.tuning) as Midi;
  }
  return "";
});

const hasNote = computed(() => noteText.value !== "");

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const trimmed = target.value.trim();
  if (trimmed == "") {
    emit("noteDelete");
    return;
  }
  if (["m", "M", "x", "X"].includes(trimmed)) {
    emit("noteChange", { note: "muted" });
  }
  const num = parseInt(target.value);
  if (Number.isInteger(num)) {
    if (num < 1 || num > props.frets) {
      target.value = `${noteText.value}`;
      return;
    }
    emit("noteChange", { note: (props.tuning + num) as Midi });
    return;
  }
  target.value = `${noteText.value}`;
}

function onClick(e: MouseEvent) {
  console.log("click handler");
  focus();
}

// function onSideMouseDown(e: MouseEvent) {
//   tieAdd.start(props.string, props.position, props.data!.midi!);
//   e.stopImmediatePropagation();
// }

function disableNativeDragPreview(arg0: {
  nativeSetDragImage: ((image: Element, x: number, y: number) => void) | null;
}) {
  throw new Error("Function not implemented.");
}
</script>

<template>
  <div
    ref="container"
    class="note-input"
    :class="{
      hovering,
      editing: isEditing,
      dragging: isDragging,
      'has-note': hasNote,
    }"
    @mouseover="() => {} /*hover(string, position)*/"
  >
    <span class="input-bg">{{ noteText }}</span>
    <!-- <div class="input-hover" /> -->
    <input
      ref="input"
      :value="noteText"
      type="text"
      inputmode="numeric"
      pattern="[0-9]{1,2}"
      @input="onInput"
      @blur="onBlur"
      @click="onClick"
      @keyup="(e) => e.stopPropagation()"
    />
  </div>
</template>

<style scoped>
.note-input {
  /* Font size set by parent, Stack */
  display: grid;
  justify-items: center;
  align-items: center; /*comment this if you want other centering*/

  &.dragging {
    opacity: 0.8;
  }
}

input {
  all: unset;
  height: var(--cell-height);
}

.input-bg,
input,
.input-hover {
  grid-area: 1 / 1;
  /* grid-area: 1 / 2; */
  /* font-size: var(--note-font-size); */
  text-align: center; /*comment this if you want other centering*/
}

input {
  /* width: var(--cell-height); */
  width: 100%;
  max-width: var(--cell-height);
}

/* .editing input {
  width: var(--cell-height);
} */

.input-bg {
  width: min-content;
  pointer-events: none;
  color: transparent;
  height: 3px;
  background-color: v-bind(blockingColor);
}

/* .hovering:not(.editing) > input,
.hovering:not(.has-note) > input { */
.hovering > input {
  background-color: var(--note-hover-color);
}
</style>
