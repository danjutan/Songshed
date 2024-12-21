import type { Bend, TieStore } from "~/model/stores";
import type { OverlayPosition } from "../overlay-objects";
import type { TablineColumn } from "../Tab.vue";

export function createBendRenderState(
  store: TieStore,
  subUnit: ComputedRef<number>,
  startRow: ComputedRef<number>,
  posToCol: (pos: number) => TablineColumn,
  //newBend: NewBend
) {
  return computed(() => {
    const bendRenders: Map<
      number, // tabline index
      Array<OverlayPosition & { bend: Bend }>
      //todo: halves logic
    > = new Map();

    function push(
      tablineIndex: number,
      row: number,
      startColumn: number,
      endColumn: number,
      bend: Bend,
    ) {
      const atTabline = bendRenders.get(tablineIndex) || [];
      atTabline.push({ row, startColumn, endColumn, bend });
      bendRenders.set(tablineIndex, atTabline);
    }

    store.getBends().forEach((bends, string) => {
      for (const bend of bends) {
        const start = posToCol(bend.from);
        const end = posToCol(bend.to);
        const row = startRow.value + string;
        if (start.tabline !== end.tabline) {
          // halves logic goes here
          continue;
        }
        push(start.tabline, row, start.column, end.column, bend);
      }
    });

    return bendRenders;
  });
}
