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
  muted?: boolean;
  slide?: boolean;
  bend?: string;
}

// TODO: Do we actually need to store the position? remove
export interface NoteSpot {
  position: number;
  data?: NoteData;
}

type StackMap<N extends NoteSpot> = Map<number, N[]>;
type SerializeableStackMap<N extends NoteSpot> = Array<[number, N[]]>;

export interface GuitarNote extends NoteSpot {
  string: number; // 0-indexed
}
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

interface SerializeableTabData extends Omit<TabData, "guitarData" | "annotations"> {
  guitarData?: SerializeableGuitar;
  annotations: Array<[number, Annotation[]]>;
}

function serializeTabData(data: TabData): string {
  const guitarData: SerializeableGuitar | undefined = data.guitarData && {
    ...data.guitarData,
    stacks: [...data.guitarData!.stacks.entries()],
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

function deserializeTabData(data: string): TabData {
  const parsed: SerializeableTabData = JSON.parse(data);
  const guitarData: GuitarTabData | undefined = parsed.guitarData && {
    ...parsed.guitarData,
    stacks: new Map(parsed.guitarData.stacks),
  };
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

/* title = "new tab",
  beatsPerBar = 4,
  beatSize = Spacing.Quarter, */
const defaults = {
  title: "new tab",
  beatsPerBar: 4,
  beatSize: Spacing.Quarter,
};

export function createTabStore(deserialize: string): TabStore;
export function createTabStore(options?: Partial<typeof defaults>): TabStore;
export function createTabStore(init?: string | Partial<typeof defaults>): TabStore {
  if (init === undefined) init = {};
  const data: TabData = reactive(
    typeof init === "object"
      ? { ...defaults, ...init, annotations: new Map() }
      : deserializeTabData(init),
  );

  const guitarStore = ref<undefined | GuitarStore>();
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

interface AbstractNoteStore<N extends NoteSpot> {
  getStacks: (start?: number, end?: number) => StackMap<N>;
  setStack: (position: number, stack: N[]) => void;
  lastPosition: () => number | undefined;
  shiftFrom: (position: number, shiftBy: number) => void;
}

interface NoteStore<N extends NoteSpot> extends AbstractNoteStore<N> {
  setNote: (note: N) => void;
}

function createAbstractNoteStore<N extends NoteSpot>(stacks: StackMap<N>): AbstractNoteStore<N> {
  const furthestPos: number[] = [];

  function getStacks(start = 0, end?: number) {
    const subset: StackMap<N> = new Map();
    for (const position of [...stacks.keys()].sort((a, b) => a - b)) {
      if (start > 0 && position < start) continue;
      if (end && position > end) break;
      subset.set(position, stacks.get(position)!);
    }
    return subset;
  }

  function setStack(position: number, stack: N[]) {
    if (position < 0) return;
    if (stack.filter((s) => s.data).length === 0) {
      console.log(stacks);
      stacks.delete(position);
      console.log(stacks);
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

type GuitarStore = NoteStore<GuitarNote> & GuitarTabData;

function createGuitarStore(guitarData: GuitarTabData): GuitarStore {
  const noteStore = createAbstractNoteStore(guitarData.stacks);

  // TODO: refactor to store only the data that is needed, while keeping the entire stack reactive
  function setNote({ position, string, data }: GuitarNote): void {
    if (position >= 0 && string >= 0 && string < guitarData.strings) {
      let stack = guitarData.stacks.get(position);

      if (!data) {
        if (!stack) return;
        stack[string].data = undefined;
        noteStore.setStack(position, stack);
        return;
      }

      if (!stack) {
        stack = Array.from({ length: strings }, (_, string) => ({
          position,
          string,
        }));
      }

      stack[string].data = data;

      noteStore.setStack(position, stack);
    }
  }

  const { stacks, strings, frets, tuning } = guitarData;
  return { ...noteStore, setNote, stacks, strings, frets, tuning };
}
