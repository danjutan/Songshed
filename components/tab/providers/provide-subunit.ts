import type { TabStore } from "~/model/stores";
import type { SettingsState } from "./state/provide-settings-state";

const SubunitInjectionKey = Symbol() as InjectionKey<Ref<number>>;

export function provideSubUnit(tabStore: TabStore, settings: SettingsState) {
  const subUnit = computed(() => tabStore.beatSize / settings.subdivisions);
  provide(SubunitInjectionKey, subUnit);
  return subUnit;
}

export function injectSubUnit() {
  return inject(SubunitInjectionKey) as ComputedRef<number>;
}
