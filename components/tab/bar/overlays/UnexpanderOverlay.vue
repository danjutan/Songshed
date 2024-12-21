<template>
  <div class="unexpander">
    <div class="label">
      <div>↦</div>
      <div>↤</div>
    </div>
  </div>
</template>

<style>
.unexpander {
  background-color: rgba(255, 0, 0, 0.1);
  height: var(--cell-height);
  width: 100%;
  cursor: pointer;
  container-name: unexpander;
  container-type: size;
}

.unexpander:hover {
  background-color: rgba(255, 0, 0, 0.2);
}

.unexpander .label {
  /* font-size: 100cqw; */
  /* font-size: var(--cell-height); */
  color: rgb(255, 0, 0);
  font-size: min(100cqw, var(--cell-height));
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@container unexpander (aspect-ratio < 1) {
  .unexpander .label {
    display: none;
  }
}
</style>
