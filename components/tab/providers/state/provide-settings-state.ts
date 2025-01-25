export function provideSettingsState() {
  const settings = reactive({
    subdivisions: 2, // per beat
    collapseSubdivisions: false,
    collapseEmpty: true,
    collapseAll: false,
    collapseRatio: 0.25, // for resizing,
    // pixels:
    cellHeight: 24,
    contextMenuHeight: 18,
    collapsedMinWidth: 12,
    // flags
    posLineCenter: true,
  });

  provide(SettingsInjectionKey, settings);
  return settings;
}

export type SettingsState = ReturnType<typeof provideSettingsState>;
const SettingsInjectionKey = Symbol() as InjectionKey<SettingsState>;

export function injectSettingsState() {
  return inject(SettingsInjectionKey) as SettingsState;
}
