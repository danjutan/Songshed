<script lang="ts" setup>
import type { TabStore } from "~/model/stores";
import Toolbar from "./tab/settings/SettingsBar.vue";
import Tab from "./tab/Tab.vue";
import ChordGroup from "./chords/ChordGroup.vue";
import {
  injectSettingsState,
  provideSettingsState,
} from "./tab/providers/state/provide-settings-state";
import { provideSpacings } from "./tab/providers/provide-spacings";

const props = defineProps<{
  tabStore: TabStore;
  id: string;
}>();

const settings = provideSettingsState();
const {
  cellHeightPx,
  dividerWidthPx,
  contextMenuHeightPx,
  collapsedMinWidthPx,
  noteTieDraggerSizePx,
  expandedMinWidthPx,
} = provideSpacings(settings);

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
  <div class="editor-app">
    <!-- <span class="text-petaluma">&#xE1D9;</span>
    <span class="text-leland">&#xE1D9;</span> -->
    <div class="flex">
      <Toolbar
        :id
        v-model:beats-per-bar="tabStore.beatsPerBar"
        v-model:beat-size="tabStore.beatSize"
        @save="save"
      />
      <ChordGroup
        v-model:sync-tuning="tabStore.syncTuning"
        :store="tabStore.chords"
      />
      <Tab :tab-store="tabStore" />
    </div>
  </div>
</template>

<style scoped>
.flex {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.text-petaluma {
  font-family: "Petaluma", serif;
  font-size: 20px;
}
.text-leland {
  margin-left: 10px;
  font-family: "Leland", serif;
  font-size: 20px;
}
.editor-app {
  --cell-height: v-bind(cellHeightPx);
  --context-menu-height: v-bind(contextMenuHeightPx);
  --collapsed-min-width: v-bind(collapsedMinWidthPx);
  --divider-width: v-bind(dividerWidthPx);
  --note-font-size: calc(var(--cell-height) * 0.8);
  --annotation-font-size: calc(var(--cell-height) * 0.7);
  --note-tie-dragger-size: v-bind(noteTieDraggerSizePx);
  --expanded-min-width: v-bind(expandedMinWidthPx);
  --pos-line-width: 1px;
  --string-width: 1px;

  --note-container-drag-extender-height: 100px;

  --tab-background-color: var(--p-surface-50);

  --tie-color: var(--p-surface-900);
  --bend-color: var(--p-surface-900);
  --tie-dragger-color: var(--p-primary-700);

  --divider-color: var(--p-surface-900);
  --divider-icon-color: var(--p-surface-50);

  --select-alpha: 0.3;

  --note-hover-color: var(--p-blue-200);
  --select-color: var(--p-blue-200);
  --might-move-color: var(--p-amber-300);
  --moving-color: var(--p-amber-400);
  --delete-color: var(--p-red-300);
  --move-target-color: var(--select-color);

  --annotation-row-line-color: var(--p-surface-300);
  --annotation-border: var(--p-surface-300);
  --annotation-notch-color: var(--p-surface-400);
  --annotation-dragger-color: var(--p-surface-400);
  --annotation-dragger-hover-color: var(--p-surface-500);
  --annotation-hover-background-color: var(--p-blue-200);
  --annotation-default-background-color: rgb(
    from var(--annotation-hover-background-color) r g b / 0.4
  );

  --pos-line-color: var(--p-surface-400);
  --pos-line-alpha: 0.6;
  --quarter-note-color: var(--p-surface-500);
  --eighth-note-color: var(--p-yellow-500);
  --sixteenth-note-color: var(--p-amber-600);
  --thirty-second-note-color: var(--p-pink-600);
  --sixty-fourth-note-color: var(--p-blue-400);
  --one-twenty-eighth-note-color: var(--pos-line-color);
  --gray-note-color: var(--p-surface-500);

  --string-color: var(--p-surface-400);

  --pos-line-z-index: 1;
  --overlay-svg-z-index: 2;
  --bar-overlay-z-index: 3;
  --annotation-dragger-z-index: 3;
  --annotation-z-index: 4;
  --divider-z-index: 5;
  --annotation-current-z-index: 5;
  --overlay-controls-z-index: 6;
  --annotation-resize-dragger-z-index: 6;
  --selection-toolbar-z-index: 6;
  --note-container-drag-extender-z-index: 7;
  --tie-dragger-z-index: 7;
}

@media (prefers-color-scheme: dark) {
  .editor-app {
    --tab-background-color: var(--p-surface-900);

    --pos-line-color: var(--p-surface-600);
    --quarter-note-color: var(--p-surface-400);
    --gray-note-color: var(--p-surface-400);

    --string-color: var(--p-surface-700);

    --tie-color: var(--p-surface-300);
    --bend-color: var(--p-surface-300);
    --tie-dragger-color: var(--p-primary-600);

    --divider-color: var(--p-primary-600);
    --divider-icon-color: var(--p-surface-50);

    --note-hover-color: var(--p-blue-100);
    --select-color: var(--p-blue-200);
    --might-move-color: var(--p-amber-400);
    --moving-color: var(--p-amber-500);
    --delete-color: var(--p-red-400);

    --annotation-row-line-color: var(--p-surface-600);
    --annotation-border: var(--p-surface-600);
    --annotation-notch-color: var(--p-surface-500);
    --annotation-dragger-color: var(--p-surface-400);
    --annotation-dragger-hover-color: var(--p-surface-300);
    --annotation-hover-background-color: var(--p-primary-700);
    --annotation-default-background-color: rgb(
      from var(--p-primary-500) r g b / 0.4
    );
  }
}
</style>
