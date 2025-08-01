import type { TabStore } from "~/model/stores";
import type { SettingsState } from "./state/provide-settings-state";

const SubunitFunctionsInjectionKey = Symbol() as InjectionKey<{
  getSubUnitForPosition: (position: number) => number;
  getPreviousPosition: (position: number) => number;
}>;

export function provideSubUnit(tabStore: TabStore, settings: SettingsState) {
  // if includeStartOfBar is false, and position is at the start of a bar
  // with a time change, use the previous time change instead
  function getTimeSignatureForPosition(
    position: number,
    includeStartOfBar: boolean = true,
  ) {
    const timeChangePositions = [...tabStore.timeChanges.keys()].sort(
      (a, b) => a - b,
    );

    let timeSignature = tabStore.timeChanges.get(0);
    if (!timeSignature) {
      return { beatsPerBar: 4, beatSize: 1 };
    }

    // Find the most recent time change that applies to this position
    for (const changePos of timeChangePositions) {
      const isPositionPastChange = includeStartOfBar
        ? changePos <= position
        : changePos < position;

      if (isPositionPastChange) {
        timeSignature = tabStore.timeChanges.get(changePos)!;
      } else {
        break;
      }
    }

    return timeSignature;
  }

  function getSubUnitForPosition(position: number): number {
    const timeSignature = getTimeSignatureForPosition(position, true);
    return timeSignature.beatSize / settings.subdivisions;
  }

  function getPreviousPosition(position: number): number {
    const timeSignature = getTimeSignatureForPosition(position, false);
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
