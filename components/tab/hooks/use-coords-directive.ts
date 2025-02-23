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
import { injectBarManagement } from "../providers/state/provide-bar-management";

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

    /* When the position is on the same tabline, just return its coords (relative to the left edge, of course)
     * When the position is on the next tabline, get its distance to *its* left edge, then add it to the coords of *our* right edge
     * When the position is on the prev tabline, get its distance to *its right edge, then subtract it from the coords of *our* left edge
     * When the position is on the next next tabline and beyond:
     * - Get the distance between it and *its* left edge
     * - Get the width of every full tabline in between
     * - Add it to the coords of *our* right edge
     * When the position is on the prev prev tabline and beyond:
     * - Get the distance between it and *its* right edge
     * - Get the width of every full tabline in between
     * - Subtract it from the coords of *our* left edge
     */

    const tablineStartIndex = tablineStarts.findLastIndex(
      (lineStart) => position >= lineStart,
    );

    const tablineStart = tablineStarts[tablineStartIndex];

    if (tablineStart < tabBarBounds.tabline.start) {
      // The position is on an earlier tabline than the current bar
      const tablineEnd = tablineStarts[tablineStartIndex + 1];
      const tablineLast = tablineEnd - subUnit.value;
      const tablineLastCoords = getStackCoords(tablineLast);
      if (!tablineLastCoords) return coords;
      // The end of the position's tabline
      const tablineEndX = tablineLastCoords.right;
      let offset = tablineEndX - coords.left;

      tablineStarts
        .slice(tablineStartIndex + 1, tabBarBounds.tabline.start - 1)
        .forEach((start, i) => {
          const startCoords = getStackCoords(start);
          const nextStart = tablineStarts[i + 1];
          const lastCoords = getStackCoords(nextStart - subUnit.value);
          offset += lastCoords!.right - startCoords!.left;
        });
      return withOffset(
        getStackCoords(tabBarBounds.tabline.start)!,
        -offset - tabBarBounds.left,
      );
    }

    if (tablineStart > tabBarBounds.tabline.start) {
      // The position is on a later tabline than the current bar

      const tablineStartCoords = getStackCoords(tablineStart);
      if (!tablineStartCoords) return coords;
      let offset = coords.right - tablineStartCoords.left;
      tablineStarts
        .slice(tabBarBounds.tabline.start + 1, tablineStartIndex - 1)
        .forEach((start, i) => {
          const startCoords = getStackCoords(start);
          const nextStart = tablineStarts[i + 1];
          const lastCoords = getStackCoords(nextStart - subUnit.value);
          offset += lastCoords!.right - startCoords!.left;
        });
      return withOffset(
        getStackCoords(tabBarBounds.tabline.end - subUnit.value)!,
        offset - tabBarBounds.left,
      );
    }

    return withOffset(coords, -tabBarBounds.left);
  };

  const valueFns: Map<HTMLElement, { [attribute: string]: ValueFn<keyof T> }> =
    new Map();

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

  function update(coordsMap: CoordsMap<keyof T>) {
    valueFns.forEach((attrToFn, el) => {
      for (const attr in attrToFn) {
        const fn = attrToFn[attr];
        updateElement(el, attr, fn(coordsMap));
      }
    });
  }

  function getCoordsMap() {
    const unwrappedPositions = Object.values(positions)
      .map(unref)
      .filter((position) => position !== undefined);

    const withCoords: [number, StackCoords][] = [];
    for (const position of unwrappedPositions) {
      const coords = getStackCoords(position);
      if (coords === undefined) {
        return;
      }
      withCoords.push([position, coords]);
    }

    const coordsMap = coordsMapFromListener(Object.fromEntries(withCoords));
    return coordsMap;
  }

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
  watch(
    [() => positions, /* flagging to potentially revisit */ tablineStarts],
    ([newPositions, oldPositions]) => {
      const unwrappedPositions = Object.values(newPositions)
        .map(unref)
        .filter((position) => position !== undefined);
      onWatcherCleanup(
        registerListener(unwrappedPositions, (posToCoords) => {
          update(coordsMapFromListener(posToCoords));
        }),
      );

      if (oldPositions) {
        const coordsMap = getCoordsMap();
        if (coordsMap) {
          update(coordsMap);
        }
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
    mounted: () => {
      const coordsMap = getCoordsMap();
      if (coordsMap) {
        update(coordsMap);
      }
    },
  };
}
