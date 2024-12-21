<script lang="ts" setup>
import type { PropType } from "vue";
import type { NoteSpot, BarStore } from "../data";
import { Spacing } from "../data";
import { ExpansionStateKey } from "../providers/expansion-state";
import Stack from "./Stack.vue";
import Drape, { type DrapeData } from "./overlays/Drape.vue";
import ExpanderOverlay from "./overlays/ExpanderOverlay.vue";
import UnexpanderOverlay from "./overlays/UnexpanderOverlay.vue";

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

const isNotch = (column: ColumnData) => column.position % unit.value === 0;
const isEmpty = (column: ColumnData) => column.stack.every(spot => !spot.data);
const hasSubstacks = (columnIndex: number) => columnData.value
  .slice(columnIndex, columnIndex + props.subdivisions)
  .some(col => !isEmpty(col));

const columnData = computed<ColumnData[]>(() => {
  const columns: Array<ColumnData> = [];

  const stackMap = props.data.getStacks();

  for (let position = props.data.start; position < props.data.end; position += subunit.value) {
    const stack = stackMap.get(position) || props.data.tuning.map((_, string) => ({ string, position }));
    columns.push({ stack, position });
  }

  return columns;
});

const expansionState = inject(ExpansionStateKey)!;

// TODO: make sure to set this up to work now that substacks aren't part of stacks
const isExpanded = (column: number) =>
  expansionState.isExpanded(props.data.start, props.notches * props.subdivisions, column);

/* const expanded = computed<Set<number>>(() =>
  new Set(divisions.value
    .map(({ notchPosition }) => notchPosition)
    .filter(col => isExpanded(col)))); */

const toggleExpanded = (column: number, num?: number) =>
  expansionState.toggleExpanded(props.data.start, props.notches * props.subdivisions, column, num);

const spacers = computed<DrapeData[]>(() => {
  const drapeData: DrapeData[] = [];
  let firstNotchIndex: number | undefined;
  let lastNotchIndex: number | undefined;
  columnData.value.forEach((col, i) => {
    if (col.stack.every(spot => !spot.data)) {
      if (isNotch(col)) {
        lastNotchIndex = i;
        if (firstNotchIndex === undefined) {
          firstNotchIndex = i;
        }
      }
      return;
    }
    // if (firstNotchIndex !== undefined && lastNotchIndex !== undefined) {
    //   drapeData.push({ start: firstNotchIndex + 1, columns: lastNotchIndex - firstNotchIndex });
    // }
    if (firstNotchIndex !== undefined) {
      const columns = isNotch(col) ? i - firstNotchIndex : lastNotchIndex! - firstNotchIndex;
      drapeData.push({ start: firstNotchIndex + 1, columns });
    }
    firstNotchIndex = undefined;
    lastNotchIndex = undefined;
  });
  if (firstNotchIndex !== undefined) {
    const columns = columnData.value.length - firstNotchIndex;
    drapeData.push({ start: firstNotchIndex + 1, columns });
  }
  return drapeData;
});

const substackGroups = computed<DrapeData[]>(() => {
  const isFilledSubstack = (col: ColumnData) => !isNotch(col) && !isEmpty(col);
  const drapeData: DrapeData[] = [];
  for (let i = 0; i < columnData.value.length; i += props.subdivisions) {
    for (let c = 0; c < props.subdivisions; c++) {
      if (isFilledSubstack(columnData.value[i + c])) {
        drapeData.push({ start: i + 2, columns: props.subdivisions - 1 });
        break;
      }
    }
  }

  return drapeData;
});

watchEffect(() => console.log(substackGroups.value));
// everything will expand to var(--cell-height)

/* const expandsTo = computed<{ [column: number]: string }>(
  () => Object.fromEntries(
    divisions.value.map(div => [
      div.notchPosition,
      div.substacks ? `calc(${subdivisions.value} * var(--cell-height))` : "var(--cell-height)",
    ]))); */

const gridTemplateColumns = computed<string>(() => {
  const columns: string[] = columnData.value.map((col, i) => {
    if (isExpanded(i + 1) || (isNotch(col) && (!isEmpty(col) || hasSubstacks(i)))) {
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
    expansionState.setExpanded(props.data.start, props.notches, false, 0, props.notches);
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
    <Drape
      v-for="{ start, columns } in spacers"
      :key="start"
      class="empty-spacer"
      collapsed="show"
      default="hide"
      up="reverse"
      :start
      :columns
      :num-strings="strings"
      :row-start="2"
      @click="toggleExpanded(start, columns)">
      <template #up>
        <UnexpanderOverlay v-if="isExpanded(start)" />
      </template>
      <template
        #down>
        <ExpanderOverlay />
      </template>
    </Drape>
    <Drape
      v-for="{ start, columns } in substackGroups"
      :key="start"
      class="substack-spacer"
      collapsed="show"
      default="hide"
      up="reverse"
      height-unit="var(--cell-height) * 2"
      :start
      :columns
      :num-strings="strings"
      :row-start="2"
      @click="toggleExpanded(start, columns)">
      <template #up>
        <UnexpanderOverlay v-if="isExpanded(start)" />
      </template>
      <template
        #down>
        <ExpanderOverlay />
      </template>
    </Drape>
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
