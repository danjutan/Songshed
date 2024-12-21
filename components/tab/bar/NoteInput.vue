<script lang="ts" setup>
import type { NoteData } from "../data";

const props = withDefaults(defineProps<{
  data?: NoteData
  tuning: Midi
  frets: number
  collapse?: boolean
  startFocused?: boolean
  blockingColor?: string
}>(), {
  data: undefined,
  blockingColor: "white",
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
    :class="{ collapse: collapse && !relativeNote }"
    @mouseover="mouseOver"
    @mouseleave="emit('endEdit')">
    <span class="input-bg">{{ relativeNote }}</span>
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
  width: var(--cell-height);
  min-width: calc(var(--cell-height) / 4);
}

.collapse {
  width: 100%;
  height: 100%;
  container-type: size;
  container-name: collapser;
  /* border: 1px solid black; */
}

input {
  all: unset;
  /* text-shadow: 1px 1px 0px lightgray; */
  height: var(--cell-height);
  /* z-index: var(--z-index-notes); */
}

.input-bg, input {
  grid-area: 1 / 1;
  font-size: var(--note-font-size);
  width: var(--note-font-size);
}

.input-bg {
  width: min-content;
  pointer-events: none;
  color: transparent;
  background-color: v-bind(blockingColor);
  /* display: none; */
  /* aspect-ratio: 1 / 1; */
}

.note-input:hover > input{
  background-color: var(--highlight-color);
}

@container collapser (aspect-ratio < 0.5) {
  /* .input-bg {
    width: 100cqw;
    background-color: var(--substack-bg);
  } */
  input {
    display: none;
  }
}

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
