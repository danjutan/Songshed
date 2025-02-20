import type { InjectionKey } from "vue";
import type { Bar } from "~/components/tab/providers/state/provide-bar-management";
import type {
  StackCoords,
  StackResizeObserver,
} from "../providers/events/provide-resize-observer";

export interface TabBarBounds {
  start: number;
  end: number;
  tabline: {
    start: number;
    end: number;
  };
  left: number | undefined;
  top: number | undefined;
}

const TabBarBoundsInjectionKey = Symbol() as InjectionKey<TabBarBounds>;

export function provideTabBarBounds(
  bar: Bar,
  resizeObserver: StackResizeObserver,
  tabBar: ComputedRef<HTMLElement | undefined>,
) {
  const { tablineStarts, registerTabBarRef, registerTabBarListener } =
    resizeObserver;

  const coords = ref<StackCoords>();

  onMounted(() => {
    registerTabBarRef(bar.start, tabBar.value!);
  });

  const tabBarBounds = reactiveComputed(() => {
    const tablineStartIndex =
      tablineStarts.findIndex((lineStart) => lineStart > bar.start) - 1;

    registerTabBarListener(bar.start, (c) => {
      coords.value = c;
    });

    return {
      start: bar.start,
      end: bar.end,
      tabline: {
        start: tablineStarts[tablineStartIndex],
        end: tablineStarts[tablineStartIndex + 1],
      },
      left: coords.value ? coords.value.left : undefined,
      top: coords.value ? coords.value.top : undefined,
    };
  });

  provide(TabBarBoundsInjectionKey, tabBarBounds);
  return tabBarBounds;
}

export function injectTabBarBounds() {
  return inject(TabBarBoundsInjectionKey) as TabBarBounds;
}
