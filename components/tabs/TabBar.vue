<script lang="ts" setup>
import type { Division } from './types';
//Let's see what things look like without composing
const divisions = defineModel<Division[]>({required: true}); 
const props = withDefaults(defineProps<{
  strings?: number,
  showDivisions?: boolean
}
>(), { strings: 6 });
/*
smallest should get a min-width of minWidth.
then your minwidth is proportional to the smallest.
*/
// const total = computed(() => divisions.value?.reduce( (prev, curr) => prev + curr, 0));
const lengths = computed(() => divisions.value.map(d => d[0]));
const smallest = computed(() => Math.min(...lengths.value));

function split (index: number) {
  const halfTime = lengths.value[index] / 2;
  divisions.value.splice(index, 1, [halfTime, divisions.value[index][1]], [halfTime]);
}

</script>

<template>
  <Overlay>
    <div class="string-background">
      <div v-for="string in props.strings" class="string"/>
    </div>
    <div class="bar">
      <div v-for="([length, notes], i) in divisions" class="division"
        :style="`flex-grow: ${length}; min-width: calc(${length / smallest} * var(--min-division-width))`">
        <!-- <Overlay> -->
          <div class="notes">
            <div v-for="string in props.strings" class="row">
              <div class="spot">
              </div>
            </div>
          </div>
          <div class="half-bar" @click="split(i)"></div>
          <div class="divider" :class="{'with-border': showDivisions}"></div>
          <!-- </Overlay> -->
        </div>
    </div>
  </Overlay>
</template>

<style>

.string-background {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}
.string {
  height: 1px;
  width: 100%;
  background-color: gray;
}

.bar {
  --min-division-width: 32px;
  display: flex;

  /* & .division:not(:last-of-type) {
    border-right: 1px dashed transparent;
    
    &.with-border {
      border-right: 1px dashed lightgray;
    }
  } */
}


.division {
  display: flex;
  justify-content: flex-end;
}

.divider {
  height: 100%; 
  width: 1px;
  background-color: lightgray;
  border: 1px solid lightgray;
  &:hover {
    background-color: lightcoral;
    border-color: lightcoral;
    /* border: 2px solid rgb(210, 237, 246); */
  }
}

.notes {
  margin-right: auto;
}

.row {
  display: flex;
  align-items: center;
  /* border-bottom: 2px solid black; */
}

.half-bar {
  /* position: relative;
  left: 50%; */
  height: 100%;
  width: calc(50% - 1px);
  border-left: 1px dashed transparent;
}

.half-bar:hover {
  background-color: rgb(210, 237, 246);
  border-left: 1px dashed lightgray;
}

.row .spot {
  /* display: flex;
  align-items:center; */
  width: calc(var(--min-division-width) / 2);
  aspect-ratio: 1;
}

.row:hover .spot {
  background-color: rgb(210, 237, 246);
}
</style>