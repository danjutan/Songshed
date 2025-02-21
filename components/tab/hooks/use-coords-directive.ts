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

type ObjectKey = string | number | symbol;

type CoordsMap<K extends ObjectKey> = {
  [key in K]: StackCoords;
};

export type ValueFn<
  K extends ObjectKey,
  V extends string | number | undefined = string | number | undefined,
> = (coordsMap: CoordsMap<K>) => V;

export function useCoordsDirective<
  T extends Record<string, number | ComputedRef<number | undefined>>,
>(
  positions: T,
): Directive<
  HTMLElement,
  ValueFn<keyof T>,
  string,
  "left" | "width" | "top" | "x" | "x1" | "x2" | "y" | "y1" | "y2" | "d"
> {
  const tabBarBounds = injectTabBarBounds();
  const { registerListener, getStackCoords, tablineStarts } =
    injectStackResizeObserver();
  const subUnit = injectSubUnit();

  const getCoords = (position: number, coords: StackCoords) => {
    if (tablineStarts.length === 0 || tabBarBounds.left === undefined) {
      return coords;
    }
    const tablineStartIndex = tablineStarts.findLastIndex(
      (lineStart) => position >= lineStart,
    );

    const tablineStart = tablineStarts[tablineStartIndex];

    // Note that the following logic assumes that overlay renders only span two tablines
    // i.e., if the position is on another tabline than the current bar, it is either on the previous or the next tabline
    // If you do drag e.g. a tie across three tablines, it will work but won't look continuous
    // TODO consider calculate the widths of the between tablines!

    if (tablineStart < tabBarBounds.tabline.start) {
      // The position is on an earlier tabline than the current bar
      // We're going to start at the beginning of the current bar,
      // and subtract the distance between the position and the end of its tabline
      const tablineEnd = tablineStarts[tablineStartIndex + 1];
      const tablineLast = tablineEnd - subUnit.value;
      const tablineLastCoords = getStackCoords(tablineLast);
      if (!tablineLastCoords) return coords;
      const tablineEndX = tablineLastCoords.right;
      const offset = coords.left - tablineEndX; // will be negative
      return withOffset(
        getStackCoords(tabBarBounds.start)!,
        offset - tabBarBounds.left,
      );
    }

    if (tablineStart > tabBarBounds.tabline.start) {
      // The position is on a later tabline than the current bar
      // We're going to start at the end of current bar,
      // and add the distance between the position and the start of its tabline

      const nextLineStart = tablineStarts[tablineStartIndex - 1];
      const nextLineStartCoords = getStackCoords(nextLineStart);
      if (!nextLineStartCoords) return coords;
      const nextLineStartX = nextLineStartCoords.left;
      const offset = coords.right - nextLineStartX; // will be positive;
      return withOffset(
        getStackCoords(tabBarBounds.end - subUnit.value)!,
        offset - tabBarBounds.left,
      );
    }

    return withOffset(coords, -tabBarBounds.left);
  };

  const valueFns: Map<HTMLElement, { [attribute: string]: ValueFn<keyof T> }> =
    new Map();

  const coordsMapFromListener = (posToCoords: Record<number, StackCoords>) => {
    return Object.fromEntries(
      Object.entries(positions)
        .map(([name, position]) =>
          unref(position) !== undefined ? [name, unref(position)] : undefined,
        )
        .filter(
          (entry): entry is [keyof T & string, number] => entry !== undefined,
        )
        .map(([name, position]) => [
          name,
          getCoords(position, posToCoords[position]),
        ]),
    ) as CoordsMap<keyof T>;
  };

  function updateElement(
    el: HTMLElement,
    attr: string,
    value: string | number | undefined,
  ) {
    if (value === undefined) return;
    if (["left", "width", "top"].includes(attr)) {
      const valueString =
        typeof value === "number" ? `${value}px` : value.trim();
      // @ts-expect-error TODO: fix hell
      el.style[attr] = valueString;
    } else {
      const valueString = value.toString().trim();
      el.setAttribute(attr, valueString);
    }
  }

  watch(
    () => positions,
    (newPositions, oldPositions) => {
      const unwrappedPositions = Object.values(newPositions)
        .map(unref)
        .filter((position) => position !== undefined);
      onWatcherCleanup(
        registerListener(unwrappedPositions, (posToCoords) => {
          valueFns.forEach((attrToFn, el) => {
            for (const attr in attrToFn) {
              const fn = attrToFn[attr];
              const value = fn(coordsMapFromListener(posToCoords));
              updateElement(el, attr, value);
            }
          });
        }),
      );

      if (oldPositions) {
        const coordsMap = coordsMapFromListener(
          Object.fromEntries(
            unwrappedPositions.map((position) => [
              position,
              getStackCoords(position)!,
            ]),
          ),
        );
        valueFns.forEach((attrToFn, el) => {
          for (const attr in attrToFn) {
            const fn = attrToFn[attr];
            updateElement(el, attr, fn(coordsMap));
          }
        });
      }
    },
    { deep: true, immediate: true },
  );

  return {
    created: (el, binding, vnode) => {
      if (binding.arg && binding.value) {
        const fnsArray = valueFns.get(el) || {};
        fnsArray[binding.arg] = binding.value;
        valueFns.set(el, fnsArray);
      }
    },
  };
}
