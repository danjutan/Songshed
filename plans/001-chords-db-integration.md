# Plan: Integrate chords-db into theory.ts

**Date:** 2026-01-26
**Branch:** feature/chords-db-integration

## Summary

Add two functions to `composables/theory.ts` that integrate the `@tombatossals/chords-db` library:
1. `getSuffixesForChroma(chroma: Chroma): string[]` - Get available chord suffixes for a note
2. `getChordsFromDb(chroma: Chroma, suffix: string): NoteStack<ChordNote>[]` - Get chord voicings

## Implementation Steps

### 1. Create New Branch
```bash
git checkout main && git pull && git checkout -b feature/chords-db-integration
```

### 2. Install the chords-db Package
```bash
pnpm add @tombatossals/chords-db
```

### 3. Add Type Definitions to theory.ts
Define interfaces for the chords-db JSON structure:
```typescript
interface ChordPosition {
  frets: number[];      // -1 = muted, 0+ = fret number
  fingers: number[];    // 0 = no finger, 1-4 = finger number
  baseFret: number;     // Starting fret position
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
```

### 4. Add Chroma-to-Key Mapping
```typescript
const CHROMA_TO_DB_KEY: Record<Chroma, string> = {
  0: "C", 1: "Csharp", 2: "D", 3: "Eb", 4: "E", 5: "F",
  6: "Fsharp", 7: "G", 8: "Ab", 9: "A", 10: "Bb", 11: "B",
} as const;
```

### 5. Import Library Data
```typescript
import guitarDb from "@tombatossals/chords-db/lib/guitar.json";
const guitar = guitarDb as GuitarChordDb;
```

### 6. Implement getSuffixesForChroma()
Returns unique suffixes available for a given Chroma value.

### 7. Implement getChordsFromDb()
Key logic:
- **Tuning**: Uses `defaultTuning` (standard tuning) for MIDI calculations
- **String order reversal**: chords-db uses low-to-high `[E2, A2, D3, G3, B3, E4]`, app uses high-to-low `[E4, B3, G3, D3, A2, E2]`
- **MIDI calculation**: `actualFret = fret === 0 ? 0 : fret + baseFret - 1`, then `midi = tuning[string] + actualFret`
- **Muted strings**: Omit from NoteStack (since ChordNote requires `note: Midi`, not `"muted"`)
- **Finger info**: Transfer when available (finger > 0)

## Files Modified

- **composables/theory.ts** - Added imports, types, mapping constant, and two functions

## Verification

1. Run `pnpm typecheck` to verify types
2. Test functions manually in browser console or add unit tests:
   - `getSuffixesForChroma(0)` should return ~80+ suffixes for C
   - `getChordsFromDb(0, "major")` should return multiple NoteStack voicings
   - Verify MIDI values in returned NoteStack match expected chord tones

## Prompts

User: We are going to integrate https://github.com/tombatossals/chords-db into our app. Ultimately, we'll build a chord picker, but for now we'll focus on the data instead of the UI. We'll be adding functions to theory.ts. We need a function that takes a note type, e.g. C or Bb (we already have the Chrome type, that should suffice) and return a list of suffixes available from chords-db for that note. Then we need a function that takes a note type + a suffix and returns a list of chords from chord-db, but they should be returned as NoteStack<ChordNote>, our app's data type for Chords.
