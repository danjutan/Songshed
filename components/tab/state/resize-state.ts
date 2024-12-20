import { useElementBounding } from "@vueuse/core";
import type { InjectionKey, Reactive } from "vue";

export interface StackCoords {
  left: number;
  center: number;
  right: number;
}
export interface ResizeState {
  registerStackRef: (startPos: number, stack: HTMLDivElement | null) => void;
  getStackCoords: (startPos: number) => StackCoords | undefined;
  getPreviousStackPos: (startPosition: number) => number | undefined;
  getNextStackPos: (startPosition: number) => number | undefined;
}

export function createResizeState(): ResizeState {
  interface Stack {
    x: StackCoords; //reactive computed
    prev?: number;
    next?: number;
  }
  const posToX = new Map<number, Stack>();

  let firstPos = Infinity;
  let lastPos = 0;

  function registerStackRef(startPos: number, stack: HTMLDivElement | null) {
    if (!stack) {
      const current = posToX.get(startPos);
      if (current) {
        const { prev, next } = current;

        if (prev !== undefined) {
          const prevNode = posToX.get(prev);
          if (prevNode) prevNode.next = next;
        }

        if (next !== undefined) {
          const nextNode = posToX.get(next);
          if (nextNode) nextNode.prev = prev;
        }

        posToX.delete(startPos);
      }
      return;
    }

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
    if (startPos > lastPos) {
      lastPos = startPos;
    }
  }

  function getStackCoords(startPos: number) {
    const coords = posToX.get(startPos);
    if (!coords) return;
    const offset = (x: number) => x - posToX.get(firstPos)!.x.left;
    return {
      left: offset(coords.x.left),
      center: offset(coords.x.center),
      right: offset(coords.x.right),
    };
  }

  function getNextStackPos(startPosition: number): number | undefined {
    return posToX.get(startPosition)?.next;
  }

  function getPreviousStackPos(startPosition: number): number | undefined {
    return posToX.get(startPosition)?.prev;
  }
  // if (steps === 0) return getStackCoords(startPosition);

  // let position = startPosition;

  // while (steps >= 1) {
  //   const currentStack = posToX.get(position);

  //   if (!currentStack?.prev) {
  //     break;
  //   }

  //   position = currentStack.prev;
  //   steps--;
  // }

  // return getStackCoords(position);
  // }

  return {
    registerStackRef,
    getStackCoords,
    getPreviousStackPos,
    getNextStackPos,
  };
}

export const ResizeStateInjectionKey = Symbol() as InjectionKey<ResizeState>;
