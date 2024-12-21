<script setup lang="ts">
import type { GuitarNote } from "../data";
import Strings from "./Strings.vue";
import Stack from "./Stack.vue";
import Overlay from "./Overlay.vue";
import Unexpander from "./Unexpander.vue";

export type GuitarStack = {
  stack: Array<GuitarNote>;
  position: number;
};

const props = defineProps<{
  stackData: GuitarStack[];
  subdivisions: number;
  notchUnit: number;
  startColumn: number;
  startRow: number;
  collapseEmpty?: boolean;
  collapseSubdivisions?: boolean;
  tuning: Midi[];
  frets: number;
  numStrings: number;
}>();

const emit = defineEmits<{
  noteDelete: [position: number, string: number];
  noteChange: [position: number, note: GuitarNote];
}>();

const isNotch = (position: number) => position % props.notchUnit === 0;
const subUnit = computed(() => props.notchUnit / props.subdivisions);

const expanded = reactive<Set<number>>(new Set());

const collapsedEmpty = computed<Set<number>>(() => {
  const collapsed = new Set<number>();
  if (!props.collapseEmpty) return collapsed;
  const emptyStack = (stack: Array<GuitarNote>) =>
    stack.length === 0; /*  stack.every((spot) => !spot.data); */
  props.stackData.forEach((notch, i) => {
    if (!isNotch(notch.position)) return;
    const notchGroup = props.stackData.slice(i, i + props.subdivisions);
    const emptyNotchGroup = notchGroup.every(({ stack }) => emptyStack(stack));
    if (emptyNotchGroup) {
      notchGroup.forEach(({ position }) => collapsed.add(position));
    }
  });
  return collapsed;
});

const collapsed = computed<Set<number>>(() => {
  const positions = new Set<number>(
    props.stackData
      .map((c) => c.position)
      .filter((position) => {
        if (expanded.has(position)) return false;
        if (props.collapseEmpty && collapsedEmpty.value.has(position)) return true;
        if (isNotch(position)) return false;
        if (props.collapseSubdivisions) return true;
      }),
  );
  return positions;
});

function toggleSubdivisions(notchCol: GuitarStack) {
  const firstPos = notchCol.position; /* notchCol.position + subUnit.value; */
  const collapse = expanded.has(firstPos);
  for (let i = 0; i < props.subdivisions; i++) {
    const pos = firstPos + i * subUnit.value;
    if (collapse) {
      expanded.delete(pos);
      continue;
    }
    expanded.add(pos);
  }
}
</script>

<template>
  <Strings :start-column :start-row :columns="stackData.length" :num-strings="numStrings" />
  <template v-for="(column, i) in stackData" :key="column.position">
    <Stack
      :style="{
        // borderTop: isNotch(column.position) && '1px solid maroon',
        borderRight: i < stackData.length && '1px solid lightgray',
        gridColumn: startColumn + i,
        gridRow: startRow,
      }"
      :notes="column.stack"
      :collapse="collapsed.has(column.position)"
      :tuning
      :frets
      @note-change="(note: GuitarNote) => emit('noteChange', column.position, note)"
      @note-delete="(string: number) => emit('noteDelete', column.position, string)"
    />
    <template v-if="isNotch(column.position)">
      <template v-if="collapsedEmpty.has(column.position)">
        <Overlay
          :start-column="startColumn + i"
          :columns="props.subdivisions"
          :start-row
          :rows="numStrings"
        >
          <div
            class="overlay-fill"
            :class="{ expanded: expanded.has(column.position) }"
            @click="toggleSubdivisions(column)"
          />
        </Overlay>
      </template>
      <template v-else-if="props.collapseSubdivisions">
        <Overlay
          :start-column="1 + startColumn + i"
          :columns="props.subdivisions - 1"
          :start-row
          :rows="numStrings"
        >
          <div
            class="overlay-fill"
            :class="{ expanded: expanded.has(column.position + subUnit) }"
            @click="toggleSubdivisions(column)"
          />
        </Overlay>
      </template>
      <Unexpander
        v-if="expanded.has(column.position + subUnit)"
        class="unexpander"
        :start-column="startColumn + i"
        :columns="props.subdivisions"
        :row="startRow + 1"
        @click="toggleSubdivisions(column)"
      />
    </template>
  </template>
</template>

<style>
.overlay-fill {
  z-index: 1;
  height: 100%;
  cursor: pointer;
  &:hover {
    background: var(--substack-bg);
  }
}
</style>
