import type { Directive, HTMLAttributes, CSSProperties } from "vue";
import { injectTabBarBounds } from "../bars/provide-bar-bounds";
import {
  injectStackResizeObserver,
  withOffset,
  type StackCoords,
} from "../providers/events/provide-resize-observer";

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

  let cleanupFn: () => void;

  const withTablineOffset = (coords: StackCoords) => {
    // get top from the tab bounds reference el

    // TODO
    return coords;
  };
  return {
    mounted: (el, binding) => {
      if (binding.arg === undefined || !Object.keys(binding.modifiers).length)
        return;

      cleanupFn = resizeObserver.registerListener(binding.arg, (rawCoords) => {
        const coords = withOffset(
          withTablineOffset(rawCoords),
          -tabBarBounds.left!,
        );
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
