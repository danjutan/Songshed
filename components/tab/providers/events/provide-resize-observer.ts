import type { InjectionKey, Reactive } from "vue";

export interface StackCoords {
  top: number;
  left: number;
  center: number;
  right: number;
}

function coordsEqual(a: StackCoords | undefined, b: StackCoords | undefined) {
  if (!a || !b) return false;
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.center === b.center &&
    a.right === b.right
  );
}

export interface StackResizeObserver {
  registerStackRef: (pos: number, stack: HTMLElement) => void;
  registerListener: (
    pos: number,
    listener: (coords: StackCoords) => void,
  ) => () => void;
  tablineStarts: Readonly<number[]>;
}

export function withOffset(coords: StackCoords, offset: number): StackCoords {
  return {
    top: coords.top,
    left: coords.left + offset,
    center: coords.center + offset,
    right: coords.right + offset,
  };
}

const StackResizeObserverInjectionKey =
  Symbol() as InjectionKey<StackResizeObserver>;

export function provideStackResizeObserver() {
  let resizeObserver: ResizeObserver;

  const stackElements = new Map<number, HTMLElement>();
  const lastCoords = new Map<number, StackCoords>();
  const stackListeners = new Map<number, ((coords: StackCoords) => void)[]>();
  const sortedPositions: number[] = [];

  const tablineStarts = reactive<number[]>([]);

  function registerListener(
    pos: number,
    listener: (coords: StackCoords) => void,
  ) {
    const posListeners = stackListeners.get(pos) || [];
    posListeners.push(listener);
    stackListeners.set(pos, posListeners);

    return () => {
      const currentListeners = stackListeners.get(pos);
      if (currentListeners) {
        stackListeners.set(
          pos,
          currentListeners.filter((l) => l !== listener),
        );
      }
    };
  }

  const createResizeObserver = () => {
    if (resizeObserver) return resizeObserver;
    resizeObserver = new ResizeObserver((entries) => {
      const tops: [position: number, top: number][] = [];
      // We need to loop through every stack, not just the ones that were resized; a resized element can trigger another stack to move without resizing it
      sortedPositions.forEach((pos) => {
        const el = stackElements.get(pos);
        if (!el) return;
        const { top, left, right, width } = el.getBoundingClientRect();
        tops.push([pos, top]);
        const coords: StackCoords = {
          top,
          left,
          center: left + width / 2,
          right,
        };
        if (!coordsEqual(lastCoords.get(pos), coords)) {
          lastCoords.set(pos, coords);
          const listeners = stackListeners.get(pos);
          if (listeners) {
            listeners.forEach((listener) => listener(coords));
          }
        }
      });
      // Trigger an update only if the array is actually different
      tablineStarts.splice(
        0,
        tablineStarts.length,
        0,
        ...tops
          .filter(([pos, top], i) => tops[i - 1]?.[1] !== top)
          .map(([pos]) => pos),
      );
      // entries.forEach((entry) => {
      // entries.forEach((entry) => {
      //   const el = entry.target as HTMLElement;
      //   const position = el.dataset.position;
      //   if (!position) return;
      //   const listeners = stackListeners.get(+position);
      //   const { top, left, width, right } = el.getBoundingClientRect();
      //   const coords: StackCoords = {
      //     top,
      //     left,
      //     center: left + width / 2,
      //     right,
      //   };
      //   lastCoords.set(+position, coords);
      //   if (!listeners) {
      //     return;
      //   }
      //   listeners.forEach((listener) => listener(coords));
      // });
    });
    return resizeObserver;
  };

  function registerStackRef(startPos: number, stack: HTMLElement) {
    stack.dataset.position = startPos.toString();
    stackElements.set(startPos, stack);
    createResizeObserver().observe(stack);
    sortedPositions.push(startPos);
    sortedPositions.sort((a, b) => a - b);
  }

  // const tablineStarts = computed(() => {
  //   const entries = [...lastCoords.entries()]
  //     .sort((a, b) => a[0] - b[0])
  //     .map(([position, coords]) => ({ position, y: coords.top }));
  //   const breaks: number[] = [];
  //   if (entries.length === 0) return [0];

  //   entries.forEach(({ position, y }, i: number) => {
  //     if (i === 0) return;
  //     const prevY = entries[i - 1].y;
  //     if (y !== prevY) {
  //       breaks.push(position);
  //     }
  //   });

  //   return [0, ...breaks, entries[entries.length - 1].position];
  // });
  const stackResizeObserver: StackResizeObserver = {
    tablineStarts: readonly(tablineStarts),
    registerStackRef,
    registerListener,
  };

  provide(StackResizeObserverInjectionKey, stackResizeObserver);
  return stackResizeObserver;
}

export function injectStackResizeObserver() {
  return inject(StackResizeObserverInjectionKey) as StackResizeObserver;
}
