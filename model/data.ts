export enum Spacing {
  Whole = 4,
  Half = 2,
  Quarter = 1,
  Eighth = 0.5,
  Sixteenth = 0.25,
  ThirtySecond = 0.125,
  SixtyFourth = 0.0625,
  OneTwentyEighth = 0.03125,
}

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

type StackMap<N extends NoteData> = Map<number, Array<N>>;
type SerializeableStackMap<N extends NoteData> = Array<[number, N[]]>;

export interface GuitarTabData {
  strings: number;
  tuning: Midi[];
  frets: number;
  stacks: StackMap<GuitarNote>;
}

interface SerializeableGuitar extends Omit<GuitarTabData, "stacks"> {
  stacks: SerializeableStackMap<GuitarNote>;
}

export interface TabData {
  title: string;
  beatsPerBar: number;
  beatSize: number;
  guitarData?: GuitarTabData; // optional because we'll add more primary views in the future
  annotations: Map<number, Annotation[]>; // annotation row -> annotations on that row
}

export interface SerializeableTabData extends Omit<TabData, "guitarData" | "annotations"> {
  guitarData?: SerializeableGuitar;
  annotations: Array<[number, Annotation[]]>;
}

function serializeTabData(data: TabData): string {
  const guitarData: SerializeableGuitar | undefined = data.guitarData && {
    ...data.guitarData,
    stacks: [...data.guitarData!.stacks.entries()].map(([position, stack]) => [
      position,
      stack.filter(Boolean) as GuitarNote[],
    ]),
  };

  const { title, beatsPerBar, beatSize } = data;
  const serializeable: SerializeableTabData = {
    title,
    beatSize,
    beatsPerBar,
    annotations: [...data.annotations.entries()],
    ...(data.guitarData && { guitarData }),
  };

  return JSON.stringify(serializeable);
}

export function deserializeTabData(data: string | SerializeableTabData): TabData {
  const parsed: SerializeableTabData = typeof data === "string" ? JSON.parse(data) : data;
  let guitarData: GuitarTabData | undefined;
  if (parsed.guitarData) {
    const stacks: StackMap<GuitarNote> = new Map();
    for (const [position, stack] of parsed.guitarData.stacks) {
      stacks.set(
        position,
        stack.reduce((arr, note) => {
          arr[note.string] = note;
          return arr;
        }, new Array<GuitarNote>()),
      );
    }
    guitarData = {
      ...parsed.guitarData,
      stacks: stacks,
    };
  }
  const { title, beatsPerBar, beatSize } = parsed;
  return {
    title,
    beatsPerBar,
    beatSize,
    annotations: new Map(parsed.annotations),
    ...(guitarData && { guitarData }),
  };
}

export interface TabStore {
  title: string;
  beatsPerBar: number;
  beatSize: number;
  createGuitarTab: (tuning?: Midi[], strings?: number, frets?: number) => GuitarStore;
  guitar?: GuitarStore;
  annotations: AnnotationStore;
  serialize: () => string;
}

const defaults = {
  title: "new tab",
  beatsPerBar: 4,
  beatSize: Spacing.Quarter,
};

