<script lang="ts" setup>
import type { NoteData } from "./data";

const props = withDefaults(defineProps<{
  data?: NoteData
  tuning: Midi
  frets: number
  backgroundColor?: string
  collapse?: boolean
  startFocused?: boolean
}>(), {
  data: undefined,
  backgroundColor: "white",
});

const emit = defineEmits<{
  dataChange: [data: NoteData | undefined]
  startEdit: []
  endEdit: []
}>();

const relativeNote = computed(() => {
  if (props.data) {
    return props.data.midi - props.tuning as Midi;
  }
  return "";
},
);

const fontSize = "calc(var(--min-division-width) / 2)";

function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.value.trim() == "") {
    return;
  }
  const num = parseInt(target.value);
  if (Number.isInteger(num)) {
    if (num < 1 || num > props.frets) {
      return target.value = `${relativeNote.value}`;
    }
    emit("dataChange", { ...props.data, midi: props.tuning + num as Midi });
    return;
  }
  target.value = `${relativeNote.value}`;
}

function onInputClick(e: Event) {
  // console.log("click", input.value?.getBoundingClientRect().width);
  e.target && (e.target as HTMLInputElement).select();
}

function onInputBlur(e: Event) {
  const target = e.target as HTMLInputElement;
  if (props.data && target.value.trim() == "") {
    emit("dataChange", undefined);
  }
}

function mouseOver() {
  emit("startEdit");
  // input.value?.focus();
}

const input = ref<HTMLInputElement>();
onMounted(() => {
  if (props.startFocused) {
    input.value?.focus();
  }
});
</script>

<template>
  <div
    class="note-input"
    :class="{ collapse: !relativeNote }"
    @mouseover="mouseOver"
    @mouseleave="emit('endEdit')">
    <span v-if="relativeNote"
          class="input-bg">{{ relativeNote }}</span>
    <input
      ref="input"
      :value="relativeNote"
      type="text"
      inputmode="numeric"
      pattern="[0-9]{1,2}"
      @input="onInput"
      @click="onInputClick"
      @blur="onInputBlur">
  </div>
</template>

<style scoped>
.note-input {
  display: grid;
  height: calc(var(--min-division-width) / 2);
  /* width: calc(var(--min-division-width) / 2); */
}

.collapse {
  width: calc(var(--min-division-width) / 8);
  /* container-type: size;
  container-name: collapser; */
}

input {
  all: unset;
  text-shadow: 1px 1px 0px lightgray;
  max-width: calc(var(--min-division-width) / 2);
  /* z-index: var(--z-index-notes); */
}

.input-bg, input, .hover-bg {
  grid-area: 1 / 1;
  font-size: v-bind(fontSize);
  /* min-height: calc(var(--min-division-width) / 2); */
  /* width: min-content; */
  /* min-width: calc(var(--min-division-width) / 2); */
}

.input-bg {
  width: min-content;
  pointer-events: none;
  color: transparent;
  background-color: v-bind(backgroundColor);
  /* display: none; */
  /* aspect-ratio: 1 / 1; */
}

.note-input:hover > input{
  width: calc(var(--min-division-width) / 2);
  /* height: 100%; */
  background-color: #ACCEF7
}

/* @container collapser (aspect-ratio < 0.5) {
  input,  .input-bg {
    display: none;
  }
} */

/* .note-input:has(input) {
  .hover-bg {
    display: none;
  }

  .input-bg {
    display: inline;
  }
} */

/* input::selection {
  background-color: blue;
} */
</style>
