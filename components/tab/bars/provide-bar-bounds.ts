import type { InjectionKey } from "vue";
import type { Bar } from "~/components/tab/providers/state/provide-bar-management";

export interface TabBarBounds {
  start: number;
  end: number;
  tabline: {
    start: number;
    end: number;
  };
}

const TabBarBoundsInjectionKey = Symbol() as InjectionKey<TabBarBounds>;

export function provideTabBarBounds(
  bar: Bar,
  tablineStarts: ComputedRef<number[]>,
) {
  const tabBarBounds = reactiveComputed(() => {
    const tablineStartIndex =
      tablineStarts.value.findIndex((lineStart) => lineStart > bar.start) - 1;
    return {
      start: bar.start,
      end: bar.end,
      tabline: {
        start: tablineStarts.value[tablineStartIndex],
        end: tablineStarts.value[tablineStartIndex + 1],
      },
    };
  });

  provide(TabBarBoundsInjectionKey, tabBarBounds);
  return tabBarBounds;
}

export function injectTabBarBounds() {
  return inject(TabBarBoundsInjectionKey) as TabBarBounds;
}
