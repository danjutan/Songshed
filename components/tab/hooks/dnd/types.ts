import type { GuitarNote } from "~/model/data";
import type { Bend } from "~/model/stores";
import type { StartType } from "../../providers/state/provide-bend-edit-state";

export type DragType = "select" | /*"tie-add" |*/ "move";

// https://atlassian.design/components/pragmatic-drag-and-drop/core-package/recipes/typing-data/

const noteInputDragDataPrivateKey = Symbol("NoteInput drag data");
const noteInputDropDataPrivateKey = Symbol("NoteInput drop data");
const bendBarDropDataPrivateKey = Symbol("Bend bar drop data");
const tieAddDragDataPrivateKey = Symbol("Tie add drag data");
const bendEditDragDataPrivateKey = Symbol("Bend edit drag data");
export type NoteInputDragDataProps = {
  position: number;
  string: number;
  data?: GuitarNote;
  dragType: DragType;
};

export type TieAddDragDataProps = {
  position: number;
  string: number;
  data: GuitarNote;
  mode: "tie" | "bend";
};

export type BendEditDragDataProps = {
  bend: Bend;
  mode: StartType;
};

type NoteInputDragData = {
  [noteInputDragDataPrivateKey]: true;
} & NoteInputDragDataProps;

type TieAddDragData = {
  [tieAddDragDataPrivateKey]: true;
} & TieAddDragDataProps;

type BendEditDragData = {
  [bendEditDragDataPrivateKey]: true;
} & BendEditDragDataProps;

type NoteInputDropData = {
  [noteInputDropDataPrivateKey]: true;
  position: number;
  string: number;
};

type BendBarDropData = {
  [bendBarDropDataPrivateKey]: true;
  position: number;
};

export function getNoteInputDragData(params: NoteInputDragDataProps) {
  return {
    [noteInputDragDataPrivateKey]: true,
    ...params,
  };
}

export function getNoteInputDropData({
  position,
  string,
}: {
  position: number;
  string: number;
}): NoteInputDropData {
  return {
    [noteInputDropDataPrivateKey]: true,
    position,
    string,
  };
}

export function getBendBarDropData({
  position,
}: {
  position: number;
}): BendBarDropData {
  return { [bendBarDropDataPrivateKey]: true, position };
}

export function getTieAddDragData(params: TieAddDragDataProps): TieAddDragData {
  return {
    [tieAddDragDataPrivateKey]: true,
    ...params,
  };
}

export function getBendEditDragData(
  params: BendEditDragDataProps,
): BendEditDragData {
  return {
    [bendEditDragDataPrivateKey]: true,
    ...params,
  };
}

export function isNoteInputDragData(
  data: Record<string | symbol, unknown>,
): data is NoteInputDragData {
  return !!data[noteInputDragDataPrivateKey];
}

export function isTieAddDragData(
  data: Record<string | symbol, unknown>,
): data is TieAddDragData {
  return !!data[tieAddDragDataPrivateKey];
}

export function isNoteInputDropData(
  data: Record<string | symbol, unknown>,
): data is NoteInputDropData {
  return !!data[noteInputDropDataPrivateKey];
}

export function isBendBarDropData(
  data: Record<string | symbol, unknown>,
): data is BendBarDropData {
  return !!data[bendBarDropDataPrivateKey];
}

export function isBendEditDragData(
  data: Record<string | symbol, unknown>,
): data is BendEditDragData {
  return !!data[bendEditDragDataPrivateKey];
}
