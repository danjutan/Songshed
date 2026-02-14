import type { Annotation, GuitarNote } from "~/model/data";
import type { Bend } from "~/model/stores";
import type { StartType } from "~/components/editor/tab/providers/state/provide-bend-edit-state";

export type NoteDragType = "select" | /*"tie-add" |*/ "move";

// https://atlassian.design/components/pragmatic-drag-and-drop/core-package/recipes/typing-data/

const noteInputDragDataPrivateKey = Symbol("NoteInput drag data");
const noteInputDropDataPrivateKey = Symbol("NoteInput drop data");
const bendBarDropDataPrivateKey = Symbol("Bend bar drop data");
const tieAddDragDataPrivateKey = Symbol("Tie add drag data");
const bendEditDragDataPrivateKey = Symbol("Bend edit drag data");
const annotationDragDataPrivateKey = Symbol("Annotation drag data");
const annotationResizeDragDataPrivateKey = Symbol(
  "Annotation resize drag data",
);
const barDragDataPrivateKey = Symbol("Bar drag data");
const insertBarDropDataPrivateKey = Symbol("Insert bar drop data");

export type NoteInputDragDataProps = {
  position: number;
  string: number;
  data?: GuitarNote;
  dragType: NoteDragType;
};

export type NoteInputDropDataProps = {
  position: number;
  string: number;
};

export type BendBarDropDataProps = {
  position: number;
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

export type AnnotationDragDataProps = {
  row: number;
  position: number;
};

export type AnnotationResizeDragDataProps = {
  row: number;
  annotation: Annotation;
  side: "start" | "end";
};

export type BarDragDataProps = {
  barStart: number;
};

export type InsertBarDropDataProps = {
  position: number;
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

type AnnotationDragData = {
  [annotationDragDataPrivateKey]: true;
} & AnnotationDragDataProps;

type AnnotationResizeDragData = {
  [annotationResizeDragDataPrivateKey]: true;
} & AnnotationResizeDragDataProps;

type NoteInputDropData = {
  [noteInputDropDataPrivateKey]: true;
} & NoteInputDropDataProps;

type BendBarDropData = {
  [bendBarDropDataPrivateKey]: true;
} & BendBarDropDataProps;

type BarDragData = {
  [barDragDataPrivateKey]: true;
} & BarDragDataProps;

type InsertBarDropData = {
  [insertBarDropDataPrivateKey]: true;
} & InsertBarDropDataProps;

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

export function getAnnotationDragData(
  params: AnnotationDragDataProps,
): AnnotationDragData {
  return {
    [annotationDragDataPrivateKey]: true,
    ...params,
  };
}

export function getAnnotationResizeDragData(
  params: AnnotationResizeDragDataProps,
): AnnotationResizeDragData {
  return {
    [annotationResizeDragDataPrivateKey]: true,
    ...params,
  };
}

export function getBarDragData(params: BarDragDataProps): BarDragData {
  return { [barDragDataPrivateKey]: true, ...params };
}

export function getInsertBarDropData(
  params: InsertBarDropDataProps,
): InsertBarDropData {
  return { [insertBarDropDataPrivateKey]: true, ...params };
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

export function isAnnotationDragData(
  data: Record<string | symbol, unknown>,
): data is AnnotationDragData {
  return !!data[annotationDragDataPrivateKey];
}

export function isAnnotationResizeDragData(
  data: Record<string | symbol, unknown>,
): data is AnnotationResizeDragData {
  return !!data[annotationResizeDragDataPrivateKey];
}

export function isBarDragData(
  data: Record<string | symbol, unknown>,
): data is BarDragData {
  return !!data[barDragDataPrivateKey];
}

export function isInsertBarDropData(
  data: Record<string | symbol, unknown>,
): data is InsertBarDropData {
  return !!data[insertBarDropDataPrivateKey];
}
