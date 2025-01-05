import type { NotePosition } from "~/model/stores";

export interface EditingState {
  editingNote: Ref<NotePosition | undefined>;
  setEditing: (notePosition: NotePosition) => void;
  blurEditing: () => void;
  isEditing: (notePosition: NotePosition) => boolean;
}

const EditingInjectionKey = Symbol() as InjectionKey<EditingState>;

export function provideEditingState(): EditingState {
  const editingNote = ref<NotePosition | undefined>(undefined);

  function setEditing(notePosition: NotePosition) {
    editingNote.value = notePosition;
  }

  function blurEditing() {
    editingNote.value = undefined;
  }

  function isEditing(notePosition: NotePosition) {
    return (
      editingNote.value?.position === notePosition.position &&
      editingNote.value?.string === notePosition.string
    );
  }

  const editingState = {
    editingNote,
    setEditing,
    blurEditing,
    isEditing,
  };

  provide(EditingInjectionKey, editingState);

  return editingState;
}

export function injectEditingState() {
  return inject(EditingInjectionKey) as EditingState;
}
