<script lang="ts" setup>
import type { PropType } from "vue";
import type { NoteSpot, BarStore } from "../data";
import { Spacing, smallestSpacing } from "../data";
import { VisualizationStateKey } from "../providers";
import Stack from "./Stack.vue";

export type DivisionData = {
  notchPosition: number
  stack: NoteSpot[]
  substacks?: Array<{ notchPosition: number, stack: NoteSpot[] }> // relative to root's notches
};

type ColumnData = {
  stack: NoteSpot[]
  position: number
};

const props = defineProps({
  notches: {
    type: Number,
    default: 16,
    validator: (notches: number, props) => {
      const data = props.data as BarStore;
      const subdivisions = props.subdivisions as number;
      const beats = data.end - data.start;
      return beats / (notches * subdivisions) in Spacing;
    },
  },

  // per notch
  subdivisions: {
    type: Number,
    default: 4,
  },

  data: {
    type: Object as PropType<BarStore>,
    required: true,
  },
});

const strings = computed(() => props.data.strings);
const unit = computed<Spacing>(() => (props.data.end - props.data.start) / (props.notches));
const subunit = computed<Spacing>(() => unit.value / props.subdivisions);

const columnData = computed<ColumnData[]>(() => {
  const columns: Array<ColumnData> = [];

  const stackMap = props.data.getStacks();

  for (let position = props.data.start; position < props.data.end; position += subunit.value) {
    const stack = stackMap.get(position) || props.data.tuning.map((_, string) => ({ string, position }));
    columns.push({ stack, position });
  }

  return columns;
});

const visualizationState = inject(VisualizationStateKey)!;

const isExpanded = (column: number) =>
  visualizationState.isExpanded(props.data.start, props.notches, column);

/* const expanded = computed<Set<number>>(() =>
  new Set(divisions.value
    .map(({ notchPosition }) => notchPosition)
    .filter(col => isExpanded(col)))); */

const toggleExpanded = (column: number, num?: number) =>
  visualizationState.toggleExpanded(props.data.start, props.notches, column, num);

// everything will expand to var(--cell-height)
/* const expandsTo = computed<{ [column: number]: string }>(
  () => Object.fromEntries(
    divisions.value.map(div => [
      div.notchPosition,
      div.substacks ? `calc(${subdivisions.value} * var(--cell-height))` : "var(--cell-height)",
    ]))); */

const gridTemplateColumns = computed<string>(() => {
  const columns: string[] = columnData.value.map(({ position }) => {
    if (position % unit.value === 0) {
      return "var(--cell-height)";
    }
    return "1fr";
  });
  /* for (const column of divisions.value.map(({ notchPosition }) => notchPosition)) {
    if (isExpanded(column)) {
      columns.push(`minmax(${expandsTo.value[column]}, auto)`);
      continue;
    }
    columns.push("auto");
  } */
  return columns.join(" ");
});

const divisionPlacement = (column: number) => ({
  gridRow: `1 / span ${strings.value}`,
  gridColumn: `${column} / span 1`,
});

function noteChange(changed: NoteSpot) {
  const { position, string, data } = changed;
  const stack = props.data.getStack(position);
  if (!stack || (stack.filter(({ data }) => data).length === 1 && !data)) {
    visualizationState.setExpanded(props.data.start, props.notches, false, 0, props.notches);
  }
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
    <Stack v-for="(col, i) in columnData"
           :key="col.position"
           :style="{ gridColumn: i + 1 }"
           :frets="data.frets"
           :tuning="data.tuning"
           :stack="col.stack"
           :class="{ substack: col.position % unit !== 0, even: i % 2 === 0 }"
           @note-change="noteChange"
    />
    <!-- <TabBarDivision v-for="div in divisions" -->
    <!--                 :key="div.notchPosition" -->
    <!--                 :subdivisions -->
    <!--                 :data="div" -->
    <!--                 :div -->
    <!--                 :subunit -->
    <!--                 :tuning="data.tuning" -->
    <!--                 :frets="data.frets" -->
    <!--                 :style="divisionPlacement(div.notchPosition)" -->
    <!--                 @note-change="noteChange" -->
    <!-- /> -->
    <!-- <TabBarToolbar :divisions -->
    <!--                :tuning="data.tuning" -->
    <!--                :subdivisions -->
    <!--                :expanded -->
    <!--                @toggle-expanded="toggleExpanded" -->
    <!-- /> -->
  </div>
</template>

<style>
.bar {
  display: grid;
  grid-template-columns: v-bind(gridTemplateColumns);
  grid-template-rows: var(--cell-height) repeat(v-bind(strings), var(--cell-height)) var(--cell-height)
}

.stack {
  grid-row: 2 / span v-bind(strings);
}

.stack.substack {
  border-top: 1px solid red;
}

.stack.substack.even {
  border-top: 1px solid blue;
}
</style>
