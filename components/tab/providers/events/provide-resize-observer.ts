import type { InjectionKey, Reactive } from "vue";

export interface StackCoords {
  top: number;
  left: number;
  center: number;
  right: number;
}

export interface StackResizeObserver {
  registerStackRef: (startPos: number, stack: HTMLDivElement) => void;
  getStackCoords: (
    position: number,
    barStart?: number,
  ) => StackCoords | undefined;
  getPreviousStackPos: (startPosition: number) => number | undefined;
  getNextStackPos: (startPosition: number) => number | undefined;
  tablineStarts: ComputedRef<number[]>;
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
  interface Stack {
    coords: Reactive<StackCoords>;
    ref: HTMLDivElement;
    prev?: number;
    next?: number;
  }

  const posToCoords = reactive(new Map<number, Stack>());
  const posToY = computed(() =>
    [...posToCoords.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([position, stack]) => ({ position, y: stack.coords.top })),
  );

  const tablineStarts = computed<number[]>(() => {
    const breaks: number[] = [];

    if (posToY.value.length === 0) return [0];

    posToY.value.forEach(({ position, y }, i: number) => {
      if (i === 0) return;
      const prevY = posToY.value[i - 1].y;
      if (y !== prevY) {
        breaks.push(position);
      }
    });

    const tablineStarts = [
      0,
      ...breaks,
      posToY.value[posToY.value.length - 1].position,
    ];
    console.log(tablineStarts);
    return tablineStarts;
  });

  let firstPos = Infinity;

  let resizeObserver: ResizeObserver;

  function updateStackCoords(el: HTMLElement, position: number) {
    const rect = el.getBoundingClientRect();
    const coords: StackCoords = {
      top: rect.top,
      left: rect.left,
      center: rect.left + rect.width / 2,
      right: rect.right,
    };
    posToCoords.get(position)!.coords = coords;
  }

  const createResizeObserver = () => {
    if (resizeObserver) return resizeObserver;
    resizeObserver = new ResizeObserver((entries) => {
      // TODO: This is a major performance bottleneck.
      for (const [pos, stack] of posToCoords) {
        updateStackCoords(stack.ref, pos);
      }

      // Try this later; I'm concerned about tablineStarts being circular
      // const startEntry = entries[0].target as HTMLElement;
      // const endEntry = entries[entries.length - 1].target as HTMLElement;

      // const startPos = +startEntry.dataset.position!;
      // const endPos = +endEntry.dataset.position!;

      // const startTabline = tablineStarts.value.find(
      //   (lineStartPos) => startPos >= lineStartPos,
      // );
      // const endTablineIndex = tablineStarts.value.findLastIndex(
      //   (lineStartPos) => endPos >= lineStartPos,
      // );

      // const rangeStart: number = startTabline!;
      // const rangeEnd: number | undefined =
      //   tablineStarts.value[endTablineIndex + 1];

      // for (const [pos, stack] of posToCoords) {
      //   if ((pos >= rangeStart && !rangeEnd) || pos < rangeEnd) {
      //     updateStackCoords(stack.ref, pos);
      //   }
      // }
    });
    return resizeObserver;
  };

  function registerStackRef(startPos: number, stack: HTMLDivElement) {
    stack.dataset.position = startPos.toString();
    createResizeObserver().observe(stack);

    const rect = stack.getBoundingClientRect();
    const newStack: Stack = {
      ref: stack,
      coords: {
        top: rect.top,
        left: rect.left,
        center: rect.left + rect.width / 2,
        right: rect.right,
      },
    };

    // Find the correct position for insertion
    let prevNode: number | undefined;
    let nextNode: number | undefined;

    for (const [key] of posToCoords) {
      if (key < startPos) {
        prevNode = key;
      } else if (key > startPos && nextNode === undefined) {
        nextNode = key;
      }
    }
    newStack.prev = prevNode;
    newStack.next = nextNode;

    if (prevNode !== undefined) {
      const prevStack = posToCoords.get(prevNode);
      if (prevStack) prevStack.next = startPos;
    }

    if (nextNode !== undefined) {
      const nextStack = posToCoords.get(nextNode);
      if (nextStack) nextStack.prev = startPos;
    }

    posToCoords.set(startPos, newStack);

    if (startPos < firstPos) firstPos = startPos;
  }

  function getStackCoords(position: number, barStart?: number) {
    if (!posToCoords.has(position)) return;
    const coords = posToCoords.get(position)!.coords;
    if (barStart !== undefined) {
      const barStartCoords = posToCoords.get(barStart)!.coords;
      return withOffset(coords, -barStartCoords.left);
    }
    return coords;
  }

  function getNextStackPos(startPosition: number): number | undefined {
    return posToCoords.get(startPosition)?.next;
  }

  function getPreviousStackPos(startPosition: number): number | undefined {
    return posToCoords.get(startPosition)?.prev;
  }

  const stackResizeObserver: StackResizeObserver = {
    tablineStarts,
    registerStackRef,
    getStackCoords,
    getPreviousStackPos,
    getNextStackPos,
  };

  provide(StackResizeObserverInjectionKey, stackResizeObserver);
  return stackResizeObserver;
}

export function injectStackResizeObserver() {
  return inject(StackResizeObserverInjectionKey) as StackResizeObserver;
}
