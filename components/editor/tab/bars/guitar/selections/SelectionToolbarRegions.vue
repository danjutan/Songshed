<script lang="ts" setup>
import {
  injectSelectionState,
  type RegionBounds,
} from "~/components/editor/tab/providers/state/provide-selection-state";
import { injectTabBarBounds } from "~/components/editor/tab/bars/providers/provide-bar-bounds";
import SelectionToolbarRegion from "~/components/editor/tab/bars/guitar/selections/SelectionToolbarRegion.vue";

const selectionState = injectSelectionState();
const tabBarBounds = injectTabBarBounds();

const inBounds = (region: RegionBounds) => {
  return (
    region.minPosition >= tabBarBounds.start &&
    region.maxPosition < tabBarBounds.end
  );
};

const oneNote = computed(() => selectionState.selections.size === 1);
</script>

<template>
  <template v-if="!oneNote">
    <SelectionToolbarRegion
      v-for="region in selectionState.regions.filter(inBounds)"
      :key="`${region.minString}-${region.minPosition}-${region.maxString}-${region.maxPosition}`"
      :region="region"
    />
  </template>
</template>
