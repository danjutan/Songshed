<script lang="ts" setup>
import type {
  GuitarNote,
  NoteStack,
  StackMap,
  Tie,
  Ties,
  TieType,
} from "~/model/data";
import TieRender, { type TieRenderProps } from "./TieRender.vue";
import type { OverlayPosition } from "~/components/tab/overlay-objects";

const props = defineProps<{
  ties: Ties;
  startRow: number;
  startColumn: number;
  startPosition: number;
  endPosition: number;
  subUnit: number;
}>();

interface TieRenderData extends OverlayPosition {
  props: TieRenderProps;
}

// Assumes ties can stretch over one divider, but not two

const ties = computed<TieRenderData[]>(() => {
  const ties: TieRenderData[] = [];
  for (const [string, stack] of props.ties) {
    for (const [position, tie] of stack) {
      // if (position === Spacing.Whole * 2) debugger;
      if (position >= props.startPosition && position < props.endPosition) {
        const startColumn =
          props.startColumn + (position - props.startPosition) / props.subUnit;
        if (tie.to <= props.endPosition) {
          ties.push({
            row: props.startRow + string,
            startColumn,
            endColumn:
              props.startColumn +
              (tie.to - props.startPosition) / props.subUnit,
            props: {
              type: tie.type,
              from: position,
              to: tie.to,
            },
          });
          continue;
        }
        ties.push({
          row: props.startRow + string,
          startColumn,
          endColumn:
            props.startColumn +
            (props.endPosition - props.startPosition) / props.subUnit -
            1,
          props: {
            type: tie.type,
            from: position,
            to: tie.to,
            half: "left",
          },
        });
        continue;
      }
      if (tie.to >= props.startPosition && tie.to <= props.endPosition) {
        ties.push({
          row: props.startRow + string,
          startColumn: props.startColumn,
          endColumn:
            props.startColumn + (tie.to - props.startPosition) / props.subUnit,
          props: {
            type: tie.type,
            from: position,
            to: tie.to,
            half: "right",
          },
        });
        continue;
      }
    }
  }
  return ties;
});
</script>

<template>
  <TieRender
    v-for="{ row, startColumn, endColumn, props } in ties"
    :key="`${row}${startColumn}`"
    v-bind="props"
    :style="{
      gridRow: row,
      gridColumn: `${startColumn} / ${endColumn + 1}`,
    }"
  />
</template>

<style scoped></style>
