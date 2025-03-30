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
  TimeSignature,
} from "./data";
import { SPACING, type SpacingValue } from "~/composables/theory";
import { syncTuning } from "./sync-tuning";

export interface TabStore
  extends Pick<TabData, "title" | "time" | "doesSyncTuning" | "lineBreaks"> {
  createGuitarTab: (tuning?: Midi[], frets?: number) => GuitarStore;
  guitar: GuitarStore;
  annotations: AnnotationStore;
  chords: ChordStore;
  updateTuning: {
    chords: UpdateTuning;
    guitar: UpdateTuning;
  };
  serialize: () => string;
}

const defaults: Omit<TabData, "guitarData" | "annotations"> = {
  title: "New Song",
  time: { beatsPerBar: 4, beatSize: SPACING.Quarter },
  doesSyncTuning: true,
  chordsData: {
    tuning: Array.from(defaultTuning),
    chords: [{ title: "", notes: new Map() }],
  },
  lineBreaks: new Set(),
  timeChanges: new Map(),
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

  const guitarStore = ref<GuitarStore>();

  if (data.guitarData) {
    guitarStore.value = createGuitarStore(data.guitarData);
  } else {
    createGuitarTab();
  }

  const annotationStore = createAnnotationStore(data.annotations);
  const chordStore = createChordStore(data.chordsData);

  function createGuitarTab(tuning = Array.from(defaultTuning), frets = 24) {
    const stacks: StackMap<GuitarNote> = new Map();
    data.guitarData = {
      ties: new Map(),
      tuning,
      frets,
      stacks,
    };

    guitarStore.value = createGuitarStore(data.guitarData);
    return guitarStore.value;
  }

  watch(
    () => data.doesSyncTuning,
    (doesSync) => {
      if (doesSync && guitarStore.value) {
        syncTuning(chordStore, guitarStore.value);
      }
    },
    { immediate: true },
  );

  return {
    createGuitarTab,
    serialize() {
      return serializeTabData(data);
    },
    get guitar() {
      return guitarStore.value!;
    },
    annotations: annotationStore,
    get chords() {
      return chordStore;
    },
    updateTuning: {
      chords: {
        setTuningNote: (string: number, note: Midi) => {
          chordStore.setTuningNote(string, note);
          if (data.doesSyncTuning && guitarStore.value) {
            guitarStore.value.setTuningNote(string, note);
          }
        },
        addTop: () => {
          chordStore.insertString(0);
          if (data.doesSyncTuning && guitarStore.value) {
            guitarStore.value.insertString(0);
          }
        },
        addBottom: () => {
          chordStore.insertString();
          if (data.doesSyncTuning && guitarStore.value) {
            guitarStore.value.insertString();
          }
        },
        removeTop: () => {
          chordStore.removeString(0);
          if (data.doesSyncTuning && guitarStore.value) {
            guitarStore.value.removeString(0);
          }
        },
        removeBottom: () => {
          chordStore.removeString();
          if (data.doesSyncTuning && guitarStore.value) {
            guitarStore.value.removeString();
          }
        },
      },
      guitar: {
        setTuningNote: (string: number, note: Midi) => {
          guitarStore.value!.setTuningNote(string, note);
        },
        addTop: () => {
          guitarStore.value!.insertString(0);
          if (data.doesSyncTuning) {
            chordStore.insertString(0);
          }
        },
        addBottom: () => {
          guitarStore.value!.insertString();
          if (data.doesSyncTuning) {
            chordStore.insertString();
          }
        },
        removeTop: () => {
          guitarStore.value!.removeString(0);
          if (data.doesSyncTuning) {
            chordStore.removeString(0);
          }
        },
        removeBottom: () => {
          guitarStore.value!.removeString();
          if (data.doesSyncTuning) {
            chordStore.removeString();
          }
        },
      },
    },
    // TODO: validation?
    get title() {
      return data.title;
    },
    set title(title: string) {
      data.title = title;
    },
    get time() {
      return data.time;
    },
    set time(time: TimeSignature) {
      data.time = time;
    },
    get doesSyncTuning() {
      return data.doesSyncTuning;
    },
    set doesSyncTuning(syncTuning: boolean) {
      data.doesSyncTuning = syncTuning;
    },
    get lineBreaks() {
      return data.lineBreaks;
    },
  };
}

