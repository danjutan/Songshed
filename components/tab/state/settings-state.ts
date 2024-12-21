export function createSettingsState() {
  const settings = reactive({
    barsPerLine: 3,
    subdivisions: 4, // per beat
    collapseSubdivisions: true,
    collapseEmpty: true,
    collapseAll: false,
  });

  return settings;
}

export type Settings = ReturnType<typeof createSettingsState>;

export const SettingsInjectionKey = Symbol() as InjectionKey<Settings>;
