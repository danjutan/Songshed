import type { InjectionKey } from "vue";

export const SelectionStateKey = Symbol() as InjectionKey<SelectionState>;

type SelectionState = {
  setSelected (start: number, end: number): void
  isSelected (start: number, end?: number): boolean
  clear(): void
};
