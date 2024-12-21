export interface SelectionState {
  selectedRange?: { start: number; end: number };
  start: (position: number, end?: number) => void;
  drag: (position: number, end?: number) => void;
  clear: () => void;
  end: () => void;
  isSelected: (position: number) => boolean;
  dragging: boolean;
  // TODO? separate the editingNote stuff into its own provider
  editingNote?: { string?: number; position?: number };
  setEditing: (string: number, position: number) => void;
  blurEditing: () => void;
}

export function createSelectionState(): SelectionState {
  const startPosition = ref<number | undefined>();
  const endPosition = ref<number | undefined>();
  const dragging = ref(false);

  const editingNote = reactive<{ string?: number; position?: number }>({});

  function setEditing(string: number, position: number) {
    editingNote.string = string;
    editingNote.position = position;
  }

  function blurEditing() {
    editingNote.string = undefined;
    editingNote.position = undefined;
  }

  const selectedRange = () => {
    if (startPosition.value === undefined || endPosition.value === undefined)
      return;
    return {
      start: startPosition.value,
      end: endPosition.value,
    };
  };

  function start(position: number, end?: number) {
    dragging.value = true;
    const [first, last] = [position, end ?? position].sort((a, b) => a - b);
    startPosition.value = first;
    endPosition.value = last;
  }

  function drag(position: number, end?: number) {
    if (!dragging.value || !startPosition.value) return;
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
    editingNote,
    setEditing,
    blurEditing,
    start,
    drag,
    clear,
    end,
    isSelected,
  };
}

export const SelectionInjectionKey = Symbol() as InjectionKey<SelectionState>;
