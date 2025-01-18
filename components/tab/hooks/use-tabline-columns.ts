import { ref, type Ref } from "vue";
import type { Bar } from "../Tab.vue";
import type { StackResizeObserver } from "../providers/events/provide-resize-observer";
import type { SettingsState } from "../providers/state/provide-settings-state";

export function useTemplateColumns(
  bars: ComputedRef<Bar[]>,
  collapsed: ComputedRef<Set<number>>,
  resizeObserver: StackResizeObserver,
  settings: SettingsState,
) {
  const collapsedMinWidth = settings.collapsedMinWidth;
  const expandedMinWidth = settings.expandedMinWidth;
  const frValues = ref<number[]>([]);
  let lastDiffX = 0;

  onMounted(() => {
    frValues.value = Array(bars.value.length).fill(1);
  });

  function getGridTemplateColumns(tabLine: Bar[]): string {
    const barTemplateColumns = (bar: Bar, fr: number) =>
      Array.from(bar.stacks.entries())
        .map(([position]) =>
          collapsed.value.has(position)
            ? `minmax(${collapsedMinWidth}px, ${fr}fr)`
            : `minmax(${expandedMinWidth}px, ${fr}fr)`,
        )
        .join(" ");

    const guitarline = tabLine
      .map((bar, i) => barTemplateColumns(bar, frValues.value[i]))
      .join(" min-content ");

    return `min-content ${guitarline}`;
  }

  function isBarTooSmall(barIndex: number, deltaX: number): boolean {
    const bar = bars.value[barIndex]!;
    const barMinWidth = Array.from(bar.stacks.entries()).reduce(
      (total, [position]) => {
        const width = collapsed.value.has(position)
          ? collapsedMinWidth
          : expandedMinWidth;
        return total + width;
      },
      0,
    );

    const barActualWidth = Array.from(bar.stacks.entries()).reduce(
      (total, [position]) => {
        const width =
          resizeObserver.getStackCoords(position)!.right -
          resizeObserver.getStackCoords(position)!.left;
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
    getGridTemplateColumns,
    handleResize,
    resetDrag,
  };
}
