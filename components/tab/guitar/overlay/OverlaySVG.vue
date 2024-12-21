<script lang="ts" setup>
import {
  ResizeStateInjectionKey,
  type ResizeState,
} from "../../state/resize-state";
import {
  SettingsInjectionKey,
  type Settings,
} from "../../state/settings-state";

const resizeState = inject(ResizeStateInjectionKey) as ResizeState;
const settingState = inject(SettingsInjectionKey) as Settings;
const cellHeight = computed(() => parseInt(settingState.cellHeight));

const lineStart = computed(() => resizeState.getStackCoords(0).value?.center);
const lineEnd = computed(
  () => resizeState.getStackCoords(resizeState.subUnit.value * 4).value?.center,
);
</script>
<template>
  <svg>
    <line
      :x1="lineStart"
      :x2="lineEnd"
      :y1="cellHeight * 5"
      :y2="cellHeight * 5"
    />
  </svg>
</template>

<style scoped>
svg {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

svg * {
  pointer-events: all;
}

line {
  stroke-width: 1px;
  stroke: black;
}
</style>