export function createTabStore(tabData: TabData): TabStore;
export function createTabStore(options?: Partial<typeof defaults>): TabStore;
export function createTabStore(init?: TabData | Partial<typeof defaults>): TabStore {
  if (init === undefined) init = {};
  const data: TabData = reactive({ ...defaults, annotations: new Map(), ...init });

  const guitarStore = ref<undefined | GuitarStore>();
  if (data.guitarData) {
    guitarStore.value = createGuitarStore(data.guitarData);
  }

  const annotationStore = createAnnotationStore(data.annotations);

  function createGuitarTab(tuning = defaultTuning, strings = 6, frets = 24) {
    const stacks: Map<number, GuitarNote[]> = new Map();
    data.guitarData = {
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

interface AnnotationStore {
  createAnnotation: (row: number, data: Annotation) => Annotation | false;
  deleteAnnotation: (row: number, data: Annotation) => void;
  getAnnotations: (row: number) => Annotation[];
  getRows: () => number[];
  nextRow: () => number;
}

function createAnnotationStore(annotations: Map<number, Annotation[]>): AnnotationStore {
  function createAnnotation(row: number, data: Annotation) {
    const ofRow = annotations.get(row);
    if (!ofRow) {
      annotations.set(row, [data]);
      return annotations.get(row)![0]; // goal is to return a reactive object; if irrelevant or broken, just return data
    }

    // Revist: <= vs <; do we need this check at all?
    const overlaps = ofRow.some(
      (a: Annotation) =>
        (a.start < data.start && a.end > data.start) || (a.start > data.start && a.end < data.end),
    );
    if (overlaps) return false;
    ofRow.push(data);
    return ofRow.at(-1)!; // see last comment
  }

  function deleteAnnotation(row: number, data: Annotation) {
    const ofRow = annotations.get(row);
    if (ofRow) {
      const toDelete = ofRow.findIndex((a) => a.start === data.start && a.end === data.end);
      ofRow.splice(toDelete, 1);
    }
  }

  function getAnnotations(row: number) {
    return annotations.get(row) || [];
  }

  function getRows() {
    return [...annotations.keys()];
  }

  function nextRow() {
    return getRows().length;
  }

  return { createAnnotation, deleteAnnotation, getAnnotations, getRows, nextRow };
}

interface StackStore<N extends NoteData> {
  getStacks: (start?: number, end?: number) => StackMap<N>;
  setStack: (position: number, stack: N[]) => void;
  lastPosition: () => number | undefined;
  shiftFrom: (position: number, shiftBy: number) => void;
}

function createStackStore<N extends NoteData>(stacks: StackMap<N>): StackStore<N> {
  const furthestPos: number[] = [];

  // TODO: Figure out why we need toRaw (setNote breaks otherwise)
  for (const key of [...toRaw(stacks).keys()].toSorted((a, b) => a - b)) {
    furthestPos.push(key);
  }

  function getStacks(start = 0, end?: number) {
    const subset: StackMap<N> = new Map();
    for (const position of [...stacks.keys()].toSorted((a, b) => a - b)) {
      if (start > 0 && position < start) continue;
      if (end && position >= end) break;
      subset.set(position, stacks.get(position)!);
    }
    return subset;
  }

  function setStack(position: number, stack: N[]) {
    if (position < 0) return;
    if (stack.filter(Boolean).length === 0) {
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

  function lastPosition() {
    return furthestPos.at(-1);
  }

  function shiftFrom(position: number, shiftBy: number) {
    if (position < 0 || !furthestPos.length || position > furthestPos.at(-1)! || shiftBy <= 0)
      return;

    const keysFromBack = [...stacks.keys()].filter((pos) => pos >= position).sort((a, b) => b - a);

    for (const pos of keysFromBack) {
      const stack = stacks.get(pos);
      if (stack) {
        setStack(pos + shiftBy, stack);
        stacks.delete(pos);
      }
    }
  }

  return { getStacks, setStack, lastPosition, shiftFrom };
}

interface GuitarStore extends Omit<StackStore<GuitarNote> & GuitarTabData, "getStacks"> {
  setNote: (position: number, data: GuitarNote) => void;
  deleteNote: (position: number, string: number) => void;
  getStacks: (start: number, end: number, subunit: number) => StackMap<GuitarNote>;
}
function createGuitarStore(guitarData: GuitarTabData): GuitarStore {
  const noteStore = createStackStore(guitarData.stacks);

  // TODO: refactor to store only the data that is needed, while keeping the entire stack reactive
  function setNote(position: number, data: GuitarNote): void {
    const string = data.string;
    if (position >= 0 && string >= 0 && string < guitarData.strings) {
      let stack = guitarData.stacks.get(position);

      if (!stack) {
        stack = new Array(guitarData.strings);
      }

      stack[string] = data;

      noteStore.setStack(position, stack);
    }
  }

  function deleteNote(position: number, string: number) {
    const stack = guitarData.stacks.get(position);
    if (stack) {
      // TODO: replace this mechanism with a map?
      /* eslint-disable */
      delete stack[string];
      noteStore.setStack(position, stack);
    }
  }

  function getStacks(start = 0, end: number, subunit: number): StackMap<GuitarNote> {
    const subset = noteStore.getStacks(start, end);
    for (let i = start; i < end; i += subunit) {
      if (!subset.has(i)) {
        subset.set(i, []);
      }
    }
    return new Map(
      [...subset.entries()]
        .sort((a, b) => a[0] - b[0])
        .filter(([position, stack]) => position % subunit === 0)
        .map(([position, stack]) => [position, stack.filter(Boolean)]),
    );
  }

  const { stacks, strings, frets, tuning } = guitarData;
  return { ...noteStore, getStacks, setNote, deleteNote, stacks, strings, frets, tuning };
}
