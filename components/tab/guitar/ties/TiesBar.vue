<script lang="ts" setup>
import TieRender, { type TieRenderProps } from "./TieRender.vue";
import type { Tie, TieMap, TieStore } from "~/model/stores";
import {
  TieAddInjectionKey,
  type TieAddState,
} from "../../state/tie-add-state";
import {
  EditingInjectionKey,
  type EditingState,
} from "../../state/editing-state";

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
const editingState = inject(EditingInjectionKey) as EditingState;
// Assumes ties can stretch over one divider, but not two

function tieToRender(string: number, tie: Tie): TieRenderProps | undefined {
  const direction = (tie.midiFrom ?? 0) < (tie.midiTo ?? 0) ? "up" : "down";
  const lastString = string === props.numStrings - 1;
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
        lastString,
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
      otherHalfColumns: (tie.to - props.endPosition) / props.subUnit + 1,
      lastString,
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
      otherHalfColumns: (props.startPosition - tie.from) / props.subUnit,
      lastString,
      direction,
    };
  }
}

const tieRenders = computed<TieRenderProps[]>(() => {
  const ties: TieRenderProps[] = [];
  for (let i = 0; i < props.numStrings; i++) {
    const stringTies = [];
    const fromData = props.ties.getTies().get(i);
    if (
      addState.newTie.to &&
      addState.newTie.string === i &&
      addState.newTie.to !== addState.newTie.from
    ) {
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

const isEditing = (data: TieRenderProps) => {
  if (editingState.editingNote) {
    const { string, position } = editingState.editingNote;
    return (
      string === data.row - props.startRow &&
      (position === data.from || position === data.to)
    );
  }
  return false;
};
</script>

<template>
  <TieRender
    v-for="(data, i) in tieRenders"
    :key="i"
    v-bind="data"
    :editing="isEditing(data)"
    @update-type="
      (type) =>
        ties.setTie(data.row - startRow, data.from, {
          type,
          to: data.to,
        })
    "
    @delete="ties.deleteTie(data.row - startRow, data.from)"
  />
</template>

<style scoped></style>
