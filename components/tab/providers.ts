import type { InjectionKey } from "vue";

export const VisualizationStateKey = Symbol() as InjectionKey<VisualizationState>;

type VisualizationState = {
  isExpanded(tabStart: number, notches: number, column: number): boolean
  toggleExpanded(tabStart: number, notches: number, start: number, num?: number): void
};

export function createVisualizationState(): VisualizationState {
  const expanded = reactive<Set<string>>(new Set());
  const key = (tabStart: number, notches: number, column: number) => `${tabStart},${notches},${column}`;

  function isExpanded(tabStart: number, notches: number, column: number) {
    return expanded.has(key(tabStart, notches, column));
  }

  function toggleExpanded(tabStart: number, notches: number, start: number, num = 1) {
    for (let i = start; i < start + num; i++) {
      const k = key(tabStart, notches, i);
      if (expanded.has(k)) {
        expanded.delete(k);
        continue;
      }
      expanded.add(k);
    }
  }

  return { isExpanded, toggleExpanded };
}
