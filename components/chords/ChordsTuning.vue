<script lang="ts" setup>
import TuningInput from "~/components/tab/bars/guitar/stack/widgets/TuningInput.vue";
import { Plus, Minus } from "lucide-vue-next";
import type { UpdateTuning } from "~/model/stores";

const props = defineProps<{
  tuning: Midi[];
  updateTuning: UpdateTuning;
}>();

const syncTuning = defineModel<boolean>("syncTuning", { required: true });
</script>

<template>
  <div class="tuning-container">
    <!--row-reverse-->
    <div class="sync-box">
      <Checkbox v-model="syncTuning" input-id="sync" binary />
      <label for="sync">Sync with Tab</label>
    </div>
    <div class="buttons">
      <Button
        v-show="tuning.length > 4"
        outlined
        size="small"
        class="button"
        severity="contrast"
        @click="updateTuning.removeTop()"
      >
        <template #icon>
          <Minus :size="16" />
        </template>
      </Button>
      <Button
        outlined
        size="small"
        class="button"
        severity="contrast"
        @click="updateTuning.addTop()"
      >
        <template #icon>
          <Plus :size="16" />
        </template>
      </Button>
    </div>
    <TuningInput
      v-for="(note, i) in tuning"
      :key="i"
      class="input"
      :font-size="'16px'"
      :model-value="note"
      :style="{ gridRow: i + 1 }"
      @update:model-value="(value) => updateTuning.setTuningNote(i, value)"
    />
    <div class="buttons">
      <Button
        outlined
        size="small"
        class="button"
        severity="contrast"
        @click="updateTuning.addBottom()"
      >
        <template #icon>
          <Plus :size="16" />
        </template>
      </Button>
      <Button
        v-show="tuning.length > 4"
        outlined
        size="small"
        class="button"
        severity="contrast"
        @click="updateTuning.removeBottom()"
      >
        <template #icon>
          <Minus :size="16" />
        </template>
      </Button>
    </div>
    <strong>Tuning:</strong>
  </div>
</template>

<style scoped>
.tuning-container {
  display: flex;
  flex-direction: row-reverse;
  gap: 4px;
  justify-content: flex-end;
  align-items: center;
}

.sync-box {
  display: flex;
  gap: 4px;
  margin: 0px 10px;
}

.input {
  width: 60px;
}

strong {
  margin-right: 10px;
}

.buttons {
  display: flex;
  gap: 2px;
}

.button {
  height: 20px;
  --p-button-sm-padding-x: 0px;
  --p-button-sm-icon-only-width: 24px;
}
</style>
