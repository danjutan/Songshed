<script lang="ts" setup>
import {
  isWithinRegion,
  type RegionBounds,
} from "~/components/tab/providers/state/provide-selection-state";
import { injectColumnsMap } from "../../../providers/provide-columns-map";
import { injectCellHoverEvents } from "../../../providers/events/provide-cell-hover-events";
import SelectionToolbar from "./SelectionToolbar.vue";

const props = defineProps<{
  region: RegionBounds;
}>();

const cellHoverEvents = injectCellHoverEvents();

const columnsMap = injectColumnsMap();

// TODO: might need this for "option 1"
const oneColumnAdjustment = computed(() => {
  return props.region.minPosition === props.region.maxPosition ? 1 : 0;
});

const startColumn = computed(() => columnsMap[props.region.minPosition].column);
const endColumn = computed(
  () => columnsMap[props.region.maxPosition].column + 1,
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
    <SelectionToolbar v-show="isHovering" />
  </div>
</template>

<style scoped>
.selection-region {
  grid-column: v-bind(startColumn) / v-bind(endColumn);
  grid-row: v-bind(startRow) / span 1;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: end;
}
</style>
