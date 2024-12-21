<script lang="ts" setup>
import { Spacing, type NoteSpot, type FilledSpot, SpacingsDescending } from './data';
import type { PropType } from 'vue';


type StackData = NoteSpot[];

// don't make this type recursive; the divisions should control their own notches/units
export type DivisionData = {
  notchPosition: number,
  stack: StackData,
  substacks?: Array<{ notchPosition: number, stack: NoteSpot[] }> // relative to root's notches
} 

export type SpacerData = {
  notchStart: number,
  notches: number;
}

const props = defineProps(
  {
    tuning: {
      type: Array as PropType<Midi[]>,
      default: () => defaultTuning,
      validator: (tuning: Midi[], props) => {
        const notes = props.modelValue as FilledSpot[];
        return notes.every(note => note.string >= 0 && note.string < tuning.length);
      }
    },
    frets: {
      type: Number,
      default: 24,
    },
    beats: {
      type: Number,
      default: Spacing.Quarter * 4,
      validator: (beats: number, props) => {
        const notes = props.modelValue as FilledSpot[];
        return notes.every(note => note.position >= 0 && note.position < beats);
      },
    },
    notches: {
      type: Number,
      default: 16,
      validator: (notches: number, props) => {
        const beats = props.beats as number;
        return beats / notches in Spacing;
      }
    },
  });

const unit = computed<Spacing>(() => props.beats / props.notches);

const notes = defineModel<FilledSpot[]>({
  required: true,
  validator: (notes: FilledSpot[]) => {
    const noConflict = notes.length === (new Set(notes.map(note => `${note.string},${note.position}`))).size
    const inGrid = notes.every(note => note.position % SpacingsDescending.at(-1)! == 0);
    // TODO
    return noConflict && inGrid;
  }
});

const stackMap = computed(() => {
  const stackMap = new Map<number, StackData>();
  for (const note of notes.value) {
    const position = note.position;
    if (position >= props.beats) continue;
    if (!stackMap.has(position)) {
      stackMap.set(position, props.tuning.map((_, string) => ({ string, position })));
    }
    stackMap.get(note.position)![note.string] = Object.assign({}, note);
  }
  return stackMap;
})

type StackMap = typeof stackMap.value;

const divisions = computed<DivisionData[]>(() => {
  const sorted = [...stackMap.value].sort(([pos1], [pos2]) => pos1 - pos2);
  const normalized: Array<[number, NoteSpot[]]> = sorted.map( 
    ([pos, stack]) => ([pos / unit.value, stack]
  ));

  return normalized.reduce<DivisionData[]>(
    (acc, [notchPosition, stack]) => {
      if (Number.isInteger(notchPosition)) {
        acc.push({
          notchPosition,
          stack
        })
        return acc;
      }
      const prev = acc.at(-1);
      const hasParent = prev?.notchPosition === Math.floor(notchPosition);
      if (hasParent) {
        const substacks = prev.substacks ?? [];
        substacks.push({ notchPosition, stack})
        prev.substacks = substacks;
        return acc;
      }
      acc.push({
        notchPosition: Math.floor(notchPosition),
        stack: [],
        substacks: [{ notchPosition, stack}]
      })
      return acc;
    }, 
  [])

})

/*
  e.g: 0, 8, 9, 12, 15 
  gaps: 8, 1, 3, 3
  slots: 7, 0, 2, 2
  (position + 1) span (slots): (0 + 1) span 7, (8 + 1) span 0, (9 + 1) span 2, (12 + 1) span 2
  filtered: 1 span 7, 10 span 2, 13 span 2
*/
const emptyDivisions = computed<SpacerData[]>(() => {
  const spacers: SpacerData[] = [];
  const filledPositions = divisions.value.map(note => note.notchPosition);
  const gaps = filledPositions.slice(1).map((n, i) => n - filledPositions[i]);
  const slots = gaps.map(gap => gap - 1);
  slots.forEach((slot, i) => {
    if (slot) {
      spacers.push({ notchStart: filledPositions[i] + 1, notches: slot });
    }
  })
  // const filledPositions = new Set(divisions.value.map(note => note.notchPosition));
  // console.log(filledPositions);
  // let currentSpacer: SpacerData | undefined;
  // for (let i = 0; i < props.notches; i++) {
  //   if (filledPositions.has(i)) {
  //     if (currentSpacer) {
  //       spacers.push(currentSpacer);
  //       currentSpacer = undefined;
  //       continue;
  //     }
  //   }
  //   if (currentSpacer) {
  //     currentSpacer.notches++;
  //     continue;
  //   }
  //   currentSpacer = { notchStart: i, notches: 1 };
  // }
  return spacers;
})

console.log(emptyDivisions.value);

const strings = computed(() => props.tuning.length);

function modifyNotes(transform: (map: StackMap) => StackMap) {
  const transformed = transform(stackMap.value);
  const stacks = transformed.values(); 
  const newNotes: FilledSpot[] = [];
  for (const note of Array.from(stacks).flat()) {
    if (note.data) {
      newNotes.push(note as FilledSpot);
    }
  }
  notes.value = newNotes;
}

// function deleteNote(note: NoteSpot) {
//   modifyNotes(stackMap => {
//     const stack = stackMap.get(note.position);
//     if (stack) {
//       stack[note.string].data = undefined;
//     }
//     return stackMap;
//   })
// }

function updateNote(note: NoteSpot) {
  modifyNotes(stackMap => {
    if (stackMap.has(note.position)) {
      stackMap.get(note.position)![note.string] = note;
    } else {
      stackMap.set(note.position, [note]);
    }
    return stackMap;
  })
}

</script>

<template>
  <div class="bar">
    <div v-for="i in strings" :key="i" :style="`grid-row: ${i} / span 1`" class="string" />
    <TabsDivision
      v-for="data in divisions"
      :key="data.notchPosition"
      :data :tuning :frets
      @note-change="updateNote" />
    <TabsSpacer
      v-for="data in emptyDivisions"
      :key="data.notchStart"
      :data="data"  :strings="strings" />
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
  --min-division-width: 48px;
  max-width: calc(var(--min-division-width) * 24);
  display: grid;
  grid-template-columns: repeat(v-bind(notches), 1fr);
  /* align-items: center; */
  /* grid-auto-flow: column; */
}
</style>