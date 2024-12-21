<script lang="ts" setup>
import type { PropType } from "vue";
import type { NoteSpot, BarStore } from "../data";
import { Spacing, smallestSpacing } from "../data";
import { VisualizationStateKey } from "../providers";

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

const divisions = computed<DivisionData[]>(() => {
  const stackMap = props.data.getStacks();
  for (let position = props.data.start; position < props.data.end; position += unit.value) {
    if (!stackMap.has(position)) {
      const emptyStack = props.data.tuning.map((_, string) => ({ string, position }));
      stackMap.set(position, emptyStack);
    }
  }

  const divisions: DivisionData[] = [];

  for (const [position, stack] of stackMap.entries()) {
    const notchPosition = 1 + (position - props.data.start) / unit.value;
    if (Number.isInteger(notchPosition)) {
      divisions.push({ notchPosition, stack });
      continue;
    }
    const prev = divisions.at(-1)!;
    const substacks = prev.substacks ?? [];
    substacks.push({ notchPosition, stack });
    prev.substacks = substacks;
  }

  divisions.sort((a, b) => a.notchPosition - b.notchPosition);

  return divisions;
});

const subdivisions = computed(() => (Spacing.Whole / smallestSpacing) / props.notches);

const visualizationState = inject(VisualizationStateKey)!;

const isExpanded = (column: number) =>
  visualizationState.isExpanded(props.data.start, props.notches, column);

const expanded = computed<Set<number>>(() =>
  new Set(divisions.value
    .map(({ notchPosition }) => notchPosition)
    .filter(col => isExpanded(col))));

const toggleExpanded = (column: number, num?: number) =>
  visualizationState.toggleExpanded(props.data.start, props.notches, column, num);

const expandsTo = computed<{ [column: number]: string }>(
  () => Object.fromEntries(
    divisions.value.map(div => [
      div.notchPosition,
      div.substacks ? `calc(${subdivisions.value} * var(--cell-height))` : "var(--cell-height)",
    ])));

const gridTemplateColumns = computed<string>(() => {
  const columns: string[] = [];
  for (const column of divisions.value.map(({ notchPosition }) => notchPosition)) {
    if (isExpanded(column)) {
      columns.push(expandsTo.value[column]);
      continue;
    }
    columns.push("auto");
  }
  return columns.join(" ");
});

const divisionPlacement = (column: number) => ({
  gridRow: `2 / span ${strings.value}`,
  gridColumn: `${column} / span 1`,
});

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
    <TabBarDivision v-for="div in divisions"
                    :key="div.notchPosition"
                    :subdivisions
                    :data="div"
                    :div
                    :unit
                    :tuning="data.tuning"
                    :frets="data.frets"
                    :style="divisionPlacement(div.notchPosition)"
                    @note-change="noteChange"
    />
    <TabBarToolbar :divisions
                   :tuning="data.tuning"
                   :subdivisions
                   :expanded
                   @toggle-expanded="toggleExpanded"
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
  grid-template-columns: v-bind(gridTemplateColumns);
  grid-template-rows: var(--cell-height) repeat(v-bind(strings), var(--cell-height))
}
</style>
