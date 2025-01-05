import type { GuitarNote } from "~/model/data";

export type DragType = "select" | "tie-add" | "move";

// https://atlassian.design/components/pragmatic-drag-and-drop/core-package/recipes/typing-data/

const noteInputDragDataPrivateKey = Symbol("NoteInput drag data");
const noteInputDropDataPrivateKey = Symbol("NoteInput drop data");

type NoteInputDragData = {
  [noteInputDragDataPrivateKey]: true;
  position: number;
  string: number;
  dragType: DragType;
  data?: GuitarNote;
};

type NoteInputDropData = {
  [noteInputDropDataPrivateKey]: true;
  position: number;
  string: number;
};

export function getNoteInputDragData({
  position,
  string,
  dragType,
  data,
}: {
  position: number;
  string: number;
  dragType: DragType;
  data?: GuitarNote;
}): NoteInputDragData {
  return {
    [noteInputDragDataPrivateKey]: true,
    position,
    string,
    dragType,
    data,
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

export function isNoteInputDragData(
  data: Record<string | symbol, unknown>,
): data is NoteInputDragData {
  return !!data[noteInputDragDataPrivateKey];
}

export function isNoteInputDropData(
  data: Record<string | symbol, unknown>,
): data is NoteInputDropData {
  return !!data[noteInputDropDataPrivateKey];
}
