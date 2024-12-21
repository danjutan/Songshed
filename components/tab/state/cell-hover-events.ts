export type HoveredRow = number | "bend" | "annotation";
type HoverListener = (row: HoveredRow, position: number) => void;
type ReleaseListener = () => void;
export function createCellHoverEvents() {
  // const hoveredCell = ref<
  //   | {
  //       string: number | "bend";
  //       position: number;
  //     }
  //   | undefined
  // >();

  const hoverListeners = new Set<HoverListener>();
  const mouseupListeners = new Set<ReleaseListener>();

  // probably remove once we make the tab extend vertically to the viewport when mousedown
  const leaveTabListeners = new Set<ReleaseListener>();

  function hover(row: HoveredRow, position: number) {
    // hoveredCell.value = { string, position };
    hoverListeners.forEach((listener) => listener(row, position));
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
    // hoveredCell,
    hover,
    mouseup,
    leaveTab,
    addHoverListener,
    addMouseUpListener,
    addLeaveTabListener,
  };
}

export type CellHoverEvents = ReturnType<typeof createCellHoverEvents>;

export const CellHoverInjectionKey = Symbol() as InjectionKey<CellHoverEvents>;
