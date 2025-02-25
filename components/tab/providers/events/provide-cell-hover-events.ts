import type { NotePosition } from "~/model/stores";

export type HoveredRow = number | "bend" | "annotation";

type HoverListener = (row: HoveredRow, position: number) => void;
type ReleaseListener = () => void;

function createCellHoverEvents() {
  const hoveredCell = ref<
    | {
        row: HoveredRow;
        position: number;
      }
    | undefined
  >();

  const hoveredNote = computed<NotePosition | undefined>(() => {
    if (!hoveredCell.value || typeof hoveredCell.value.row !== "number")
      return undefined;
    return {
      position: hoveredCell.value.position,
      string: hoveredCell.value.row,
    };
  });

  const debounced = ref(false);
  const hoverListeners = new Set<HoverListener>();
  let timeout: NodeJS.Timeout | undefined;

  function hover(row: HoveredRow, position: number) {
    debounced.value = false;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      debounced.value = true;
    }, 50);
    hoverListeners.forEach((listener) => listener(row, position));
    hoveredCell.value = { row, position };
  }

  function clear() {
    hoveredCell.value = undefined;
    debounced.value = false;
    clearTimeout(timeout);
  }

  function addHoverListener(listener: HoverListener) {
    hoverListeners.add(listener);
  }

  return {
    hoveredCell,
    hoveredNote,
    debounced,
    hover,
    addHoverListener,
    clear,
  };
}

export type CellHoverEvents = ReturnType<typeof createCellHoverEvents>;

const CellHoverInjectionKey = Symbol() as InjectionKey<CellHoverEvents>;

export function provideCellHoverEvents() {
  const cellHoverEvents = createCellHoverEvents();
  provide(CellHoverInjectionKey, cellHoverEvents);
  return cellHoverEvents;
}

export function injectCellHoverEvents() {
  return inject(CellHoverInjectionKey) as CellHoverEvents;
}
