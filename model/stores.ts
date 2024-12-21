import { serializeTabData } from "./serialize";
import type {
  TabData,
  GuitarNote,
  Annotation,
  NoteData,
  StackMap,
  GuitarTabData,
  NoteStack,
  ChordsData,
  Chord,
  BendData,
  TieData,
} from "./data";

export interface TabStore {
  title: string;
  beatsPerBar: number;
  beatSize: number;
  createGuitarTab: (
    tuning?: Midi[],
    strings?: number,
    frets?: number,
  ) => GuitarStore;
  guitar?: GuitarStore;
  annotations: AnnotationStore;
  chords: ChordStore;
  serialize: () => string;
}

const defaults: Pick<
  TabData,
  "title" | "beatsPerBar" | "beatSize" | "chordsData"
> = {
  title: "new tab",
  beatsPerBar: 4,
  beatSize: Spacing.Quarter,
  chordsData: {
    tuning: defaultTuning,
    chords: [{ title: "", notes: new Map() }],
  },
};

export function createTabStore(tabData: TabData): TabStore;
export function createTabStore(options?: Partial<typeof defaults>): TabStore;
export function createTabStore(
  init?: TabData | Partial<typeof defaults>,
): TabStore {
  if (init === undefined) init = {};
  const data: TabData = reactive({
    ...defaults,
    annotations: new Map(),
    ...init,
  });

  const guitarStore = ref<undefined | GuitarStore>();
  if (data.guitarData) {
    guitarStore.value = createGuitarStore(data.guitarData);
  }

  const annotationStore = createAnnotationStore(data.annotations);
  const chordStore = createChordStore(data.chordsData);

  function createGuitarTab(tuning = defaultTuning, strings = 6, frets = 24) {
    const stacks: StackMap<GuitarNote> = new Map();
    data.guitarData = {
      ties: new Map(),
      strings,
      tuning,
      frets,
      stacks,
    };

    guitarStore.value = createGuitarStore(data.guitarData);
    return guitarStore.value;
  }

  return {
    createGuitarTab,
    serialize() {
      return serializeTabData(data);
    },
    get guitar() {
      return guitarStore.value;
    },
    annotations: annotationStore,
    get chords() {
      return chordStore;
    },
    // TODO: validation?
    get title() {
      return data.title;
    },
    set title(title: string) {
      data.title = title;
    },
    get beatsPerBar() {
      return data.beatsPerBar;
    },
    set beatsPerBar(beatsPerBar: number) {
      data.beatsPerBar = beatsPerBar;
    },
    get beatSize() {
      return data.beatSize;
    },
    set beatSize(beatSize: number) {
      data.beatSize = beatSize;
    },
  };
}

function createChordStore({ tuning, chords }: ChordsData) {
  // TODO: edit tuning, swap chords, etc
  return {
    // the array is deeply reactive, so you can set notes directly
    chords,
    tuning,
    // TODO: delete if unused
    setChord(index: number, chord: Chord) {
      chords[index] = chord;
    },
    addChord() {
      const chord: Chord = {
        title: "",
        notes: new Map(),
      };
      chords.push(chord);
    },
    deleteChord(index: number) {
      chords.splice(index);
    },
  };
}

export type ChordStore = ReturnType<typeof createChordStore>;

export interface AnnotationStore {
  createAnnotation: (row: number, data: Annotation) => Annotation | false;
  deleteAnnotation: (row: number, data: Annotation) => void;
  getAnnotations: (row: number) => Annotation[];
  getRows: () => number[];
  createNextRow: () => void;
}

