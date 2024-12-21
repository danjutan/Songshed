export interface Annotation<D = unknown> {
  start: number;
  end: number;
  title: string;
  readonly data?: D;
}

export interface NoteData {
  midi: Midi;
}

export interface Tie {
  type: "h" | "p" | "slide";
  to: number; //position
}
export interface GuitarNote extends NoteData {
  tie?: Tie;
  /*
  muted?: boolean;
  slide?: boolean;
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
