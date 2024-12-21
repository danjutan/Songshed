<script lang="ts" setup>
import type { GuitarStore } from "~/model/stores";
import type { Bar, TablineColumn } from "../Tab.vue";
import GuitarBar from "./GuitarBar.vue";
import TiesBar from "./ties/TiesBar.vue";
import BendRender from "./bends/BendRender.vue";
import BendDragBar from "./bends/BendDragBar.vue";
import { createBendRenderState } from "./state/bend-render-state";
import { TieAddInjectionKey, type TieAddState } from "./state/tie-add-state";
import { SettingsInjectionKey, type Settings } from "../state/settings-state";

const props = defineProps<{
  tabLineIndex: number;
  guitarStore: GuitarStore;
  bars: Bar[];
  startRow: number;
  posToCol: (pos: number) => TablineColumn;
  columnsPerBar: number;
  beatSize: number;
  subUnit: number;
}>();

const tieAddState = inject(TieAddInjectionKey) as TieAddState;

const bendRenders = computed(() => {
  return createBendRenderState(
    props.guitarStore.ties,
    computed(() => props.startRow + 1),
    props.posToCol,
    computed(() => tieAddState.newBend),
  ).value;
});

const bendRow = computed(() =>
  bendRenders.value && bendRenders.value.size ? props.startRow : undefined,
);

const notesRow = computed(() =>
  bendRow.value ? bendRow.value + 1 : props.startRow,
);
</script>

<template>
  <template v-for="(bar, i) in bars" :key="bar.start">
    <BendDragBar
      v-if="bendRow"
      :bend-row
      :start-column="i * (columnsPerBar + 1) + 1"
      :bar-positions="[...bar.stacks.keys()]"
    />

    <GuitarBar
      :stack-data="bar.stacks"
      :sub-unit
      :beat-size
      :start-column="i * (columnsPerBar + 1) + 2"
      :start-row="notesRow"
      :tuning="guitarStore.tuning"
      :frets="guitarStore.frets"
      :num-strings="guitarStore.strings"
      @note-change="guitarStore.setNote"
      @note-delete="guitarStore.deleteNote"
    />

    <TiesBar
      :ties="guitarStore.ties"
      :new-tie="tieAddState.newTie"
      :num-strings="guitarStore.strings"
      :start-row="notesRow"
      :start-column="i * (columnsPerBar + 1) + 2"
      :start-position="bar.start"
      :end-position="bar.start + bar.stacks.size * subUnit"
      :sub-unit="subUnit"
    />
  </template>
  <template v-if="bendRow">
    <!-- <div
      v-if="tieAddState.newBend"
      class="bend-row-label"
      :style="{ gridRow: bendRow }"
    >
      bend
    </div> -->
    <BendRender
      v-for="render in bendRenders!.get(tabLineIndex)"
      :key="render.startColumn"
      v-bind="render"
      :bend-row
    />
  </template>
</template>

<style scoped>
.bend-row-label {
  /* 
    Using :style instead, in case we want to show the bend label all the time.
    For some reason, this refuses to update for the first tabline, after save/loading. 
  */
  /* grid-row: v-bind(bendRow); */
  grid-column: 1;
  font-size: calc(var(--note-font-size) * 0.75);
  align-self: center;
  /* writing-mode: vertical-rl;
  text-orientation: upright; */
}
</style>
