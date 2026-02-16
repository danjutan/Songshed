import type { ChordNote, NoteStack } from "~/model/data";
import guitarDb from "@tombatossals/chords-db/lib/guitar.json";
import { Chord as TonalChord, Note as TonalNote } from "tonal";
import { type Chroma, type Midi, defaultTuning } from "./notes";

interface ChordPosition {
  frets: number[]; // -1 = muted, 0 = open, 1+ = fret number
  fingers: number[]; // 0 = no finger, 1-4 = finger number
  baseFret: number; // Starting fret position
  barres?: number[];
  midi: number[];
}

interface ChordEntry {
  key: string;
  suffix: string;
  positions: ChordPosition[];
}

interface GuitarChordDb {
  main: { strings: number; fretsOnChord: number; name: string };
  tunings: { standard: string[] };
  keys: string[];
  chords: Record<string, ChordEntry[]>;
}

const guitar = guitarDb as GuitarChordDb;

// Map Chroma values to chords-db key names
const CHROMA_TO_DB_KEY: Record<Chroma, string> = {
  0: "C",
  1: "Csharp",
  2: "D",
  3: "Eb",
  4: "E",
  5: "F",
  6: "Fsharp",
  7: "G",
  8: "Ab",
  9: "A",
  10: "Bb",
  11: "B",
} as const;

/**
 * Get available chord suffixes for a given note (Chroma value) from chords-db
 */
export function getSuffixesForChroma(chroma: Chroma): string[] {
  const key = CHROMA_TO_DB_KEY[chroma];
  const chordEntries = guitar.chords[key];
  if (!chordEntries) return [];

  return chordEntries.map((entry) => entry.suffix);
}

/**
 * Get chord voicings from chords-db as NoteStack<ChordNote>
 *
 * Note: chords-db uses low-to-high string order [E2, A2, D3, G3, B3, E4],
 * while our app uses high-to-low [E4, B3, G3, D3, A2, E2].
 * Muted strings (fret = -1) are omitted from the NoteStack.
 */
export function getChordsFromDb(
  chroma: Chroma,
  suffix: string,
): NoteStack<ChordNote>[] {
  const key = CHROMA_TO_DB_KEY[chroma];
  const chordEntries = guitar.chords[key];
  if (!chordEntries) return [];

  const entry = chordEntries.find((e) => e.suffix === suffix);
  if (!entry) return [];

  const numStrings = defaultTuning.length;

  return entry.positions.map((position) => {
    const noteStack: NoteStack<ChordNote> = new Map();

    position.frets.forEach((fret, dbStringIndex) => {
      // Skip muted strings
      if (fret === -1) return;

      // Convert from chords-db string order (low-to-high) to our order (high-to-low)
      const appStringIndex = numStrings - 1 - dbStringIndex;

      // Calculate actual fret: open string (0) stays 0, otherwise add baseFret offset
      const actualFret = fret === 0 ? 0 : fret + position.baseFret - 1;

      // Calculate MIDI note from tuning and fret
      const midiValue = defaultTuning[appStringIndex] + actualFret;

      const chordNote: ChordNote = {
        note: midiValue as Midi,
      };

      // Add finger info if available
      const finger = position.fingers[dbStringIndex];
      if (finger > 0) {
        chordNote.finger = finger;
      }

      noteStack.set(appStringIndex, chordNote);
    });

    return noteStack;
  });
}

const FLAT_TO_SHARP: Record<string, string> = {
  Bb: "A#",
  Eb: "D#",
  Ab: "G#",
  Db: "C#",
  Gb: "F#",
};

function convertFlatsToSharps(chordName: string): string {
  for (const [flat, sharp] of Object.entries(FLAT_TO_SHARP)) {
    if (chordName.startsWith(flat)) {
      return sharp + chordName.slice(flat.length);
    }
  }
  return chordName;
}

export function detectChord(notes: NoteStack<ChordNote>): string | null {
  if (notes.size === 0) return null;

  const pitchClasses = [...notes.values()]
    .sort((a, b) => a.note - b.note)
    .map((n) => TonalNote.pitchClass(TonalNote.fromMidi(n.note)));

  const detected = TonalChord.detect(pitchClasses);
  if (detected.length === 0) return null;

  const chordName = detected[0].replace("M", "");

  return convertFlatsToSharps(chordName);
}
