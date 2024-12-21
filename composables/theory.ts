import { Note, Midi } from "tonal";
import type { Chroma } from "./colors";

export type Midi =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75
  | 76
  | 77
  | 78
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 90
  | 91
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98
  | 99
  | 100
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 108
  | 109
  | 110
  | 111
  | 112
  | 113
  | 114
  | 115
  | 116
  | 117
  | 118
  | 119
  | 120
  | 121
  | 122
  | 123
  | 124
  | 125
  | 126
  | 127;

export const defaultTuning = ["E4", "B3", "G3", "D3", "A2", "E2"].map(toMidi);

export function validMidi(midi: number | null): midi is Midi {
  return (
    typeof midi === "number" &&
    Number.isInteger(midi) &&
    midi < 128 &&
    midi >= 0
  );
}

// Note.get already caches for us https://github.com/tonaljs/tonal/blob/3eb59b7cc0e02f6a66d07756d9d6dec8637abf2f/packages/core/src/note.ts#L44-L48
export function getNoteInfo(nameOrMidi: string | number) {
  const note =
    typeof nameOrMidi === "number" ? Note.fromMidi(nameOrMidi) : nameOrMidi;

  const noteData = Note.get(note);

  if (noteData.empty) {
    throw new Error(`Invalid note: ${note}`);
  }

  return noteData;
}

export function toMidi(note: string): Midi {
  const conversion = Midi.toMidi(note);
  if (!validMidi(conversion)) {
    throw new Error(`Invalid note: ${note}`);
  }
  return conversion;
}

export function getChroma(midi: number): Chroma {
  return (midi % 12) as Chroma;
}
