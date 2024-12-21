import type { Bend, TieStore } from "~/model/stores";
import type { OverlayPosition } from "../overlay-objects";
import type { TablineColumn } from "../Tab.vue";
import type { BendRenderProps } from "../guitar/bends/BendRender.vue";

export function createBendRenderState(
  store: TieStore,
  subUnit: ComputedRef<number>,
  startRow: ComputedRef<number>,
  tablineColumns: ComputedRef<number>,
  posToCol: (pos: number) => TablineColumn,
  //newBend: NewBend
) {
  return computed(() => {
    const bendRenders: Map<
      number, // tabline index
      Array<BendRenderProps>
      //todo: halves logic
    > = new Map();

    function push(tablineIndex: number, renderProps: BendRenderProps) {
      const atTabline = bendRenders.get(tablineIndex) || [];
      atTabline.push(renderProps);
      bendRenders.set(tablineIndex, atTabline);
    }

    store.getBends().forEach((bends, string) => {
      for (const bend of bends) {
        const start = posToCol(bend.from);
        const end = posToCol(bend.to);
        const throughColumns = bend.through
          ? bend.through.map((p) => posToCol(p + bend.from).column)
          : [];
        const row = startRow.value + string;
        if (start.tabline !== end.tabline) {
          // halves logic goes here
          // continue;
          const fullColumns = tablineColumns.value - start.column + end.column;
          push(start.tabline, {
            row,
            startColumn: start.column,
            throughColumns,
            endColumn: tablineColumns.value,
            bend,
            half: "left",
            fullColumns,
          });
          push(end.tabline, {
            row,
            startColumn: 2,
            throughColumns,
            endColumn: end.column,
            bend,
            half: "right",
            fullColumns,
          });
          continue;
        }
        push(start.tabline, {
          row,
          startColumn: start.column,
          throughColumns,
          endColumn: end.column,
          bend,
        });
      }
    });

    return bendRenders;
  });
}
