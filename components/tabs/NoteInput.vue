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


function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.value.trim() == "") {
    console.log("empty");
    emit('dataChange', {...props.data, note: false})
  }
  const num = parseInt(target.value);
  if (Number.isInteger(num)) {
    if (num < 1 || num > props.frets) {
      return target.value = `${relativeNote.value}`;
    }
    emit('dataChange', {...props.data, note: props.tuning + num as Midi})
    return;
  }
  target.value = `${relativeNote.value}`;
}

function onInputClick(e: Event) {
  e.target && (e.target as HTMLInputElement).select();
  // console.log(relativeNote.value, props.data.note)
}

function onInputBlur() {

}

</script>

<template>
  <div @mouseover="emit('startEdit')" @mouseleave="emit('endEdit')">
    <span class="input-bg">{{ relativeNote }}</span>
    <input size="2" :value="relativeNote" @input="onInput" @click="onInputClick"
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
</style>