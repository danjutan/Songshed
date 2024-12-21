<script lang="ts" setup>
import { createEmptyDivision, type Division, type NoteData } from './data';
import NoteInput from "./NoteInput.vue";
import type { PropType } from 'vue';

const props = defineProps(
 {
  tuning: {
    type: Array as PropType<Midi[]>,
    default: () => defaultTuning,
    validator: (tuning: Midi[], props) => {
      const divisions = props.modelValue as Division[];
      return divisions.every(d => d.duration > 0 && d.notes.length === tuning.length);
    }
  }, 
  frets: {
    type: Number,
    default: 12,
  },
});

const divisions = defineModel<Division[]>({required: true});

const strings = computed(() => props.tuning.length);

function modifyDivisions( transform: (division: Division[]) => Division[]) {
  const clone = structuredClone(toRaw(divisions.value));
  const transformed = transform(clone);
  divisions.value = transformed;
}

function updateNoteData(col: number, string: number, noteData: NoteData) {
  modifyDivisions((divisions) => {
    divisions[col].notes[string] = noteData;
    return divisions;
  });
}

function split(index: number) {
  modifyDivisions((divisions) => {
    const curr = divisions[index];
    const halfTime = curr.duration / 2;
    divisions.splice(index, 1, {duration: halfTime, notes: curr.notes}, createEmptyDivision(halfTime, strings.value));
    return divisions;
  });
}

const lengths = computed(() => divisions.value.map(d => d.duration));
const smallest = computed(() => Math.min(...lengths.value));

const templateColumns = computed<string>(() => lengths.value.map(length => length + "fr").join(" "));

const dragging = ref(0);

</script>

<template>
  <div class="bar">
    <div v-for="i in strings" :style="`grid-row: ${i} / span 1`" class="string"></div>
    <div v-for="({duration, notes}, col) in divisions" class="division"
      :style="`grid-column: ${col + 1} / span 1`">
      <div class="notes">
        <div v-for="(stringTuning, string) in tuning" class="row">
          <NoteInput
            :data="notes[string]"
            :frets="frets"
            :tuning="stringTuning"
            @dataChange="updateNoteData(col, string, $event)">
          </NoteInput>
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
  min-width: var(--min-division-width);
  max-width: calc(50%);
  flex-grow: 1;
  border-left: 1px dashed transparent;
}

.half-bar:hover {
  background-color: rgb(210, 237, 246);
  border-left: 1px dashed lightgray;
}

</style>