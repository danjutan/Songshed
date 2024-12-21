export interface Region<D = undefined> {
  readonly type: string
  start: number
  end: number
  readonly annotationData?: AnnotationData
  readonly data?: D
};

export interface AnnotationData {
  title: string
};

export interface GuitarTabData {
  strings: number
  tuning: Midi[]
  frets: number
  stacks: Map<number, GuitarNote[]>
};

export interface TabData {
  title: string
  beatsPerBar: number
  beatSize: number
  guitarData?: GuitarTabData // optional because we'll add more primary views in the future
  annotations: Region[]
};

export interface NoteData {
  midi: Midi
  muted?: boolean
  slide?: boolean
  bend?: string
};

export interface NoteSpot {
  position: number
  data?: NoteData
}

export interface GuitarNote extends NoteSpot {
  string: number // 0-indexed
};

export type StackMap = Map<number, NoteData>;

export interface TabStore {
  title: string
  beatsPerBar: number
  beatSize: number
  createGuitarTab: (tuning?: Midi[], strings?: number, frets?: number) => GuitarStore
  guitar?: GuitarStore
}
export function createTabStore(title = "new tab", beatsPerBar = 4, beatSize = Spacing.Quarter): TabStore {
  const data: TabData = reactive({
    title,
    beatsPerBar,
    beatSize,
    annotations: [],
  });

  const guitarStore = ref<undefined | GuitarStore>();

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
    get guitar() {
      return guitarStore.value;
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
};

interface NoteStore<N extends NoteSpot> {
  setNote: (note: N) => void
  // updateNote: (position: number, string: number, properties: Partial<NoteData>) => void
  // ordered by ascending string #
  getStacks: (start?: number, end?: number) => Map<number, N[]>
  lastPosition: () => number | undefined
};

type GuitarStore = NoteStore<GuitarNote> & GuitarTabData;
function createGuitarStore(guitarData: GuitarTabData): GuitarStore {
  const furthestPos: number[] = [];

  function setNote({ position, string, data }: GuitarNote): void {
    if (position >= 0 && string >= 0 && string < guitarData.strings) {
      if (!data) {
        const stack = guitarData.stacks.get(position);
        if (!stack) return;
        stack[string].data = undefined;
        if (stack.map(s => s.data).filter(Boolean).length === 0) {
          guitarData.stacks.delete(position);
          if (position === furthestPos.at(-1)) {
            furthestPos.pop();
          }
        }
        return;
      }

      const stack: GuitarNote[] = guitarData.stacks.get(position)
        || Array.from({ length: strings }, (_, string) => ({ position, string }));
      stack[string].data = data;
      guitarData.stacks.set(position, stack);
      if (position > (furthestPos.at(-1) ?? 0)) {
        furthestPos.push(position);
      }
    }
  };

  function getStacks(start = 0, end?: number) {
    const subset = new Map<number, GuitarNote[]>();
    for (const position of [...guitarData.stacks.keys()].sort((a, b) => a - b)) {
      if (start > 0 && position < start) continue;
      if (end && position >= end) break;
      subset.set(position, guitarData.stacks.get(position)!);
    }
    return subset;
  }

  function lastPosition() {
    return furthestPos.at(-1);
  }

  const { stacks, strings, frets, tuning } = guitarData;
  return { setNote, getStacks, lastPosition, stacks, strings, frets, tuning };
}

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

export const smallestSpacing = Spacing.SixtyFourth;
// export const SpacingsDescending = (Object.values(Spacing).filter(Number) as number[]).sort((a, b) => b - a);
