<script lang="ts" setup>
import { injectSettingsState } from "~/components/editor/providers/provide-settings-state";
import {
  withOffset,
  type StackCoords,
  injectStackResizeObserver,
} from "~/components/editor/tab/providers/events/provide-resize-observer";
import { injectTabBarBounds } from "~/components/editor/tab/bars/providers/provide-bar-bounds";
import { injectSubUnitFunctions } from "~/components/editor/tab/providers/provide-subunit";

// There's an argument for this being a hook instead of a component. I liked the ergonomics of being able to do the positioning within the template, and I didn't like the idea of inject() outside of a component.

const props = withDefaults(
  defineProps<{
    positions: Array<number | undefined>;
    offset?: number;
  }>(),
  {
    offset: 0,
  },
);

const bounds = injectTabBarBounds();
const { getSubUnitForPosition, getPreviousPosition } = injectSubUnitFunctions();
const resizeObserver = injectStackResizeObserver();
const settingState = injectSettingsState();

const { tablineStarts } = resizeObserver;

const getStackCoords = (position: number) =>
  resizeObserver.getStackCoords(position)!;

const barTop = computed(() => getStackCoords(bounds.start)!.top);

const toCoords = (position: number): StackCoords | undefined => {
  const coords = getStackCoords(position);
  if (!coords) return;
  // TODO: make this work if the position is two or more lines away
  if (coords.top < barTop.value) {
    // Position is on the previous line, so we need to subtract the distance between the point and the end of that line.
    const lastLineEnd = tablineStarts.find(
      (start: number) => start > position,
    )!;
    const lastLineLast = getPreviousPosition(lastLineEnd);
    const lastLineEndX = getStackCoords(lastLineLast)!.right;
    const offset = coords.left - lastLineEndX; // will be negative
    return withOffset(getStackCoords(bounds.start), offset);
  }

  if (coords.top > barTop.value) {
    // Position is on the next line, so we need to add the distance between the start of that line and the point
    const nextLineIndex =
      tablineStarts.findIndex((start: number) => start > position) - 1;
    const nextLineStart = tablineStarts[nextLineIndex];
    const nextLineStartX = getStackCoords(nextLineStart)!.left;
    const offset = coords.right - nextLineStartX; // will be positive;
    return withOffset(getStackCoords(getPreviousPosition(bounds.end)), offset);
  }
  return withOffset(coords, props.offset);
};
</script>

<template>
  <slot
    :coords="
      positions.map((pos) => (pos !== undefined ? toCoords(pos) : undefined))
    "
  />
</template>
