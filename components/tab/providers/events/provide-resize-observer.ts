import type { InjectionKey, Reactive } from "vue";
import { useResizeObserver } from "@vueuse/core";
import type { ColumnsMap } from "../provide-columns-map";

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

const StackResizeObserverInjectionKey =
  Symbol() as InjectionKey<StackResizeObserver>;

export function provideStackResizeObserver(columnsMap: ColumnsMap) {
  interface Stack {
    x: Reactive<StackCoords>;
    ref: HTMLDivElement;
    prev?: number;
    next?: number;
  }

  const posToX = reactive(new Map<number, Stack>());

  let firstPos = Infinity;

  let resizeObserver: ResizeObserver;

  function updateStackCoords(el: HTMLElement, position: number) {
    const rect = el.getBoundingClientRect();
    const coords: StackCoords = {
      left: rect.left,
      center: rect.left + rect.width / 2,
      right: rect.right,
    };
    posToX.get(position)!.x = coords;
  }

  const createResizeObserver = () => {
    if (resizeObserver) return resizeObserver;
    resizeObserver = new ResizeObserver((entries) => {
      const startEntry = entries[0].target as HTMLElement;
      const endEntry = entries[entries.length - 1].target as HTMLElement;

      const startPos = +startEntry.dataset.position!;
      const endPos = +endEntry.dataset.position!;

      if (!(startPos in columnsMap) || !(endPos in columnsMap)) return;

      const startTabline = columnsMap[startPos].tabline;
      const endTabline = columnsMap[endPos].tabline;

      for (const [pos, stack] of posToX) {
        const tabline = columnsMap[pos]?.tabline;
        if (tabline === undefined) continue;
        if (tabline >= startTabline && tabline <= endTabline) {
          updateStackCoords(stack.ref, pos);
        }
      }
    });
    return resizeObserver;
  };

  function registerStackRef(startPos: number, stack: HTMLDivElement) {
    stack.dataset.position = startPos.toString();
    createResizeObserver().observe(stack);

    const rect = stack.getBoundingClientRect();
    const newStack: Stack = {
      ref: stack,
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

  const stackResizeObserver: StackResizeObserver = {
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
