<script setup lang="ts">
import type { GuitarNote, NoteStack, StackMap } from "~/model/data";
import Strings from "./Strings.vue";
import Stack from "./Stack.vue";
import Overlay from "./Overlay.vue";
import Unexpander from "./Unexpander.vue";
import {
  SelectionInjectionKey,
  type SelectionState,
} from "../state/selection-state";
import { SettingsInjectionKey, type Settings } from "../state/settings-state";

const props = defineProps<{
  stackData: StackMap<GuitarNote>;
  subUnit: number;
  beatSize: number;
  startColumn: number;
  startRow: number;
  tuning: Midi[];
  frets: number;
  numStrings: number;
}>();

const emit = defineEmits<{
  noteDelete: [position: number, string: number];
  noteChange: [position: number, string: number, note: GuitarNote];
}>();

const settings = inject(SettingsInjectionKey) as Settings;

const selectionState = inject(SelectionInjectionKey) as SelectionState;

const isNotch = (position: number) => position % props.beatSize === 0;

const expanded = reactive<Set<number>>(new Set());

const collapsedEmpty = computed<Set<number>>(() => {
  const collapsed = new Set<number>();
  if (!settings.collapseEmpty) return collapsed;
  const emptyStack = (stack: NoteStack<GuitarNote>) =>
    stack.size === 0; /*  stack.every((spot) => !spot.data); */
  props.stackData.forEach((_, position) => {
    if (!isNotch(position)) return;
    const notchGroup: number[] = [];
    for (let i = 0; i < settings.subdivisions; i++) {
      const subPos = position + i * props.subUnit;
      const stack = props.stackData.get(subPos);
      if (stack && !emptyStack(stack)) return;
      notchGroup.push(subPos);
    }
    notchGroup.forEach((position) => collapsed.add(position));
  });
  return collapsed;
});

const collapsed = computed<Set<number>>(() => {
  const positions = new Set<number>(
    [...props.stackData]
      .map(([position, _]) => position)
      .filter((position) => {
        if (expanded.has(position)) return false;
        if (settings.collapseEmpty && collapsedEmpty.value.has(position))
          return true;
        if (isNotch(position)) return false;
        if (settings.collapseSubdivisions) return true;
      }),
  );
  return positions;
});

function toggleSubdivisions(notchPosition: number) {
  const collapse = expanded.has(notchPosition);
  for (let i = 0; i < settings.subdivisions; i++) {
    const pos = notchPosition + i * props.subUnit;
    if (collapse) {
      expanded.delete(pos);
      continue;
    }
    expanded.add(pos);
  }
}
</script>

<template>
  <Strings
    :start-column
    :start-row
    :columns="stackData.size"
    :num-strings="numStrings"
  />
  <template
    v-for="([position, stack], i) in stackData.entries()"
    :key="position"
  >
    <Stack
      :style="{
        // borderTop: isNotch(column.position) && '1px solid maroon',
        borderRight: i < stackData.size && '1px solid lightgray',
        gridColumn: startColumn + i,
        gridRow: `${startRow} / span ${numStrings}`,
      }"
      :notes="stack"
      :position="position"
      :collapse="collapsed.has(position)"
      :tuning
      :frets
      @note-change="
        (string: number, note: GuitarNote) =>
          emit('noteChange', position, string, note)
      "
      @note-delete="(string: number) => emit('noteDelete', position, string)"
    />
    <template v-if="isNotch(position)">
      <template v-if="collapsedEmpty.has(position)">
        <Overlay
          :start-column="startColumn + i"
          :columns="settings.subdivisions"
          :start-row
          :rows="numStrings"
          @mousedown="
            !selectionState.isSelected(position) &&
              selectionState.start(
                position,
                position + subUnit * (settings.subdivisions - 1),
              )
          "
          @mousemove="
            selectionState.drag(
              position,
              position + subUnit * (settings.subdivisions - 1),
            )
          "
        >
          <div
            class="overlay-fill"
            :class="{ expanded: expanded.has(position) }"
            @click="toggleSubdivisions(position)"
          />
        </Overlay>
      </template>
      <template v-else-if="settings.collapseSubdivisions">
        <Overlay
          :start-column="1 + startColumn + i"
          :columns="settings.subdivisions - 1"
          :start-row
          :rows="numStrings"
          @mousedown="
            !selectionState.isSelected(position + subUnit) &&
              selectionState.start(
                position,
                position + subUnit * (settings.subdivisions - 1),
              )
          "
          @mousemove="
            selectionState.drag(
              position,
              position + subUnit * (settings.subdivisions - 1),
            )
          "
        >
          <div
            class="overlay-fill"
            :class="{ expanded: expanded.has(position + subUnit) }"
            @click="toggleSubdivisions(position)"
          />
        </Overlay>
      </template>
      <Unexpander
        v-if="expanded.has(position + subUnit)"
        class="unexpander"
        :start-column="startColumn + i"
        :columns="settings.subdivisions"
        :row="startRow + numStrings"
        @click="toggleSubdivisions(position)"
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
