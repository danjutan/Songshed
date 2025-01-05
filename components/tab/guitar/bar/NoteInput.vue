<script lang="ts" setup>
import type { GuitarNote } from "~/model/data";

import { onWatcherCleanup, useTemplateRef } from "vue";
import { injectEditingState } from "../../providers/state/provide-editing-state";
import { injectCellHoverEvents } from "../../providers/events/provide-cell-hover-events";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { getNoteInputDragData, getNoteInputDropData } from "../../dnd/types";
import { injectSelectionState } from "../../providers/state/provide-selection-state";
import type { NotePosition } from "~/model/stores";

const props = defineProps<{
  data?: GuitarNote;
  notePosition: NotePosition;
  tuning: Midi;
  frets: number;
  startFocused?: boolean;
  selected?: boolean;
  hovering?: boolean;
}>();

const emit = defineEmits<{
  noteChange: [data: GuitarNote];
  noteDelete: [];
  // TODO: remove if unused
  focus: [];
  blur: [];
}>();

const input = useTemplateRef("input");

function onClick() {
  input.value!.select();
  // emit("focus");
}

function onMouseDown(e: MouseEvent) {
  setTimeout(() => {
    input.value!.blur();
  }, 0);
}

onMounted(() => {
  if (props.startFocused) {
    input.value!.focus();
    onClick();
  }
});

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
</script>

<template>
  <div
    ref="container"
    class="note-input"
    :class="{
      hovering,
      'has-note': hasNote,
      selected,
    }"
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
      @keyup="(e) => e.stopPropagation()"
    />
    <!-- <div v-if="isEditing(notePosition)" class="tie-add-dragger" /> -->
  </div>
</template>

<style scoped>
.note-input {
  /* Font size set by parent, Stack */
  display: grid;
  justify-items: center;
  align-items: center; /*comment this if you want other centering*/
  &.moving {
    opacity: 0.8;
  }
}

input {
  all: unset;
  height: var(--cell-height);
}

.input-bg,
input,
.input-hover,
.tie-add-dragger {
  grid-area: 1 / 1;
  /* grid-area: 1 / 2; */
  /* font-size: var(--note-font-size); */
  text-align: center; /*comment this if you want other centering*/
}

.tie-add-dragger {
  width: 100%;
  height: 100%;
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
  background-color: white;
}

.note-input.selected .input-bg {
  background-color: var(--highlight-blocking);
}
/* .hovering:not(.editing) > input,
.hovering:not(.has-note) > input { */
.hovering > input {
  background-color: var(--note-hover-color);
}
</style>
