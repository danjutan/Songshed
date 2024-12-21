import type { TabData } from "./data";

function replacer(key: string, value: object) {
  if (value instanceof Map) {
    return {
      _entries: [...value],
    };
  }
  if (value instanceof Set) {
    return {
      _svalues: [...value],
    };
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reviver(key: string, value: any) {
  if (typeof value === "object") {
    if (value._entries) {
      return new Map(value._entries as Array<[unknown, unknown]>);
    }
    if (value._svalues) {
      return new Set(value._svalues as Array<unknown>);
    }
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
