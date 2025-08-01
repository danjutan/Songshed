import type { InjectionKey } from "vue";
import type {
  Bar,
  BarManagementState,
} from "~/components/tab/providers/state/provide-bar-management";
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
  resizeObserver: StackResizeObserver,
  barManagement: BarManagementState,
  bar: ComputedRef<Bar>,
  tabBarEl: ComputedRef<HTMLElement | undefined>,
) {
  const { tablineStarts, registerTabBarRef, registerTabBarListener } =
    resizeObserver;

  const coords = ref<StackCoords>();

  onMounted(() => {
    registerTabBarRef(bar.value.start, tabBarEl.value!);
  });

  const tabBarBounds = reactiveComputed(() => {
    const tablineBounds = [...tablineStarts, barManagement.bars.at(-1)!.end];
    const tablineStartIndex = Math.max(
      tablineBounds.findIndex((lineStart) => lineStart > bar.value.start) - 1,
      0,
    );

    registerTabBarListener(bar.value.start, (c) => {
      coords.value = c;
    });

    return {
      start: bar.value.start,
      end: bar.value.end,
      tabline: {
        start: tablineBounds[tablineStartIndex],
        end: tablineBounds[tablineStartIndex + 1],
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