export interface UpdateTuning {
  addTop: () => void;
  addBottom: () => void;
  removeTop: () => void;
  removeBottom: () => void;
  setTuningNote: (string: number, note: Midi) => void;
}

function createChordStore({ tuning, chords }: ChordsData) {
  return {
    // the array is deeply reactive, so you can set notes directly
    chords,
    // So it can be used with v-model
    get tuning() {
      return tuning;
    },
    setTuningNote(string: number, note: Midi) {
      tuning[string] = note;
    },
    // set tuning(newTuning: Midi[]) {
    //   tuning.splice(0, tuning.length, ...newTuning);
    // },
    addChord() {
      const chord: Chord = {
        title: "",
        notes: new Map(),
      };
      chords.push(chord);
    },
    deleteChord(index: number) {
      chords.splice(index, 1);
    },
    moveChord(from: number, to: number) {
      const chord = chords[from];
      chords.splice(from, 1);
      chords.splice(to, 0, chord);
    },
    insertString(position = tuning.length) {
      let newTuningNote;
      if (position === tuning.length) {
        // Add to bottom
        newTuningNote = (tuning[position - 1] - 5) as Midi;
        tuning.push(newTuningNote);
      } else if (position === 0) {
        // Add to top
        newTuningNote = (tuning[0] + 5) as Midi;
        tuning.unshift(newTuningNote);

        // Shift existing notes down
        for (const chord of chords) {
          const oldNotes = new Map(chord.notes);
          chord.notes.clear();

          for (const [string, note] of oldNotes.entries()) {
            chord.notes.set(string + 1, note);
          }
        }
      } else {
        // Add in middle
        newTuningNote = tuning[position];
        tuning.splice(position, 0, newTuningNote as Midi);

        // Shift notes below the insertion point
        for (const chord of chords) {
          const oldNotes = new Map(chord.notes);
          chord.notes.clear();

          for (const [string, note] of oldNotes.entries()) {
            if (string >= position) {
              chord.notes.set(string + 1, note);
            } else {
              chord.notes.set(string, note);
            }
          }
        }
      }
    },
    removeString(position = tuning.length - 1) {
      // Don't remove the last string
      if (tuning.length <= 1) return;

      if (position === 0) {
        // Remove from top
        tuning.shift();

        for (const chord of chords) {
          chord.notes.delete(0);

          const oldNotes = new Map(chord.notes);
          chord.notes.clear();

          for (const [string, note] of oldNotes.entries()) {
            if (string > 0) {
              chord.notes.set(string - 1, note);
            }
          }
        }
      } else {
        // Remove from bottom or middle
        tuning.splice(position, 1);

        // Remove notes on the removed string and shift higher strings down
        for (const chord of chords) {
          chord.notes.delete(position);

          const oldNotes = new Map(chord.notes);
          chord.notes.clear();

          for (const [string, note] of oldNotes.entries()) {
            if (string > position) {
              chord.notes.set(string - 1, note);
            } else if (string < position) {
              chord.notes.set(string, note);
            }
          }
        }
      }
    },
  };
}

export type ChordStore = ReturnType<typeof createChordStore>;

