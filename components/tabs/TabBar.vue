<script lang="ts" setup>
import { type Division, type NoteData, type NoteStack, timeUnits } from './data';
import NoteInput from "./NoteInput.vue";
import type { PropType } from 'vue';

const props = defineProps(
 {
  tuning: {
    type: Array as PropType<Midi[]>,
    default: () => defaultTuning,
    validator: (tuning: Midi[], props) => {
      const divisions = props.modelValue as Division[];
      const stringsLength = divisions.every(d => d.stacks.every(stack => stack.length <= tuning.length));
      return stringsLength;
    }
  }, 
  frets: {
    type: Number,
    default: 12,
  },
  notches: {
    type: Number,
    default: 16 
  }

});

const divisions = defineModel<Division[]>({
  required: true,
  validator: (divisions: Division[]) => {
    const sorted = divisions.sort((a, b) => a.start - b.start);
    const validStart = sorted[0].start >= 0;
    const hasStacks = divisions.every(d => d.stacks.length > 0);
    const positiveDuration = divisions.every(d => d.duration > 0);
    const noOverlap = sorted.every((d, i) => {
      if (i === 0) return true;
      const prev = sorted[i - 1];
      return d.start >= prev.start + prev.duration
    });
    return validStart && hasStacks && positiveDuration && noOverlap;
  }
});

// sort the divisions by start
const sortedDivisions = computed(() => divisions.value.sort((a, b) => a.start - b.start));

type DivisionRender = {
  colStart: number,
  span: number,
  stacks: NoteStack[],
}

const divisionRenders = computed(() => {
  const renderData = divisions.value.map((division, i) => {
    // 4 notches means each notch is 1 quarter note, 8 notches means each not is 1/2 a quarter note..
    const unit = 4 / props.notches; // e.g., 4 / 16 = 1/4
    // TODO: probably change to ceil/floor rather than floor/ceil so we never overlap
    const colStart = Math.floor(division.start / unit); // e.g. .125 / 0.25 = 0.5 -> 0
    const span = Math.ceil(division.duration / unit); // e.g. 3.0625 / 0.25 = 12.25 -> 13
    const remainder = Math.min(division.start % unit, division.duration % unit)
    const subunit = division.duration / division.stacks.length;
    // const subunit = timeUnits.find(unit => remainder % unit == 0);
    if (!subunit) throw new Error("note spacing is off");
    const startPadding = ((division.start % unit) / subunit); 

    const substacks: NoteStack[] = new Array(startPadding).fill([]);
    for (let i = 0; i < division.stacks.length; i++) {
      debugger;
      const stack = division.stacks[i];
      substacks.push(stack);
      substacks.push(...new Array(subunit / unit - 1).fill([]));
    }

    return {
      colStart,
      span,
      stacks: substacks,
    }
    // do we need end padding?
    // generate the stacks. just put a given note in one stack (assume a note lasts for subunit)
  });
  // TODO: combine contiguous divisions that have the same number of (stacks / span)

  return renderData;
});

const strings = computed(() => props.tuning.length);

function modifyDivisions( transform: (division: Division[]) => Division[]) {
  const clone = structuredClone(toRaw(divisions.value));
  const transformed = transform(clone);
  divisions.value = transformed;
}

// function updateNoteData(col: number, string: number, noteData: NoteData) {
//   modifyDivisions((divisions) => {
//     divisions[col].notes[string] = noteData;
//     return divisions;
//   });
// }

// function split(index: number) {
//   modifyDivisions((divisions) => {
//     const curr = divisions[index];
//     const halfTime = curr.duration / 2;
//     divisions.splice(index, 1, {duration: halfTime, notes: curr.notes}, createEmptyDivision(halfTime, strings.value));
//     return divisions;
//   });
// }

// const lengths = computed(() => divisions.value.map(d => d.duration));
// const smallest = computed(() => Math.min(...lengths.value));

const dragging = ref(0);

</script>

<template>
  <div class="bar">
    <div v-for="i in strings" :style="`grid-row: ${i} / span 1`" class="string"/>
    <TabsDivision v-for="{colStart, span, stacks} in divisionRenders"
      :stacks :tuning :frets
      :style="`grid-column: ${colStart} / span ${span}`" />
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
  grid-template-columns: repeat(v-bind(notches), 1fr);
  /* align-items: center; */
  /* grid-auto-flow: column; */
}


</style>