import type { Directive, HTMLAttributes, CSSProperties } from "vue";
import { injectTabBarBounds } from "../bars/provide-bar-bounds";
import {
  injectStackResizeObserver,
  withOffset,
  type StackCoords,
} from "../providers/events/provide-resize-observer";
import { injectSubUnit } from "../providers/provide-subunit";

type Value = (coords: StackCoords) => number | string;

export function useCoordsDirective(): Directive<
  HTMLElement,
  Value,
  string,
  // @ts-expect-error Vue handles number-valued arguments totally fine.
  number
> {
  const tabBarBounds = injectTabBarBounds();
  const resizeObserver = injectStackResizeObserver();
  const subUnit = injectSubUnit();

  let cleanupFn: () => void;

  const getCoords = (position: number, coords: StackCoords) => {
    if (coords.top < tabBarBounds.top!) {
      const lastLineEnd = resizeObserver.tablineStarts.find(
        (start) => start > position,
      )!;
      const lastLineLast = lastLineEnd - subUnit.value;
      const lastLineEndX = resizeObserver.getStackCoords(lastLineLast)!.right;
      const offset = coords.left - lastLineEndX; // will be negative
      return withOffset(
        resizeObserver.getStackCoords(tabBarBounds.start)!,
        offset,
      );
    }

    if (coords.top > tabBarBounds.top!) {
      const nextLineIndex =
        resizeObserver.tablineStarts.findIndex((start) => start > position) - 1;
      const nextLineStart = resizeObserver.tablineStarts[nextLineIndex];
      const nextLineStartX = resizeObserver.getStackCoords(nextLineStart)!.left;
      const offset = coords.right - nextLineStartX; // will be positive;
      return withOffset(
        resizeObserver.getStackCoords(tabBarBounds.end - subUnit.value)!,
        offset,
      );
    }

    return withOffset(coords, -tabBarBounds.left!);
  };
  return {
    mounted: (el, binding) => {
      if (binding.arg === undefined || !Object.keys(binding.modifiers).length)
        return;

      const position = binding.arg;

      cleanupFn = resizeObserver.registerListener(position, (rawCoords) => {
        // const coords = withOffset(
        //   withTablineOffset(position, rawCoords),
        //   -tabBarBounds.left!,
        // );
        const coords = getCoords(position, rawCoords);
        const attrValue = binding.value(coords);
        for (const modifier of Object.keys(binding.modifiers)) {
          // @ts-expect-error TODO: figure this out
          el.style[modifier] = attrValue.toString();
        }
      });
    },
    unmounted: () => {
      cleanupFn?.();
    },
  };
}
