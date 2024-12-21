export type NoteSpot = {
  position: number; // 0-indexed
  string: number; // 0-indexed
  data?: NoteData;
};

export function createNote(position: number, string: number, midi: Midi | string) {
  return {
    position,
    string,
    data: {
      midi: typeof midi === 'string' ? toMidi(midi) : midi,
    },
  };
}

export type FilledSpot = Required<NoteSpot>;

export type NoteData = {
  midi: Midi;
  muted?: boolean;
  slide?: boolean;
  bend?: string;
};

export enum Spacing {
  Whole = 4,
  Half = 2,
  Quarter = 1,
  Eighth = 0.5,
  Sixteenth = 0.25,
  ThirtySecond = 0.125,
  SixtyFourth = 0.0625,
}

export const SpacingsDescending = (Object.values(Spacing).filter(Number) as number[]).sort((a, b) => b - a);
