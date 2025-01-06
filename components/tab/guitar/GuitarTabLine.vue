<script lang="ts" setup>
import type { GuitarStore } from "~/model/stores";
import type { Bar } from "@/components/tab/Tab.vue";
import GuitarBar from "./bar/GuitarBar.vue";
import BendDragBar from "./overlay/bend/BendTopBar.vue";
import BendRender from "./overlay/bend/BendRender.vue";
import TieRender from "./overlay/tie/TieRender.vue";
import { injectTieAddState } from "../providers/state/provide-tie-add-state";
import { provideTablineBounds } from "./provide-tabline-bounds";
import { provideEditTie } from "./overlay/tie/provide-edit-tie";
import { provideOverlayControlsTeleport } from "./overlay/provide-overlay-controls-teleport";

const props = defineProps<{
  tabLineIndex: number;
  guitarStore: GuitarStore;
  bars: Bar[];
  startRow: number;
  columnsPerBar: number;
  beatSize: number;
  subUnit: number;
}>();

const tieAddState = injectTieAddState();

const tablineBounds = provideTablineBounds(props);
const overlayControlsId = provideOverlayControlsTeleport();
provideEditTie(props.guitarStore.ties);

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

const barStarts = computed(() => props.bars.map((bar) => bar.start));

const centeredOverDivider = (from: number, to: number) => {
  const dividerBetween = barStarts.value.find(
    (start) => start > from && start <= to,
  )!;
  return to + props.subUnit - dividerBetween === dividerBetween - from;
};

const columnEnd = computed(
  () => props.columnsPerBar * props.bars.length + props.bars.length + 1,
);
</script>

<template>
  <template v-for="(bar, i) in bars" :key="bar.start">
    <slot
      :notes-row
      :num-strings="guitarStore.strings"
      :bar
      :bar-index="i"
      :bend-row
    />
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
  </template>
  <ClientOnly>
    <svg :id="overlayControlsId" class="overlay-controls">
      <!--Teleport-->
    </svg>
    <svg class="overlay">
      <BendRender
        v-for="bend in bends"
        :key="`${bend.from}-${bend.string}`"
        :bend
      />
      <TieRender
        v-for="tie in ties"
        :key="`${tie.from}-${tie.string}`"
        :tie
        :first-row="bends.length ? 2 : 1"
        :over-divider="centeredOverDivider(tie.from, tie.to)"
      />
    </svg>
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
  height: calc(100% + var(--cell-height) / 2);
}

.overlay-controls {
  z-index: 2;
  position: relative; /* somehow makes the VueSelect hover events work right */
  height: calc(100% + var(--cell-height) / 2 + 100px);
  overflow: visible;
}

.overlay,
.overlay-controls {
  pointer-events: none;
  grid-column: 2 / v-bind(columnEnd);
  grid-row: v-bind(bendRow) / span calc(v-bind(numStrings) + 1);
  width: 100%;
}
</style>
