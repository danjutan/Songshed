<script lang="ts" setup>
import type { PropType } from "vue";
import type { NoteSpot, BarStore } from "../data";
import { Spacing, smallestSpacing } from "../data";

// don't make this type recursive; the divisions should control their own notches/units
export type DivisionData = {
  notchPosition: number
  stack: NoteSpot[]
  substacks?: Array<{ notchPosition: number, stack: NoteSpot[] }> // relative to root's notches
};

const props = defineProps({

  notches: {
    type: Number,
    default: 16,
    validator: (notches: number, props) => {
      const data = props.data as BarStore;
      const beats = data.end - data.start;
      return beats / notches in Spacing;
    },
  },

  data: {
    type: Object as PropType<BarStore>,
    required: true,
  },
});

const strings = computed(() => props.data.strings);
const unit = computed<Spacing>(() => (props.data.end - props.data.start) / props.notches);

type StacksMap = Map<number, NoteSpot[]>;
const stacksMap = computed<StacksMap>(() => {
  const map = new Map<number, NoteSpot[]>();
  const emptyStack = (position: number) => props.data.tuning.map((_, string) => ({ string, position }));
  for (let position = 0; position < props.data.end - props.data.start; position += unit.value) {
    const stack = emptyStack(position);
    map.set(position, stack);
  }
  for (const [position, stack] of props.data.getStacks()) {
    const existing = map.get(position) || emptyStack(position);
    for (const note of stack) {
      existing[note.string] = note;
    }
    map.set(position, existing);
  }
  return map;
});

const divisions = computed<DivisionData[]>(() => {
  const sorted = [...stacksMap.value].sort(([pos1], [pos2]) => pos1 - pos2);
  const normalized: Array<[number, NoteSpot[]]> = sorted.map(
    ([pos, stack]) => ([(pos - props.data.start) / unit.value, stack]
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

const divisionPlacement = (column: number) => ({
  gridRow: `2 / span ${strings.value}`,
  gridColumn: `${column} / span 1`,
});

const subdivisions = computed(() => (Spacing.Whole / smallestSpacing) / props.notches);

function noteChange(changed: NoteSpot) {
  const { position, string, data } = changed;
  if (data) {
    props.data.setNote(position, string, data);
    return;
  }
  props.data.deleteNote(position, string);
}
</script>

<template>
  <div class="bar">
    <TabBarStrings />
    <TabBarDivision
      v-for="div in divisions"
      :key="div.notchPosition"
      debug
      :subdivisions
      :data="div"
      :div
      :unit
      :tuning="data.tuning"
      :frets="data.frets"
      :style="divisionPlacement(div.notchPosition + 1)"
      @note-change="noteChange"
    />
    <TabBarToolbar
      :divisions
      :tuning="data.tuning"
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
  display: grid;
  grid-template-columns: repeat(v-bind(notches), 1fr);
  grid-template-rows: var(--cell-height) repeat(v-bind(strings), var(--cell-height))
}
</style>
