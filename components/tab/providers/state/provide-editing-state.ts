export interface EditingState {
  editingNote?: { string?: number; position?: number };
  setEditing: (string: number, position: number) => void;
  blurEditing: () => void;
}

const EditingInjectionKey = Symbol() as InjectionKey<EditingState>;

export function provideEditingState(): EditingState {
  const editingNote = reactive<{ string?: number; position?: number }>({});

  function setEditing(string: number, position: number) {
    editingNote.string = string;
    editingNote.position = position;
    console.log("set editing", string, position);
  }

  function blurEditing() {
    console.log("blurred!", editingNote.string, editingNote.position);
    editingNote.string = undefined;
    editingNote.position = undefined;
  }
  const editingState = {
    editingNote,
    setEditing,
    blurEditing,
  };

  provide(EditingInjectionKey, editingState);

  return editingState;
}

export function injectEditingState() {
  return inject(EditingInjectionKey) as EditingState;
}
