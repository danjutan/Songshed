import type { InjectionKey, Reactive } from "vue";
import { useResizeObserver } from "@vueuse/core";

export interface StackCoords {
  left: number;
  center: number;
  right: number;
}

export interface StackResizeObserver {
  registerStackRef: (startPos: number, stack: HTMLDivElement) => void;
  getStackCoords: (startPos: number) => StackCoords | undefined;
  getPreviousStackPos: (startPosition: number) => number | undefined;
  getNextStackPos: (startPosition: number) => number | undefined;
}

export function withOffset(coords: StackCoords, offset: number): StackCoords {
  return {
    left: coords.left + offset,
    center: coords.center + offset,
    right: coords.right + offset,
  };
}

function createStackResizeObserver(): StackResizeObserver {
  interface Stack {
    x: Reactive<StackCoords>;
    prev?: number;
    next?: number;
  }
  const posToX = reactive(new Map<number, Stack>());

  let firstPos = Infinity;

  let resizeObserver: ResizeObserver;

  const createResizeObserver = () => {
    if (resizeObserver) return resizeObserver;
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const position = +(entry.target as HTMLElement).dataset.position!;
        const rect = (entry.target as HTMLElement).getBoundingClientRect();
        const coords: StackCoords = {
          left: rect.left,
          center: rect.left + rect.width / 2,
          right: rect.right,
        };
        posToX.get(position)!.x = coords;
      }
    });
    return resizeObserver;
  };

  let stopFn: () => void;

  function registerStackRef(startPos: number, stack: HTMLDivElement) {
    stack.dataset.position = startPos.toString();
    createResizeObserver().observe(stack);

    // if (!stack) {
    //   const current = posToX.get(startPos);
    //   if (current) {
    //     const { prev, next } = current;

    //     if (prev !== undefined) {
    //       const prevNode = posToX.get(prev);
    //       if (prevNode) prevNode.next = next;
    //     }

    //     if (next !== undefined) {
    //       const nextNode = posToX.get(next);
    //       if (nextNode) nextNode.prev = prev;
    //     }

    //     posToX.delete(startPos);
    //   }
    //   return;
    // }

    // const { x, width } = useElementBounding(stack);

    const rect = stack.getBoundingClientRect();
    const newStack: Stack = {
      x: {
        left: rect.left,
        center: rect.left + rect.width / 2,
        right: rect.right,
      },
    };

    // Find the correct position for insertion
    let prevNode: number | undefined;
    let nextNode: number | undefined;

    for (const [key] of posToX) {
      if (key < startPos) {
        prevNode = key;
      } else if (key > startPos && nextNode === undefined) {
        nextNode = key;
      }
    }
    newStack.prev = prevNode;
    newStack.next = nextNode;

    if (prevNode !== undefined) {
      const prevStack = posToX.get(prevNode);
      if (prevStack) prevStack.next = startPos;
    }

    if (nextNode !== undefined) {
      const nextStack = posToX.get(nextNode);
      if (nextStack) nextStack.prev = startPos;
    }

    posToX.set(startPos, newStack);

    if (startPos < firstPos) firstPos = startPos;

    console.log(
      Array.from(posToX.entries()).map(([pos, stack]) => [pos, stack.x.left]),
    );
  }

  function getStackCoords(startPos: number) {
    const coords = posToX.get(startPos);
    if (!coords) return;
    // WARNING: assumes all tablines start at the same x position
    return withOffset(coords.x, -posToX.get(firstPos)!.x.left);
  }

  function getNextStackPos(startPosition: number): number | undefined {
    return posToX.get(startPosition)?.next;
  }

  function getPreviousStackPos(startPosition: number): number | undefined {
    return posToX.get(startPosition)?.prev;
  }

  return {
    registerStackRef,
    getStackCoords,
    getPreviousStackPos,
    getNextStackPos,
  };
}

const StackResizeObserverInjectionKey =
  Symbol() as InjectionKey<StackResizeObserver>;

export function provideStackResizeObserver() {
  const stackResizeObserver = createStackResizeObserver();
  provide(StackResizeObserverInjectionKey, stackResizeObserver);
  return stackResizeObserver;
}

export function injectStackResizeObserver() {
  return inject(StackResizeObserverInjectionKey) as StackResizeObserver;
}
