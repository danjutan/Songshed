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

  const hoverListeners = new Set<HoverListener>();
  const mouseupListeners = new Set<ReleaseListener>();

  // probably remove once we make the tab extend vertically to the viewport when mousedown
  const leaveTabListeners = new Set<ReleaseListener>();

  function hover(row: HoveredRow, position: number) {
    // hoveredCell.value = { string, position };
    hoverListeners.forEach((listener) => listener(row, position));
    hoveredCell.value = { row, position };
  }

  function mouseup() {
    mouseupListeners.forEach((listener) => listener());
  }

  function leaveTab() {
    leaveTabListeners.forEach((listener) => listener());
  }

  function addHoverListener(listener: HoverListener) {
    hoverListeners.add(listener);
  }

  function addMouseUpListener(listener: ReleaseListener) {
    mouseupListeners.add(listener);
  }

  function addLeaveTabListener(listener: ReleaseListener) {
    leaveTabListeners.add(listener);
  }

  return {
    hoveredCell,
    hoveredNote,
    hover,
    mouseup,
    leaveTab,
    addHoverListener,
    addMouseUpListener,
    addLeaveTabListener,
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
