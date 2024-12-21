<script lang="ts" setup>
import type { Ties } from "~/model/data";
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

// Assumes ties can stretch over one divider, but not two

const ties = computed<TieRenderProps[]>(() => {
  const ties: TieRenderProps[] = [];
  for (const [string, stack] of props.ties) {
    for (const [position, tie] of stack) {
      // if (position === Spacing.Whole * 2) debugger;
      if (position >= props.startPosition && position < props.endPosition) {
        const startColumn =
          props.startColumn + (position - props.startPosition) / props.subUnit;
        if (tie.to < props.endPosition) {
          ties.push({
            row: props.startRow + string,
            startColumn,
            endColumn:
              props.startColumn +
              (tie.to - props.startPosition) / props.subUnit,
            type: tie.type,
            from: position,
            to: tie.to,
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
          type: tie.type,
          from: position,
          to: tie.to,
          half: "left",
        });
        continue;
      }
      if (tie.to >= props.startPosition && tie.to <= props.endPosition) {
        ties.push({
          row: props.startRow + string,
          startColumn: props.startColumn,
          endColumn:
            props.startColumn + (tie.to - props.startPosition) / props.subUnit,
          type: tie.type,
          from: position,
          to: tie.to,
          half: "right",
        });
        continue;
      }
    }
  }
  return ties;
});
</script>

<template>
  <TieRender v-for="(props, i) in ties" :key="i" v-bind="props" />
</template>

<style scoped></style>
