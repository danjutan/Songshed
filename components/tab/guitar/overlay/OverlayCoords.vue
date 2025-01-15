<script lang="ts" setup>
import { injectSettingsState } from "../../providers/state/provide-settings-state";
import {
  withOffset,
  type StackCoords,
  injectStackResizeObserver,
} from "../../providers/events/provide-resize-observer";
import { injectTablineBounds } from "../provide-tabline-bounds";

// There's an argument for this being a hook instead of a component. I liked the ergonomics of being able to do the positioning within the template, and I didn't like the idea of inject() outside of a component.

const props = defineProps<{
  positions: Array<number | undefined>;
}>();

const bounds = injectTablineBounds();

const resizeObserver = injectStackResizeObserver();
const settingState = injectSettingsState();

const cellHeight = computed(() => settingState.cellHeight);

const { getStackCoords, getPreviousStackPos, getNextStackPos } = resizeObserver;

const lastLineEnd = computed(
  () => getStackCoords(getPreviousStackPos(bounds.start)!)!.right,
);

const nextLineStart = computed(
  () => getStackCoords(getNextStackPos(bounds.last)!)!.left,
);

const toCoords = (position: number): StackCoords | undefined => {
  const coords = getStackCoords(position);
  if (!coords) return;
  if (position < bounds.start) {
    const offset = coords.left - lastLineEnd.value; // will be negative
    return withOffset(getStackCoords(bounds.start)!, offset);
  }
  if (position > bounds.last) {
    const offset = coords.right - nextLineStart.value; // will be positive;
    return withOffset(getStackCoords(bounds.last)!, offset);
  }
  return coords;
};
</script>

<template>
  <slot
    :coords="
      positions.map((pos) => (pos !== undefined ? toCoords(pos) : undefined))
    "
    :cell-height
  />
</template>
