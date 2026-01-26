export const SPACING = {
  Whole: 4,
  Half: 2,
  Quarter: 1,
  Eighth: 0.5,
  Sixteenth: 0.25,
  ThirtySecond: 0.125,
  SixtyFourth: 0.0625,
  OneTwentyEighth: 0.03125,
} as const;

export type SpacingName = keyof typeof SPACING;
export type SpacingValue = (typeof SPACING)[SpacingName];
export type ColoredSpacingName = Exclude<SpacingName, "Whole" | "Half">;

export function largestSpacingDivisor(
  position: number,
): ColoredSpacingName | undefined {
  const largest = Object.entries(SPACING)
    .sort((a, b) => b[1] - a[1])
    .slice(2)
    .find(([_, spacing]) => position % spacing === 0);

  if (largest) {
    return largest[0] as ColoredSpacingName;
  }
}
