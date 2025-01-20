import { ref, type Ref } from "vue";
import type { Bar } from "../Tab.vue";
import type { StackResizeObserver } from "../providers/events/provide-resize-observer";
import type { SettingsState } from "../providers/state/provide-settings-state";
import { isCollapsed } from "./use-collapsed";

export function useTemplateColumns(
  props: ReactiveComputed<{
    tabline: Bar[];
    beatSize: number;
    resizeObserver: StackResizeObserver;
    settings: SettingsState;
  }>,
) {
  const frValues = ref<number[]>(
    Array.from({ length: props.tabline.length }, () => 1),
  );
  let lastDiffX = 0;

  const gridTemplateColumns = computed(() => {
    const barTemplateColumns = (bar: Bar, fr: number) =>
      `repeat(${bar.stacks.size}, minmax(min-content, ${fr}fr))`;

    const guitarline = props.tabline
      .map((bar, i) => barTemplateColumns(bar, frValues.value[i]))
      .join(" min-content ");

    return `min-content ${guitarline}`;
  });

  const collapsedMinWidth = props.settings.collapsedMinWidth;
  const expandedMinWidth = props.settings.cellHeight;

  function isBarTooSmall(barIndex: number, deltaX: number): boolean {
    const bar = props.tabline[barIndex]!;

    const barMinWidth = Array.from(bar.stacks.entries()).reduce(
      (total, [position]) => {
        const width = isCollapsed(
          props.settings,
          bar.stacks.get(position)!,
          position % props.beatSize === 0,
        )
          ? collapsedMinWidth
          : expandedMinWidth;
        return total + width;
      },
      0,
    );

    const barActualWidth = Array.from(bar.stacks.entries()).reduce(
      (total, [position]) => {
        const width =
          props.resizeObserver.getStackCoords(position)!.right -
          props.resizeObserver.getStackCoords(position)!.left;
        return total + width;
      },
      0,
    );

    return barActualWidth < barMinWidth + Math.abs(deltaX);
  }

  function handleResize(barIndex: number, diffX: number, gridWidth: number) {
    const deltaX = diffX - lastDiffX;
    lastDiffX = diffX;

    const totalFr = frValues.value.reduce((sum, fr) => sum + fr, 0);
    const pxPerFr = gridWidth / totalFr;

    const deltaFr = deltaX / pxPerFr;

    const newFrLeft = frValues.value[barIndex] + deltaFr;
    const newFrRight = frValues.value[barIndex + 1] - deltaFr;

    if (deltaX < 0 && isBarTooSmall(barIndex, deltaX)) return;

    if (deltaX > 0 && isBarTooSmall(barIndex + 1, deltaX)) return;

    frValues.value[barIndex] = newFrLeft;
    frValues.value[barIndex + 1] = newFrRight;
  }

  function resetDrag() {
    lastDiffX = 0;
  }

  return {
    gridTemplateColumns,
    handleResize,
    resetDrag,
  };
}