function createAnnotationStore(
  annotations: Map<number, Annotation[]>,
): AnnotationStore {
  function createAnnotation(row: number, data: Annotation) {
    const ofRow = annotations.get(row);
    if (!ofRow) {
      annotations.set(row, [data]);
      return annotations.get(row)![0]; // TODO: revist: goal is to return a reactive object; if irrelevant or broken, just return data
    }

    // TODO: revist: <= vs <; do we need this check at all?
    const overlaps = ofRow.some(
      (a: Annotation) =>
        (a.start < data.start && a.end > data.start) ||
        (a.start > data.start && a.end < data.end),
    );
    if (overlaps) return false;
    ofRow.push(data);
    return ofRow.at(-1)!; // see above
  }

  function deleteAnnotation(row: number, data: Annotation) {
    const ofRow = annotations.get(row);
    if (ofRow) {
      const toDelete = ofRow.findIndex(
        (a) => a.start === data.start && a.end === data.end,
      );
      ofRow.splice(toDelete, 1);
    }
  }

  function getAnnotations(row: number) {
    return annotations.get(row) || [];
  }

  function getRows() {
    return [...annotations.keys()];
  }

  function createNextRow() {
    return annotations.set(getRows().length, []);
  }

  return {
    createAnnotation,
    deleteAnnotation,
    getAnnotations,
    getRows,
    createNextRow,
  };
}
interface StackStore<N extends NoteData> {
  getStacks: (start?: number, end?: number) => StackMap<N>;
  setStack: (position: number, stack: NoteStack<N>) => void;
  deleteStacks: (start: number, end: number) => void;
  lastPosition: () => number | undefined;
  shiftFrom: (position: number, shiftBy: number) => void;
}
function createStackStore<N extends NoteData>(
  stacks: StackMap<N>,
): StackStore<N> {
  const furthestPos: number[] = [];

  // TODO: Figure out why we need toRaw (setNote breaks otherwise)
  for (const key of [...toRaw(stacks).keys()].sort((a, b) => a - b)) {
    furthestPos.push(key);
  }

  function getStacks(start = 0, end?: number) {
    const subset: StackMap<N> = new Map();
    for (const position of [...stacks.keys()].sort((a, b) => a - b)) {
      if (start > 0 && position < start) continue;
      if (end && position >= end) break;
      subset.set(position, stacks.get(position)!);
    }
    return subset;
  }

  function setStack(position: number, stack: NoteStack<N>) {
    if (position < 0) return;
    if (stack.size === 0) {
      stacks.delete(position);
      if (position === furthestPos.at(-1)) {
        furthestPos.pop();
      }
      return;
    }
    stacks.set(position, stack);
    if (position > (furthestPos.at(-1) ?? 0)) {
      furthestPos.push(position);
    }
  }

  function deleteStacks(start: number, end: number) {
    for (const position of [...stacks.keys()].sort((a, b) => a - b)) {
      if (position >= start && position <= end) {
        stacks.delete(position);
        if (position === furthestPos.at(-1)) {
          furthestPos.pop();
        }
      }
    }
  }

  function lastPosition() {
    return furthestPos.at(-1);
  }

  function shiftFrom(position: number, shiftBy: number) {
    if (
      position < 0 ||
      !furthestPos.length ||
      position > furthestPos.at(-1)! ||
      shiftBy <= 0
    )
      return;

    const keysFromBack = [...stacks.keys()]
      .filter((pos) => pos >= position)
      .sort((a, b) => b - a);

    for (const pos of keysFromBack) {
      const stack = stacks.get(pos);
      if (stack) {
        setStack(pos + shiftBy, stack);
        stacks.delete(pos);
      }
    }
  }

  return { getStacks, setStack, deleteStacks, lastPosition, shiftFrom };
}

export type Tie = TieData & {
  from: number;
  midiFrom?: Midi;
  midiTo?: Midi;
};
export type Bend = BendData & { from: number };
export type TieMap = Map<number, Tie[]>;
export type BendMap = Map<number, Bend[]>;

export interface TieStore {
  setTie: (string: number, from: number, tie: TieData | BendData) => void;
  deleteTie: (string: number, from: number) => void;
  getTies: () => TieMap;
  getBends: () => BendMap;
}

