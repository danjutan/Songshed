<script lang="ts" setup>
import type { TieData } from "~/model/data";
import TieRender, { type TieRenderProps } from "./TieRender.vue";
import type { OverlayPosition } from "~/components/tab/overlay-objects";
import type { Tie, TieMap, TieStore } from "~/model/stores";
import {
  TieAddInjectionKey,
  type TieAddState,
} from "../providers/tie-add-state";

const props = defineProps<{
  ties: TieStore;
  numStrings: number;
  startRow: number;
  startColumn: number;
  startPosition: number;
  endPosition: number;
  subUnit: number;
}>();

const addState = inject(TieAddInjectionKey) as TieAddState;
// Assumes ties can stretch over one divider, but not two

function tieToRender(string: number, tie: Tie): TieRenderProps | undefined {
  const direction = (tie.midiFrom ?? 0) < (tie.midiTo ?? 0) ? "up" : "down";
  if (tie.from >= props.startPosition && tie.from < props.endPosition) {
    const startColumn =
      props.startColumn + (tie.from - props.startPosition) / props.subUnit;
    if (tie.to < props.endPosition) {
      return {
        row: props.startRow + string,
        startColumn,
        endColumn:
          props.startColumn + (tie.to - props.startPosition) / props.subUnit,
        type: tie.type,
        from: tie.from,
        to: tie.to,
        direction,
      };
    }
    return {
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
    };
  }
  if (tie.to >= props.startPosition && tie.to <= props.endPosition) {
    return {
      row: props.startRow + string,
      startColumn: props.startColumn,
      endColumn:
        props.startColumn + (tie.to - props.startPosition) / props.subUnit,
      type: tie.type,
      from: tie.from,
      to: tie.to,
      half: "right",
      direction,
    };
  }
}

const tieRenders = computed<TieRenderProps[]>(() => {
  const ties: TieRenderProps[] = [];
  for (let i = 0; i < props.numStrings; i++) {
    const stringTies = [];
    const fromData = props.ties.getTies().get(i);
    if (addState.newTie.to && addState.newTie.string === i) {
      stringTies.push(addState.newTie);
    }
    if (fromData) {
      if (stringTies.length) {
        stringTies.push(
          ...fromData.filter((tie) => tie.from !== addState.newTie.from),
        );
      } else {
        stringTies.push(...fromData);
      }
    }
    for (const tie of stringTies) {
      const render = tieToRender(i, tie);
      if (render) ties.push(render);
    }
  }

  return ties;
});
</script>

<template>
  <TieRender
    v-for="(data, i) in tieRenders"
    :key="i"
    v-bind="data"
    @update-type="
      (type) =>
        ties.setTie(data.row - startRow, data.from, {
          type,
          to: data.to,
        })
    "
  />
</template>

<style scoped></style>
