import type { CellHoverEvents } from "./cell-hover-events";

export interface SelectionState {
  selectedRange?: { start: number; end: number };
  start: (position: number, end?: number) => void;
  drag: (position: number, end?: number) => void;
  clear: () => void;
  end: () => void;
  isSelected: (position: number) => boolean;
  dragging: boolean;
}

export function createSelectionState(
  cellHoverState: CellHoverEvents,
): SelectionState {
  const startPosition = ref<number | undefined>();
  const endPosition = ref<number | undefined>();
  const dragging = ref(false);

  const selectedRange = () => {
    if (startPosition.value === undefined || endPosition.value === undefined)
      return;
    return {
      start: startPosition.value,
      end: endPosition.value,
    };
  };

  cellHoverState.addHoverListener((string, position) => drag(position));
  cellHoverState.addMouseUpListener(end);

  function start(position: number, end?: number) {
    dragging.value = true;
    const [first, last] = [position, end ?? position].sort((a, b) => a - b);
    startPosition.value = first;
    endPosition.value = last;
  }

  function drag(position: number, end?: number) {
    if (!dragging.value || startPosition.value === undefined) return;
    const [first, last] = [position, end ?? position].sort((a, b) => a - b);
    if (position <= startPosition.value) {
      startPosition.value = first;
      return;
    }
    endPosition.value = last;
  }
  function end() {
    dragging.value = false;
  }
  function clear() {
    startPosition.value = undefined;
    endPosition.value = undefined;
  }
  function isSelected(position: number) {
    const range = selectedRange();
    if (!range) return false;
    return range.start <= position && position <= range.end;
  }

  return {
    get selectedRange() {
      return selectedRange();
    },
    get dragging() {
      return dragging.value;
    },
    start,
    drag,
    clear,
    end,
    isSelected,
  };
}

export const SelectionInjectionKey = Symbol() as InjectionKey<SelectionState>;
