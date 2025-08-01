<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    fontSize: string;
    showOctave: boolean;
  }>(),
  {
    showOctave: true,
  },
);

const notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
const octaves = [1, 2, 3, 4, 5, 6, 7, 8];

const midiNote = defineModel<Midi>({ required: true });

const nameAndOctave = computed(() => {
  return getNameAndOctave(midiNote.value);
});

const name = computed({
  get() {
    return nameAndOctave.value.name;
  },
  set(newName: string) {
    midiNote.value = toMidi(`${newName}${nameAndOctave.value.octave}`);
  },
});

const octave = computed({
  get() {
    return nameAndOctave.value.octave;
  },
  set(newOctave: number) {
    midiNote.value = toMidi(`${name.value}${newOctave}`);
  },
});

const orderedNotes = computed(() => {
  const currentNote = name.value;
  const currentIndex = notes.indexOf(currentNote ?? notes[0]);
  const notesBeforeCount = 3; // Show 3 notes before the current note

  const startIndex =
    (currentIndex - notesBeforeCount + notes.length) % notes.length;

  return [...notes.slice(startIndex), ...notes.slice(0, startIndex)].slice(
    0,
    notes.length,
  );
});
</script>

<template>
  <div class="flex">
    <Select
      v-model="name"
      editable
      class="select note"
      pt:dropdown:class="dropdown"
      pt:label:class="label"
      pt:optionLabel:style="font-family: sans-serif"
      :options="orderedNotes"
    >
      <template #dropdownicon>
        <span />
      </template>
    </Select>
    <Select
      v-if="showOctave"
      v-model="octave"
      class="select octave"
      editable
      pt:dropdown:class="dropdown"
      pt:label:class="label"
      pt:optionLabel:style="font-family: sans-serif"
      :options="octaves"
    >
      <template #dropdownicon>
        <span />
      </template>
    </Select>
  </div>
</template>

<style scoped>
.flex {
  display: flex;
}
.select {
  /* position: relative; */
  --p-select-padding-x: calc(var(--cell-height) / 6);
  --p-select-padding-y: 3px;
  &:deep(.label) {
    text-align: center;
    text-overflow: clip;
    font-size: v-bind(fontSize);
  }
  &:deep(.dropdown) {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
  &:deep(.option) {
    font-family: sans-serif;
  }
}

.note {
  border-right: none;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.octave {
  border-left: none;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
