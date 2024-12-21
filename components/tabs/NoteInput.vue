<script lang="ts" setup>
import type { NoteData } from './data';

const props = defineProps<{
  data: NoteData | undefined,
  tuning: Midi, 
  frets: number,
  collapse?: boolean,
  startFocused?: boolean
}>()

const emit = defineEmits<{
  dataChange: [data: NoteData | undefined],
  startEdit: [],
  endEdit: [],
}>()

const relativeNote = computed(() =>
  {
    if (props.data) {
      return props.data.midi - props.tuning as Midi;
    }
    return "";
  },
);


function onInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.value.trim() == "") {
    emit('dataChange', undefined);
  }
  const num = parseInt(target.value);
  if (Number.isInteger(num)) {
    if (num < 1 || num > props.frets) {
      return target.value = `${relativeNote.value}`;
    }
    emit('dataChange', {...props.data, midi: props.tuning + num as Midi})
    return;
  }
  target.value = `${relativeNote.value}`;
}

function onInputClick(e: Event) {
  console.log("click", input.value?.getBoundingClientRect().width);
  e.target && (e.target as HTMLInputElement).select();
}

function onInputBlur() {

}

function mouseOver () {
  emit('startEdit');
  // input.value?.focus();
}

const input = ref<HTMLInputElement>()
onMounted(() => {
  if (props.startFocused) {
    input.value?.focus();
  }
});

</script>

<template>
  <div
    class="note-input" 
    :class="collapse ? 'collapse' : ''"
    @mouseover="mouseOver" @mouseleave="emit('endEdit')">
    <span class="hover-bg">{{  relativeNote }}</span>
    <span class="input-bg">{{ relativeNote }}</span>
    <input 
      ref="input"
      :size="2" :value="relativeNote" type="text" inputmode="numeric"
      pattern="[0-9]{1,2}" @input="onInput" @click="onInputClick" @blur="onInputBlur">
  </div>
</template>

<style scoped>

.note-input {
  /* min-width: calc(var(--min-division-width) / 2); */
  display: grid;
  height: calc(var(--min-division-width) / 2);
  /* height: calc(var(--min-division-width) / 2); */
  /* border: 1px red dashed; */
}

.collapse {
  container-type: size;
}

input {
  all: unset;
}


.input-bg, input, .hover-bg {
  /* border: 1px dashed blue; */
  grid-area: 1 / 1;
  font-size: calc(var(--min-division-width) / 2);
  width: min-content;
  /* min-width: calc(var(--min-division-width) / 2); */
}

.input-bg {
  pointer-events: none;
  color: green;
  background-color: white;
  /* aspect-ratio: 1 / 1; */
}

.hover-bg {
  aspect-ratio: 1;
}

.note-input:hover > .hover-bg {
  background-color: #ACCEF7;
}

.note-input:hover > .input-bg {
  display: none;
}

@container (aspect-ratio < 0.5) {
  input, .hover-bg, .input-bg {
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