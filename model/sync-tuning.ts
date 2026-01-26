import type { Midi } from "~/theory/notes";
import type { ChordStore, GuitarStore } from "./stores";

/**
 * Synchronizes the chord tuning with the guitar tuning
 * Finds the longest common subsequence of identical notes and aligns them,
 * adding/removing strings as needed.
 */
export function syncTuning(
  chordStore: ChordStore,
  guitarStore: GuitarStore,
): void {
  const guitarTuning = guitarStore.tuning;
  const chordTuning = chordStore.tuning;

  // Find longest common sequence of identical notes
  let maxLen = 0;
  let maxStart = 0;
  let maxGuitarStart = 0;

  for (let i = 0; i < chordTuning.length; i++) {
    for (let j = 0; j < guitarTuning.length; j++) {
      let len = 0;
      while (
        i + len < chordTuning.length &&
        j + len < guitarTuning.length &&
        chordTuning[i + len] === guitarTuning[j + len]
      ) {
        len++;
      }
      if (len > maxLen) {
        maxLen = len;
        maxStart = i;
        maxGuitarStart = j;
      }
    }
  }

  // If no common subsequence was found, completely reset the chord tuning
  if (maxLen === 0) {
    // Remove all strings from chordTuning
    while (chordTuning.length > 0) {
      chordStore.removeString(0);
    }

    // Add new strings to match guitarTuning
    for (let i = 0; i < guitarTuning.length; i++) {
      chordStore.insertString();
      chordStore.setTuningNote(i, guitarTuning[i]);
    }
  } else {
    // First, align the starting position of the common subsequence

    // Remove extra strings from the top of chordTuning if needed
    for (let i = 0; i < maxStart; i++) {
      chordStore.removeString(0);
    }

    // Add missing strings to the top of chordTuning if needed
    for (let i = 0; i < maxGuitarStart; i++) {
      chordStore.insertString(0);
    }

    // At this point, the common subsequence is aligned at the top of chordTuning

    // Calculate remaining strings in chordTuning after the common subsequence
    const chordRemainingAfter = chordTuning.length - maxLen;

    // Calculate remaining strings in guitarTuning after the common subsequence
    const guitarRemainingAfter =
      guitarTuning.length - (maxGuitarStart + maxLen);

    // Remove extra strings from the bottom of chordTuning if needed
    for (let i = 0; i < chordRemainingAfter; i++) {
      chordStore.removeString();
    }

    // Add missing strings to the bottom of chordTuning if needed
    for (let i = 0; i < guitarRemainingAfter; i++) {
      chordStore.insertString();
    }

    // Finally, set each tuning note to match guitarTuning
    for (let i = 0; i < guitarTuning.length; i++) {
      chordStore.setTuningNote(i, guitarTuning[i]);
    }
  }
}