export interface AnnotationStore {
  createAnnotation: (row: number, data: Annotation) => void;
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
      return;
    }

    ofRow.push(data);
  }

  function deleteAnnotation(row: number, data: Annotation) {
    const ofRow = annotations.get(row);
    if (ofRow) {
      const toDelete = ofRow.findIndex(
        (a) => a.start === data.start && a.end === data.end,
      );
      ofRow.splice(toDelete, 1);
      if (ofRow.length === 0 && row === annotations.size - 1) {
        annotations.delete(row);
      }
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
  shiftFrom: (position: number, shiftBy: number) => void;
  getLastPosition: () => number;
  getMinSpacing: () => number;
}
function createStackStore<N extends NoteData>(
  stacks: StackMap<N>,
): StackStore<N> {
  const getLastPosition = () =>
    [...stacks.keys()].sort((a, b) => b - a)[0] || 0;

  const getMinSpacing = () => {
    let minSpacing = Infinity;
    for (const position of [...stacks.keys()]) {
      const divisor = largestSpacingDivisor(position);
      if (divisor) minSpacing = Math.min(minSpacing, SPACING[divisor]);
    }
    return minSpacing;
  };

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
      return;
    }
    stacks.set(position, stack);
  }

  // function deleteStacks(start: number, end: number) {
  //   for (const position of [...stacks.keys()].sort((a, b) => a - b)) {
  //     if (position >= start && position <= end) {
  //       stacks.delete(position);
  //       if (position === furthestPos.at(-1)) {
  //         furthestPos.pop();
  //       }
  //     }
  //   }
  // }

  function shiftFrom(position: number, shiftBy: number) {
    if (position < 0) return;

    // we need to move the "last" stacks before the "first"
    const comparator =
      shiftBy > 0
        ? (a: number, b: number) => b - a
        : (a: number, b: number) => a - b;

    const entries = [...stacks.entries()]
      .filter(([pos, stack]) => pos >= position)
      .sort(([posA], [posB]) => comparator(posA, posB));

    for (const [pos, stack] of entries) {
      setStack(pos + shiftBy, stack);
      stacks.delete(pos);
    }
  }

  return {
    getStacks,
    setStack,
    getLastPosition,
    getMinSpacing,
    shiftFrom,
  };
}

export interface Tie extends TieData {
  string: number;
  from: number;
  midiFrom?: Midi;
  midiTo?: Midi;
}

export interface Bend extends BendData {
  string: number;
  from: number;
}

export interface TieStore {
  setTie: (string: number, from: number, tie: TieData | BendData) => void;
  updateBend: (bend: Bend) => void;
  updateTie: (tie: Tie) => void;
  deleteTie: (string: number, from: number) => void;
  deleteAt: (string: number, position: number) => void;
  getTies: () => Tie[];
  getBends: () => Bend[];
  shiftFrom: (position: number, shiftBy: number) => void;
  getStartsAt: (notePosition: NotePosition) => TieData | BendData | undefined;
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

  function updateBend(bend: Bend) {
    const { string, from, ...bendData } = bend;
    setTie(string, from, bendData);
  }

  function updateTie(tie: Tie) {
    const { string, from, ...tieData } = tie;
    setTie(string, from, tieData);
  }

  function deleteTie(string: number, from: number) {
    const stringTies = guitarData.ties.get(string);
    if (stringTies) {
      stringTies.delete(from);
    }
  }

  function deleteAt(string: number, position: number) {
    const stringTies = guitarData.ties.get(string);
    if (stringTies) {
      deleteTie(string, position);
      const tiedTo = [...stringTies.entries()].find(
        ([from, tie]) => tie.to === position,
      );
      if (tiedTo) {
        deleteTie(string, tiedTo[0]);
      }
    }
  }

  function getTies(): Tie[] {
    const ties: Tie[] = [];
    for (const [string, stringTies] of guitarData.ties) {
      for (const [from, tie] of stringTies) {
        if (tie.type === "bend") continue;
        const fromNote = guitarData.stacks.get(from)?.get(string);
        const toNote = guitarData.stacks.get(tie.to)?.get(string);
        ties.push({
          ...tie,
          string,
          from,
          // if the ties were added correctly by the GUI, these will always be defined as Midi
          midiFrom: fromNote?.note === "muted" ? undefined : fromNote?.note,
          midiTo: toNote?.note === "muted" ? undefined : toNote?.note,
        });
      }
    }
    return ties;
  }

  function getBends(): Bend[] {
    const bends: Bend[] = [];
    for (const [string, stringTies] of guitarData.ties) {
      for (const [from, tie] of stringTies) {
        if (tie.type === "bend") {
          bends.push({ ...tie, string, from });
        }
      }
    }
    return bends;
  }

  // function isConnected({ string, position }: NotePosition): boolean {
  //   const stringTies = guitarData.ties.get(string);
  //   if (!stringTies) return false;
  //   const tie = stringTies.get(position);
  //   return tie !== undefined;
  // }

  function getStartsAt({
    position,
    string,
  }: NotePosition): TieData | BendData | undefined {
    const stringTies = guitarData.ties.get(string);
    if (!stringTies) return undefined;
    return stringTies.get(position);
  }

