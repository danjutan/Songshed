<script setup lang="ts">
import type { GuitarNote, TabData } from "~/model/data";
import type { TabStore } from "./model/stores";
import { createTabStore } from "./model/stores";
import { deserializeTabData } from "./model/serialize";
import Tab from "./components/tab/Tab.vue";
import ChordGroup from "./components/chords/ChordGroup.vue";
import {
  createSettingsState,
  SettingsInjectionKey,
} from "./components/tab/state/settings-state";
import Toolbar from "./components/tab/toolbar/Toolbar.vue";

const route = useRoute();
const [_, id] = route.path.split("/");

const tabStore = ref<TabStore>();

if (id) {
  // TODO: make an App component, then use pages and create a dedicated route for this
  const url = `/api/tab-data/${id}`;
  const { data, pending, error, refresh } = await useFetch(url, {
    method: "GET",
  });

  watchEffect(() => {
    if (data.value) {
      const tabData: TabData = deserializeTabData(data.value as string);
      tabStore.value = createTabStore(tabData);
    }
  });
} else {
  const store = createTabStore();

  const guitar = store.createGuitarTab();

  const guitarNotes: Array<[number, number, string]> = [
    [0, 0, "B4"],
    [Spacing.Quarter * 2, 2, "B4"],
    [Spacing.Quarter * 2 + Spacing.Sixteenth, 2, "D4"],
    [Spacing.Quarter * 3, 4, "B3"],
    [Spacing.Quarter * 3 + Spacing.Sixteenth, 1, "B3"],
    [Spacing.Quarter * 4, 5, "A3"],
    [Spacing.Quarter * 4 - Spacing.Eighth, 5, "A2"],
    [Spacing.Quarter * 4 + Spacing.Sixteenth, 1, "A4"],
    [Spacing.Quarter * 5, 5, "C3"],
    [Spacing.Quarter * 6, 5, "G3"],
    [Spacing.Quarter * 8 - Spacing.Sixteenth, 2, "A3"],
    [Spacing.Quarter * 8, 2, "B3"],
    [Spacing.Quarter * 8, 5, "F3"],
    [Spacing.Quarter * 9 - Spacing.Sixteenth, 0, "G4"],
    [Spacing.Quarter * 9 - Spacing.Sixteenth, 2, "B3"],
    [Spacing.Quarter * 9, 0, "F#4"],
    [Spacing.Quarter * 9 + Spacing.Eighth + Spacing.Sixteenth, 0, "F4"],
    [Spacing.Quarter * 10 + Spacing.Sixteenth, 2, "F4"],
    [Spacing.Quarter * 12 - Spacing.Eighth, 2, "G4"],
    [Spacing.Quarter * 12, 2, "F4"],
    [Spacing.Quarter * 12 + Spacing.Sixteenth, 0, "F4"],
  ];

  guitarNotes.forEach(([position, string, midiString]) => {
    const data: GuitarNote = {
      note: toMidi(midiString),
    };
    guitar.setNote(position, string, data);
  });

  const ties = guitar.ties;

  ties.setTie(5, Spacing.Quarter * 4 - Spacing.Eighth, {
    type: "bend",
    releaseType: "connect",
    bend: 1,
    through: [Spacing.Sixteenth * 1],
    to: Spacing.Quarter * 5,
  });

  // ties.setTie(5, Spacing.Quarter * 5 - Spacing.Eighth, {
  //   type: "bend",
  //   releaseType: "hold",
  //   bend: 0.5,
  //   through: [Spacing.Sixteenth * 4],
  //   to: Spacing.Quarter * 6,
  // });

  // ties.setTie(2, Spacing.Quarter * 3 - Spacing.Eighth, {
  //   type: "bend",
  //   releaseType: "hold",
  //   bend: 1,
  //   to: Spacing.Quarter * 3,
  // });

  ties.setTie(2, Spacing.Quarter * 11, {
    type: "bend",
    releaseType: "connect",
    bend: 1,
    // through: [Spacing.Sixteenth * 2],
    to: Spacing.Quarter * 12,
  });

  ties.setTie(2, Spacing.Quarter * 2, {
    to: Spacing.Quarter * 2 + Spacing.Sixteenth,
    type: { hammer: true },
  });

  ties.setTie(1, Spacing.Quarter * 3 + Spacing.Sixteenth, {
    to: Spacing.Whole + Spacing.Sixteenth,
    type: { slide: true, hammer: true },
  });

  ties.setTie(2, Spacing.Whole * 2 - Spacing.Sixteenth, {
    to: Spacing.Whole * 2,
    type: { hammer: true },
  });

  ties.setTie(2, Spacing.Whole * 3 - Spacing.Eighth, {
    to: Spacing.Whole * 3,
    type: { slide: true },
  });

  ties.setTie(0, Spacing.Quarter * 9, {
    to: Spacing.Quarter * 10 - Spacing.Sixteenth,
    type: { slide: true },
  });

  ties.setTie(2, Spacing.Quarter * 9 - Spacing.Sixteenth, {
    to: Spacing.Quarter * 10 + Spacing.Sixteenth,
    type: { hammer: true },
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

const settings = createSettingsState();
provide(SettingsInjectionKey, settings);

async function save(saveId: string) {
  if (tabStore.value && saveId) {
    const tabData = tabStore.value.serialize();

    const url = "/api/tab-data/" + saveId;
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
    <Toolbar
      v-if="tabStore"
      :id
      v-model:beats-per-bar="tabStore.beatsPerBar"
      v-model:beat-size="tabStore.beatSize"
      @save="save"
    />
  </div>
  <ChordGroup v-if="tabStore" :data="tabStore.chords" />
  <Tab v-if="tabStore" :tab-store="tabStore" />
  <!-- <Fretboard
    width="75%"
    :stack="activeStack"
    @note-change="fretboardNoteChange"
  /> -->
</template>

<style scoped></style>
