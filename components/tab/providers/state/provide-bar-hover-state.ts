export interface BarHoverState {
  hoveredBarStart: ComputedRef<number | undefined>;
  setHoveredBarStart: (position: number) => void;
  clearHoveredBarStart: () => void;
}

const barHoverKey = Symbol() as InjectionKey<BarHoverState>;

export function provideBarHoverState() {
  const hoveredBarStart = ref<number>();

  const setHoveredBarStart = (position: number) => {
    hoveredBarStart.value = position;
  };

  const state: BarHoverState = {
    hoveredBarStart: computed(() => hoveredBarStart.value),
    setHoveredBarStart,
    clearHoveredBarStart: () => (hoveredBarStart.value = undefined),
  };

  provide(barHoverKey, state);
  return state;
}

export function injectBarHoverState() {
  return inject(barHoverKey) as BarHoverState;
}
