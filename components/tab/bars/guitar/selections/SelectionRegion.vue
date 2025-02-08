<script lang="ts" setup>
import {
  isWithinRegion,
  type RegionBounds,
} from "~/components/tab/providers/state/provide-selection-state";
import { injectColumnsMap } from "~/components/tab/providers/provide-columns-map";
import { injectCellHoverEvents } from "~/components/tab/providers/events/provide-cell-hover-events";
import SelectionToolbar from "./SelectionToolbar.vue";
import { injectTabBarBounds } from "../../provide-bar-bounds";
import { injectSubUnit } from "~/components/tab/providers/provide-subunit";

const props = defineProps<{
  region: RegionBounds;
}>();

const cellHoverEvents = injectCellHoverEvents();
const subUnit = injectSubUnit();
const tabBarBounds = injectTabBarBounds();

const oneColumnAdjustment = computed(() => {
  return props.region.minPosition === props.region.maxPosition ? 1 : 0;
});

const startColumn = computed(
  () => (props.region.minPosition - tabBarBounds.start) / subUnit.value + 1,
);

const endColumn = computed(
  () => (props.region.maxPosition - tabBarBounds.start) / subUnit.value + 2,
);
const startRow = computed(() => props.region.minString + 1);

const hoverRegion = computed(() => {
  const { minPosition, maxPosition, minString, maxString } = props.region;
  return {
    minPosition,
    maxPosition,
    minString: minString - 1,
    maxString,
  };
});

const isHovering = computed(() => {
  return (
    cellHoverEvents.hoveredNote.value &&
    isWithinRegion(cellHoverEvents.hoveredNote.value, hoverRegion.value)
  );
});
</script>

<template>
  <div class="selection-region">
    <SelectionToolbar v-show="isHovering" :region />
  </div>
</template>

<style scoped>
.selection-region {
  /* background: red; */
  grid-column: v-bind(startColumn) / v-bind(endColumn);
  grid-row: v-bind(startRow) / span 1;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: start;
}
</style>
