<script setup lang="ts">
import type { ChordStore, UpdateTuning } from "~/model/stores";
import ChordsTuning from "./ChordsTuning.vue";
import ChordContainer from "./ChordContainer.vue";
import {
  Check,
  X,
  Plus,
  GripVertical,
  ChevronRight,
  ChevronDown,
} from "lucide-vue-next";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { isChordDragData, isChordInsertDropData } from "./dnd-types";

const props = defineProps<{
  store: ChordStore;
  updateTuning: UpdateTuning;
}>();

const syncTuning = defineModel<boolean>("syncTuning", { required: true });

onMounted(() => {
  watchEffect((cleanup) => {
    cleanup(
      monitorForElements({
        canMonitor({ source }) {
          return isChordDragData(source.data);
        },
        onDrop(args) {
          if (args.location.current.dropTargets.length === 0) return;
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
  <!-- <Panel class="panel" header="Chords" toggleable pt:header:class="header">
    <template #toggleicon="{ collapsed }">
      <ChevronRight v-if="collapsed" :size="16" />
      <ChevronDown v-else :size="16" />
    </template> -->
    <!-- <ChordsTuning
      v-model:sync-tuning="syncTuning"
      :tuning="store.tuning"
      :update-tuning="updateTuning"
    /> -->
    <div class="group">
      <ChordContainer
        v-for="(chord, i) of store.chords"
        :key="i"
        :index="i"
        :chord="chord"
        :tuning="store.tuning"
        @delete="store.deleteChord(i)"
      />

      <Button
        class="add"
        severity="secondary"
        outlined
        @click="store.addChord()"
      >
        <template #icon>
          <Plus :size="24" />
        </template>
      </Button>
    </div>
  <!-- </Panel> -->
</template>

<style scoped>
.panel {
  --p-panel-toggleable-header-padding: 0px 1.125rem;
  border: 0px;

  &:deep(.header) {
    justify-content: flex-start;
    /* justify-content: flex-end;
    flex-direction: row-reverse; */
  }
}

.group {
  display: flex;
  align-items: center;
}

.add {
  width: none;
  padding: 2px;
  margin: 12px;
}
</style>
