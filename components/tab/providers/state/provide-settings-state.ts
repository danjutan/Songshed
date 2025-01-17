export function provideSettingsState() {
  const settings = reactive({
    barsPerLine: 4,
    subdivisions: 4, // per beat
    collapseSubdivisions: false,
    collapseEmpty: false,
    collapseAll: true,
    // pixels:
    cellHeight: 24,
    contextMenuHeight: 18,
  });

  provide(SettingsInjectionKey, settings);
  return settings;
}

export type SettingsState = ReturnType<typeof provideSettingsState>;
const SettingsInjectionKey = Symbol() as InjectionKey<SettingsState>;

export function injectSettingsState() {
  return inject(SettingsInjectionKey) as SettingsState;
}