  function shiftFrom(position: number, shiftBy: number) {
    for (const [string, ties] of guitarData.ties) {
      const newTies = new Map<number, TieData | BendData>();
      for (const [from, tie] of ties) {
        if (tie.to >= position && from <= position) continue;
        if (tie.to >= position && from >= position) {
          newTies.set(from + shiftBy, {
            ...tie,
            to: tie.to + shiftBy,
          });
          continue;
        }
        newTies.set(from, tie);
      }
      guitarData.ties.set(string, newTies);
    }
  }

  return {
    setTie,
    updateBend,
    updateTie,
    deleteTie,
    deleteAt,
    getTies,
    getBends,
    getStartsAt,
    shiftFrom,
  };
}

export interface NotePosition {
  position: number;
  string: number;
}

export type GuitarStack = {
  position: number;
  notes: Array<GuitarNote | undefined>;
};

export interface GuitarStore
  extends Omit<StackStore<GuitarNote> & GuitarTabData, "getStacks" | "ties"> {
  getNote: (notePosition: NotePosition) => GuitarNote | undefined;
  setNote: (notePosition: NotePosition, data: GuitarNote) => void;
  deleteNote: (notePosition: NotePosition) => void;
  getMovedNotes: (
    positions: NotePosition[],
    deltaString: number,
    deltaPosition: number,
  ) => Array<{
    position: NotePosition;
    note: GuitarNote;
  }>;
  moveNotes: (
    positions: NotePosition[],
    deltaString: number,
    deltaPosition: number,
    copy?: boolean,
  ) => NotePosition[];
  deleteStacks: (start: number, end: number) => void;
  getStacks: (start: number, end: number, subunit: number) => GuitarStack[];
  insertString: (position?: number) => void;
  removeString: (position?: number) => void;
  setTuningNote: (string: number, note: Midi) => void;
  ties: TieStore;
}

