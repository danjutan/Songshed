export function provideSettingsState() {
  const settings = reactive({
    subdivisions: 4, // per beat
    collapseSubdivisions: false,
    collapseEmpty: true,
    collapseAll: false,
    cellHeight: 24,
    posLineCenter: true,
    colorPositions: "gray" as "hover" | false | "always" | "gray",
    colorSmallest: false,
    onlyColorBar: true,
  });

  provide(SettingsInjectionKey, settings);
  return settings;
}

export type SettingsState = ReturnType<typeof provideSettingsState>;
const SettingsInjectionKey = Symbol() as InjectionKey<SettingsState>;

export function injectSettingsState() {
  return inject(SettingsInjectionKey) as SettingsState;
}
