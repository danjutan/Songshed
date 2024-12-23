import type { Reactive } from "vue";
import type { Bar } from "@/components/tab/Tab.vue";

export interface TablineBounds {
  start: number;
  last: number;
}

const TablineBoundsInjectionKey = Symbol() as InjectionKey<TablineBounds>;

export function provideTablineBounds(
  props: Reactive<{ bars: Bar[]; columnsPerBar: number; subUnit: number }>,
) {
  const tablineBounds = reactiveComputed(() => ({
    start: props.bars[0].start,
    last:
      props.bars[0].start +
      props.bars.length * props.columnsPerBar * props.subUnit -
      props.subUnit,
  }));
  provide(TablineBoundsInjectionKey, tablineBounds);
  return tablineBounds;
}

export function injectTablineBounds() {
  return inject(TablineBoundsInjectionKey) as TablineBounds;
}
