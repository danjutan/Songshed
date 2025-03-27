<script setup lang="ts">
import type { GuitarNote } from "~/model/data";
import type { GuitarStack, NotePosition, TieStore } from "~/model/stores";

import { injectSettingsState } from "~/components/tab/providers/state/provide-settings-state";
import { injectTabBarBounds } from "../provide-bar-bounds";
import { injectTieAddState } from "../../providers/state/provide-tie-add-state";
import { injectSubUnit } from "../../providers/provide-subunit";
import { provideEditTie } from "./provide-edit-tie";
import { provideOverlayControlsTeleport } from "./provide-overlay-controls-teleport";

import BendRender from "./overlay/bend/BendRender.vue";
import TieRender from "./overlay/tie/TieRender.vue";
import StringLine from "./stack/StringLine.vue";
import Stack from "./stack/Stack.vue";
import WidgetStack from "./stack/widgets/WidgetStack.vue";
import SelectionRegions from "./selections/SelectionRegions.vue";
import BendDroppable from "./overlay/bend/BendDroppable.vue";
import type { BarHighlightType } from "../TabBar.vue";

const settings = injectSettingsState();

const props = defineProps<{
  stackData: GuitarStack[];
  tuning: Midi[];
  frets: number;
  tieStore: TieStore;
  highlight?: BarHighlightType | false;
}>();

const tieAddState = injectTieAddState();
const tabBarBounds = injectTabBarBounds();
const subUnit = injectSubUnit();

const { uniqueId, draggersClass, selectsClass } =
  provideOverlayControlsTeleport();

provideEditTie(props.tieStore);

const emit = defineEmits<{
  noteDelete: [notePosition: NotePosition];
  noteChange: [notePosition: NotePosition, note: GuitarNote];
}>();

const slots = useSlots();
const hasWidget = computed(() => slots.widget);
const numStacks = computed(
  () => props.stackData.length + (hasWidget.value ? 1 : 0),
);

const numStrings = computed(() => props.tuning.length);

// onBeforeUpdate(() => {
//   console.log("updated bar");
// });

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

const showTieLabel = (from: number, to: number): boolean | "shift" => {
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
  <div
    class="guitar-bar"
    :class="{ 'has-bends': tablineHasBends, 'has-widget': hasWidget }"
  >
    <slot name="divider" />
    <div v-if="highlight" class="highlight" :class="highlight" />
    <div class="toolbar">
      <div class="flex-bar" />
      <template v-if="tablineHasBends">
        <div class="bend-bar" />
        <BendDroppable
          v-for="(stack, i) in stackData"
          :key="stack.position"
          class="bend-droppable"
          :position="stack.position"
          :style="{
            gridColumn: i === 0 ? '1 / span 2' : i + 2,
          }"
        />
      </template>
    </div>
    <div class="notes-grid">
      <StringLine
        v-for="(_, i) in tuning"
        :key="i"
        :style="{
          gridRow: i + 1,
          gridColumn: '1 / -1',
        }"
      />
      <WidgetStack v-if="hasWidget" style="grid-column: 1; grid-row: 1 / -1">
        <slot name="widget" />
      </WidgetStack>
      <Stack
        v-for="({ position, notes }, i) in stackData"
        :key="position"
        ref="stacks"
        class="stack"
        :class="{ border: !settings.posLineCenter && i < stackData.length - 1 }"
        :style="{
          gridColumn: i + (hasWidget ? 2 : 1),
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
    </div>
    <ClientOnly>
      <div :id="uniqueId" class="overlay-controls">
        <div :class="draggersClass">
          <!-- Teleport -->
        </div>
        <div :class="selectsClass">
          <!-- Teleport -->
        </div>
      </div>
      <svg class="overlay">
        <BendRender
          v-for="bend in bends"
          :key="`${bend.from}-${bend.string}`"
          :bend
          :show-label="inBounds(bend.to)"
        />
        <TieRender
          v-for="tie in ties"
          :key="`${tie.from}-${tie.string}`"
          :tie
          :show-label="showTieLabel(tie.from, tie.to)"
        />
      </svg>
    </ClientOnly>
  </div>
</template>

<style scoped>
.guitar-bar {
  display: grid;
  width: 100%;
  grid-template-columns: min-content repeat(
      v-bind(numStacks),
      minmax(auto, var(--expanded-min-width))
        /* expanded-min-width is also the max width */
    );
  grid-template-rows: auto calc(v-bind(numStrings) * var(--cell-height));

  &.has-widget {
    grid-template-columns: min-content min-content repeat(
        v-bind(numStacks),
        minmax(auto, var(--expanded-min-width))
      );
  }

  & :deep(.divider) {
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
  grid-auto-rows: var(--context-menu-height);
}

.flex-bar {
  grid-column: 1 / -1;
}

.has-bends .flex-bar {
  grid-row: 2;
}

.bend-bar {
  grid-column: 1 / -1;
  grid-row: 1;
  height: var(--context-menu-height);
}

& .bend-droppable {
  grid-row: 1 / span 2;
}
.stack.border {
  border-right: var(--pos-line-width) solid var(--pos-line-color);
  grid-row: 1 / span v-bind(numStrings);
}

.overlay {
  z-index: var(--overlay-svg-z-index);
}

.overlay-controls {
  display: contents;
}
.overlay-controls > div {
  position: relative; /* somehow makes the VueSelect hover events work right */
  overflow: visible;
  z-index: var(--overlay-controls-z-index);
}

.overlay,
.overlay-controls > div {
  overflow: hidden;
  pointer-events: none;
  grid-column: 1 / -1;
  grid-row: 2;
  width: 100%;
  height: calc(
    100% + var(--cell-height) / 2 + var(--context-menu-height) +
      var(--cell-height)
  );
  margin-top: calc(-1 * (var(--cell-height) + var(--context-menu-height)));
}

.highlight {
  grid-column: 2 / -1;
  grid-row: 2 / -1;
  pointer-events: none;
  width: 100%;
  height: 100%;
  opacity: var(--select-alpha);
  z-index: var(--bar-overlay-z-index);

  &.might-delete {
    background-color: var(--delete-color);
  }
  &.might-move {
    background-color: var(--might-move-color);
  }
  &.moving {
    background-color: var(--moving-color);
  }
  &.move-target {
    background-color: var(--move-target-color);
  }
}
</style>
