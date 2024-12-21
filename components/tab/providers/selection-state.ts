import type { InjectionKey } from "vue";

export const SelectionStateKey = Symbol() as InjectionKey<SelectionState>;

type SelectionState = {
  readonly start: number | undefined
  readonly end: number | undefined
  addSelected (start: number, end: number): void
  isSelected (start: number, end?: number): boolean
  clear(): void
};

export function createSelectionState(): SelectionState {
  const start = ref<number | undefined>();
  const end = ref<number | undefined>();

  const contains = (position: number) =>
    start.value !== undefined && end.value !== undefined
    && start.value <= position && position < end.value;

  return {
    get start() {
      return start.value;
    },
    get end() {
      return end.value;
    },
    addSelected(s: number, e: number) {
      if (contains(s) && e > end.value!) {
        end.value = e;
        return;
      }
      if (contains(e) && s < start.value!) {
        start.value = s;
        return;
      }
      start.value = s;
      end.value = e;
    },
    isSelected(s: number, e?: number) {
      if (e && e < s)
        return false;
      return contains(s) && (e === undefined || contains(e));
    },
    clear() {
      start.value = undefined;
      end.value = undefined;
    },
  };
}
