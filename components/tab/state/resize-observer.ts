import { useElementBounding } from "@vueuse/core";
import type { InjectionKey, Reactive } from "vue";

export interface StackCoords {
  left: number;
  center: number;
  right: number;
}

export interface ResizeObserver {
  registerStackRef: (startPos: number, stack: HTMLDivElement | null) => void;
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

export function createResizeObserver(): ResizeObserver {
  interface Stack {
    x: StackCoords; //reactive computed
    prev?: number;
    next?: number;
  }
  const posToX = new Map<number, Stack>();

  let firstPos = Infinity;

  function registerStackRef(startPos: number, stack: HTMLDivElement | null) {
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

    const { x, width } = useElementBounding(stack);

    const newStack: Stack = {
      x: reactiveComputed(() => ({
        left: x.value,
        right: x.value + width.value,
        center: x.value + width.value / 2,
      })),
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

  return {
    registerStackRef,
    getStackCoords,
    getPreviousStackPos,
    getNextStackPos,
  };
}

export const ResizeObserverInjectionKey =
  Symbol() as InjectionKey<ResizeObserver>;
