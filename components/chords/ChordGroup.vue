<script setup lang="ts">
import type { ChordStore } from "~/model/stores";
import ChordChart from "./ChordChart.vue";
import ChordContainer from "./ChordContainer.vue";
import { Check, X, Plus, GripVertical } from "lucide-vue-next";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isChordDragData, isChordInsertDropData } from "./dnd-types";

// TODO: all of the chord stuff should be independent of cellHeight

const props = defineProps<{
  data: ChordStore;
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
            props.data.moveChord(args.source.data.index, dropData.index);
          }
        },
      }),
    );
  });
});
</script>

<template>
  <div class="group">
    <div v-if="data.chords.length === 0" class="empty-chords-label">
      Chords:
    </div>
    <ChordContainer
      v-for="(chord, i) of data.chords"
      :key="i"
      :index="i"
      :chord="chord"
      :tuning="data.tuning"
    />

    <Button class="add" severity="secondary" outlined @click="data.addChord()">
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
