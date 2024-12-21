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
        const through = bend.through?.[0]
          ? posToCol(bend.from + bend.through[0])
          : undefined;
        const row = startRow.value + string;
        if (start.tabline !== end.tabline) {
          if (!through) {
            const fullUpswingColumns =
              tablineColumns.value - start.column + end.column;
            push(start.tabline, {
              startColumn: start.column,
              endColumn: tablineColumns.value,
              half: "left",
              fullUpswingColumns,
              row,
              bend,
            });
            push(end.tabline, {
              startColumn: 2,
              endColumn: end.column,
              half: "right",
              fullUpswingColumns,
              row,
              bend,
            });
            continue;
          }
          if (through.tabline === end.tabline) {
            const fullUpswingColumns =
              tablineColumns.value - start.column + through.column;
            push(start.tabline, {
              startColumn: start.column,
              endColumn: tablineColumns.value,
              half: "left",
              fullUpswingColumns,
              row,
              bend,
            });
            push(end.tabline, {
              startColumn: 2,
              throughColumn: through.column,
              endColumn: end.column,
              half: "right",
              fullUpswingColumns,
              row,
              bend,
            });
            continue;
          }
          const fullRestColumns =
            tablineColumns.value - through.column + end.column;
          push(start.tabline, {
            startColumn: start.column,
            throughColumn: through.column,
            endColumn: tablineColumns.value,
            half: "left",
            fullRestColumns,
            row,
            bend,
          });
          push(end.tabline, {
            startColumn: 2,
            endColumn: end.column,
            half: "right",
            fullRestColumns,
            row,
            bend,
          });
          continue;
        }
        push(start.tabline, {
          startColumn: start.column,
          throughColumn: through?.column,
          endColumn: end.column,
          row,
          bend,
        });
      }
    });

    return bendRenders;
  });
}
