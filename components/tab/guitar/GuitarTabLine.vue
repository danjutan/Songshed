<script lang="ts" setup>
import type { GuitarStore } from "~/model/stores";
import type { Bar, TablineColumn } from "@/components/tab/Tab.vue";
import GuitarBar from "./bar/GuitarBar.vue";
import BendDragBar from "./overlay/bend/BendDragBar.vue";
import OverlaySVG from "./overlay/OverlaySVG.vue";
import { injectTieAddState } from "./overlay/state/provide-tie-add-state";
import { provideTablineBounds } from "./provide-tabline-bounds";

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

const tieAddState = injectTieAddState();

const tablineBounds = provideTablineBounds(props);

const notesRow = computed(() =>
  bendRow.value ? bendRow.value + 1 : props.startRow,
);

const numStrings = computed(() => props.guitarStore.strings);

const inBounds = (position: number) =>
  position >= tablineBounds.start && position <= tablineBounds.last;

const bends = computed(() => {
  const bends = props.guitarStore.ties.getBends();
  const withNew = tieAddState.newBend ? [...bends, tieAddState.newBend] : bends;
  return withNew.filter((bend) => inBounds(bend.from) || inBounds(bend.to));
});

const ties = computed(() => {
  const ties = props.guitarStore.ties.getTies();
  const withNew = tieAddState.newTie ? [...ties, tieAddState.newTie] : ties;
  return withNew.filter((tie) => inBounds(tie.from) || inBounds(tie.to));
});

const bendRow = computed(() =>
  bends.value.length ? props.startRow : undefined,
);

const columnEnd = computed(
  () => props.columnsPerBar * props.bars.length + props.bars.length + 1,
);
</script>

<template>
  <template v-for="(bar, i) in bars" :key="bar.start">
    <slot :notes-row :num-strings="guitarStore.strings" :bar :bar-index="i" />
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
      :num-strings="numStrings"
      @note-change="guitarStore.setNote"
      @note-delete="guitarStore.deleteNote"
    />

    <!-- <TiesBar
      :ties="guitarStore.ties"
      :new-tie="tieAddState.newTie"
      :num-strings="guitarStore.strings"
      :start-row="notesRow"
      :start-column="i * (columnsPerBar + 1) + 2"
      :start-position="bar.start"
      :end-position="bar.start + bar.stacks.size * subUnit"
      :sub-unit="subUnit"
    /> -->
  </template>
  <ClientOnly>
    <OverlaySVG class="overlay" :bends :ties />
  </ClientOnly>
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

.overlay {
  grid-column: 2 / v-bind(columnEnd);
  grid-row: v-bind(bendRow) / span calc(v-bind(numStrings) + 1);
}
</style>
