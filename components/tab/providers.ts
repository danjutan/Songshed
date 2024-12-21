import type { InjectionKey } from "vue";

export const VisualizationStateKey = Symbol() as InjectionKey<VisualizationState>;

type VisualizationState = {
  expanded: Set<number>
  toggleExpanded(start: number, num?: number): void
};

export function createVisualizationState(): VisualizationState {
  const expanded = reactive<Set<number>>(new Set());

  function toggleExpanded(start: number, num = 1) {
    for (let i = start; i < start + num; i++) {
      if (expanded.has(i)) {
        expanded.delete(i);
        continue;
      }
      expanded.add(i);
    }
  }

  return { expanded, toggleExpanded };
}
