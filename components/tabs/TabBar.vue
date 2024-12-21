<script lang="ts" setup>
import type { PropType } from "vue";
import type { NoteData, NoteSpot, FilledSpot } from "./data";
import { SpacingsDescending, Spacing } from "./data";

type StackData = NoteSpot[];

// don't make this type recursive; the divisions should control their own notches/units
export type DivisionData = {
  notchPosition: number
  stack: StackData
  substacks?: Array<{ notchPosition: number, stack: NoteSpot[] }> // relative to root's notches
};

export type SpacerData = {
  notchStart: number
  notches: number
};

const props = defineProps(
  {
    tuning: {
      type: Array as PropType<Midi[]>,
      default: () => defaultTuning,
      validator: (tuning: Midi[], props) => {
        const notes = props.modelValue as FilledSpot[];
        return notes.every(note => note.string >= 0 && note.string < tuning.length);
      },
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
      },
    },
  });

const unit = computed<Spacing>(() => props.beats / props.notches);
const strings = computed(() => props.tuning.length);

const notes = defineModel<FilledSpot[]>({
  required: true,
  validator: (notes: FilledSpot[]) => {
    const noConflict = notes.length === (new Set(notes.map(note => `${note.string},${note.position}`))).size;
    const inGrid = notes.every(note => note.position % SpacingsDescending.at(-1)! == 0);
    // TODO
    return noConflict && inGrid;
  },
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
});

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
  });
  return spacers;
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

const newNoteCol = ref(0);
const newNoteRow = ref(0);
const showNewNote = ref(false);
const newNoteData = ref<NoteData>();

function emptySpotHover(string: number, notch: number) {
  showNewNote.value = true;
  newNoteCol.value = notch;
  newNoteRow.value = string;
}
</script>

<template>
  <div class="bar">
    <TabsStrings />
    <TabsDivision
      v-for="data in divisions"
      :key="data.notchPosition"
      :data
      :tuning
      :frets
      @note-change="updateNote"
    />
    <TabsSpacer
      v-for="data in emptyDivisions"
      :key="data.notchStart"
      :data="data"
      :strings="strings"
      @hover="emptySpotHover"
    />
    <TabsNoteInput
      v-if="showNewNote"
      start-focused
      collapse
      class="new-note"
      :data="newNoteData"
      :tuning="tuning[newNoteRow - 1]"
      :frets="frets"
      @mouseleave="() => showNewNote = false"
    />
  </div>
</template>

<style>
.bar {
  --min-division-width: 48px;
  /* --z-index-notes: 10; */
  /* border: 1px solid black; */
  margin: 10px;
  display: grid;
  grid-template-columns: repeat(v-bind(notches), 1fr);
  grid-template-rows: repeat(v-bind(strings), calc(var(--min-division-width) / 2))
  /* height: calc(var(--min-division-width) / 2 * v-bind(strings)); */
  /* grid-template-rows:  */
  /* align-items: center; */
  /* grid-auto-flow: column; */
}

.new-note {
  grid-row: v-bind(newNoteRow) / span 1;
  grid-column: v-bind(newNoteCol) / span 1;
  /* max-width: 100%; */
  /* border: 1px dashed red; */
}
</style>
