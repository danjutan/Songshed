<script setup lang="ts">
import type { ChordStore } from "~/model/stores";
import ChordChart from "./ChordChart.vue";
import ChordContainer from "./ChordContainer.vue";
import { Check, X, Plus, GripVertical } from "lucide-vue-next";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isChordDragData, isChordInsertDropData } from "./dnd-types";

const props = defineProps<{
  store: ChordStore;
}>();

onMounted(() => {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return isChordDragData(source.data);
        },
        onDrop(args) {
          const dropData = args.location.current.dropTargets[0].data;
          if (
            isChordInsertDropData(dropData) &&
            isChordDragData(args.source.data)
          ) {
            props.store.moveChord(args.source.data.index, dropData.index);
          }
        },
      }),
    );
  });
});
</script>

<template>
  <div class="group">
    <div v-if="store.chords.length === 0" class="empty-chords-label">
      Chords:
    </div>
    <ChordContainer
      v-for="(chord, i) of store.chords"
      :key="i"
      :index="i"
      :chord="chord"
      :tuning="store.tuning"
      @delete="store.deleteChord(i)"
    />

    <Button class="add" severity="secondary" outlined @click="store.addChord()">
      <template #icon>
        <Plus :size="24" />
      </template>
    </Button>
  </div>
</template>

<style scoped>
.group {
  display: flex;
  align-items: center;
}

.empty-chords-label {
  font-size: var(--note-font-size);
  font-weight: bold;
}

.add {
  width: none;
  padding: 2px;
}
</style>
