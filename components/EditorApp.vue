<script lang="ts" setup>
import type { TabStore } from "~/model/stores";
import Toolbar from "./tab/settings/SettingsBar.vue";
import Tab from "./tab/Tab.vue";
import ChordGroup from "./chords/ChordGroup.vue";
import { provideSettingsState } from "./tab/providers/state/provide-settings-state";

const props = defineProps<{
  tabStore: TabStore;
  id: string;
}>();

provideSettingsState();

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

const selected = ref("");

// Leaving this here fpr reference, but it's probably not a real bottleneck;
// without the call, the time is just spent on something else
// onMounted(() => {
//
//  // https://github.com/orgs/vuejs/discussions/8805
//   document.querySelectorAll = function () {
//     return [];
//   };
// });
</script>

<template>
  <Button label="Test PrimeVue" />
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
