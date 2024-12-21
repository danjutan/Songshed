export function useTiePath(
  x1: number,
  x2: number,
  y: number,
  orientationUp: boolean = false,
) {
  const curvePointY = Math.abs(x2 - x1) < 50 ? [2, 3] : [10, 12];

  const orientation = orientationUp ? 1 : -1;
  const topY = y + curvePointY[0] * orientation;
  const bottomY = y + curvePointY[1] * orientation;
  const curvePointX = (x2 + x1) / 2;

  const pathData = `
    M ${x1},${y}
    Q ${curvePointX},${topY} ${x2},${y}
    Q ${curvePointX},${bottomY} ${x1},${y} 
    Z`;

  return pathData;
}
