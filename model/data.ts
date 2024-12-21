export interface Annotation<D = unknown> {
  start: number;
  end: number;
  title: string;
  readonly data?: D;
}

export interface NoteData {
  midi: Midi;
}

// "hammer" means hammer-on if going up, pull-off if going down
export type TieType = "hammer" | "slide";

export type TieData = {
  type: TieType;
  to: number;
};

// export type TieOrBendData = ({ type: "bend" } & BendData) | TieData;

export interface BendData {
  type: "bend";
  releaseType: "stay" | "connect"; // whether the line release back down to note
  bend: number;
  through?: number[]; //relative to from
  to: number;
}

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
  ties: Map<number, Map<number, TieData | BendData>>;
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
