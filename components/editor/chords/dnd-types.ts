const chordDragDataPrivateKey = Symbol("Chord drag data");
const chordInsertDropDataPrivateKey = Symbol("Chord insert drag data");

export type ChordDragDataProps = {
  index: number;
};

export type ChordInsertDropDataProps = {
  index: number;
};

type ChordDragData = {
  [chordDragDataPrivateKey]: true;
} & ChordDragDataProps;

type ChordInsertDropData = {
  [chordInsertDropDataPrivateKey]: true;
} & ChordInsertDropDataProps;

export function getChordDragData(params: ChordDragDataProps): ChordDragData {
  return {
    [chordDragDataPrivateKey]: true,
    ...params,
  };
}

export function getChordInsertDropData(
  params: ChordInsertDropDataProps,
): ChordInsertDropData {
  return {
    [chordInsertDropDataPrivateKey]: true,
    ...params,
  };
}

export function isChordDragData(
  data: Record<string | symbol, unknown>,
): data is ChordDragData {
  return chordDragDataPrivateKey in data;
}

export function isChordInsertDropData(
  data: Record<string | symbol, unknown>,
): data is ChordInsertDropData {
  return chordInsertDropDataPrivateKey in data;
}
