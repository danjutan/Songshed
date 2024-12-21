import { useElementBounding, useElementSize } from "@vueuse/core";
import type { InjectionKey } from "vue";

export interface StackCoords {
  left: number;
  center: number;
  right: number;
}
export interface ResizeState {
  registerStackRef: (startPos: number, stack: HTMLDivElement | null) => void;
  getStackCoords: (startPos: number) => Ref<StackCoords | undefined>;
}

export function createResizeState(subUnit: ComputedRef<number>): ResizeState {
  const stackX = new Map<number, Ref<number>>();
  let lastPos = 0;
  let lastWidth: Ref<number>;

  function registerStackRef(startPos: number, stack: HTMLDivElement | null) {
    // TODO: test with add and delete rows. the ref function might not retrigger
    if (!stack) {
      stackX.delete(startPos);
      return;
    }
    const { x, width } = useElementBounding(stack);
    stackX.set(startPos, x);
    if (startPos > lastPos) {
      lastPos = startPos;
      lastWidth = width;
    }
  }

  function getStackCoords(startPos: number) {
    return computed<StackCoords | undefined>(() => {
      const startX = stackX.get(startPos);
      if (!startX) return;
      if (startPos === lastPos) {
        return {
          left: startPos,
          center: startX.value + lastWidth.value / 2,
          right: startX.value + lastWidth.value,
        };
      }
      const nextX = stackX.get(startPos + subUnit.value);
      if (!nextX) return;
      return {
        left: startX.value,
        center: (startX.value + nextX.value) / 2,
        right: nextX.value,
      };
    });
  }

  return { registerStackRef, getStackCoords };
}

export const ResizeStateInjectionKey = Symbol() as InjectionKey<ResizeState>;
