export interface SelectionStore {
  selectedRange?: { start: number; end: number };
  start: (position: number) => void;
  drag: (position: number) => void;
  clear: () => void;
  end: () => void;
  isSelected: (position: number) => boolean;
}

export function createSelectionStore(): SelectionStore {
  const startPosition = ref<number | undefined>();
  const endPosition = ref<number | undefined>();
  const dragging = ref(false);

  function start(position: number) {
    dragging.value = true;
    startPosition.value = position;
    endPosition.value = position;
  }
  function drag(position: number) {
    if (!dragging.value || !startPosition.value) return;
    endPosition.value = position;
  }
  function end() {
    dragging.value = false;
  }
  function clear() {
    startPosition.value = undefined;
    endPosition.value = undefined;
  }
  function isSelected(position: number) {
    if (startPosition.value === undefined || endPosition.value === undefined)
      return false;
    const [first, last] = [startPosition.value, endPosition.value].sort(
      (a, b) => a - b,
    );
    return first <= position && position <= last;
  }
  return {
    get selectedRange() {
      if (startPosition.value === undefined || endPosition.value === undefined)
        return;
      return {
        start: startPosition.value,
        end: endPosition.value,
      };
    },
    start,
    drag,
    clear,
    end,
    isSelected,
  };
}

export const SelectionInjectionKey = Symbol() as InjectionKey<SelectionStore>;
