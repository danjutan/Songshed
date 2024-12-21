export type Chroma = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type NoteColors = {
  [note in Chroma]: string;
};

export const defaultColors: NoteColors = {
  0: "#F94144",
  1: "#F3722C",
  2: "#F8961E",
  3: "#F9844A",
  4: "#f9c74f",
  5: "#90BE6D",
  6: "#43AA8B",
  7: "#4d908e",
  8: "#577590",
  9: "#277DA1",
  10: "#861388",
  11: "#C02A66",
};

export const defaultFrameColor = "gray";
