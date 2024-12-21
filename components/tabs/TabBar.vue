<script lang="ts" setup>
import type { Division } from './types';
//Let's see what things look like without composing
const divisions = defineModel<Division[]>({ required: true });
const props = withDefaults(defineProps<{
  strings?: number,
}
>(), { strings: 6 });
/*
smallest should get a min-width of minWidth.
then your minwidth is proportional to the smallest.
*/
// const total = computed(() => divisions.value?.reduce( (prev, curr) => prev + curr, 0));
const lengths = computed(() => divisions.value.map(d => d[0]));
const smallest = computed(() => Math.min(...lengths.value));

const templateColumns = computed<string>(() => lengths.value.map(length => length + "fr").join(" "));

function split(index: number) {
  const halfTime = lengths.value[index] / 2;
  divisions.value.splice(index, 1, [halfTime, divisions.value[index][1]], [halfTime]);
}

const dragging = ref(0);
</script>

<template>
  <div class="bar">
    <div v-for="string in props.strings" :style="`grid-row: ${string} / span ${1}`" class="string"></div>
    <div v-for="([length, notes], i) in divisions" class="division"
      :style="`min-width: calc(${length / smallest} * var(--min-division-width)); grid-column: ${i + 1} / span 1`">
      <div class="notes">
        <div v-for="string in props.strings" class="row">
          <div class="spot">
          </div>
        </div>
      </div>
      <div class="half-bar" @click="split(i)"></div>
      <div class="divider" @mousedown="dragging = i + 1" @mouseup="dragging = 0"></div>
    </div>
    <div v-if="dragging" @mouseup="dragging = 0" class="dragger"></div>
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
  width: calc(50% - 1px);
  border-left: 1px dashed transparent;
}

.half-bar:hover {
  background-color: rgb(210, 237, 246);
  border-left: 1px dashed lightgray;
}

.row .spot {
  width: calc(var(--min-division-width) / 2);
  aspect-ratio: 1;
}

.row:hover .spot {
  background-color: rgb(210, 237, 246);
}
</style>