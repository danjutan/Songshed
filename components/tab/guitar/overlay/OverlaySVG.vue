<script lang="ts" setup>
import BendRender from "./bend/BendRender.vue";
import TieRender from "./tie/TieRender.vue";
import type { Bend, Tie } from "~/model/stores";

const props = defineProps<{
  bends: Bend[];
  ties: Tie[];
}>();

// const lineStart = computed(() => resizeState.getStackCoords(0).value?.center);
// const lineEnd = computed(
//   () => resizeState.getStackCoords(resizeState.subUnit.value * 4).value?.center,
// );
</script>
<template>
  <svg>
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
    />
  </svg>
</template>

<style scoped>
svg {
  width: 100%;
  height: calc(100% + var(--cell-height) / 2);
  pointer-events: none;
  /* z-index: 1; */
}
</style>
