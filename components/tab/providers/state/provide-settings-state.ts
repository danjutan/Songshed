export function provideSettingsState() {
  const settings = reactive({
    // barsPerLine: 4,
    subdivisions: 4, // per beat
    collapseSubdivisions: false,
    collapseEmpty: false,
    collapseAll: true,
    collapseRatio: 0.25, // for resizing,
    // pixels:
    cellHeight: 24,
    contextMenuHeight: 18,
    collapsedMinWidth: 5,
    expandedMinWidth: 36,
  });

  provide(SettingsInjectionKey, settings);
  return settings;
}

export type SettingsState = ReturnType<typeof provideSettingsState>;
const SettingsInjectionKey = Symbol() as InjectionKey<SettingsState>;

export function injectSettingsState() {
  return inject(SettingsInjectionKey) as SettingsState;
}
