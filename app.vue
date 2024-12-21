<script setup lang="ts">
import type { GuitarNote, TabData } from "~/model/data";
import type { TabStore } from "./model/stores";
import type { SerializeableTabData } from "./model/serialize";
import { createTabStore } from "./model/stores";
import { deserializeTabData } from "./model/serialize";
import Tab from "./components/tab/Tab.vue";
import ChordGroup from "./components/chords/ChordGroup.vue";

const route = useRoute();
const [_, id] = route.path.split("/");

const tabStore = ref<TabStore>();

if (id) {
  // TODO: use pages and create a dedicated route for this
  const url = `/api/tab-data/${id}`;
  const { data, pending, error, refresh } = await useFetch(url, {
    method: "GET",
  });

  watchEffect(() => {
    if (data.value) {
      const tabData: TabData = deserializeTabData(data.value as SerializeableTabData);
      tabStore.value = createTabStore(tabData);
    }
  });
} else {
  const store = createTabStore();

  const guitar = store.createGuitarTab();

  const guitarNotes: Array<[number, number, string]> = [
    [0, 0, "B4"],
    [Spacing.Quarter * 2, 0, "B4"],
    [Spacing.Quarter * 2 + Spacing.ThirtySecond, 2, "D4"],
    [Spacing.Quarter * 3, 4, "B3"],
    [Spacing.Quarter * 4, 5, "A3"],
    [Spacing.Quarter * 6, 5, "G3"],
    [Spacing.Quarter * 8, 5, "F3"],
    [Spacing.Quarter * 9, 0, "F4"],
    [Spacing.Quarter * 9 + Spacing.ThirtySecond, 0, "F4"],
    [Spacing.Quarter * 12, 0, "F4"],
    [Spacing.Quarter * 12 + Spacing.ThirtySecond, 0, "F4"],
  ];

  guitarNotes.forEach(([position, string, midiString]) => {
    const data: GuitarNote = {
      string,
      midi: toMidi(midiString),
    };
    guitar.setNote(position, data);
  });

  tabStore.value = store;
}

/*
const activeStack = computed(() => {
  if (selectionState.start) {
    return notes.getStack(selectionState.start);
  }
  return notes.tuning.map((_, string) => ({ position: -1, string }));
});

function fretboardNoteChange(note: GuitarNote) {
  const { position, string, data } = note;
  if (data) {
    notes.setNote(position, string, data);
    return;
  }
  notes.deleteNote(position, string);
} */

const barsPerLine = ref(3);
const notches = ref(4);
const subdivisions = ref(4);
const collapseSubdivisions = ref(true);
const collapseEmpty = ref(true);

const saveId = ref(id);

async function save() {
  if (tabStore.value && saveId.value) {
    const tabData = tabStore.value.serialize();

    const url = "/api/tab-data/" + saveId.value;
    const { data, pending, error, refresh } = await $fetch(url, {
      method: "POST",
      body: tabData,
    });
  }
}
</script>

<template>
  <!-- <input type="checkbox" v-model="showDivisions"/> -->
  <div>
    Bars per line:
    <input v-model="barsPerLine" type="number" />
    Notches per bar:
    <input v-model="notches" type="number" />
    Subdivide notches by:
    <input v-model="subdivisions" type="number" />
    Collapse subdivisions:
    <input v-model="collapseSubdivisions" type="checkbox" />

    Collapse empty notches:
    <input v-model="collapseEmpty" type="checkbox" />

    <input v-model="saveId" type="text" />
    <button @click="save">Save</button>
  </div>
  <ChordGroup v-if="tabStore" :data="tabStore.chords" />
  <Tab
    v-if="tabStore"
    :data="tabStore"
    :bars-per-line
    :notches
    :subdivisions
    :collapse-subdivisions
    :collapse-empty
  />
  <!-- <Fretboard
    width="75%"
    :stack="activeStack"
    @note-change="fretboardNoteChange"
  /> -->
</template>

<style scoped>
input[type="number"] {
  width: 50px;
}
</style>
