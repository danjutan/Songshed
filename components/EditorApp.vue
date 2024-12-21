<script lang="ts" setup>
import type { TabStore } from "~/model/stores";
import Toolbar from "./tab/toolbar/Toolbar.vue";
import Tab from "./tab/Tab.vue";
import ChordGroup from "./chords/ChordGroup.vue";
import {
  createSettingsState,
  SettingsInjectionKey,
} from "./tab/state/settings-state";

const props = defineProps<{
  tabStore: TabStore;
  id: string;
}>();

const settings = createSettingsState();
provide(SettingsInjectionKey, settings);

async function save(saveId: string) {
  if (props.tabStore && saveId) {
    const tabData = props.tabStore.serialize();

    const url = "/api/tab-data/" + saveId;
    /*const { data, pending, error, refresh } = await*/ $fetch(url, {
      method: "POST",
      body: tabData,
    });
  }
}
</script>

<template>
  <Toolbar
    :id
    v-model:beats-per-bar="tabStore.beatsPerBar"
    v-model:beat-size="tabStore.beatSize"
    @save="save"
  />
  <ChordGroup :data="tabStore.chords" />
  <Tab :tab-store="tabStore" />
</template>

<style scoped></style>
