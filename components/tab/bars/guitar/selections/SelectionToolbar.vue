<script lang="ts" setup>
import MoveDragger from "./MoveDragger.vue";
import { Delete, ClipboardPlus, ClipboardPaste } from "lucide-vue-next";
import {
  injectSelectionState,
  type RegionBounds,
} from "@/components/tab/providers/state/provide-selection-state";
import { injectCopyState } from "@/components/tab/providers/state/provide-copy-state";
const selectionState = injectSelectionState();
const copyState = injectCopyState();

const isOneNote = computed(() => selectionState.selections.size === 1);
const isEmpty = computed(() => selectionState.isEmpty());
const props = defineProps<{
  region: RegionBounds;
  top?: string;
}>();

const copied = copyState.copied;
const copiedHere = ref(false);
function copy() {
  copyState.copy();
  copiedHere.value = true;
}

function paste() {
  copyState.paste(pastePosition.value);
  copiedHere.value = true;
}

const pastePosition = computed(() => ({
  string: props.region.minString,
  position: props.region.minPosition,
}));
</script>

<template>
  <div class="selection-toolbar" :style="{ top }">
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
    <button
      v-if="!isEmpty && !copiedHere"
      class="selection-toolbar-button"
      @click="copy"
    >
      <ClipboardPlus class="copy-icon" :size="16" />
    </button>
    <button
      v-if="copied && !copiedHere"
      class="selection-toolbar-button"
      @click="paste"
      @mouseenter="copyState.pasteHover(pastePosition)"
      @mouseleave="copyState.pasteHoverLeave"
    >
      <ClipboardPaste class="paste-icon" :size="16" />
    </button>
  </div>
</template>

<style scoped>
.selection-toolbar {
  position: absolute;
  z-index: var(--selection-toolbar-z-index);
  pointer-events: auto;
  display: flex;
  height: var(--context-menu-height);
  transform: translateY(-50%);
  border-radius: 4px;
  box-shadow: var(--p-button-raised-shadow);
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
  border-top: 1px solid var(--p-button-outlined-secondary-border-color);
  border-bottom: 1px solid var(--p-button-outlined-secondary-border-color);
  /* background-color: rgba(222, 222, 222, 0.4); */
  color: var(--p-button-outlined-secondary-color);
  background-color: var(--p-button-secondary-background);
  transition: background-color 0.2s;
  &:hover {
    color: var(--p-button-secondary-hover-color);
    background-color: var(--p-button-secondary-hover-background);
  }
  /* background: transparent; */

  &:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    border-left: 2px solid var(--p-button-outlined-secondary-border-color);
  }
  &:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-right: 2px solid var(--p-button-outlined-secondary-border-color);
  }
}

.delete-icon {
  transform: rotate(180deg);
}
</style>
