export type NoteData = { note: Midi | false, muted?: boolean, slide?: boolean, bend?: string }
/*
  We're dividing an entire bar, not a beat (which would usually be 1/4 of a bar).
  A half note is considered 2 beats, but 1/2 of a bar. */

export type Division = {duration: number, notes: NoteData[]}

export function createEmptyDivision (duration: number, numNotes: number): Division {
  const notes = new Array<NoteData>(numNotes);
  for (let i = 0; i < numNotes; i++) {
    notes[i] = {note: false};
  }
  return {duration, notes};
}
