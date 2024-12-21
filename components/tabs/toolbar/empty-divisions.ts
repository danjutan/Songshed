import type { DivisionData } from "../TabBar.vue";
import type { DrapeData } from "./Drape.vue";

const isEmptyDivision = (division: DivisionData) => {
  const stackEmpty = division.stack.every(s => !s.data);
  console.log(division.substacks);
  return stackEmpty && !division.substacks;
};

export const emptyDivisions = (divisions: DivisionData[]) => {
  const emptyPositions = divisions.filter(isEmptyDivision).map(d => d.notchPosition + 1);
  return emptyPositions.reduce<DrapeData[]>((arr, pos) => {
    const last = arr.at(-1);
    if (last && last.start + last.columns == pos) {
      last.columns++;
      return arr;
    };
    return [...arr, { start: pos, columns: 1 }];
  }, []);
};
