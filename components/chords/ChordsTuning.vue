<script lang="ts" setup>
import TuningInput from "~/components/tab/bars/guitar/stack/widgets/TuningInput.vue";

const tuning = defineModel<Midi[]>({ required: true });
const syncTuning = defineModel<boolean>("syncTuning", { required: true });

const emit = defineEmits(["addTop", "addBottom", "removeTop", "removeBottom"]);

const updateNote = (index: number, newValue: Midi) => {
  const newTuning = [...tuning.value];
  newTuning[index] = newValue;
  tuning.value = newTuning;
};
</script>

<template>
  <div class="tuning-container">
    <!--row-reverse-->
    <div class="sync-box">
      <Checkbox v-model="syncTuning" input-id="sync" binary />
      <label for="sync">Sync with Tab</label>
    </div>
    <TuningInput
      v-for="(note, i) in tuning"
      :key="i"
      class="input"
      :font-size="'16px'"
      :model-value="note"
      :style="{ gridRow: i + 1 }"
      @update:model-value="(value) => updateNote(i, value)"
    />
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
</style>
