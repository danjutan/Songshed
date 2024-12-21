<script lang="ts" setup>
import type { TabData } from "~/model/data";
import { deserializeTabData } from "~/model/serialize";
import { createTabStore } from "~/model/stores";

const route = useRoute();

const id = route.params.id as string;

const url = `/api/tab-data/${id}`;
const { data, pending, error, refresh } = await useFetch(url, {
  method: "GET",
});

const tabStore = computed(() => {
  if (data.value) {
    const tabData: TabData = deserializeTabData(data.value as string);
    return createTabStore(tabData);
  }
  return undefined;
});
</script>

<template>
  <EditorApp v-if="tabStore" :id="id" :tab-store="tabStore" />
</template>

<style scoped></style>
