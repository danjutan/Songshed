import type { Bar } from "../Tab.vue";

export type TablineColumn = {
  tabline: number;
  column: number;
  tablineColumns: number; // total columns in tabline
};

export type ColumnsMap = { [position: number]: TablineColumn }; // position (time) => column (1-indexed)

export function provideColumnsMap(
  props: ReactiveComputed<{
    tablines: Array<Bar[]>;
    subUnit: number;
    columnsPerBar: number;
    // barSize: number;
  }>,
) {
  const columnsMap = reactiveComputed<ColumnsMap>(() => {
    const map: ColumnsMap = {};
    const { tablines, subUnit, columnsPerBar } = props;
    tablines.forEach((tablineBars, tablineIndex) => {
      const tablineColumns = (tablineBars.length + 1) * columnsPerBar;
      let columnIndex = 1;
      for (const bar of tablineBars) {
        columnIndex++;
        for (let i = 0; i < columnsPerBar; i++) {
          const pos = bar.start + i * subUnit;
          map[pos] = {
            tabline: tablineIndex,
            column: columnIndex,
            tablineColumns,
          };
          columnIndex++;
        }
      }
    });
    return map;
  });
  provide(ColumnsMapInjectionKey, columnsMap);
  return columnsMap;
}

const ColumnsMapInjectionKey = Symbol() as InjectionKey<ColumnsMap>;

export function injectColumnsMap() {
  return inject(ColumnsMapInjectionKey) as ColumnsMap;
}
