export interface Annotation<D = unknown> {
  start: number;
  end: number;
  title: string;
  readonly data?: D;
}

export interface NoteData {
  midi: Midi;
}

export type TieType = "H" | "P" | "S";
export interface Tie {
  type: TieType;
  // from: number; //position
  to: number;
}
export type Ties = Map<number, Map<number, Tie>>;
export interface GuitarNote extends NoteData {
  /*
  muted?: boolean;
  bend?: string; */
}

export interface ChordNote extends NoteData {
  finger?: number; // to implement
}

export type NoteStack<N extends NoteData> = Map<number, N>;
export type StackMap<N extends NoteData> = Map<number, NoteStack<N>>;
export type Chord = { title: string; notes: NoteStack<ChordNote> };

export interface GuitarTabData {
  strings: number;
  tuning: Midi[];
  frets: number;
  stacks: StackMap<GuitarNote>;
  ties: Ties;
}

export interface ChordsData {
  tuning: Midi[];
  chords: Chord[];
}

export interface TabData {
  title: string;
  beatsPerBar: number;
  beatSize: number;
  guitarData?: GuitarTabData; // optional because we'll add more primary views in the future
  annotations: Map<number, Annotation[]>; // annotation row -> annotations on that row
  chordsData: ChordsData;
}
