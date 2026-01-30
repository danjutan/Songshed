<script lang="ts" setup>
import { defaultTuning, getChroma, getNoteInfo } from "~/theory/notes";
const tuning = defaultTuning;
const frets = 12;

const testableNotes = ["C", "D", "E", "F", "G", "A", "B"];
const testableStrings = [1, 2, 3, 4, 5, 6];

interface Position {
  string: number;
  fret: number;
}

interface Positions {
  [note: string]: {
    [string: number]: number[];
  };
}

const positions: Positions = {};
for (const note of testableNotes) {
  positions[note] = {};
  for (const string of testableStrings) {
    positions[note][string] = [];
    const chroma = getNoteInfo(note).chroma;
    for (let i = 0; i <= frets; i++) {
      if (getChroma(tuning[string - 1] + i) === chroma) {
        positions[note][string].push(i);
      }
    }
  }
}

const posEqual = (pos1: Position, pos2: Position) =>
  pos1.string === pos2.string && pos1.fret === pos2.fret;

const testingNotes = new Set(["A", "C"]);
const currentNote = ref(getNextNote());
const currentString = ref(getNextString());
const selected = ref<Position[]>([]);
const done = ref(false);

function toggleTestingNote(note: string) {
  if (testingNotes.has(note)) {
    testingNotes.delete(note);
  } else {
    testingNotes.add(note);
  }
}

function getNextString() {
  return testableStrings[Math.floor(Math.random() * testableStrings.length)];
}

function getNextNote() {
  const notes = [...testingNotes.keys()];
  return notes[Math.floor(Math.random() * notes.length)];
}

function next() {
  done.value = false;
  selected.value = [];
  currentString.value = getNextString();
  currentNote.value = getNextNote();
}

interface Card {
  prompt: string;
  answers: Position[];
}

const currentCard = computed<Card>(() => {
  const prompt = `${currentNote.value} on string ${currentString.value}`;
  const answers = positions[currentNote.value][currentString.value].map(
    (fret) => ({ string: currentString.value, fret }),
  );
  return { prompt, answers };
});

function onToggle(toSelected: boolean, position: Position) {
  if (!toSelected) return;
  if (currentCard.value.answers.some((answer) => posEqual(answer, position))) {
    selected.value.push(position);
    if (selected.value.length === currentCard.value.answers.length) {
      done.value = true;
    }
  }
}
</script>

<template>
  <div class="app">
    <ClientOnly>
      <div class="settings">
        <div v-for="note in testableNotes" :key="note">
          <input
            :id="note"
            type="checkbox"
            :checked="testingNotes.has(note)"
            @change="() => toggleTestingNote(note)"
          />
          <label :for="note">{{ note }}</label>
        </div>
      </div>
      <div class="prompt">{{ currentCard.prompt }}</div>
      <Fretboard
        class="fretboard"
        :show-labels="done"
        :show-colors="done"
        :frets
        :selected
        :selected-strings="[currentCard.answers[0].string]"
        @toggle="onToggle"
      />
      <button v-if="done" class="next" @click="next">Next</button>
    </ClientOnly>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-family: sans-serif;
}

.settings {
  display: flex;
  font-size: 16pt;
}

.prompt {
  font-size: 24pt;
}

.fretboard {
  width: 75%;
  max-width: 1200px;
}

.next {
  font-size: 18pt;
  padding: 10px;
}
</style>
