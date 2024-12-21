<script lang="ts" setup>
import type { TieData } from "~/model/data";
import TieRender, { type TieRenderProps } from "./TieRender.vue";
import type { OverlayPosition } from "~/components/tab/overlay-objects";
import type { TieMap, TieStore } from "~/model/stores";

const props = defineProps<{
  ties: TieStore;
  startRow: number;
  startColumn: number;
  startPosition: number;
  endPosition: number;
  subUnit: number;
}>();

// Assumes ties can stretch over one divider, but not two

const ties = computed<TieRenderProps[]>(() => {
  const ties: TieRenderProps[] = [];
  for (const [string, stringTies] of props.ties.getTies()) {
    for (const tie of stringTies) {
      const direction = (tie.midiFrom ?? 0) < (tie.midiTo ?? 0) ? "up" : "down";
      if (tie.from >= props.startPosition && tie.from < props.endPosition) {
        const startColumn =
          props.startColumn + (tie.from - props.startPosition) / props.subUnit;
        if (tie.to < props.endPosition) {
          ties.push({
            row: props.startRow + string,
            startColumn,
            endColumn:
              props.startColumn +
              (tie.to - props.startPosition) / props.subUnit,
            type: tie.type,
            from: tie.from,
            to: tie.to,
            direction,
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
          from: tie.from,
          to: tie.to,
          half: "left",
          direction,
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
          from: tie.from,
          to: tie.to,
          half: "right",
          direction,
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
