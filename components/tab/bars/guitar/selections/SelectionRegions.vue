<script lang="ts" setup>
import {
  injectSelectionState,
  type RegionBounds,
} from "~/components/tab/providers/state/provide-selection-state";
import { injectTabBarBounds } from "../provide-bar-bounds";
import SelectionRegion from "./SelectionRegion.vue";

const selectionState = injectSelectionState();
const tabBarBounds = injectTabBarBounds();

const inBounds = (region: RegionBounds) => {
  return (
    region.minPosition >= tabBarBounds.start &&
    region.maxPosition <= tabBarBounds.end
  );
};

const oneNote = computed(() => selectionState.selections.size === 1);
</script>

<template>
  <template v-if="!oneNote">
    <SelectionRegion
      v-for="region in selectionState.regions.filter(inBounds)"
      :key="`${region.minString}-${region.minPosition}-${region.maxString}-${region.maxPosition}`"
      :region="region"
    />
  </template>
</template>
