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

type SerializeableStackMap<N extends NoteData> = Array<[number, Array<[number, N]>]>;

export interface SerializeableGuitar extends Omit<GuitarTabData, "stacks"> {
  stacks: SerializeableStackMap<Omit<GuitarNote, "string">>;
}

export interface SerializeableTabData extends Omit<TabData, "guitarData"> {
  guitarData?: SerializeableGuitar;
}
export function serializeTabData(data: TabData): string {
  const withoutString = (guitarNote: GuitarNote) => {
    const { string, ...rest } = guitarNote;
    return rest;
  };

  const guitarData: SerializeableGuitar | undefined = data.guitarData && {
    ...data.guitarData,
    stacks: [...data.guitarData!.stacks.entries()].map(([position, stack]) => [
      position,
      [...stack.entries()].map(([key, value]) => [key, withoutString(value)]),
    ]),
  };

  const { title, beatsPerBar, beatSize } = data;
  const serializeable: SerializeableTabData = {
    title,
    beatSize,
    beatsPerBar,
    annotations: data.annotations,
    chordsData: data.chordsData,
    ...(data.guitarData && { guitarData }),
  };

  return JSON.stringify(serializeable, replacer);
}

export function deserializeTabData(data: string): TabData {
  const parsed: SerializeableTabData = JSON.parse(data, reviver);
  console.log(parsed);
  let guitarData: GuitarTabData | undefined;
  if (parsed.guitarData) {
    const stacks: StackMap<GuitarNote> = new Map();
    for (const [position, stack] of parsed.guitarData.stacks) {
      const withString = stack.map(
        ([key, value]) => [key, { string: key, ...value }] as [number, GuitarNote],
      );
      stacks.set(position, new Map(withString));
    }
    guitarData = {
      ...parsed.guitarData,
      stacks: stacks,
    };
  }
  const { title, beatsPerBar, beatSize, annotations, chordsData } = parsed;
  return {
    title,
    beatsPerBar,
    beatSize,
    annotations,
    chordsData,
    ...(guitarData && { guitarData }),
  };
}
