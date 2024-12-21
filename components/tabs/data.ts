export type NoteData = undefined | { note: Midi, muted?: boolean, slide?: boolean, bend?: string }
export type NoteStack = NoteData[];
export type QuarterNotes = number;

//TODO: use this to validate stuff
export const timeUnits: QuarterNotes[] = [4, 2, 1, 1/2, 1/4, 1/8, 1/16, 1/32] // [whole, half, quarter, eighth, sixteenth, thirty-second, sixty-fourth]

// Divisions are EVENLY SPACED notes. Duration and start are in quarter notes.
// start is zero indexed
export type Division = {start: number, duration: number, stacks: NoteStack[]}

export function createDivision(start: QuarterNotes, duration: QuarterNotes, ...stacks: NoteStack[]): Division {
    return {duration, start, stacks: stacks}
}

// Now there's always a parent to shrink, and we don't need { note: false }, just an empty array for a stack