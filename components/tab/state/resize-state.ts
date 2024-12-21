import { useElementBounding } from "@vueuse/core";
import type { InjectionKey } from "vue";

export interface StackCoords {
  left: number;
  center: number;
  right: number;
}
export interface ResizeState {
  registerStackRef: (startPos: number, stack: HTMLDivElement | null) => void;
  getStackCoords: (startPos: number) => ComputedRef<StackCoords | undefined>;
  subUnit: ComputedRef<number>; // TODO: remove
}

export function createResizeState(subUnit: ComputedRef<number>): ResizeState {
  const stackX = new Map<number, Ref<number>>();
  let firstPos = Infinity;
  let lastPos = 0;
  let lastWidth: Ref<number>;

  function registerStackRef(startPos: number, stack: HTMLDivElement | null) {
    // console.log("registerStackRef", startPos, stack);
    // TODO: test with add and delete rows. the ref function might not retrigger
    if (!stack) {
      console.log("null called");
      stackX.delete(startPos);
      return;
    }
    const { x, width } = useElementBounding(stack);
    stackX.set(startPos, x);
    if (startPos > lastPos) {
      lastPos = startPos;
      lastWidth = width;
    }
    if (startPos < firstPos) {
      firstPos = startPos;
    }
  }

  function getStackCoords(startPos: number) {
    return computed<StackCoords | undefined>(() => {
      const startX = stackX.get(startPos);
      const firstX = stackX.get(firstPos)!;
      const offset = (x: number) => x - firstX.value;
      if (!startX) return;
      if (startPos === lastPos) {
        return {
          left: offset(startPos),
          center: offset(startX.value + lastWidth.value / 2),
          right: offset(startX.value + lastWidth.value),
        };
      }
      const nextX = stackX.get(startPos + subUnit.value);
      if (!nextX) return;
      return {
        left: offset(startX.value),
        center: offset((startX.value + nextX.value) / 2),
        right: offset(nextX.value),
      };
    });
  }

  return { registerStackRef, getStackCoords, subUnit };
}

export const ResizeStateInjectionKey = Symbol() as InjectionKey<ResizeState>;
