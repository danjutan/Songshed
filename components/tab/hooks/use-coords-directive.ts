import {
  type Directive,
  type HTMLAttributes,
  type CSSProperties,
  onWatcherCleanup,
} from "vue";
import { injectTabBarBounds } from "../bars/provide-bar-bounds";
import {
  coordsEqual,
  injectStackResizeObserver,
  withOffset,
  type StackCoords,
} from "../providers/events/provide-resize-observer";
import { injectSubUnit } from "../providers/provide-subunit";

type CoordsMap<T extends Record<string, unknown>> = {
  [K in keyof T]?: StackCoords;
};

export function useCoordsDirective<
  T extends Record<string, number | ComputedRef<number>>,
>(
  positions: T,
): Directive<
  HTMLElement,
  (coordsMap: CoordsMap<T>) => string | undefined,
  string, // unused
  "left" | "width" | "x1" | "x2" | "d"
> {
  const tabBarBounds = injectTabBarBounds();
  const resizeObserver = injectStackResizeObserver();
  const subUnit = injectSubUnit();

  const cleanupFns: Array<() => void> = [];

  function cleanup() {
    for (const cleanupFn of cleanupFns) {
      cleanupFn();
    }
  }

  const coordsMap: CoordsMap<T> = {};

  const getCoords = (position: number, coords: StackCoords) => {
    const tablineStartIndex = resizeObserver.tablineStarts.findLastIndex(
      (start) => position > start,
    );
    if (tablineStartIndex < tabBarBounds.tabline.start) {
      console.log("above");
    }
    if (tablineStartIndex > tabBarBounds.tabline.start) {
      console.log("below");
    }

    // if (coords.top < tabBarBounds.top!) {
    //   const lastLineEnd = resizeObserver.tablineStarts.find(
    //     (start) => start > position,
    //   )!;
    //   const lastLineLast = lastLineEnd - subUnit.value;
    //   const lastLineEndCoords = resizeObserver.getStackCoords(lastLineLast);
    //   if (!lastLineEndCoords) return coords;
    //   const lastLineEndX = lastLineEndCoords.right;
    //   const offset = coords.left - lastLineEndX; // will be negative
    //   return withOffset(
    //     resizeObserver.getStackCoords(tabBarBounds.start)!,
    //     offset,
    //   );
    // }

    // if (coords.top > tabBarBounds.top!) {
    //   const nextLineIndex =
    //     resizeObserver.tablineStarts.findIndex((start) => start > position) - 1;
    //   const nextLineStart = resizeObserver.tablineStarts[nextLineIndex];
    //   const nextLineStartCoords = resizeObserver.getStackCoords(nextLineStart);
    //   if (!nextLineStartCoords) return coords;
    //   const nextLineStartX = nextLineStartCoords.left;
    //   const offset = coords.right - nextLineStartX; // will be positive;
    //   return withOffset(
    //     resizeObserver.getStackCoords(tabBarBounds.end - subUnit.value)!,
    //     offset,
    //   );
    // }

    return withOffset(coords, -tabBarBounds.left!);
  };
  return {
    mounted: (el, binding) => {
      const arg = binding.arg;
      if (!arg) return;

      const updateElement = () => {
        const value = binding.value(coordsMap);
        if (value === undefined) return;
        if (["left", "width"].includes(arg)) {
          // @ts-expect-error TODO: fix hell
          el.style[arg] = value;
        } else {
          el.setAttribute(arg, value);
        }
      };

      for (const name in positions) {
        const registerListener = (position: number) => {
          const cleanupFn = resizeObserver.registerListener(
            position,
            (rawCoords) => {
              const coords = getCoords(position, rawCoords);
              coordsMap[name] = coords;
              updateElement();
            },
          );
          return cleanupFn;
        };

        if (typeof positions[name] === "number") {
          const cleanupFn = registerListener(positions[name]);
          cleanupFns.push(cleanupFn);
          return;
        }

        watch(
          positions[name],
          (position) => {
            const coords = resizeObserver.getStackCoords(position);
            if (coords) {
              coordsMap[name] = getCoords(position, coords);
              updateElement();
            }
            const cleanupFn = registerListener(position);
            onWatcherCleanup(cleanupFn);
          },
          { immediate: true },
        );
      }

      // watch(
      //   () => positions,
      //   () => {
      //     for (const name in positions) {
      //       const position = positions[name];
      //       coordsMap[name] = undefined;
      //       const cleanupFn = resizeObserver.registerListener(
      //         position,
      //         (rawCoords) => {
      //           const coords = getCoords(position, rawCoords);
      //           coordsMap[name] = coords;
      //           const value = binding.value(coordsMap);
      //           if (value === undefined) return;
      //           if (["left", "width"].includes(arg)) {
      //             // @ts-expect-error TODO: fix hell
      //             el.style[arg] = value;
      //           } else {
      //             el.setAttribute(arg, value);
      //           }
      //         },
      //       );
      //       cleanupFns.push(cleanupFn);
      //     }

      //     onWatcherCleanup(cleanup);
      //   },
      //   { immediate: true, deep: true },
      // );
      // if (binding.arg === undefined || !Object.keys(binding.modifiers).length)
      //   return;
      // const position = binding.arg;
      // cleanupFn = resizeObserver.registerListener(position, (rawCoords) => {
      //   const coords = getCoords(position, rawCoords);
      //   const attrValue = binding.value(coords);
      //   for (const modifier of Object.keys(binding.modifiers)) {
      //     // @ts-expect-error TODO: figure this out
      //     el.style[modifier] = attrValue.toString();
      //   }
      // });
    },
    unmounted: () => {
      cleanup();
    },
  };
}
