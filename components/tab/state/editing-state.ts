export interface EditingState {
  editingNote?: { string?: number; position?: number };
  setEditing: (string: number, position: number) => void;
  blurEditing: () => void;
}

export function createEditingState(): EditingState {
  const editingNote = reactive<{ string?: number; position?: number }>({});

  function setEditing(string: number, position: number) {
    editingNote.string = string;
    editingNote.position = position;
  }

  function blurEditing() {
    editingNote.string = undefined;
    editingNote.position = undefined;
  }
  return {
    editingNote,
    setEditing,
    blurEditing,
  };
}

export const EditingInjectionKey = Symbol() as InjectionKey<EditingState>;
