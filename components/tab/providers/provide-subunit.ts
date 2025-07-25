import type { TabStore } from "~/model/stores";
import type { SettingsState } from "./state/provide-settings-state";

const SubunitInjectionKey = Symbol() as InjectionKey<Ref<number>>;

export function provideSubUnit(tabStore: TabStore, settings: SettingsState) {
  // TODO: make this work for time changes
  const subUnit = computed(() => {
    const timeChange = tabStore.timeChanges.get(0);
    if (!timeChange) return 1;
    return timeChange.beatSize / settings.subdivisions;
  });
  provide(SubunitInjectionKey, subUnit);
  return subUnit;
}

export function injectSubUnit() {
  return inject(SubunitInjectionKey) as ComputedRef<number>;
}
