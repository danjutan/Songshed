<script setup lang="ts">
import type { GuitarNote, NoteStack, StackMap } from "~/model/data";
import Stack from "./stack/Stack.vue";
import type {
  Bend,
  GuitarStack,
  NotePosition,
  Tie,
  TieStore,
} from "~/model/stores";
import SelectionRegions from "./selections/SelectionRegions.vue";
import Toolbar from "~/components/tab/Toolbar.vue";

import { injectSettingsState } from "~/components/tab/providers/state/provide-settings-state";
import { injectTabBarBounds } from "../provide-bar-bounds";
import { injectTieAddState } from "../../providers/state/provide-tie-add-state";
import { injectSubUnit } from "../../providers/provide-subunit";
import { provideEditTie } from "./provide-edit-tie";
import { provideOverlayControlsTeleport } from "./provide-overlay-controls-teleport";

import BendRender from "./overlay/bend/BendRender.vue";
import TieRender from "./overlay/tie/TieRender.vue";

const settings = injectSettingsState();

const props = defineProps<{
  stackData: GuitarStack[];
  tuning: Midi[];
  frets: number;
  numStrings: number;
  tieStore: TieStore;
}>();

const tieAddState = injectTieAddState();
const tabBarBounds = injectTabBarBounds();
const subUnit = injectSubUnit();

const overlayControlsId = provideOverlayControlsTeleport();
provideEditTie(props.tieStore);

const emit = defineEmits<{
  noteDelete: [notePosition: NotePosition];
  noteChange: [notePosition: NotePosition, note: GuitarNote];
}>();

const numStacks = computed(() => props.stackData.length);

onBeforeUpdate(() => {
  console.log("updated bar");
});

const inBounds = (position: number) =>
  position >= tabBarBounds.start && position < tabBarBounds.end;

const inBarOrThrough = (from: number, to: number) => {
  const within = inBounds(from) || inBounds(to);
  const through = from < tabBarBounds.start && to >= tabBarBounds.end;
  return within || through;
};

const bends = computed(() => {
  const withNew = tieAddState.newBend
    ? [...props.tieStore.getBends(), tieAddState.newBend]
    : props.tieStore.getBends();
  return withNew.filter((bend) => inBarOrThrough(bend.from, bend.to));
});

const ties = computed(() => {
  const withNew = tieAddState.newTie
    ? [...props.tieStore.getTies(), tieAddState.newTie]
    : props.tieStore.getTies();
  return withNew.filter((tie) => inBarOrThrough(tie.from, tie.to));
});

const showLabel = (from: number, to: number): boolean | "shift" => {
  if (inBounds(from) && inBounds(to)) {
    return true;
  }

  const middle = (from + to + subUnit.value) / 2;

  if (middle === tabBarBounds.start) {
    return "shift";
  }

  return inBounds(middle);
};

const tablineHasBends = computed(() => {
  return tieAddState.hasBendsWithin(
    tabBarBounds.tabline.start,
    tabBarBounds.tabline.end,
  );
});
</script>

<template>
  <div class="guitar-bar" :class="{ 'has-bends': tablineHasBends }">
    <slot name="divider" />
    <div class="toolbar">
      <!-- annotations go here -->
      <div v-if="tablineHasBends" class="bend-bar" />
      <div class="flex-bar" />
    </div>
    <div class="notes-grid">
      <Stack
        v-for="({ position, notes }, i) in stackData"
        :key="position"
        ref="stacks"
        class="stack"
        :class="{ border: !settings.posLineCenter && i < stackData.length - 1 }"
        :style="{
          gridColumn: i + 1,
          gridRow: '1 / -1',
        }"
        :notes
        :position="position"
        :tuning
        :frets
        @note-change="
          (string: number, note: GuitarNote) =>
            emit('noteChange', { position, string }, note)
        "
        @note-delete="
          (string: number) => emit('noteDelete', { position, string })
        "
      />
      <SelectionRegions />
      <ClientOnly>
        <svg :id="overlayControlsId" class="overlay-controls">
          <!--Teleport-->
        </svg>
        <svg class="overlay">
          <BendRender
            v-for="bend in bends"
            :key="`${bend.from}-${bend.string}`"
            :bend
          />
          <TieRender
            v-for="tie in ties"
            :key="`${tie.from}-${tie.string}`"
            :tie
            :show-label="showLabel(tie.from, tie.to)"
          />
        </svg>
      </ClientOnly>
    </div>
  </div>
  <!-- <SelectionRegions /> -->
</template>

<style>
.guitar-bar {
  display: grid;
  width: 100%;
  grid-template-columns: min-content repeat(v-bind(numStacks), 1fr);
  grid-template-rows: auto auto;

  .divider {
    grid-column: 1;
    grid-row: -2 / -1;
  }
}

.notes-grid {
  display: grid;
  grid-column: 2 / -1;
  grid-row: 2;
  grid-template-columns: subgrid;
  grid-template-rows: repeat(v-bind(numStrings), var(--cell-height));
}

.toolbar {
  grid-column: 1 / -1;
  grid-row: 1;
  display: grid;
  grid-template-columns: subgrid;

  & .flex-bar {
    grid-column: 1 / -1;
    height: var(--context-menu-height);
  }

  & .bend-bar {
    grid-column: 1 / -1;
    height: var(--context-menu-height);
  }
}

/* .guitar-bar.has-bends {
  grid-template-rows: var(--cell-height) var(--context-menu-height) repeat(
      v-bind(numStrings),
      var(--cell-height)
    );

  .divider {
    grid-row: 3 / -1;
  }

  .overlay,
  .overlay-controls {
    grid-row: 3 / -1;
  }
} */

.stack.border {
  border-right: var(--pos-line-width) solid var(--pos-line-color);
  grid-row: 1 / span v-bind(numStrings);
}
.overlay-controls {
  z-index: var(--overlay-controls-z-index);
  position: relative; /* somehow makes the VueSelect hover events work right */
  overflow: hidden;
}
.guitar-bar .overlay,
.guitar-bar .overlay-controls {
  pointer-events: none;
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  width: 100%;
  height: calc(
    100% + var(--cell-height) / 2 + var(--context-menu-height) +
      var(--cell-height)
  );
  margin-top: calc(-1 * (var(--cell-height) + var(--context-menu-height)));
}
</style>
