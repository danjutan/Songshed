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
    el: HTMLDivElement | null;
  }>,
) {
  const collapsedMinWidth = props.settings.collapsedMinWidth;
  const expandedMinWidth = props.settings.cellHeight;

  const dividerSpace = computed(() => {
    return (
      (props.settings.cellHeight / 3) * (props.tabline.length - 1) +
      props.settings.cellHeight * 0.8
    );
  });

  const barPercentages = ref<number[]>(
    Array.from(
      { length: props.tabline.length },
      () => 1 / props.tabline.length,
    ),
  );

  let lastDiffX = 0;

  watch(
    () => props.tabline.length,
    () => {
      if (props.el) {
        const ratio =
          (props.el.getBoundingClientRect().width - dividerSpace.value) /
          props.el.getBoundingClientRect().width;
        barPercentages.value = Array.from(
          { length: props.tabline.length },
          () => ratio / props.tabline.length,
        );
      }
      // TODO: smarter joins than this?
    },
  );

  // const totalFr = computed(() => {
  //   return props.tabline
  //     .flatMap((bar) =>
  //       Array.from(bar.stacks.entries()).map(([position, stack]) =>
  //         isCollapsed(props.settings, stack, position % props.beatSize === 0),
  //       ),
  //     )
  //     .filter(Boolean).length;
  // });

  // const frValues = computed(() => {
  //   if (!props.el) return barPercentages.value;
  //   return barPercentages.value.map((percentage, i) => {
  //     const bar = props.tabline[i];
  //     if (!bar) return 0;
  //     let numCollapsed = 0;
  //     let numExpanded = 0;
  //     for (const [position, stack] of bar.stacks.entries()) {
  //       if (
  //         isCollapsed(props.settings, stack, position % props.beatSize === 0)
  //       ) {
  //         numCollapsed++;
  //       } else {
  //         numExpanded++;
  //       }
  //     }

  //     const tablineWidth = props.el!.getBoundingClientRect().width;

  //     const frozenWidth = numExpanded * expandedMinWidth;
  //     const frozenPercentage = frozenWidth / tablineWidth;
  //     console.log(frozenPercentage);
  //     const leftToDistribute = percentage - frozenPercentage;
  //     return leftToDistribute / numCollapsed;
  //   });
  // });

  const expanded = computed(() => {
    const expandedSets = new Map<number, Set<number>>();
    props.tabline.forEach((bar, barIndex) => {
      const barExpandedSet = new Set<number>();
      for (const [position] of bar.stacks.entries()) {
        if (
          !isCollapsed(
            props.settings,
            bar.stacks.get(position)!,
            position % props.beatSize === 0,
          )
        ) {
          barExpandedSet.add(position);
        }
      }
      expandedSets.set(barIndex, barExpandedSet);
    });
    return expandedSets;
  });

  const gridTemplateColumns = computed(() => {
    if (!props.el) return "";
    const barTemplateColumns = (bar: Bar, barIndex: number) => {
      const percentage = barPercentages.value[barIndex];
      const numExpanded = expanded.value.get(barIndex)!.size;
      const numCollapsed = bar.stacks.size - numExpanded;

      const perColumn = `${(percentage / bar.stacks.size) * 100}%`;

      const ratio =
        (props.el!.getBoundingClientRect().width - dividerSpace.value) /
        props.el!.getBoundingClientRect().width;

      return Array.from(bar.stacks.entries())
        .map(([position]) => {
          const collapsed = isCollapsed(
            props.settings,
            bar.stacks.get(position)!,
            position % props.beatSize === 0,
          );
          if (collapsed) {
            return `calc((${percentage * 100}% - max(${perColumn}, ${expandedMinWidth}px) * ${numExpanded})/${numCollapsed} * ${ratio})`;
            // return `calc(${perColumn} -
            //   max(
            //     calc(${numExpanded} * (${expandedMinWidth}px - ${perColumn})
            //                      / ${numCollapsed}),
            //     0px
            //   )
            // )`;
          }
          return `minmax(min-content, ${perColumn})`;
        })
        .join(" ");
    };

    const guitarline = props.tabline
      .map(barTemplateColumns)
      .join(" min-content ");

    return `var(--note-font-size) ${guitarline}`;
  });

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

  function handleResize(barIndex: number, diffX: number) {
    if (!props.el) return;
    const tablineWidth = props.el.getBoundingClientRect().width;

    const deltaX = diffX - lastDiffX;
    lastDiffX = diffX;

    const diffPercentage = deltaX / tablineWidth;
    barPercentages.value[barIndex] += diffPercentage;
    barPercentages.value[barIndex + 1] -= diffPercentage;

    // const totalFr = frValues.value.reduce((sum, fr) => sum + fr, 0);
    // const pxPerFr = gridWidth / totalFr;

    // const deltaFr = deltaX / pxPerFr;

    // const newFrLeft = frValues.value[barIndex] + deltaFr;
    // const newFrRight = frValues.value[barIndex + 1] - deltaFr;

    // if (deltaX < 0 && isBarTooSmall(barIndex, deltaX)) return;

    // if (deltaX > 0 && isBarTooSmall(barIndex + 1, deltaX)) return;

    // frValues.value[barIndex] = newFrLeft;
    // frValues.value[barIndex + 1] = newFrRight;
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
