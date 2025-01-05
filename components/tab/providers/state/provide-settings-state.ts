export function provideSettingsState() {
  const settings = reactive({
    barsPerLine: 2,
    subdivisions: 4, // per beat
    collapseSubdivisions: false,
    collapseEmpty: false,
    collapseAll: true,
    cellHeight: "24px",
  });

  provide(SettingsInjectionKey, settings);
  return settings;
}

type Settings = ReturnType<typeof provideSettingsState>;
const SettingsInjectionKey = Symbol() as InjectionKey<Settings>;

export function injectSettingsState() {
  return inject(SettingsInjectionKey) as Settings;
}
