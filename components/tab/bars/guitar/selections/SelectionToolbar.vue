<script lang="ts" setup>
import MoveDragger from "./MoveDragger.vue";
import { Delete } from "lucide-vue-next";
import {
  injectSelectionState,
  type RegionBounds,
} from "@/components/tab/providers/state/provide-selection-state";
const selectionState = injectSelectionState();
const isOneNote = computed(() => selectionState.selections.size === 1);
const isEmpty = computed(() => selectionState.isEmpty());
const props = defineProps<{
  region: RegionBounds;
}>();
</script>

<template>
  <div class="selection-toolbar">
    <button
      v-if="!isOneNote && !isEmpty"
      class="selection-toolbar-button"
      @click="selectionState.deleteSelectedNotes"
      @mouseenter="selectionState.setAction('might-delete')"
      @mouseleave="selectionState.setAction('none')"
    >
      <Delete class="delete-icon" :size="16" />
    </button>
    <button v-if="!isEmpty" class="selection-toolbar-button">
      <MoveDragger :region="region" />
    </button>
  </div>
</template>

<style scoped>
.selection-toolbar {
  position: absolute;
  pointer-events: auto;
  display: flex;
  height: var(--context-menu-height);
  transform: translateY(-50%);
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  opacity: 0.4;
  transition: opacity 0.2s;
  &:hover {
    opacity: 1;
  }
}

.selection-toolbar-button {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  padding-top: 1px;
  padding-inline: 2px;
  border: none;
  border-top: 1px solid gray;
  border-bottom: 1px solid gray;
  /* background-color: rgba(222, 222, 222, 0.4); */
  background-color: rgba(255, 255, 255, 1);
  transition: background-color 0.2s;
  &:hover {
    background-color: rgba(240, 240, 240, 1);
  }
  /* background: transparent; */

  &:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    border-left: 1px solid gray;
  }
  &:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-right: 1px solid gray;
  }
}

.delete-icon {
  transform: rotate(180deg);
}
</style>
