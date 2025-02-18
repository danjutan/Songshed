<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
body {
  background-color: var(--p-surface-50);
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: var(--p-surface-900);
  }
}
</style>
