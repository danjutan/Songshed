import type { Midi } from "~/theory/notes";
import type { SpacingValue } from "~/theory/spacing";

export interface Annotation {
  start: number;
  end: number;
  text?: string;
}

export interface NoteData {
  note: Midi | "muted";
}

// "hammer" means hammer-on if going up, pull-off if going down
export const TIE_TYPE = {
  Plain: "plain",
  Hammer: "hammer",
  Tap: "tap",
  Slide: "slide",
  TieSlide: "tie-slide",
} as const;

export type TieType = (typeof TIE_TYPE)[keyof typeof TIE_TYPE];

export type TieData = {
  type: TieType;
  to: number;
};

export interface BendData {
  bend: number;
  through?: number[]; //relative to from. this is an array in case we later want to add consecutive bend segments https://archive.steinberg.help/dorico/v3/en/dorico/topics/notation_reference/notation_reference_guitar_bends/notation_reference_guitar_bends_c.html#:~:text=consecutive%20guitar%20bends
  releaseType: "hold" | "connect"; // whether the line releases down to "to" note. ignored if no "through" point.
  to: number;
}

export interface GuitarNote extends NoteData {
  /*
  muted?: boolean;
  bend?: string; */
}

export interface ChordNote extends NoteData {
  note: Midi;
  finger?: number; // to implement
}

export type NoteStack<N extends NoteData> = Map<number, N>;
export type StackMap<N extends NoteData> = Map<number, NoteStack<N>>;
export type Chord = {
  title: string;
  notes: NoteStack<ChordNote>;
};

export interface TieSlotData {
  tie?: TieData;
  bend?: BendData;
}

export interface GuitarTabData {
  tuning: Midi[];
  frets: number;
  stacks: StackMap<GuitarNote>;
  ties: Map<number, Map<number, TieSlotData>>; // string -> from pos -> TieSlotData
}

export interface ChordsData {
  tuning: Midi[];
  chords: Chord[];
}

export interface TimeSignature {
  beatsPerBar: number;
  beatSize: SpacingValue;
}

export interface TabData {
  title: string;
  doesSyncTuning: boolean;
  lineBreaks: Set<number>;
  timeChanges: Map<number, TimeSignature>;
  guitarData?: GuitarTabData; // optional because we'll add more primary views in the future
  annotations: Map<number, Annotation[]>; // annotation row -> annotations on that row
  chordsData: ChordsData;
}
