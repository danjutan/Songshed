import type { TabStore } from "~/model/stores";

const BeatsizeInjectionKey = Symbol() as InjectionKey<Ref<number>>;

export function provideBeatSize(tabStore: TabStore) {
  const beatSize = computed(() => tabStore.beatSize);
  provide(BeatsizeInjectionKey, beatSize);
  return beatSize;
}

export function injectBeatSize() {
  return inject(BeatsizeInjectionKey) as ComputedRef<number>;
}
