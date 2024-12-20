import type { Bend } from "~/model/stores";
import {
  withOffset,
  type StackCoords,
  type StackResizeObserver,
} from "~/components/tab/state/stack-resize-observer";
import type { BendRenderProps } from "./BendRender.vue";

export function useBendCoords(
  resizeObserver: StackResizeObserver,
  props: BendRenderProps,
) {
  const { getStackCoords, getPreviousStackPos, getNextStackPos } =
    resizeObserver;
  const prebend = computed(() => props.bend.from === props.bend.to);

  const throughPoint = computed(() =>
    props.bend.through?.length ? props.bend.through[0] : undefined,
  );

  const isRightHalf = computed(() => props.bend.from < props.tablineStart);
  const isLeftHalf = computed(() => props.bend.to > props.tablineLast);

  const lastLineEnd = computed(
    () => getStackCoords(getPreviousStackPos(props.tablineStart)!)!.right,
  );

  const nextLineStart = computed(
    () => getStackCoords(getNextStackPos(props.tablineLast)!)!.left,
  );

  const fromCoords = reactiveComputed<StackCoords>(() => {
    const coords = getStackCoords(props.bend.from)!;
    if (isRightHalf.value) {
      // WARNING: this technique won't work if we need to render a tabline independently / if the bend starts off-screen
      // TODO: in that case just use the current tabline as reference
      const offset = coords.left - lastLineEnd.value; // will be negative
      return withOffset(getStackCoords(props.tablineStart)!, offset);
    }
    return coords;
  });

  const toCoords = reactiveComputed<StackCoords>(() => {
    const coords = getStackCoords(props.bend.to)!;
    if (isLeftHalf.value) {
      const offset = coords.right - nextLineStart.value; // will be positive;
      return withOffset(getStackCoords(props.tablineLast)!, offset);
    }
    return coords;
  });

  const throughCoords = computed<StackCoords | undefined>(() => {
    if (!throughPoint.value) return;
    const coords = getStackCoords(props.bend.from + throughPoint.value!)!;
    if (!coords) return;
    if (isRightHalf.value) {
      if (throughPoint.value < props.tablineStart) {
        const offset = coords.left - lastLineEnd.value; // will be negative
        return withOffset(getStackCoords(props.tablineStart)!, offset);
      }
    }
    if (isLeftHalf.value) {
      if (throughPoint.value > props.tablineLast) {
        const offset = coords.right - nextLineStart.value; // will be positive;
        return withOffset(getStackCoords(props.tablineLast)!, offset);
      }
    }
    return coords;
  });

  const upswingToCoords = reactiveComputed<StackCoords>(() => {
    return throughCoords.value || toCoords;
  });

  return reactive({
    upswingTo: upswingToCoords,
    through: throughCoords,
    to: toCoords,
    from: fromCoords,
    isLeftHalf,
    isRightHalf,
    throughPoint,
    prebend,
  });
}
