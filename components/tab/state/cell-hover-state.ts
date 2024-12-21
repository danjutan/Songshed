export function createCellHoverState() {
  // const hoveredCell = ref<
  //   | {
  //       string: number | "bend";
  //       position: number;
  //     }
  //   | undefined
  // >();

  type HoverListener = (string: number | "bend", position: number) => void;
  type ReleaseListener = () => void;
  const hoverListeners = new Set<HoverListener>();
  const mouseupListeners = new Set<ReleaseListener>();
  const leaveTabListeners = new Set<ReleaseListener>();

  function hover(string: number | "bend", position: number) {
    // hoveredCell.value = { string, position };
    hoverListeners.forEach((listener) => listener(string, position));
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

export type CellHoverState = ReturnType<typeof createCellHoverState>;

export const CellHoverInjectionKey = Symbol() as InjectionKey<CellHoverState>;
