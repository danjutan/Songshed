import { ref, type Ref } from "vue";
import type { Bar } from "../Tab.vue";

export function useTemplateColumns(
  bars: ComputedRef<Bar[]>,
  collapsed: ComputedRef<Set<number>>,
) {
  // Holds fractional (fr) values for each bar
  const frValues = ref<number[]>([]);

  // Local state to track drag changes
  let lastDiffX = 0; // Tracks the last diffX value during a drag

  onMounted(() => {
    frValues.value = Array(bars.value.length).fill(1); // Initialize all bars to 1fr
  });

  function getGridTemplateColumns(tabLine: Bar[]): string {
    const barTemplateColumns = (bar: Bar, fr: number) =>
      Array.from(bar.stacks.entries())
        .map(([position]) =>
          collapsed.value.has(position)
            ? `${fr}fr`
            : `minmax(var(--cell-height), ${fr}fr)`,
        )
        .join(" ");

    const guitarline = tabLine
      .map((bar, i) => barTemplateColumns(bar, frValues.value[i]))
      .join(" min-content ");

    return `min-content ${guitarline}`;
  }

  function handleResize(barIndex: number, diffX: number, gridWidth: number) {
    const deltaX = diffX - lastDiffX; // Calculate the incremental change in diffX
    lastDiffX = diffX; // Update the last recorded diffX value

    const totalFr = frValues.value.reduce((sum, fr) => sum + fr, 0); // Total fraction units
    const pxPerFr = gridWidth / totalFr; // Pixels per 1fr unit

    const deltaFr = deltaX / pxPerFr; // Convert the incremental drag distance to fractional units

    // Adjust the `fr` values of the affected bars
    const newFrLeft = frValues.value[barIndex] + deltaFr;
    const newFrRight = frValues.value[barIndex + 1] - deltaFr;

    if (newFrLeft > 0.1 && newFrRight > 0.1) {
      frValues.value[barIndex] = newFrLeft;
      frValues.value[barIndex + 1] = newFrRight;
    }
  }

  function resetDrag() {
    lastDiffX = 0; // Reset drag tracking
  }

  return {
    getGridTemplateColumns,
    handleResize,
    resetDrag,
  };
}