function createTieStore(guitarData: GuitarTabData): TieStore {
  function setTie(string: number, from: number, tie: TieData | BendData) {
    const stringTies = guitarData.ties.get(string);
    if (!stringTies) {
      guitarData.ties.set(string, new Map([[from, tie]]));
      return;
    }
    stringTies.set(from, tie);
  }

  function deleteTie(string: number, from: number) {
    const stringTies = guitarData.ties.get(string);
    if (stringTies) {
      stringTies.delete(from);
    }
  }

  function getTies(): TieMap {
    const map: TieMap = new Map();
    for (const [string, stringTies] of guitarData.ties) {
      const addTies: Tie[] = [];
      for (const [from, tie] of stringTies) {
        if (tie.type === "bend") continue;
        const fromNote = guitarData.stacks.get(from)?.get(string);
        const toNote = guitarData.stacks.get(tie.to)?.get(string);
        addTies.push({
          ...tie,
          from,
          midiFrom: fromNote?.midi,
          midiTo: toNote?.midi,
        });
      }
      map.set(string, addTies);
    }
    return map;
  }

  function getBends(): BendMap {
    const map: BendMap = new Map();
    for (const [string, stringTies] of guitarData.ties) {
      const addBends: Bend[] = [];
      for (const [from, tie] of stringTies) {
        if (tie.type === "bend") {
          addBends.push({ from, ...tie });
        }
      }
      map.set(string, addBends);
    }
    return map;
  }

  return { setTie, deleteTie, getTies, getBends };
}

export interface GuitarStore
  extends Omit<StackStore<GuitarNote> & GuitarTabData, "getStacks" | "ties"> {
  setNote: (position: number, string: number, data: GuitarNote) => void;
  deleteNote: (position: number, string: number) => void;
  getStacks: (
    start: number,
    end: number,
    subunit: number,
  ) => StackMap<GuitarNote>;
  ties: TieStore;
}

function createGuitarStore(guitarData: GuitarTabData): GuitarStore {
  const noteStore = createStackStore(guitarData.stacks);

  function setNote(position: number, string: number, data: GuitarNote): void {
    if (position >= 0 && string >= 0 && string < guitarData.strings) {
      let stack = guitarData.stacks.get(position);

      if (!stack) {
        stack = new Map();
      }

      stack.set(string, data);

      noteStore.setStack(position, stack);
    }
  }

  function deleteNote(position: number, string: number) {
    const stack = guitarData.stacks.get(position);
    if (stack && stack.has(string)) {
      stack.delete(string);
      noteStore.setStack(position, stack);

      const ties = guitarData.ties.get(string);
      if (ties) {
        ties.delete(position);
        const tiedTo = [...ties.entries()].find(
          ([_, tie]) => tie.to === position,
        );
        if (tiedTo) {
          ties.delete(tiedTo[0]);
        }
      }
    }
  }

  function getStacks(
    start = 0,
    end: number,
    subunit: number,
  ): StackMap<GuitarNote> {
    const subset = noteStore.getStacks(start, end);
    for (let i = start; i < end; i += subunit) {
      if (!subset.has(i)) {
        subset.set(i, new Map());
      }
    }
    return new Map(
      [...subset.entries()]
        .sort((a, b) => a[0] - b[0])
        .filter(([position, _]) => position % subunit === 0),
    );
  }

  function shiftFrom(position: number, shiftBy: number) {
    noteStore.shiftFrom(position, shiftBy);
    for (const [string, ties] of guitarData.ties) {
      const newTies = new Map<number, TieData | BendData>();
      for (const [from, tie] of ties) {
        newTies.set(from + shiftBy, { ...tie, to: tie.to + shiftBy });
      }
      guitarData.ties.set(string, newTies);
    }
  }
  return {
    ...noteStore,
    getStacks,
    setNote,
    deleteNote,
    shiftFrom,
    ...guitarData,
    ties: createTieStore(guitarData),
  };
}
