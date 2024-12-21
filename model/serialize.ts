import type { TabData, Annotation, GuitarNote, NoteData, GuitarTabData, StackMap } from "./data";

function replacer(key: string, value: object) {
  if (value instanceof Map) {
    return {
      _entries: [...value],
    };
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reviver(key: string, value: any) {
  if (typeof value === "object" && value._entries) {
    return new Map(value._entries as Array<[unknown, unknown]>);
  }
  return value;
}

/* type SerializeableStackMap<N extends NoteData> = Array<[number, Array<[number, N]>]>;

export interface SerializeableGuitar extends Omit<GuitarTabData, "stacks"> {
  stacks: SerializeableStackMap<Omit<GuitarNote, "string">>;
}

export interface SerializeableTabData extends Omit<TabData, "guitarData"> {
  guitarData?: SerializeableGuitar;
} */

export function serializeTabData(data: TabData): string {
  return JSON.stringify(data, replacer);
}

export function deserializeTabData(data: string): TabData {
  const parsed = JSON.parse(data, reviver);
  return parsed;
}
