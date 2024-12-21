import type { TabData, Annotation, GuitarNote, NoteData, GuitarTabData, StackMap } from "./data";

type SerializeableStackMap<N extends NoteData> = Array<[number, N[]]>;

export interface SerializeableGuitar extends Omit<GuitarTabData, "stacks"> {
  stacks: SerializeableStackMap<GuitarNote>;
}


export interface SerializeableTabData extends Omit<TabData, "guitarData" | "annotations"> {
  guitarData?: SerializeableGuitar;
  annotations: Array<[number, Annotation[]]>;
}
export function serializeTabData(data: TabData): string {
  const guitarData: SerializeableGuitar | undefined = data.guitarData && {
    ...data.guitarData,
    stacks: [...data.guitarData!.stacks.entries()].map(([position, stack]) => [
      position,
      stack.filter(Boolean) as GuitarNote[],
    ]),
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

export function deserializeTabData(data: string | SerializeableTabData): TabData {
  const parsed: SerializeableTabData = typeof data === "string" ? JSON.parse(data) : data;
  let guitarData: GuitarTabData | undefined;
  if (parsed.guitarData) {
    const stacks: StackMap<GuitarNote> = new Map();
    for (const [position, stack] of parsed.guitarData.stacks) {
      stacks.set(
        position,
        stack.reduce((arr, note) => {
          arr[note.string] = note;
          return arr;
        }, new Array<GuitarNote>())
      );
    }
    guitarData = {
      ...parsed.guitarData,
      stacks: stacks,
    };
  }
  const { title, beatsPerBar, beatSize } = parsed;
  return {
    title,
    beatsPerBar,
    beatSize,
    annotations: new Map(parsed.annotations),
    ...(guitarData && { guitarData }),
  };
}
