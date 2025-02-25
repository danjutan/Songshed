import {
  computed,
  type ComputedRef,
  type InjectionKey,
  inject,
  provide,
} from "vue";
import type { SettingsState } from "./state/provide-settings-state";

export interface SpacingsState {
  cellHeight: ComputedRef<number>;
  cellHeightPx: ComputedRef<string>;
  dividerWidth: ComputedRef<number>;
  dividerWidthPx: ComputedRef<string>;
  contextMenuHeight: ComputedRef<number>;
  contextMenuHeightPx: ComputedRef<string>;
  collapsedMinWidth: ComputedRef<number>;
  collapsedMinWidthPx: ComputedRef<string>;
  noteTieDraggerSize: ComputedRef<number>;
  noteTieDraggerSizePx: ComputedRef<string>;
  expandedMinWidth: ComputedRef<number>;
  expandedMinWidthPx: ComputedRef<string>;
}

const SpacingsStateKey: InjectionKey<SpacingsState> = Symbol("SpacingsState");

export function provideSpacings(settings: SettingsState): SpacingsState {
  const cellHeight = computed(() => settings.cellHeight);
  const dividerWidth = computed(() => settings.cellHeight / 3);
  const contextMenuHeight = computed(() => (settings.cellHeight * 3) / 4);
  const collapsedMinWidth = computed(() => settings.cellHeight / 2);
  const noteTieDraggerSize = computed(() => settings.cellHeight / 3);
  const expandedMinWidth = computed(
    () => settings.cellHeight + noteTieDraggerSize.value * 1.5,
  );

  const cellHeightPx = computed(() => `${cellHeight.value}px`);
  const dividerWidthPx = computed(() => `${dividerWidth.value}px`);
  const contextMenuHeightPx = computed(() => `${contextMenuHeight.value}px`);
  const collapsedMinWidthPx = computed(() => `${collapsedMinWidth.value}px`);
  const noteTieDraggerSizePx = computed(() => `${noteTieDraggerSize.value}px`);
  const expandedMinWidthPx = computed(() => `${expandedMinWidth.value}px`);

  const state: SpacingsState = {
    cellHeight,
    cellHeightPx,
    dividerWidth,
    dividerWidthPx,
    contextMenuHeight,
    contextMenuHeightPx,
    collapsedMinWidth,
    collapsedMinWidthPx,
    noteTieDraggerSize,
    noteTieDraggerSizePx,
    expandedMinWidth,
    expandedMinWidthPx,
  };

  provide(SpacingsStateKey, state);

  return state;
}

export function injectSpacingsState() {
  return inject(SpacingsStateKey) as SpacingsState;
}
