import type { TabStore } from "~/model/stores";
import type { SettingsState } from "~/components/editor/providers/provide-settings-state";
import type { TimeSignature } from "~/model/data";

const SubunitFunctionsInjectionKey = Symbol() as InjectionKey<{
  getSubUnitForPosition: (position: number) => number;
  getPreviousPosition: (position: number) => number;
}>;

export function provideSubUnit(
  tabStore: TabStore,
  settings: SettingsState,
  getTimeSignatureAt: (position: number, before?: boolean) => TimeSignature,
) {
  function getSubUnitForPosition(position: number): number {
    const timeSignature = getTimeSignatureAt(position, false);
    return timeSignature.beatSize / settings.subdivisions;
  }

  function getPreviousPosition(position: number): number {
    const timeSignature = getTimeSignatureAt(position, true);
    const subunit = timeSignature.beatSize / settings.subdivisions;
    return position - subunit;
  }

  const subunitFunctions = {
    getSubUnitForPosition,
    getPreviousPosition,
  };

  provide(SubunitFunctionsInjectionKey, subunitFunctions);

  return subunitFunctions;
}

export type SubunitFunctions = ReturnType<typeof provideSubUnit>;

export function injectSubUnitFunctions() {
  return inject(SubunitFunctionsInjectionKey) as SubunitFunctions;
}
