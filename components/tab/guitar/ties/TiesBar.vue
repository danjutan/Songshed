<script lang="ts" setup>
import TieRender, { type TieRenderProps } from "./TieRender.vue";
import type { Tie, TieStore } from "~/model/stores";
import { TieAddInjectionKey, type TieAddState } from "../state/tie-add-state";
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
  newTie?: Tie;
}>();

const editingState = inject(EditingInjectionKey) as EditingState;
// Assumes ties can stretch over one divider, but not two

function tieToRender(tie: Tie): TieRenderProps | undefined {
  const direction = (tie.midiFrom ?? 0) < (tie.midiTo ?? 0) ? "up" : "down";
  const lastString = tie.string === props.numStrings - 1;
  if (tie.from >= props.startPosition && tie.from < props.endPosition) {
    const startColumn =
      props.startColumn + (tie.from - props.startPosition) / props.subUnit;
    if (tie.to < props.endPosition) {
      return {
        row: props.startRow + tie.string,
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
      row: props.startRow + tie.string,
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
      row: props.startRow + tie.string,
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
  // if you get here, the tie is fully part of a different bar
}

const tieRenders = computed<TieRenderProps[]>(() => {
  const ties = [...props.ties.getTies()];
  if (props.newTie && props.newTie.to !== props.newTie.from) {
    ties.push(props.newTie);
  }
  const tieRenders: TieRenderProps[] = [];
  for (const tie of ties) {
    const render = tieToRender(tie);
    if (render) tieRenders.push(render);
  }
  return tieRenders;
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
