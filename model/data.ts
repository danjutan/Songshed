export interface Annotation<D = unknown> {
  start: number;
  end: number;
  title: string;
  readonly data?: D;
}

export interface NoteData {
  midi: Midi;
}

export interface GuitarNote extends NoteData {
  string: number;
  /*
  muted?: boolean;
  slide?: boolean;
  bend?: string; */
}

export type StackMap<N extends NoteData> = Map<number, Array<N>>;

export interface GuitarTabData {
  strings: number;
  tuning: Midi[];
  frets: number;
  stacks: StackMap<GuitarNote>;
}

export interface TabData {
  title: string;
  beatsPerBar: number;
  beatSize: number;
  guitarData?: GuitarTabData; // optional because we'll add more primary views in the future
  annotations: Map<number, Annotation[]>; // annotation row -> annotations on that row
  chords: StackMap<GuitarNote>;
}
