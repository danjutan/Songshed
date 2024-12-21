import type { Bend, TieStore } from "~/model/stores";
import type { OverlayPosition } from "../../overlay-objects";
import type { TablineColumn } from "../../Tab.vue";
import type { BendRenderProps } from "../bends/BendRender.vue";

export function createBendRenderState(
  store: TieStore,
  startRow: ComputedRef<number>,
  tablineColumns: ComputedRef<number>,
  posToCol: (pos: number) => TablineColumn,
  newBend: ComputedRef<Bend | undefined>,
) {
  return computed(() => {
    const bendRenders: Map<
      number, // tabline index
      Array<BendRenderProps>
      //todo: halves logic
    > = new Map();

    function pushRenderProps(
      tablineIndex: number,
      renderProps: BendRenderProps,
    ) {
      const atTabline = bendRenders.get(tablineIndex) || [];
      atTabline.push(renderProps);
      bendRenders.set(tablineIndex, atTabline);
    }

    function pushBend(bend: Bend) {
      const start = posToCol(bend.from);
      const end = posToCol(bend.to);
      const through = bend.through?.[0]
        ? posToCol(bend.from + bend.through[0])
        : undefined;
      const row = startRow.value + bend.string;
      if (start.tabline !== end.tabline) {
        if (!through) {
          const fullUpswingColumns =
            tablineColumns.value - start.column + end.column;
          pushRenderProps(start.tabline, {
            startColumn: start.column,
            endColumn: tablineColumns.value,
            half: "left",
            fullUpswingColumns,
            row,
            bend,
          });
          pushRenderProps(end.tabline, {
            startColumn: 2,
            endColumn: end.column,
            half: "right",
            fullUpswingColumns,
            row,
            bend,
          });
          return;
        }
        if (through.tabline === end.tabline) {
          const fullUpswingColumns =
            tablineColumns.value - start.column + through.column;
          pushRenderProps(start.tabline, {
            startColumn: start.column,
            endColumn: tablineColumns.value,
            half: "left",
            fullUpswingColumns,
            row,
            bend,
          });
          pushRenderProps(end.tabline, {
            startColumn: 2,
            throughColumn: through.column,
            endColumn: end.column,
            half: "right",
            fullUpswingColumns,
            row,
            bend,
          });
          return;
        }
        const fullRestColumns =
          tablineColumns.value - through.column + end.column;
        pushRenderProps(start.tabline, {
          startColumn: start.column,
          throughColumn: through.column,
          endColumn: tablineColumns.value,
          half: "left",
          fullRestColumns,
          row,
          bend,
        });
        pushRenderProps(end.tabline, {
          startColumn: 2,
          endColumn: end.column,
          half: "right",
          fullRestColumns,
          row,
          bend,
        });
        return;
      }
      pushRenderProps(start.tabline, {
        startColumn: start.column,
        throughColumn: through?.column,
        endColumn: end.column,
        row,
        bend,
      });
    }

    store.getBends().forEach(pushBend);

    if (newBend.value) {
      pushBend(newBend.value);
    }

    return bendRenders;
  });
}
