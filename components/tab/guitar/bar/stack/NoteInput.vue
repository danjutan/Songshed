<script lang="ts" setup>
import type { GuitarNote } from "~/model/data";

import { useTemplateRef } from "vue";
import type { NotePosition } from "~/model/stores";

const props = defineProps<{
  data?: GuitarNote;
  notePosition: NotePosition;
  tuning: Midi;
  frets: number;
  startFocused?: boolean;
  selected?: boolean;
  hovering?: boolean;
  backgroundColor?: string;
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
  input.value!.focus();
}

function onMouseDown(e: MouseEvent) {
  // input.value!.blur();
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

// const hasNote = computed(() => noteText.value !== "");

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

defineExpose({
  blur: () => input.value!.blur(),
  focus: () => input.value!.focus(),
  noteText,
});
</script>

<template>
  <div
    ref="container"
    class="note-input"
    :class="{
      hovering,
      selected,
    }"
    @click="onClick"
    @mousedown="onMouseDown"
  >
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
  </div>
</template>

<style scoped>
input {
  all: unset;
  height: var(--cell-height);
  max-width: var(--cell-height);
  text-align: center;
  /* width: min-content; */
}
</style>
