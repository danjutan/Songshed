<script lang="ts" setup>
import type { GuitarStore } from "~/model/stores";
import type { Bar } from "@/components/tab/Tab.vue";
import GuitarBar from "./bar/GuitarBar.vue";
import BendRender from "./overlay/bend/BendRender.vue";
import TieRender from "./overlay/tie/TieRender.vue";
import { injectTieAddState } from "../providers/state/provide-tie-add-state";
import { provideTablineBounds } from "./provide-tabline-bounds";
import { provideEditTie } from "./overlay/tie/provide-edit-tie";
import { provideOverlayControlsTeleport } from "./overlay/provide-overlay-controls-teleport";
import { useWindowResizing } from "../hooks/use-window-resizing";

const props = defineProps<{
  tablineIndex: number;
  guitarStore: GuitarStore;
  bars: Bar[];
  startRow: number;
  columnsPerBar: number;
  beatSize: number;
  subUnit: number;
}>();

const tieAddState = injectTieAddState();
const { isResizing } = useWindowResizing();

const tablineBounds = provideTablineBounds(props);
const overlayControlsId = provideOverlayControlsTeleport();
provideEditTie(props.guitarStore.ties);

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

const barStarts = computed(() => props.bars.map((bar) => bar.start));

// If a tie is centered over a divider, we need to shift it
const centeredOverDivider = (from: number, to: number) => {
  const dividerBetween = barStarts.value.find(
    (start) => start > from && start <= to,
  )!;
  return to + props.subUnit - dividerBetween === dividerBetween - from;
};

const columnEnd = computed(
  () => props.columnsPerBar * props.bars.length + props.bars.length + 1,
);

onBeforeUpdate(() => {
  console.log("updated line", props.tablineIndex);
});

onUnmounted(() => {
  console.log("unmounted line", props.tablineIndex);
});

onMounted(() => {
  console.log("mounted guitar line", props.tablineIndex);
});
// onRenderTriggered(() => {
//   console.log("line render triggered");
// });

// onRenderTracked((e) => {
//   console.log("line render tracked");
// });
</script>

<template>
  <template v-for="(bar, i) in bars" :key="bar.start">
    <slot
      name="divider"
      :num-strings="guitarStore.strings"
      :bar
      :bar-index="i"
    />

    <GuitarBar
      :stack-data="bar.stacks"
      :sub-unit
      :beat-size
      :start-column="i * (columnsPerBar + 1) + 2"
      :start-row="2"
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
        :over-divider="centeredOverDivider(tie.from, tie.to)"
      />
    </svg>
  </ClientOnly>
</template>

<style scoped>
.overlay-controls {
  z-index: var(--overlay-controls-z-index);
  position: relative; /* somehow makes the VueSelect hover events work right */
  overflow: visible;
}
.overlay,
.overlay-controls {
  pointer-events: none;
  grid-column: 2 / v-bind(columnEnd);
  grid-row: 2 / span calc(v-bind(numStrings) + 1);
  width: 100%;
  height: calc(
    100% + var(--cell-height) / 2 + var(--context-menu-height) +
      var(--cell-height)
  );
  margin-top: calc(-1 * (var(--cell-height) + var(--context-menu-height)));
}
</style>
