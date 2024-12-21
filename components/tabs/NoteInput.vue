<script lang="ts" setup>
import type { NoteData } from './data';

const props = defineProps<{
  data: NoteData,
  tuning: Midi, 
  frets: number 
}>()

const emit = defineEmits<{
  dataChange: [data: NoteData],
  startEdit: [],
  endEdit: [],
}>()

const relativeNote = computed(() =>
  {
    if (props.data.note !== false) {
      return props.data.note - props.tuning as Midi;
    }
    return "";
  },
);

function onInputKeypress(e: KeyboardEvent) {
  const key = parseInt(e.key);
  const nextValue = (e.target as HTMLInputElement).value + e.key;
  if (!Number.isInteger || key < 1 || parseInt(nextValue) > props.frets)
    e.preventDefault();

}
function onInput(e: Event) {
  const num = parseInt((e.target as HTMLInputElement).value);
  if (Number.isInteger(num)) {
    emit('dataChange', {...props.data, note: props.tuning + num as Midi})
    return;
  }
  emit('dataChange', {...props.data, note: false})
}

function onInputClick() {
  // console.log(relativeNote.value, props.data.note)
}

function onInputBlur() {

}

</script>

<template>
  <div @mouseover="emit('startEdit')" @mouseleave="emit('endEdit')">
    <span class="input-bg">{{ relativeNote }}</span>
    <input size="2" :value="relativeNote" @input="onInput" @keypress="onInputKeypress" @click="onInputClick"
      @blur="onInputBlur" type="text" inputmode="numeric" pattern="[0-9]{1,2}" />
  </div>
</template>

<style>
.input-bg {
  grid-area: 1 / 1;
  width: min-content;
  pointer-events: none;
  font-size: x-small;
  color: green;
  background-color: white;
}

input {
  all: unset;
  grid-area: 1 / 1;
  font-size: x-small;
  width: min-content;
}

/* input::selection {
  background-color: blue;
} */
</style>./data