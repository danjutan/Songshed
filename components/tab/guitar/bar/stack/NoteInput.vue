<script lang="ts" setup>
import type { GuitarNote } from "~/model/data";
import { useTemplateRef } from "vue";
import type { NotePosition } from "~/model/stores";

const props = defineProps<{
  data?: GuitarNote;
  noteText: string;
  notePosition: NotePosition;
  tuning: Midi;
  frets: number;
  startFocused?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{
  noteChange: [data: GuitarNote];
  noteDelete: [];
  // TODO: remove if unused
  focus: [e: FocusEvent];
  blur: [e: FocusEvent];
}>();

const input = useTemplateRef("input");

onMounted(() => {
  if (props.startFocused) {
    input.value!.focus();
  }
});

function onFocus(e: FocusEvent) {
  input.value!.select();
  emit("focus", e);
}

function onBlur(e: FocusEvent) {
  emit("blur", e);
}

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
    if (num < 0 || num > props.frets) {
      target.value = `${props.noteText}`;
      return;
    }
    emit("noteChange", { note: (props.tuning + num) as Midi });
    return;
  }
  target.value = `${props.noteText}`;
}

defineExpose({
  blur: () => input.value!.blur(),
  focus: () => input.value!.focus(),
});
</script>

<template>
  <div
    ref="container"
    class="note-input"
    :class="{
      selected,
    }"
  >
    <input
      ref="input"
      :value="noteText"
      type="text"
      inputmode="numeric"
      pattern="[0-9]{1,2}"
      @input="onInput"
      @blur="onBlur"
      @focus="onFocus"
      @keyup="(e) => e.stopPropagation()"
    />
  </div>
</template>

<style scoped>
input {
  all: unset;
  max-width: var(--cell-height);
  text-align: center;
  /* width: min-content; */
}
</style>
