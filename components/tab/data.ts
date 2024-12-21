/* export function createNote(position: number, string: number, midi: Midi | string) {
  return {
    position,
    string,
    data: {
      midi: typeof midi === "string" ? toMidi(midi) : midi,
    },
  };
}

export type FilledSpot = Required<NoteSpot>; */

export type NoteData = {
  midi: Midi
  muted?: boolean
  slide?: boolean
  bend?: string
};

export type NoteSpot = {
  position: number // 0-indexed
  string: number // 0-indexed
  data: NoteData
};

type StackMap = Map<number, NoteData>;
export type TabData = Map<number, StackMap>;

export type TabStore = {
  readonly notes: ReturnType<typeof computed<NoteSpot[]>>
  addNote: (position: number, string: number, data: NoteData) => void
  getNote: (position: number, string: number) => NoteData | undefined
  // updateNote: (position: number, string: number, properties: Partial<NoteData>) => void
  deleteNote: (position: number, string: number) => void
  getBar: (start: number, end: number) => Omit<TabStore, "getBar">
};

function mapToNotes(tabData: TabData, start = 0, end?: number): NoteSpot[] {
  const notes: NoteSpot[] = [];
  for (const [position, stackMap] of tabData.entries()) {
    if (start > 0 && position < start) continue;
    if (end && position >= end) continue;
    for (const [string, data] of stackMap.entries()) {
      notes.push({ position, string, data });
    }
  }
  return notes;
}

export function createTabStore(strings: number): TabStore {
  const tabData = reactive<TabData>(new Map());

  function getNote(position: number, string: number) {
    const stackMap = tabData.get(position);
    if (stackMap) {
      return stackMap.get(string);
    }
  };

  function addNote(position, string, data) {
    const stackMap = tabData.get(position) || new Map<number, NoteData>();
    stackMap.set(string, data);
    tabData.set(position, stackMap);
  };

  function deleteNote(position: number, string: number) {
    const stackMap = tabData.get(position);
    if (stackMap) {
      stackMap.delete(string);
      if (stackMap.size === 0) {
        tabData.delete(position);
      }
    }
  };

  return {
    notes: computed(() => mapToNotes(tabData)),
    getNote,
    addNote,
    deleteNote,
    getBar(start: number, end: number) {
      const subset = computed(() => mapToNotes(tabData, start, end));
      const validPos = (pos: number) => start <= pos && pos < end;
      return {
        notes: subset,
        getNote(position, string) {
          if (validPos(position))
            getNote(position, string);
        },
        addNote(position, string, data) {
          if (validPos(position)) {
            addNote(position, string, data);
          }
        },
        deleteNote,
      };
    },
  };
}

export enum Spacing {
  Whole = 4,
  Half = 2,
  Quarter = 1,
  Eighth = 0.5,
  Sixteenth = 0.25,
  ThirtySecond = 0.125,
  SixtyFourth = 0.0625,
}

export const smallestSpacing = Spacing.SixtyFourth;
// export const SpacingsDescending = (Object.values(Spacing).filter(Number) as number[]).sort((a, b) => b - a);
