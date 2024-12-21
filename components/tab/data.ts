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
  data?: NoteData
};

export type StacksData = Array<[position: number, NoteSpot[]]>;

type StackMap = Map<number, NoteData>;
export type TabData = Map<number, StackMap>;

export type TabStore = {
  readonly strings: number
  readonly tuning: Midi[]
  readonly frets: number
  setNote: {
    (position: number, string: number, data: NoteData): void
    (position: number, string: number, midiString: string): void
    (position: number, string: number, midi: Midi): void
  }
  getNote: (position: number, string: number) => NoteData | undefined
  getNotes: (start?: number, end?: number) => NoteSpot[]
  // updateNote: (position: number, string: number, properties: Partial<NoteData>) => void
  deleteNote: (position: number, string: number) => void
  // ordered by ascending string #
  getStack: (position: number) => NoteSpot[] | undefined
  getStacks: () => StacksData
  lastPosition: () => number | undefined
  getBar: (start: number, end: number) => BarStore
};

export type BarStore = { readonly start: number, readonly end: number } &
  Omit<TabStore, "getBar" | "lastPosition">;

export function createTabStore(strings: number = 6, frets: number = 24, tuning: Midi[] = defaultTuning): TabStore {
  const tabData = reactive<TabData>(new Map());

  const furthestPos: number[] = []; // Stack
  /* function mapToNotes(start = 0, end?: number): NoteSpot[] {
    const notes: NoteSpot[] = [];
    for (const [position, stackMap] of tabData.entries()) {
      if (start > 0 && position < start) continue;
      if (end && position > end) continue;
      const sorted = [...stackMap.entries()].sort((a, b) => a[0] - b[0]);
      for (const [string, data] of sorted) {
        notes.push({ position, string, data });
      }
    }
    return notes;
  } */

  function getStack(position: number): NoteSpot[] | undefined {
    if (tabData.has(position)) {
      const stackMap = tabData.get(position)!;
      const sorted = [...stackMap.entries()].sort((a, b) => a[0] - b[0]);
      return sorted.map(([string, data]) => ({
        position,
        string,
        data,
      }));
    }
  }

  function getStacks(start = 0, end?: number) {
    const stacks: StacksData = [];
    for (const position of tabData.keys()) {
      if (start > 0 && position < start) continue;
      if (end && position > end) continue;
      stacks.push([position, getStack(position)!]);
    }
    return stacks;
  }

  function getNotes(start = 0, end?: number) {
    const stacks = getStacks(start, end);
    return stacks.map(([_, notes]) => notes).flat();
  }

  function getNote(position: number, string: number) {
    const stackMap = tabData.get(position);
    if (stackMap) {
      return stackMap.get(string);
    }
  };

  function setNote(position: number, string: number, data: NoteData | Midi | string): void {
    console.log("setNote called", arguments);
    if (position >= 0 && string >= 0 && string < strings) {
      const stackMap = tabData.get(position) || new Map<number, NoteData>();
      const noteData = typeof data === "object"
        ? data
        : {
            midi: typeof data === "string" ? toMidi(data) : data,
          };
      stackMap.set(string, noteData);
      console.log("setting");
      tabData.set(position, stackMap);
      if (position > (furthestPos.at(-1) ?? 0)) {
        furthestPos.push(position);
      }
    }
  };

  function deleteNote(position: number, string: number) {
    const stackMap = tabData.get(position);
    if (stackMap) {
      stackMap.delete(string);
      if (stackMap.size === 0) {
        tabData.delete(position);
        if (position === furthestPos.at(-1)) {
          furthestPos.pop();
        }
      }
    }
  };

  return {
    strings,
    frets,
    tuning,
    getNote,
    getNotes,
    getStack,
    getStacks,
    deleteNote,
    setNote,
    lastPosition() {
      return furthestPos.at(-1);
    },
    getBar(start: number, end: number) {
      // const subset = computed(() => mapToNotes(tabData, start, end));
      const validPos = (pos: number) => start <= pos && pos < end;
      function ifInBounds(func: (position: number, ...args: any[]) => any, position: number, ...otherArgs: any[]) {
        if (validPos(position))
          return func(position, ...otherArgs);
      }
      return {
        start,
        end,
        strings,
        frets,
        tuning,
        getStack: position => ifInBounds(getStack, position),
        getStacks: () => getStacks(start, end),
        getNotes: () => getNotes(start, end),
        getNote: (position, ...args) => ifInBounds(getNote, position, ...args),
        setNote: (position, ...args) => ifInBounds(setNote, position, ...args),
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
