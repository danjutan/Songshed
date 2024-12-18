<script lang="ts" setup>
import {
  ResizeStateInjectionKey,
  type ResizeState,
} from "../../state/resize-state";

const resizeState = inject(ResizeStateInjectionKey) as ResizeState;

const lineStart = computed(
  () => resizeState.getStackCoords(resizeState.subUnit.value * 2).value?.center,
);
const lineEnd = computed(
  () => resizeState.getStackCoords(resizeState.subUnit.value * 4).value?.center,
);
</script>
<template>
  <ClientOnly>
    <svg>
      <line :x1="lineStart" :x2="lineEnd" :y1="20" :y2="20" />
    </svg>
  </ClientOnly>
</template>

<style scoped>
svg {
  width: 100%;
  height: 100%;
}

line {
  stroke-width: 10px;
  stroke: black;
}
</style>