function createGuitarStore(guitarData: GuitarTabData): GuitarStore {
  const noteStore = createStackStore(guitarData.stacks);
  const tieStore = createTieStore(guitarData);

  function insertString(position = guitarData.tuning.length) {
    let newTuningNote;
    if (position === guitarData.tuning.length) {
      newTuningNote = guitarData.tuning[position - 1] - 5;
    } else if (position === 0) {
      newTuningNote = guitarData.tuning[0] + 5;
    } else {
      newTuningNote = guitarData.tuning[position];
    }
    guitarData.tuning.splice(position, 0, newTuningNote as Midi);

    // Shift notes up
    guitarData.stacks.forEach((stack) => {
      // Shift all notes at or above the insertion position up by one string
      for (let i = guitarData.tuning.length - 2; i >= position; i--) {
        const note = stack.get(i);
        if (note) {
          stack.set(i + 1, note);
          stack.delete(i);
        }
      }
    });

    // Shift ties/bends up
    const tieEntries = [...guitarData.ties.entries()]
      .filter(([string, _]) => string >= position)
      .sort(([stringA], [stringB]) => stringB - stringA); // Process from highest string to lowest

    for (const [string, ties] of tieEntries) {
      guitarData.ties.set(string + 1, ties);
      guitarData.ties.delete(string);
    }
  }

  function removeString(position = guitarData.tuning.length - 1) {
    if (guitarData.tuning.length <= 1) return; // Don't remove the last string

    // Remove the tuning note
    guitarData.tuning.splice(position, 1);

    // Remove notes on the removed string and shift higher strings down
    guitarData.stacks.forEach((stack) => {
      // Delete the note at the removed position
      stack.delete(position);

      // Shift all notes above the removed position down by one string
      for (let i = position + 1; i < guitarData.tuning.length + 1; i++) {
        const note = stack.get(i);
        if (note) {
          stack.set(i - 1, note);
          stack.delete(i);
        }
      }
    });

    // Remove any ties/bends on the removed string
    const stringTies = guitarData.ties.get(position);
    if (stringTies) {
      guitarData.ties.delete(position);
    }

    // Shift ties/bends from higher strings down
    for (let i = position + 1; i < guitarData.tuning.length + 1; i++) {
      const ties = guitarData.ties.get(i);
      if (ties) {
        guitarData.ties.set(i - 1, ties);
        guitarData.ties.delete(i);
      }
    }
  }

  function setTuningNote(string: number, note: Midi) {
    guitarData.tuning[string] = note;
  }

  function getNote({ position, string }: NotePosition): GuitarNote | undefined {
    return guitarData.stacks.get(position)?.get(string);
  }

  function setNote({ position, string }: NotePosition, data: GuitarNote): void {
    if (position >= 0 && string >= 0 && string < guitarData.tuning.length) {
      let stack = guitarData.stacks.get(position);

      if (!stack) {
        stack = new Map();
      }

      stack.set(string, data);

      noteStore.setStack(position, stack);
    }
  }

  function deleteNote({ position, string }: NotePosition) {
    const stack = guitarData.stacks.get(position);
    if (stack && stack.has(string)) {
      stack.delete(string);
      noteStore.setStack(position, stack);
      tieStore.deleteAt(string, position);
    }
  }

  function moveNotes(
    positions: NotePosition[],
    deltaString: number,
    deltaPosition: number,
    copy?: boolean,
  ) {
    const movedNotes = getMovedNotes(positions, deltaString, deltaPosition);

    if (!copy) {
      for (const position of positions) {
        deleteNote(position);
      }
    }

    for (const { position, note } of movedNotes) {
      setNote(position, note);
    }

    return movedNotes.map(({ position }) => position);
  }

  function getMovedNotes(
    positions: NotePosition[],
    deltaString: number,
    deltaPosition: number,
  ) {
    const newNotes: Array<{
      position: NotePosition;
      note: GuitarNote;
    }> = [];

    for (const position of positions) {
      const note = getNote(position);
      if (!note) continue;

      const newPosition = {
        string: position.string + deltaString,
        position: position.position + deltaPosition,
      };

      const newNote: GuitarNote = {
        note:
          note.note === "muted"
            ? "muted"
            : ((note.note +
                (guitarData.tuning[newPosition.string] -
                  guitarData.tuning[position.string])) as Midi),
      };

      newNotes.push({ position: newPosition, note: newNote });
    }

    return newNotes;
  }

  function deleteStacks(start: number, end: number) {
    // const positions = [...guitarData.stacks.keys()].sort((a, b) => a - b).filter(pos =>pos >= start && )
    for (const position of guitarData.stacks.keys()) {
      if (position >= start && position < end) {
        const stack = guitarData.stacks.get(position)!;
        for (const [string, note] of stack) {
          deleteNote({ position, string });
        }
      }
    }
  }

  function getStacks(start = 0, end: number, subunit: number) {
    const subset = noteStore.getStacks(start, end);
    for (let i = start; i < end; i += subunit) {
      if (!subset.has(i)) {
        subset.set(i, new Map());
      }
    }

    return [...subset.entries()]
      .sort((a, b) => a[0] - b[0])
      .filter(([position, _]) => position % subunit === 0)
      .map(([position, stack]) => {
        const stackArray = [];
        for (let i = 0; i < guitarData.tuning.length; i++) {
          stackArray[i] = stack.get(i) || undefined;
        }
        return { position, notes: stackArray };
      });
  }

  function getMinSpacing() {
    let minSpacing = noteStore.getMinSpacing();
    for (const pos of tieStore
      .getBends()
      .flatMap((bend) =>
        bend.through ? [bend.through[0], bend.to] : bend.to,
      )) {
      const divisor = largestSpacingDivisor(pos);
      if (divisor) minSpacing = Math.min(minSpacing, SPACING[divisor]);
    }
    return minSpacing;
  }

  function shiftFrom(position: number, shiftBy: number) {
    noteStore.shiftFrom(position, shiftBy);
    tieStore.shiftFrom(position, shiftBy);
  }

  return {
    ...noteStore,
    insertString,
    removeString,
    getNote,
    setTuningNote,
    getStacks,
    setNote,
    deleteNote,
    deleteStacks,
    shiftFrom,
    moveNotes,
    getMovedNotes,
    getMinSpacing,
    ...guitarData,
    get tuning() {
      return guitarData.tuning;
    },
    ties: tieStore,
  };
}
