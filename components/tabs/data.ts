export type NoteSpot = {
  position: number, //0-indexed
  string: number, //0-indexed
  data?: NoteData 
}

export function createNote(position: number, string: number, midi: Midi | string) {
    return {
        position,
        string,
        data: {
            midi: typeof midi === "string" ? toMidi(midi) : midi
        }
    }
}

export type FilledSpot = Required<NoteSpot>

export type NoteData = {
  midi: Midi,
  muted?: boolean,
  slide?: boolean,
  bend?: string
}


export enum Spacing {
  Whole = 4,
  Half = 2,
  Quarter = 1,
  Eighth = 1 / 2,
  Sixteenth = 1 / 4,
  ThirtySecond = 1 / 8,
  SixtyFourth = 1 / 16
}
