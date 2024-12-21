<script lang="ts" setup>
import {
  StackResizeObserverInjectionKey,
  type StackResizeObserver,
  withOffset,
  type StackCoords,
} from "../../state/stack-resize-observer";

// There's an argument for this being a hook instead of a component. I liked the ergonomics of being able to do the positioning within the template, and I didn't like the idea of inject() outside of a component.

const props = defineProps<{
  tablineStart: number;
  tablineLast: number;
}>();

const resizeObserver = inject(
  StackResizeObserverInjectionKey,
) as StackResizeObserver;

const { getStackCoords, getPreviousStackPos, getNextStackPos } = resizeObserver;

const lastLineEnd = computed(
  () => getStackCoords(getPreviousStackPos(props.tablineStart)!)!.right,
);

const nextLineStart = computed(
  () => getStackCoords(getNextStackPos(props.tablineLast)!)!.left,
);

const toCoords = (position: number): StackCoords => {
  const coords = getStackCoords(position)!;
  if (position < props.tablineStart) {
    const offset = coords.left - lastLineEnd.value; // will be negative
    return withOffset(getStackCoords(props.tablineStart)!, offset);
  }
  if (position > props.tablineLast) {
    const offset = coords.right - nextLineStart.value; // will be positive;
    return withOffset(getStackCoords(props.tablineLast)!, offset);
  }
  return coords;
};
</script>

<template>
  <slot :to-coords :resize-observer />
</template>
