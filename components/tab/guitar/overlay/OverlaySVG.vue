<script lang="ts" setup>
import {
  ResizeStateInjectionKey,
  type ResizeState,
} from "../../state/resize-state";
import {
  SettingsInjectionKey,
  type Settings,
} from "../../state/settings-state";
import BendRender from "./Bend.vue";
import type { Bend } from "~/model/stores";

const props = defineProps<{
  bends: Bend[];
  tablineStart: number;
  tablineLast: number;
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
      :key="`${bend.from}${bend.string}`"
      :bend
      :tabline-start
      :tabline-last
    />
  </svg>
</template>

<style scoped>
svg {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
