<script lang="ts" setup>
import {
  isWithinRegion,
  type RegionBounds,
} from "~/components/editor/tab/providers/state/provide-selection-state";
import { injectCellHoverEvents } from "~/components/editor/tab/providers/events/provide-cell-hover-events";
import SelectionToolbar from "~/components/editor/tab/bars/guitar/selections/SelectionToolbar.vue";
import { injectTabBarBounds } from "~/components/editor/tab/bars/providers/provide-bar-bounds";
import { injectSubUnitFunctions } from "~/components/editor/tab/providers/provide-subunit";

const props = defineProps<{
  region: RegionBounds;
}>();

const cellHoverEvents = injectCellHoverEvents();
const { getSubUnitForPosition } = injectSubUnitFunctions();
const tabBarBounds = injectTabBarBounds();
const oneColumnAdjustment = computed(() => {
  return props.region.minPosition === props.region.maxPosition ? 1 : 0;
});

const subunit = computed(() => getSubUnitForPosition(tabBarBounds.start));

const startColumn = computed(
  () => (props.region.minPosition - tabBarBounds.start) / subunit.value + 2, // +1 to turn index into column, +1 to account for the widget column
);

const endColumn = computed(
  () => (props.region.maxPosition - tabBarBounds.start) / subunit.value + 3, //+1 to turn index into column, +1 to end after the column, +1 to account for the widget column
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
  <div class="selection-toolbar-region">
    <SelectionToolbar v-show="isHovering" :region />
  </div>
</template>

<style scoped>
.selection-toolbar-region {
  grid-column: v-bind(startColumn) / v-bind(endColumn);
  grid-row: v-bind(startRow) / span 1;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: start;
}
</style>
