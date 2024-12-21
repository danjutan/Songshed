<script lang="ts" setup>
import type { PropType } from "vue";
import type { NoteSpot, FilledSpot } from "../data";
import { Spacing, smallestSpacing } from "../data";

type StackData = NoteSpot[];

// don't make this type recursive; the divisions should control their own notches/units
export type DivisionData = {
  notchPosition: number
  stack: StackData
  substacks?: Array<{ notchPosition: number, stack: NoteSpot[] }> // relative to root's notches
};

const props = defineProps({

  tuning: {
    type: Array as PropType<Midi[]>,
    default: () => defaultTuning,
  },

  frets: {
    type: Number,
    default: 24,
  },

  beats: {
    type: Number,
    default: 4 * Spacing.Quarter,
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
    },
  },

  // Where in the noteData does this start?
  notePosition: {
    type: Number,
    default: 0,
  },
});

const unit = computed<Spacing>(() => props.beats / props.notches);
const strings = computed(() => props.tuning.length);

const notes = defineModel<FilledSpot[]>({
  required: true,
});

const stackMap = computed(() => {
  const stackMap = new Map<number, StackData>();
  const emptyStack = (position: number) => props.tuning.map((_, string) => ({ string, position }));
  for (let position = 0; position < props.beats; position += unit.value) {
    stackMap.set(position, emptyStack(position));
  }
  for (const note of notes.value) {
    const position = note.position;
    if (!stackMap.has(position)) {
      // These are the substacks, which don't fit on the grid lines in the last loop
      stackMap.set(position, emptyStack(position));
    }
    stackMap.get(note.position)![note.string] = Object.assign({}, note);
  }
  return stackMap;
});

type StackMap = typeof stackMap.value;

const divisions = computed<DivisionData[]>(() => {
  const sorted = [...stackMap.value].sort(([pos1], [pos2]) => pos1 - pos2);
  const normalized: Array<[number, NoteSpot[]]> = sorted.map(
    ([pos, stack]) => ([(pos - props.notePosition) / unit.value, stack]
    ));

  return normalized.reduce<DivisionData[]>(
    (acc, [notchPosition, stack]) => {
      if (Number.isInteger(notchPosition)) {
        acc.push({
          notchPosition,
          stack,
        });
        return acc;
      }
      const prev = acc.at(-1);
      const hasParent = prev?.notchPosition === Math.floor(notchPosition);
      if (hasParent) {
        const substacks = prev.substacks ?? [];
        substacks.push({ notchPosition, stack });
        prev.substacks = substacks;
        return acc;
      }
      acc.push({
        notchPosition: Math.floor(notchPosition),
        stack: [],
        substacks: [{ notchPosition, stack }],
      });
      return acc;
    },
    []);
});

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

function updateNote(note: NoteSpot) {
  modifyNotes((stackMap) => {
    if (stackMap.has(note.position)) {
      stackMap.get(note.position)![note.string] = note;
    }
    else {
      stackMap.set(note.position, [note]);
    }
    return stackMap;
  });
}

const divisionPlacement = (column: number) => ({
  gridRow: `2 / span ${strings.value}`,
  gridColumn: `${column} / span 1`,
});

const subdivisions = computed(() => (Spacing.Whole / smallestSpacing) / props.notches);
</script>

<template>
  <div class="bar">
    <TabBarStrings />
    <TabBarDivision
      v-for="data in divisions"
      :key="data.notchPosition"
      debug
      :subdivisions
      :data
      :unit
      :tuning
      :frets
      :style="divisionPlacement(data.notchPosition + 1)"
      @note-change="updateNote"
    />
    <TabBarToolbar
      :divisions
      :tuning
      :subdivisions
    />
    <!-- <TabBarSpacer
      v-for="data in emptyDivisions"
      :key="data.notchStart"
      :data="data"
      :strings="strings"
      @hover="emptySpotHover"
    /> -->
  </div>
</template>

<style>
.bar {
  --cell-height: 23px;
  --note-font-size: calc(var(--cell-height) * 0.8);
  --substack-bg: rgba(255, 0, 0, 0.1);
  --string-width: 1px;
  --string-color: gray;
  --highlight-color: rgba(172, 206, 247, 0.6);
  margin: 10px;
  display: grid;
  grid-template-columns: repeat(v-bind(notches), 1fr);
  grid-template-rows: var(--cell-height) repeat(v-bind(strings), var(--cell-height))
}
</style>
