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
  const resizeObserver = injectStackResizeObserver();
  const subUnit = injectSubUnit();

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

    return withOffset(coords, -(tabBarBounds.left ?? 0));
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
        resizeObserver.registerListener(unwrappedPositions, (posToCoords) => {
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
              resizeObserver.getStackCoords(position)!,
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
