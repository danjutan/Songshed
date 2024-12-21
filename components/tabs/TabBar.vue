<script lang="ts" setup>
import type { Division } from './types';
//Let's see what things look like without composing
const divisions = defineModel<Division[]>({ required: true });
const props = withDefaults(defineProps<{
  strings?: number,
  frets?: number
}
>(), { strings: 6, frets: 12 });
/*
smallest should get a min-width of minWidth.
then your minwidth is proportional to the smallest.
*/
// const total = computed(() => divisions.value?.reduce( (prev, curr) => prev + curr, 0));
const lengths = computed(() => divisions.value.map(d => d.length));
const smallest = computed(() => Math.min(...lengths.value));

const templateColumns = computed<string>(() => lengths.value.map(length => length + "fr").join(" "));

function split(index: number) {
  const halfTime = lengths.value[index] / 2;
  divisions.value.splice(index, 1, {length: halfTime, notes: divisions.value[index].notes}, {length: halfTime, notes: []});
}

const dragging = ref(0);

const editing = ref<{col: number, string: number}>();

const isEditing = (col: number, string: number) => 
  col === editing.value?.col && string === editing?.value.string;

const filled = (col: number, string: number) => {
  return divisions.value[col].notes[string];
}

// const inputs = reactive([]); 

function onInputClick(payload: MouseEvent) {
  console.log(payload.target);
  if (payload.target) {
    (payload.target as HTMLInputElement).select();
  }
}

function onInputBlur(payload: FocusEvent) {
  const clamped = Math.max(1, Math.min(props.frets, parseInt((payload.target as HTMLInputElement).value)));
  // correct this and the v-model below
  // divisions.value[editing.value.col][1][editing.value.string] = clamped;
}

</script>

<template>
  <div class="bar">
    <div v-for="string in props.strings" :style="`grid-row: ${string} / span ${1}`" class="string"></div>
    <div v-for="({length, notes}, col) in divisions" class="division"
      :style="`min-width: calc(${length / smallest} * var(--min-division-width)); grid-column: ${col + 1} / span 1`">
      <div class="notes">
        <div v-for="(_, string) in props.strings" class="row">
          <div class="spot" @mouseover="editing = {col, string}" @mouseleave="editing = undefined">
              <span class="input-bg">{{ divisions[col].notes[string]}}</span>
              <input v-model="divisions[col].notes[string]" 
                size="2"
                @click="onInputClick"
                @blur="onInputBlur"
                type="text" inputmode="numeric" pattern="[0-9]*"/>
          </div>
        </div>
      </div>
      <div v-show="!editing" class="half-bar" @click="split(col)"></div>
      <div class="divider" @mousedown="dragging = col + 1" @mouseup="dragging = 0"></div>
    </div>
    <div v-if="dragging" @mouseup="dragging = 0" @mouseout="dragging = 0" class="dragger"></div>
  </div>
</template>

<style>
.string {
  grid-column: 1 / -1;
  align-self: center;
  height: 1px;
  background-color: gray;
}

.bar {
  --min-division-width: 32px;
  display: grid;
  grid-template-columns: v-bind(templateColumns);
  grid-template-rows: repeat(v-bind(strings), calc(var(--min-division-width) / 2));
  /* align-items: center; */
  /* grid-auto-flow: column; */
}

.subgrid {
  display: grid;
  grid: subgrid / subgrid;
}

.dragger {
  background-color: red;
  opacity: 0.3;
  margin-left: -5px;
  grid-column: v-bind(dragging) / span 2;
  grid-row: 1 / span v-bind(strings);
}

.division {
  display: flex;
  justify-content: flex-end;
  grid-row: 1 / span v-bind(strings);
}

.divider {
  height: 100%;
  width: 2px;
  background-color: lightgray;
  border: 2px solid white;

  &:hover {
    background-color: lightcoral;
    border-color: lightcoral;
  }
}

.notes {
  margin-right: auto;
}

.row {
  display: flex;
  align-items: center;
}

.half-bar {
  height: 100%;
  max-width: calc(50%);
  flex-grow: 1;
  border-left: 1px dashed transparent;
}

.half-bar:hover {
  background-color: rgb(210, 237, 246);
  border-left: 1px dashed lightgray;
}

.row .spot {
  width: calc(var(--min-division-width) / 2);
  display: grid;
  aspect-ratio: 1;
  align-items: center;

  & .input-bg {
    grid-area: 1 / 1;
    width: min-content;
    pointer-events: none;
    font-size: x-small;
    color: green;
    background-color: white;
  }

  & input {
    all: unset;
    grid-area: 1 / 1;
    font-size: x-small;
    width: min-content;
  }

  & input::selection {
    background-color: blue;
  }


}


</style>