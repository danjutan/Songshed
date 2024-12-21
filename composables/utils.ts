// TODO: remove or move to Fretboard.vue
export function range(count: number): number[];
export function range(start: number, end: number): number[];
export function range(countOrStart: number, end?: number) {
  const length = end ? end - countOrStart + 1 : countOrStart;
  const start = end ? countOrStart : 1;
  return Array.from({ length }, (_, i) => start + i);
}

// export function mapOnRange<T>(start: number, end: number, mapfn: (current: number, index: number) => T) {
//   return range(start, end).map(mapfn);
// }
