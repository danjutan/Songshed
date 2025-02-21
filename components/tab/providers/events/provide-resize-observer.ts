import type { InjectionKey, Reactive } from "vue";

export interface StackCoords {
  top: number;
  left: number;
  center: number;
  right: number;
}

export function coordsEqual(
  a: StackCoords | undefined,
  b: StackCoords | undefined,
) {
  if (!a || !b) return false;
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.center === b.center &&
    a.right === b.right
  );
}

export function withOffset(coords: StackCoords, offset: number): StackCoords {
  return {
    top: coords.top,
    left: coords.left + offset,
    center: coords.center + offset,
    right: coords.right + offset,
  };
}

type StackResizeListener = (coords: Record<number, StackCoords>) => void;

export interface StackResizeObserver {
  registerStackRef: (pos: number, stack: HTMLElement) => void;
  registerTabBarRef: (pos: number, tabBar: HTMLElement) => void;
  registerListener: (
    positions: number[],
    listener: StackResizeListener,
  ) => () => void;
  registerTabBarListener: (
    pos: number,
    listener: (coords: StackCoords) => void,
  ) => () => void;
  tablineStarts: Readonly<number[]>;
  getStackCoords: (pos: number) => StackCoords | undefined;
}

const StackResizeObserverInjectionKey =
  Symbol() as InjectionKey<StackResizeObserver>;

type ListenerId = number;

export function provideStackResizeObserver() {
  let resizeObserver: ResizeObserver;

  let nextId = 0;
  const stackListeners = new Map<
    ListenerId,
    { positions: number[]; listener: StackResizeListener }
  >();

  const stackElements = new Map<number, HTMLElement>();
  const lastStackCoords = new Map<number, StackCoords>();

  const posStackListeners = new Map<number, ListenerId[]>();

  const tabBarElements = new Map<number, HTMLElement>();
  const lastTabBarCoords = new Map<number, StackCoords>();
  const tabBarListeners = new Map<number, ((coords: StackCoords) => void)[]>();

  const sortedPositions: number[] = [];

  const tablineStarts = reactive<number[]>([]);

  function registerListener(
    positions: number[],
    listener: StackResizeListener,
  ) {
    const id = nextId;
    stackListeners.set(id, { positions, listener });

    positions.forEach((pos) => {
      const posListeners = posStackListeners.get(pos) || [];
      posListeners.push(id);
      posStackListeners.set(pos, posListeners);
    });

    nextId++;
    return () => {
      stackListeners.delete(id);
      positions.forEach((pos) => {
        const currentListeners = posStackListeners.get(pos);
        if (currentListeners) {
          posStackListeners.set(
            pos,
            currentListeners.filter((l) => l !== id),
          );
        }
      });
    };
  }

  function registerTabBarListener(
    pos: number,
    listener: (coords: StackCoords) => void,
  ) {
    const posListeners = tabBarListeners.get(pos) || [];
    posListeners.push(listener);
    tabBarListeners.set(pos, posListeners);

    return () => {
      const currentListeners = tabBarListeners.get(pos);
      if (currentListeners) {
        tabBarListeners.set(
          pos,
          currentListeners.filter((l) => l !== listener),
        );
      }
    };
  }

  const createResizeObserver = () => {
    if (resizeObserver) return resizeObserver;
    resizeObserver = new ResizeObserver(
      useThrottleFn((entries) => {
        const tops: [position: number, top: number][] = [];
        const triggered = new Set<ListenerId>();
        // We need to loop through every stack, not just the ones that were resized; a resized element can trigger another stack to move without resizing it
        sortedPositions.forEach((pos) => {
          const el = stackElements.get(pos);
          if (!el) return;
          const { top, left, right, width } = el.getBoundingClientRect();
          // tops.push([pos, top]);
          const coords: StackCoords = {
            top,
            left,
            center: left + width / 2,
            right,
          };
          if (!coordsEqual(lastStackCoords.get(pos), coords)) {
            // if not equal, look up the multifns for the coord
            // we will get different functions associated with diff positions
            // some fns will be associated with the same positions but will be from diff directive instances
            // regardless, a fn with two positions only need to be fired once if each position changes
            // so we need a way of tracking whether we've seen this fn before
            // each fn is originally inserted under all its dependencies with the same id
            // listeners only get tracked here if that id hasn't already been tracked

            lastStackCoords.set(pos, coords);
            const listeners = posStackListeners.get(pos);
            if (listeners) {
              listeners.forEach((id) => triggered.add(id));
            }
          }

          if (tabBarElements.has(pos)) {
            const el = tabBarElements.get(pos);
            if (!el) return;
            const { top, left, right, width } = el.getBoundingClientRect();
            tops.push([pos, top]);
            const coords: StackCoords = {
              top,
              left,
              center: left + width / 2,
              right,
            };
            if (!coordsEqual(lastTabBarCoords.get(pos), coords)) {
              lastTabBarCoords.set(pos, coords);
              const listeners = tabBarListeners.get(pos);
              if (listeners) {
                listeners.forEach((listener) => listener(coords));
              }
            }
          }
        });

        for (const id of triggered) {
          const { positions, listener } = stackListeners.get(id)!;
          const coords: Record<number, StackCoords> = {};
          for (const pos of positions) {
            coords[pos] = lastStackCoords.get(pos)!;
          }
          listener(coords);
        }

        // Trigger an update only if the array is actually different
        tablineStarts.splice(
          0,
          tablineStarts.length,
          ...tops
            .filter(([pos, top], i) => tops[i - 1]?.[1] !== top)
            .map(([pos]) => pos),
        );
      }, 50),
    );
    return resizeObserver;
  };

  function registerStackRef(startPos: number, stack: HTMLElement) {
    stackElements.set(startPos, stack);
    // createResizeObserver().observe(stack);
    sortedPositions.push(startPos);
    sortedPositions.sort((a, b) => a - b);
  }

  function registerTabBarRef(startPos: number, tabBar: HTMLElement) {
    tabBarElements.set(startPos, tabBar);
    createResizeObserver().observe(tabBar);
    // sortedPositions.push(startPos);
    // sortedPositions.sort((a, b) => a - b);
  }

  function getStackCoords(pos: number) {
    return lastStackCoords.get(pos);
  }

  const stackResizeObserver: StackResizeObserver = {
    tablineStarts: readonly(tablineStarts),
    registerStackRef,
    registerListener,
    getStackCoords,
    registerTabBarRef,
    registerTabBarListener,
  };

  provide(StackResizeObserverInjectionKey, stackResizeObserver);
  return stackResizeObserver;
}

export function injectStackResizeObserver() {
  return inject(StackResizeObserverInjectionKey) as StackResizeObserver;
}
