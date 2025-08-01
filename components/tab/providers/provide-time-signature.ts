import { type InjectionKey, inject, provide } from "vue";
import type { TabStore } from "~/model/stores";
import type { TimeSignature } from "~/model/data";

export interface TimeSignatureState {
  getTimeSignatureAt: (position: number, before?: boolean) => TimeSignature;
}

const TimeSignatureInjectionKey = Symbol() as InjectionKey<TimeSignatureState>;

export function provideTimeSignature(tabStore: TabStore): TimeSignatureState {
  /**
   * Gets the time signature that applies at a given position
   * @param position - The position to get the time signature for
   * @param before - If true, returns the time signature before the position (exclusive), otherwise returns the time signature at or before the position (inclusive)
   * @returns The time signature that applies at the given position
   */
  function getTimeSignatureAt(
    position: number,
    before: boolean = false,
  ): TimeSignature {
    if (tabStore.timeChanges.size === 0) {
      throw new Error("No time changes found");
    }

    // Sort all time change positions
    const timeChangePositions = [...tabStore.timeChanges.keys()].sort(
      (a, b) => a - b,
    );

    const condition = before
      ? (changePos: number) => changePos < position
      : (changePos: number) => changePos <= position;
    let timeSignature = tabStore.timeChanges.get(0)!;
    for (const changePos of timeChangePositions) {
      if (condition(changePos)) {
        timeSignature = tabStore.timeChanges.get(changePos)!;
      } else {
        break; // Stop once we've gone past our position
      }
    }

    return timeSignature;
  }

  const timeSignatureState: TimeSignatureState = {
    getTimeSignatureAt,
  };

  provide(TimeSignatureInjectionKey, timeSignatureState);

  return timeSignatureState;
}

export type TimeSignatureFunctions = ReturnType<typeof provideTimeSignature>;

export function injectTimeSignature() {
  return inject(TimeSignatureInjectionKey) as TimeSignatureState;
}
